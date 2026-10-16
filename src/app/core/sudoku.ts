import { LevelId } from './levels';

/** A sudoku: every row, column and box holds each digit 1..size exactly once. */
export interface SudokuPuzzle {
  kind: 'sudoku';
  level: LevelId;
  seed: number;
  themeId: string;
  symbols: string[];
  /** The solution, row by row. */
  values: number[];
  size: number;
  /** Box height and width in cells (2x2, 2x3 or 3x3). */
  boxRows: number;
  boxCols: number;
  /** true = the digit is shown, false = the player fills it. */
  given: boolean[];
  /** Not asked as a single answer; `answer` is the number of blank cells. */
  question: { kind: 'cells'; answer: number };
  /** Blank cell indices in the order logic can deduce them; hints reveal the first few. */
  hintOrder: number[];
}

export interface SudokuDimensions {
  size: number;
  boxRows: number;
  boxCols: number;
}

export function rowOf(dimensions: SudokuDimensions, cell: number): number {
  return Math.floor(cell / dimensions.size);
}

export function columnOf(dimensions: SudokuDimensions, cell: number): number {
  return cell % dimensions.size;
}

export function boxOf(dimensions: SudokuDimensions, cell: number): number {
  const boxesPerRow = dimensions.size / dimensions.boxCols;
  return (
    Math.floor(rowOf(dimensions, cell) / dimensions.boxRows) * boxesPerRow +
    Math.floor(columnOf(dimensions, cell) / dimensions.boxCols)
  );
}

/** All cells sharing a row, column or box with `cell` (not the cell itself). */
export function peersOf(dimensions: SudokuDimensions, cell: number): number[] {
  const total = dimensions.size * dimensions.size;
  const row = rowOf(dimensions, cell);
  const column = columnOf(dimensions, cell);
  const box = boxOf(dimensions, cell);
  return Array.from({ length: total }, (_, other) => other).filter(
    (other) =>
      other !== cell &&
      (rowOf(dimensions, other) === row ||
        columnOf(dimensions, other) === column ||
        boxOf(dimensions, other) === box),
  );
}

/**
 * Cells whose digit appears again in the same row, column or box. Says nothing about the
 * solution, only that two equal digits break the rules.
 */
export function conflictCells(dimensions: SudokuDimensions, digits: readonly number[]): number[] {
  return digits.flatMap((digit, cell) =>
    digit > 0 && peersOf(dimensions, cell).some((peer) => digits[peer] === digit) ? [cell] : [],
  );
}
