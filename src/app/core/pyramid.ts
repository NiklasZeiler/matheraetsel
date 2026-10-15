import { LevelId } from './levels';

/**
 * A sum pyramid: every stone is the sum of the two stones below it. Cells are stored top to
 * bottom, row r holding r + 1 stones, so cell (r, c) has index r (r + 1) / 2 + c.
 */
export interface PyramidPuzzle {
  kind: 'pyramide';
  level: LevelId;
  seed: number;
  themeId: string;
  symbols: string[];
  values: number[];
  rows: number;
  /** true = the number is shown, false = the player fills it. */
  given: boolean[];
  /** Not asked as a single answer; `answer` is the number of blank cells. */
  question: { kind: 'cells'; answer: number };
  /** Blank cell indices in the order they can be deduced; hints reveal them in this order. */
  hintOrder: number[];
}

export function pyramidIndex(row: number, column: number): number {
  return (row * (row + 1)) / 2 + column;
}

export function pyramidCellCount(rows: number): number {
  return (rows * (rows + 1)) / 2;
}
