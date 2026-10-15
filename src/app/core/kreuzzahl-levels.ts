import { Operator } from './expression';
import { LevelId } from './levels';

export interface KreuzLevelConfig {
  id: LevelId;
  description: string;
  size: 2 | 3;
  operators: readonly Operator[];
  /** Cell values and every line result stay within 1..limit. */
  limit: number;
  valueRange: readonly [number, number];
  blanks: readonly [number, number];
}

export const KREUZ_LEVELS: Record<LevelId, KreuzLevelConfig> = {
  leicht: {
    id: 'leicht',
    description: '2×2 · plus und minus · bis 20',
    size: 2,
    operators: ['+', '-'],
    limit: 20,
    valueRange: [1, 12],
    blanks: [2, 2],
  },
  mittel: {
    id: 'mittel',
    description: '2×2 · plus, minus, mal · bis 100',
    size: 2,
    operators: ['+', '-', '*'],
    limit: 100,
    valueRange: [2, 15],
    blanks: [3, 3],
  },
  schwer: {
    id: 'schwer',
    description: '3×3 · plus, minus, mal · bis 100',
    size: 3,
    operators: ['+', '-', '*'],
    limit: 100,
    valueRange: [2, 12],
    blanks: [4, 5],
  },
  knobler: {
    id: 'knobler',
    description: '3×3 · alle Rechenarten, Punkt vor Strich · bis 1000',
    size: 3,
    operators: ['+', '-', '*', '/'],
    limit: 1000,
    valueRange: [2, 30],
    blanks: [5, 6],
  },
};
