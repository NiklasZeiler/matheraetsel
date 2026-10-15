import { AnyPuzzle } from './puzzle';

/** How many hints a puzzle offers; the asked-for picture itself is never revealed. */
export function maxHints(puzzle: AnyPuzzle): number {
  if (puzzle.kind === 'waage') {
    return puzzle.hintOrder.length;
  }
  return puzzle.question.kind === 'symbol' ? puzzle.symbols.length - 1 : puzzle.symbols.length;
}

/** Ratio scales carry no numbers, so players have nothing to note down. */
export function notesEnabled(puzzle: AnyPuzzle): boolean {
  return !(puzzle.kind === 'waage' && puzzle.mode === 'ratio');
}
