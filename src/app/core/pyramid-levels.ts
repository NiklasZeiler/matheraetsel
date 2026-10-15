import { LevelId } from './levels';

export interface PyramidLevelConfig {
  id: LevelId;
  description: string;
  rows: number;
  /** Every stone, including the top, stays within 1..limit. */
  limit: number;
  /** Range of the bottom row; the stones above are sums. */
  baseRange: readonly [number, number];
  blanks: number;
}

export const PYRAMID_LEVELS: Record<LevelId, PyramidLevelConfig> = {
  leicht: {
    id: 'leicht',
    description: '3 Reihen · Spitze bis 20 · 2 Lücken',
    rows: 3,
    limit: 20,
    baseRange: [1, 6],
    blanks: 2,
  },
  mittel: {
    id: 'mittel',
    description: '4 Reihen · Spitze bis 100 · 4 Lücken',
    rows: 4,
    limit: 100,
    baseRange: [2, 12],
    blanks: 4,
  },
  schwer: {
    id: 'schwer',
    description: '5 Reihen · Spitze bis 100 · 7 Lücken',
    rows: 5,
    limit: 100,
    baseRange: [1, 6],
    blanks: 7,
  },
  knobler: {
    id: 'knobler',
    description: '6 Reihen · Spitze bis 1000 · 10 Lücken',
    rows: 6,
    limit: 1000,
    baseRange: [2, 30],
    blanks: 10,
  },
};
