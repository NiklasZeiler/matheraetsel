import { LevelId } from './levels';

export interface CodeLevelConfig {
  id: LevelId;
  description: string;
  length: number;
  repeats: boolean;
  /** Number of clues the generator aims for. */
  clues: readonly [number, number];
  /** Clues only say how many digits are right and well placed (the others are not in the code). */
  simpleClues: boolean;
  /** Hints stay a help: they reveal at most this many positions. */
  maxHints: number;
}

export const CODE_LEVELS: Record<LevelId, CodeLevelConfig> = {
  leicht: {
    id: 'leicht',
    description: '3 Ziffern · einfache Hinweise',
    length: 3,
    repeats: false,
    clues: [3, 4],
    simpleClues: true,
    maxHints: 1,
  },
  mittel: {
    id: 'mittel',
    description: '3 Ziffern · mehr Hinweise',
    length: 3,
    repeats: false,
    clues: [4, 5],
    simpleClues: false,
    maxHints: 1,
  },
  schwer: {
    id: 'schwer',
    description: '4 Ziffern · jede Ziffer nur einmal',
    length: 4,
    repeats: false,
    clues: [5, 6],
    simpleClues: false,
    maxHints: 2,
  },
  knobler: {
    id: 'knobler',
    description: '4 Ziffern · Ziffern dürfen doppelt vorkommen',
    length: 4,
    repeats: true,
    clues: [6, 7],
    simpleClues: false,
    maxHints: 2,
  },
};
