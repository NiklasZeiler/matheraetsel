import { LevelId } from './levels';
import { Pan, Scale } from './waage';

/** One thing hanging on a bar: a leaf (picture or number) or a smaller mobile. */
export type MobileItem =
  | { kind: 'picture'; symbol: number }
  | { kind: 'number'; weight: number }
  /** Numbers mode: the leaf the player must find; `weight` is the hidden answer. */
  | { kind: 'unknown'; weight: number }
  | { kind: 'mobile'; id: number; asked: boolean; bar: MobileBar };

/** A bar is balanced: the weight hanging on the left equals the weight on the right. */
export interface MobileBar {
  left: MobileItem[];
  right: MobileItem[];
}

export type MobileMode = 'numbers' | 'pictures';

export type MobileQuestion =
  | { kind: 'unknown'; answer: number }
  | { kind: 'symbol'; symbol: number; answer: number }
  /** Weight of the sub-mobile marked with `asked`. */
  | { kind: 'part'; answer: number };

export interface MobilePuzzle {
  kind: 'mobile';
  mode: MobileMode;
  level: LevelId;
  seed: number;
  themeId: string;
  symbols: string[];
  /** Hidden weight per symbol (empty in numbers mode). */
  values: number[];
  root: MobileBar;
  question: MobileQuestion;
  /** Pictures mode: symbol indices to reveal. Numbers mode: ids of sub-mobiles whose total is revealed. */
  hintOrder: number[];
}

export function itemWeight(item: MobileItem, values: readonly number[]): number {
  switch (item.kind) {
    case 'picture':
      return values[item.symbol];
    case 'number':
    case 'unknown':
      return item.weight;
    case 'mobile':
      return barWeight(item.bar, values);
  }
}

export function sideWeight(items: readonly MobileItem[], values: readonly number[]): number {
  return items.reduce((sum, item) => sum + itemWeight(item, values), 0);
}

/** Weight of everything hanging below (and on) this bar. */
export function barWeight(bar: MobileBar, values: readonly number[]): number {
  return sideWeight(bar.left, values) + sideWeight(bar.right, values);
}

export function subMobiles(bar: MobileBar): Extract<MobileItem, { kind: 'mobile' }>[] {
  const direct = [...bar.left, ...bar.right].filter(
    (item): item is Extract<MobileItem, { kind: 'mobile' }> => item.kind === 'mobile',
  );
  return direct.flatMap((item) => [item, ...subMobiles(item.bar)]);
}

/** Every bar, root first; used to turn the mobile into balance equations. */
export function allBars(root: MobileBar): MobileBar[] {
  return [root, ...subMobiles(root).map((item) => item.bar)];
}

function leaves(items: readonly MobileItem[], unknownSymbol: number): Pan {
  const pan: Pan = { pictures: [], weights: [] };
  for (const item of items) {
    if (item.kind === 'picture') {
      pan.pictures.push(item.symbol);
    } else if (item.kind === 'unknown') {
      pan.pictures.push(unknownSymbol);
    } else if (item.kind === 'number') {
      pan.weights.push(item.weight);
    } else {
      const inner = leaves([...item.bar.left, ...item.bar.right], unknownSymbol);
      pan.pictures.push(...inner.pictures);
      pan.weights.push(...inner.weights);
    }
  }
  return pan;
}

/** The balance equation of one bar as a flat scale, so the waage solver can verify it. */
export function barToScale(bar: MobileBar, unknownSymbol = 0): Scale {
  return { left: leaves(bar.left, unknownSymbol), right: leaves(bar.right, unknownSymbol) };
}

/**
 * Approximate drawing width in leaf units: both arms side by side plus the fulcrum between
 * them. A sub-mobile hangs from its own fulcrum, so it counts with its full width.
 */
export function barWidth(bar: MobileBar): number {
  const arm = (items: readonly MobileItem[]) =>
    items.reduce((sum, item) => sum + (item.kind === 'mobile' ? barWidth(item.bar) : 1), 0);
  return arm(bar.left) + arm(bar.right) + 0.5;
}

export function mobileLabel(id: number): string {
  return String.fromCharCode(65 + id);
}
