import { LevelId } from './levels';

/** What one side of a balance holds: pictures (by symbol index) and numbered weights. */
export interface Pan {
  pictures: number[];
  weights: number[];
}

export interface Scale {
  left: Pan;
  right: Pan;
}

/**
 * "ratio": no numbers on the scales, pictures are compared by how many of one fit another.
 * "weights": numbered weights lie on the scales and the player computes a weight.
 */
export type WaageMode = 'ratio' | 'weights';

export type WaageQuestion =
  | { kind: 'count'; pan: Pan; unit: number; answer: number }
  | { kind: 'symbol'; symbol: number; answer: number }
  | { kind: 'expression'; pan: Pan; answer: number };

export interface WaagePuzzle {
  kind: 'waage';
  mode: WaageMode;
  level: LevelId;
  seed: number;
  themeId: string;
  symbols: string[];
  /** Hidden value per symbol; in ratio mode the unit symbol has value 1. */
  values: number[];
  scales: Scale[];
  question: WaageQuestion;
  /** Symbol indices in the order hints reveal them. */
  hintOrder: number[];
  /** Ratio mode only: the symbol every other picture is counted in. */
  unit: number | null;
}

export function panWeight(pan: Pan, values: readonly number[]): number {
  const pictures = pan.pictures.reduce((sum, symbol) => sum + values[symbol], 0);
  return pictures + pan.weights.reduce((sum, weight) => sum + weight, 0);
}

export function panItemCount(pan: Pan): number {
  return pan.pictures.length + pan.weights.length;
}
