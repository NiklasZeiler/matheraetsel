import { LevelId } from './levels';
import { Random, createRandom, pickOne, randomInt, shuffled } from './random';
import { THEMES } from './themes';
import { Pan, Scale, WaagePuzzle, WaageQuestion, panItemCount, panWeight } from './waage';
import { WAAGE_LEVELS, WaageLevelConfig } from './waage-levels';
import { solveScales } from './waage-solver';

const MAX_PUZZLE_ATTEMPTS = 500;
const MAX_SCALE_TRIES = 60;
const RATIO_ANSWER_LIMIT = 12;

/**
 * Deterministic like generatePuzzle: the same level and seed always give the same scales.
 * Do not reorder the random draws below once links are shared; the golden test guards this.
 */
export function generateWaage(levelId: LevelId, seed: number): WaagePuzzle {
  const level = WAAGE_LEVELS[levelId];
  const random = createRandom(seed);
  for (let attempt = 0; attempt < MAX_PUZZLE_ATTEMPTS; attempt++) {
    const puzzle =
      level.mode === 'ratio'
        ? tryGenerateRatio(level, seed, random)
        : tryGenerateWeights(level, seed, random);
    if (puzzle) {
      return puzzle;
    }
  }
  throw new Error(`No waage puzzle found for level ${levelId} and seed ${seed}`);
}

function pickSymbols(random: Random, count: number) {
  const theme = pickOne(random, THEMES);
  return { themeId: theme.id, symbols: shuffled(random, theme.symbols).slice(0, count) };
}

function emptyPan(): Pan {
  return { pictures: [], weights: [] };
}

function repeat(symbol: number, count: number): number[] {
  return Array.from({ length: count }, () => symbol);
}

function sides(random: Random, first: Pan, second: Pan): Scale {
  return random() < 0.5 ? { left: first, right: second } : { left: second, right: first };
}

// ---------------------------------------------------------------- ratio mode

/**
 * Chain S0 = m0 * S1, S1 = m1 * S2, ... The last symbol is the unit with value 1.
 * Scale i compares k copies of S_i with k * m_i copies of S_(i+1).
 */
function tryGenerateRatio(
  level: WaageLevelConfig,
  seed: number,
  random: Random,
): WaagePuzzle | null {
  const symbolCount = randomInt(random, level.symbolCount[0], level.symbolCount[1]);
  const { themeId, symbols } = pickSymbols(random, symbolCount);
  const unit = symbolCount - 1;

  const values: number[] = new Array(symbolCount).fill(1);
  const multiples: number[] = [];
  for (let symbol = unit - 1; symbol >= 0; symbol--) {
    const multiple = randomInt(random, level.multipleRange[0], level.multipleRange[1]);
    multiples[symbol] = multiple;
    values[symbol] = multiple * values[symbol + 1];
  }

  const scales: Scale[] = [];
  for (let symbol = 0; symbol < unit; symbol++) {
    const copies = multiples[symbol] <= 3 ? randomInt(random, 1, 2) : 1;
    const heavy: Pan = { pictures: repeat(symbol, copies), weights: [] };
    const light: Pan = { pictures: repeat(symbol + 1, copies * multiples[symbol]), weights: [] };
    scales.push(sides(random, heavy, light));
  }

  const pan = buildRatioQuestionPan(random, level, symbolCount);
  const answer = panWeight(pan, values);
  if (answer > RATIO_ANSWER_LIMIT || panItemCount(pan) < 1) {
    return null;
  }
  if (
    solveScales(
      scales,
      symbolCount,
      level.limit * 100,
      values.map((v, i) => (i === unit ? 1 : undefined)),
    ) === null
  ) {
    return null;
  }

  const question: WaageQuestion = { kind: 'count', pan, unit, answer };
  const hintOrder = Array.from({ length: unit }, (_, index) => unit - 1 - index);
  return {
    kind: 'waage',
    mode: 'ratio',
    level: level.id,
    seed,
    themeId,
    symbols,
    values,
    scales,
    question,
    hintOrder,
    unit,
  };
}

function buildRatioQuestionPan(random: Random, level: WaageLevelConfig, symbolCount: number): Pan {
  if (symbolCount === 2) {
    return { pictures: repeat(0, randomInt(random, 2, 3)), weights: [] };
  }
  const variants: number[][] = [[0], [0, 1], [0, 0], [0, 1, 1]];
  return { pictures: pickOne(random, variants), weights: [] };
}

// -------------------------------------------------------------- weights mode

function tryGenerateWeights(
  level: WaageLevelConfig,
  seed: number,
  random: Random,
): WaagePuzzle | null {
  const symbolCount = randomInt(random, level.symbolCount[0], level.symbolCount[1]);
  const { themeId, symbols } = pickSymbols(random, symbolCount);
  const all: number[] = [];
  for (let value = level.valueRange[0]; value <= level.valueRange[1]; value++) {
    all.push(value);
  }
  const values = shuffled(random, all).slice(0, symbolCount);

  const scales: Scale[] = [];
  for (let symbol = 0; symbol < symbolCount; symbol++) {
    const scale = buildWeightScale(random, level, symbol, values);
    if (!scale) {
      return null;
    }
    scales.push(scale);
  }

  if (!sameValues(solveScales(scales, symbolCount, level.limit), values)) {
    return null;
  }
  const question = buildWeightQuestion(random, level, values);
  if (!question) {
    return null;
  }
  const revealable = question.kind === 'symbol' ? symbolCount - 1 : symbolCount;
  const hintOrder = solveOrder(scales, symbolCount).slice(0, revealable);
  return {
    kind: 'waage',
    mode: 'weights',
    level: level.id,
    seed,
    themeId,
    symbols,
    values,
    scales,
    question,
    hintOrder,
    unit: null,
  };
}

function sameValues(solved: number[] | null, values: readonly number[]): boolean {
  return solved !== null && solved.every((value, index) => value === values[index]);
}

/** Symbols are introduced one per scale, so the deduction order is simply 0..n-1. */
function solveOrder(scales: readonly Scale[], symbolCount: number): number[] {
  return scales.length === symbolCount ? Array.from({ length: symbolCount }, (_, i) => i) : [];
}

function splitWeight(random: Random, level: WaageLevelConfig, total: number): number[] {
  const margin = Math.ceil(total / 4);
  if (level.splitWeights && total >= 8 && random() < 0.5) {
    // Keep both parts sizeable so a split never looks like "109 + 1".
    const first = randomInt(random, margin, total - margin);
    return [first, total - first];
  }
  return [total];
}

/**
 * Scale k introduces symbol k and always holds symbol k-1, so the last picture can only be
 * found by working through every scale. A balancing weight is added to the lighter pan.
 */
function buildWeightScale(
  random: Random,
  level: WaageLevelConfig,
  symbol: number,
  values: readonly number[],
): Scale | null {
  for (let attempt = 0; attempt < MAX_SCALE_TRIES; attempt++) {
    let scale: Scale;

    if (symbol === 0) {
      const copies = randomInt(random, 2, 3);
      const total = copies * values[0];
      const pictures: Pan = { pictures: repeat(0, copies), weights: [] };
      const weights: Pan = { pictures: [], weights: splitWeight(random, level, total) };
      scale = sides(random, pictures, weights);
    } else {
      const left = emptyPan();
      const right = emptyPan();
      const place = (symbolToPlace: number, count: number, onLeft: boolean) =>
        (onLeft ? left : right).pictures.push(...repeat(symbolToPlace, count));

      const newCount = randomInt(random, 1, 2);
      const newOnLeft = random() < 0.5;
      place(symbol, newCount, newOnLeft);
      if (newCount === 2 && random() < 0.3) {
        place(symbol, 1, !newOnLeft);
      }
      place(symbol - 1, randomInt(random, 1, 2), random() < 0.5);
      if (symbol >= 2 && random() < 0.5) {
        place(randomInt(random, 0, symbol - 2), 1, random() < 0.5);
      }

      const difference = panWeight(left, values) - panWeight(right, values);
      const leftCount = left.pictures.filter((p) => p === symbol).length;
      const rightCount = right.pictures.filter((p) => p === symbol).length;
      if (leftCount === rightCount) {
        continue;
      }
      if (difference > 0) {
        right.weights.push(...splitWeight(random, level, difference));
      } else if (difference < 0) {
        left.weights.push(...splitWeight(random, level, -difference));
      }
      scale = { left, right };
    }

    const fits = [scale.left, scale.right].every(
      (pan) => panItemCount(pan) <= level.maxPanItems && panWeight(pan, values) <= level.limit,
    );
    if (fits) {
      return scale;
    }
  }
  return null;
}

function buildWeightQuestion(
  random: Random,
  level: WaageLevelConfig,
  values: readonly number[],
): WaageQuestion | null {
  const last = values.length - 1;
  if (level.question === 'symbol') {
    return { kind: 'symbol', symbol: last, answer: values[last] };
  }

  const others = shuffled(
    random,
    Array.from({ length: last }, (_, index) => index),
  );
  const pictures = shuffled(random, [last, others[0], others[1], pickOne(random, others)]).slice(
    0,
    randomInt(random, 3, 4),
  );
  if (!pictures.includes(last)) {
    pictures[0] = last;
  }
  const pan: Pan = { pictures, weights: [] };
  const answer = panWeight(pan, values);
  return answer <= level.limit ? { kind: 'expression', pan, answer } : null;
}
