import type { AnyPuzzle } from './puzzle';
import type { KreuzPuzzle } from './kreuzzahl';
import type { PyramidPuzzle } from './pyramid';
import type { SudokuPuzzle } from './sudoku';

/** Puzzles whose answer is a set of blank cells (kreuzzahl, pyramid, sudoku). */
export type CellPuzzle = KreuzPuzzle | PyramidPuzzle | SudokuPuzzle;

export function isCellPuzzle(puzzle: AnyPuzzle): puzzle is CellPuzzle {
  return puzzle.kind === 'kreuzzahl' || puzzle.kind === 'pyramide' || puzzle.kind === 'sudoku';
}

export function blankCells(puzzle: Pick<CellPuzzle, 'given'>): number[] {
  return puzzle.given.flatMap((given, cell) => (given ? [] : [cell]));
}
