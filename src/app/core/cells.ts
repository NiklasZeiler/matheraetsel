import type { AnyPuzzle } from './puzzle';
import type { KreuzPuzzle } from './kreuzzahl';
import type { PyramidPuzzle } from './pyramid';

/** Puzzles whose answer is a set of blank cells (kreuzzahl, pyramid). */
export type CellPuzzle = KreuzPuzzle | PyramidPuzzle;

export function isCellPuzzle(puzzle: AnyPuzzle): puzzle is CellPuzzle {
  return puzzle.kind === 'kreuzzahl' || puzzle.kind === 'pyramide';
}

export function blankCells(puzzle: Pick<CellPuzzle, 'given'>): number[] {
  return puzzle.given.flatMap((given, cell) => (given ? [] : [cell]));
}
