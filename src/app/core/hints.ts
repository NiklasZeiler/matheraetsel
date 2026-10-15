import { AnyPuzzle } from './puzzle';

/** How many hints a puzzle offers; the asked-for picture itself is never revealed. */
export function maxHints(puzzle: AnyPuzzle): number {
  if (puzzle.kind === 'gleichung') {
    return puzzle.question.kind === 'symbol' ? puzzle.symbols.length - 1 : puzzle.symbols.length;
  }
  return puzzle.hintOrder.length;
}

/**
 * Ratio scales and number-only mobiles carry nothing worth noting per picture, so players
 * only get hints there.
 */
export function notesEnabled(puzzle: AnyPuzzle): boolean {
  if (puzzle.kind === 'waage') {
    return puzzle.mode === 'weights';
  }
  if (puzzle.kind === 'mobile') {
    return puzzle.mode === 'pictures';
  }
  return true;
}
