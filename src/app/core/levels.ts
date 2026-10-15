import { Operator } from './expression';

export type LevelId = 'leicht' | 'mittel' | 'schwer' | 'knobler';

export interface LevelConfig {
  id: LevelId;
  label: string;
  description: string;
  /** Every value, result and intermediate result stays within 1..limit. */
  limit: number;
  operators: readonly Operator[];
  allowParentheses: boolean;
  symbolCount: readonly [number, number];
  /** Range of the hidden value behind each picture. */
  valueRange: readonly [number, number];
  /** Pictures per equation, counted with repeats. */
  occurrences: readonly [number, number];
  question: 'symbol' | 'expression';
}

export const LEVELS: Record<LevelId, LevelConfig> = {
  leicht: {
    id: 'leicht',
    label: 'Leicht',
    description: 'Zahlenraum bis 20 · plus und minus',
    limit: 20,
    operators: ['+', '-'],
    allowParentheses: false,
    symbolCount: [3, 3],
    valueRange: [2, 9],
    occurrences: [2, 3],
    question: 'symbol',
  },
  mittel: {
    id: 'mittel',
    label: 'Mittel',
    description: 'Zahlenraum bis 100 · plus, minus, mal',
    limit: 100,
    operators: ['+', '-', '*'],
    allowParentheses: false,
    symbolCount: [4, 4],
    valueRange: [2, 12],
    occurrences: [2, 3],
    question: 'symbol',
  },
  schwer: {
    id: 'schwer',
    label: 'Schwer',
    description: 'Zahlenraum bis 100 · alle Rechenarten, Punkt vor Strich',
    limit: 100,
    operators: ['+', '-', '*', '/'],
    allowParentheses: false,
    symbolCount: [5, 5],
    valueRange: [2, 15],
    occurrences: [3, 4],
    question: 'expression',
  },
  knobler: {
    id: 'knobler',
    label: 'Knobler',
    description: 'Zahlenraum bis 1000 · alle Rechenarten mit Klammern',
    limit: 1000,
    operators: ['+', '-', '*', '/'],
    allowParentheses: true,
    symbolCount: [5, 6],
    valueRange: [2, 30],
    occurrences: [3, 4],
    question: 'expression',
  },
};

export const LEVEL_IDS = Object.keys(LEVELS) as LevelId[];

export function isLevelId(value: unknown): value is LevelId {
  return typeof value === 'string' && value in LEVELS;
}
