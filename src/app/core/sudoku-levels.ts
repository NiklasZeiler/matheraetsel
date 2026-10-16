import { LevelId } from './levels';

export interface SudokuLevelConfig {
  id: LevelId;
  description: string;
  size: 4 | 6 | 9;
  boxRows: number;
  boxCols: number;
  /** Digits shown at the start. The generator removes cells while logic still solves it. */
  givens: number;
  /** Accepted overshoot: some grids cannot be thinned down to exactly `givens`. */
  tolerance: number;
  /** Hints are capped so they stay a help, not a walkthrough. */
  maxHints: number;
}

export const SUDOKU_LEVELS: Record<LevelId, SudokuLevelConfig> = {
  leicht: {
    id: 'leicht',
    description: '4×4 · etwa 8 Zahlen vorgegeben',
    size: 4,
    boxRows: 2,
    boxCols: 2,
    givens: 8,
    tolerance: 1,
    maxHints: 2,
  },
  mittel: {
    id: 'mittel',
    description: '6×6 · etwa 18 Zahlen vorgegeben',
    size: 6,
    boxRows: 2,
    boxCols: 3,
    givens: 18,
    tolerance: 2,
    maxHints: 3,
  },
  schwer: {
    id: 'schwer',
    description: '9×9 · etwa 36 Zahlen vorgegeben',
    size: 9,
    boxRows: 3,
    boxCols: 3,
    givens: 36,
    tolerance: 3,
    maxHints: 3,
  },
  knobler: {
    id: 'knobler',
    description: '9×9 · etwa 28 Zahlen vorgegeben',
    size: 9,
    boxRows: 3,
    boxCols: 3,
    givens: 28,
    tolerance: 5,
    maxHints: 3,
  },
};
