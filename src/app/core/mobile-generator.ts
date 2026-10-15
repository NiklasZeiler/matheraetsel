import { LevelId } from './levels';
import {
  MobileBar,
  MobileItem,
  MobilePuzzle,
  MobileQuestion,
  allBars,
  barToScale,
  barWeight,
  barWidth,
  subMobiles,
} from './mobile';
import { MOBILE_LEVELS, MobileLevelConfig } from './mobile-levels';
import { Random, createRandom, pickOne, randomInt, shuffled } from './random';
import { THEMES } from './themes';
import { solveScales } from './waage-solver';

const MAX_PUZZLE_ATTEMPTS = 800;
/** Chance that an extra leaf reuses an already known picture instead of a plain number. */
const REUSE_CHANCE = 0.75;
/** Chance that a newly introduced picture hangs twice on the same side. */
const TWIN_CHANCE = 0.6;
/** Deepest nesting of bars; the root bar is level 1. */
const MAX_DEPTH = 3;

interface Slot {
  /** null = leaf; otherwise a smaller mobile hangs here. */
  bar: ShapeBar | null;
}

interface ShapeBar {
  left: Slot[];
  right: Slot[];
}

/**
 * Deterministic like the other generators: the same level and seed give the same mobile.
 * Keep the order of random draws stable once links are shared (golden test in the spec).
 */
export function generateMobile(levelId: LevelId, seed: number): MobilePuzzle {
  const level = MOBILE_LEVELS[levelId];
  const random = createRandom(seed);
  for (let attempt = 0; attempt < MAX_PUZZLE_ATTEMPTS; attempt++) {
    const puzzle = tryGenerate(level, seed, random);
    if (puzzle) {
      return puzzle;
    }
  }
  throw new Error(`No mobile found for level ${levelId} and seed ${seed}`);
}

function newShapeBar(random: Random): ShapeBar {
  const slots = (count: number): Slot[] => Array.from({ length: count }, () => ({ bar: null }));
  // Two hangers per side are more common, so nested shapes find enough room.
  const count = () => (random() < 0.65 ? 2 : 1);
  return { left: slots(count()), right: slots(count()) };
}

function leafSlots(bar: ShapeBar): Slot[] {
  return [...bar.left, ...bar.right].filter((slot) => slot.bar === null);
}

function leavesOn(slots: Slot[]): number {
  return slots.filter((slot) => slot.bar === null).length;
}

/** Nests `barCount` bars; every bar keeps enough leaf slots for its balancing weight (and new picture). */
function randomShape(random: Random, barCount: number, minLeafSlots: number): ShapeBar | null {
  const root = newShapeBar(random);
  const bars = [root];
  const depthOf = new Map<ShapeBar, number>([[root, 1]]);
  while (bars.length < barCount) {
    // Picture bars keep one side with two leaf hangers: the new picture plus a balancing number.
    // Depth is capped: every level halves the weight left for its pictures.
    const candidates = bars
      .filter((bar) => (depthOf.get(bar) ?? 1) < MAX_DEPTH)
      .flatMap((bar) =>
        (['left', 'right'] as const).flatMap((side) =>
          bar[side].flatMap((slot) => {
            const isLeaf = slot.bar === null;
            // Below the top bar every side keeps a number to absorb odd remainders.
            const keepsLeaf = (depthOf.get(bar) ?? 1) === 1 || leavesOn(bar[side]) - 1 >= 1;
            const keepsRoomySide =
              minLeafSlots < 2 ||
              (['left', 'right'] as const).some(
                (other) => leavesOn(bar[other]) - (other === side ? 1 : 0) >= 2,
              );
            return isLeaf && keepsLeaf && leafSlots(bar).length > minLeafSlots && keepsRoomySide
              ? [slot]
              : [];
          }),
        ),
      );
    if (candidates.length === 0) {
      return null;
    }
    const slot = pickOne(random, candidates);
    const parent = bars.find((bar) => [...bar.left, ...bar.right].includes(slot)) ?? root;
    slot.bar = newShapeBar(random);
    depthOf.set(slot.bar, (depthOf.get(parent) ?? 1) + 1);
    bars.push(slot.bar);
  }
  return root;
}

interface FillContext {
  random: Random;
  level: MobileLevelConfig;
  symbolCount: number;
  /** Hidden picture weights (empty in numbers mode). */
  symbolValues: number[];
  /** Postorder index per bar: bar k introduces picture k while k < symbolCount. */
  indexOf: Map<ShapeBar, number>;
}

type Side = 'left' | 'right';
const SIDES: readonly Side[] = ['left', 'right'];

function assignIndices(shape: ShapeBar, indexOf: Map<ShapeBar, number>): void {
  for (const slot of [...shape.left, ...shape.right]) {
    if (slot.bar) {
      assignIndices(slot.bar, indexOf);
    }
  }
  indexOf.set(shape, indexOf.size);
}

/**
 * Least weight each side of this bar needs: every leaf weighs at least 1, the new picture its
 * own weight, and every sub-mobile at least what its own sides need.
 */
function minTarget(shape: ShapeBar, context: FillContext): number {
  const index = context.indexOf.get(shape) ?? 0;
  const introduces = context.level.mode === 'pictures' && index < context.symbolCount;
  const sideMin = (slots: Slot[]) =>
    slots.reduce((sum, slot) => sum + (slot.bar ? 2 * minTarget(slot.bar, context) : 1), 0);
  const fresh = introduces ? context.symbolValues[index] - 1 : 0;
  return Math.max(sideMin(shape.left), sideMin(shape.right)) + fresh;
}

/**
 * Fills a bar top-down so it balances by construction: each side must weigh exactly
 * `target`, and one item per side (a number or a sub-mobile) takes up whatever is left.
 * A sub-mobile of total weight m gets `m / 2` on each of its sides.
 */
function fillBar(shape: ShapeBar, context: FillContext, target: number): MobileBar | null {
  const { random, level, symbolCount } = context;
  const index = context.indexOf.get(shape) ?? 0;
  const introduces = level.mode === 'pictures' && index < symbolCount;

  let freshSide: Side | null = null;
  if (introduces) {
    // The side needs a second free leaf: the new picture alone could not be balanced.
    const options = SIDES.filter((side) => leavesOn(shape[side]) >= 2);
    if (options.length === 0) {
      return null;
    }
    freshSide = pickOne(random, options);
  }

  const bar: MobileBar = { left: [], right: [] };
  for (const side of SIDES) {
    const items = fillSide(shape[side], side === freshSide, target, index, context);
    if (!items) {
      return null;
    }
    bar[side] = items;
  }
  return bar;
}

function fillSide(
  slots: Slot[],
  hasFresh: boolean,
  target: number,
  index: number,
  context: FillContext,
): MobileItem[] | null {
  const { random, level, symbolCount, symbolValues } = context;
  const known = Math.min(index, symbolCount);
  const items: (MobileItem | null)[] = slots.map(() => null);
  const leafPositions = shuffled(
    random,
    slots.flatMap((slot, position) => (slot.bar === null ? [position] : [])),
  );
  const mobilePositions = shuffled(
    random,
    slots.flatMap((slot, position) => (slot.bar !== null ? [position] : [])),
  );
  let remaining = target;

  if (hasFresh) {
    // A second copy on the same side makes the picture count as "two of them".
    const copies = leafPositions.length >= 3 && random() < TWIN_CHANCE ? 2 : 1;
    for (let copy = 0; copy < copies; copy++) {
      const position = leafPositions.shift();
      if (position === undefined) {
        return null;
      }
      items[position] = { kind: 'picture', symbol: index };
      remaining -= symbolValues[index];
    }
  }

  // The last free item absorbs the remainder so the side weighs exactly `target`.
  const absorber =
    leafPositions.length > 0
      ? { kind: 'leaf' as const, position: leafPositions.pop() ?? 0 }
      : mobilePositions.length > 0
        ? { kind: 'mobile' as const, position: mobilePositions.pop() ?? 0 }
        : null;
  if (absorber === null && remaining !== 0) {
    return null;
  }

  const pending = shuffled(random, [
    ...leafPositions.map((position) => ({ kind: 'leaf' as const, position })),
    ...mobilePositions.map((position) => ({ kind: 'mobile' as const, position })),
  ]);
  const minimum = (kind: 'leaf' | 'mobile') => (kind === 'mobile' ? 2 : 1);
  const mobileTotals = new Map<number, number>();
  let budget = remaining - (absorber ? minimum(absorber.kind) : 0);

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    const reserved = pending.slice(i + 1).reduce((sum, rest) => sum + minimum(rest.kind), 0);
    const room = budget - reserved;
    if (room < minimum(item.kind)) {
      return null;
    }
    if (item.kind === 'mobile') {
      // Take at least half of the room: sub-mobiles must be heavy enough to carry pictures.
      const child = slots[item.position].bar;
      const least = child ? 2 * minTarget(child, context) : 2;
      const most = 2 * Math.floor(room / 2);
      if (most < least) {
        return null;
      }
      const lower = Math.max(least, 2 * Math.floor(room / 4));
      const total = 2 * randomInt(random, Math.ceil(Math.min(lower, most) / 2), most / 2);
      mobileTotals.set(item.position, total);
      budget -= total;
      continue;
    }
    const reuse = level.mode === 'pictures' && known > 0 && random() < REUSE_CHANCE;
    const symbol = reuse ? randomInt(random, 0, known - 1) : -1;
    if (reuse && symbolValues[symbol] <= room) {
      items[item.position] = { kind: 'picture', symbol };
      budget -= symbolValues[symbol];
    } else {
      const upper = Math.max(1, Math.min(level.numberMax, room));
      const weight = randomInt(random, Math.min(level.valueRange[0], upper), upper);
      items[item.position] = { kind: 'number', weight };
      budget -= weight;
    }
  }

  if (absorber) {
    const rest = budget + minimum(absorber.kind);
    if (absorber.kind === 'leaf') {
      if (rest < 1 || rest > level.limit) {
        return null;
      }
      items[absorber.position] = { kind: 'number', weight: rest };
    } else {
      const child = slots[absorber.position].bar;
      if (rest % 2 !== 0 || (child && rest < 2 * minTarget(child, context))) {
        return null;
      }
      mobileTotals.set(absorber.position, rest);
    }
  }

  for (const [position, total] of mobileTotals) {
    const child = slots[position].bar;
    const bar = child ? fillBar(child, context, total / 2) : null;
    if (!bar) {
      return null;
    }
    items[position] = { kind: 'mobile', id: -1, asked: false, bar };
  }

  return items.every((item): item is MobileItem => item !== null) ? items : null;
}

function assignIds(root: MobileBar): void {
  let next = 0;
  const visit = (bar: MobileBar) => {
    for (const item of [...bar.left, ...bar.right]) {
      if (item.kind === 'mobile') {
        item.id = next++;
        visit(item.bar);
      }
    }
  };
  visit(root);
}

function tryGenerate(level: MobileLevelConfig, seed: number, random: Random): MobilePuzzle | null {
  const pictures = level.mode === 'pictures';
  const barCount = randomInt(random, level.bars[0], level.bars[1]);
  const symbolCount = pictures ? randomInt(random, level.symbolCount[0], level.symbolCount[1]) : 0;
  const theme = pickOne(random, THEMES);
  const symbols = shuffled(random, theme.symbols).slice(0, symbolCount);

  const range: number[] = [];
  for (let value = level.valueRange[0]; value <= level.valueRange[1]; value++) {
    range.push(value);
  }
  const symbolValues = shuffled(random, range).slice(0, symbolCount);

  const shape = randomShape(random, barCount, pictures ? 2 : 1);
  if (!shape) {
    return null;
  }
  const indexOf = new Map<ShapeBar, number>();
  assignIndices(shape, indexOf);
  const sideWeightTarget = 2 * randomInt(random, level.sideWeight[0] / 2, level.sideWeight[1] / 2);
  const root = fillBar(
    shape,
    { random, level, symbolCount, symbolValues, indexOf },
    sideWeightTarget,
  );
  if (!root || barWidth(root) > level.maxWidth) {
    return null;
  }
  assignIds(root);

  return pictures
    ? finishPictures(level, seed, random, theme.id, symbols, symbolValues, root)
    : finishNumbers(level, seed, random, theme.id, root);
}

function finishPictures(
  level: MobileLevelConfig,
  seed: number,
  random: Random,
  themeId: string,
  symbols: string[],
  values: number[],
  root: MobileBar,
): MobilePuzzle | null {
  const solved = solveScales(
    allBars(root).map((bar) => barToScale(bar)),
    symbols.length,
    level.limit,
  );
  if (!solved || solved.some((value, index) => value !== values[index])) {
    return null;
  }

  const last = symbols.length - 1;
  let question: MobileQuestion;
  let hintOrder = Array.from({ length: symbols.length }, (_, index) => index);

  if (level.question === 'symbol') {
    question = { kind: 'symbol', symbol: last, answer: values[last] };
    hintOrder = hintOrder.slice(0, last);
  } else {
    const parts = subMobiles(root).filter((item) => barWeight(item.bar, values) <= level.limit);
    if (parts.length === 0) {
      return null;
    }
    const withLast = parts.filter((item) => containsSymbol(item.bar, last));
    const asked = pickOne(random, withLast.length > 0 ? withLast : parts);
    asked.asked = true;
    question = { kind: 'part', answer: barWeight(asked.bar, values) };
  }

  return {
    kind: 'mobile',
    mode: 'pictures',
    level: level.id,
    seed,
    themeId,
    symbols,
    values,
    root,
    question,
    hintOrder,
  };
}

function containsSymbol(bar: MobileBar, symbol: number): boolean {
  return [...bar.left, ...bar.right].some(
    (item) =>
      (item.kind === 'picture' && item.symbol === symbol) ||
      (item.kind === 'mobile' && containsSymbol(item.bar, symbol)),
  );
}

/**
 * Hides one number leaf in a bar that holds at least one sub-mobile, so the player has to
 * add up a whole sub-mobile first. The hints reveal those sub-mobiles' totals.
 */
function finishNumbers(
  level: MobileLevelConfig,
  seed: number,
  random: Random,
  themeId: string,
  root: MobileBar,
): MobilePuzzle | null {
  const candidates = allBars(root).filter((bar) =>
    [...bar.left, ...bar.right].some((item) => item.kind === 'mobile'),
  );
  if (candidates.length === 0) {
    return null;
  }
  const bar = pickOne(random, candidates);
  const numberLeaves = ([bar.left, bar.right] as const).flatMap((side) =>
    side.flatMap((item, position) => (item.kind === 'number' ? [{ side, position }] : [])),
  );
  if (numberLeaves.length === 0) {
    return null;
  }
  const target = pickOne(random, numberLeaves);
  const original = target.side[target.position];
  if (original.kind !== 'number') {
    return null;
  }
  target.side[target.position] = { kind: 'unknown', weight: original.weight };

  const solved = solveScales(
    allBars(root).map((b) => barToScale(b, 0)),
    1,
    level.limit,
  );
  if (!solved || solved[0] !== original.weight) {
    return null;
  }

  const hintOrder = [...bar.left, ...bar.right].flatMap((item) =>
    item.kind === 'mobile' ? [item.id] : [],
  );
  return {
    kind: 'mobile',
    mode: 'numbers',
    level: level.id,
    seed,
    themeId,
    symbols: [],
    values: [],
    root,
    question: { kind: 'unknown', answer: original.weight },
    hintOrder,
  };
}
