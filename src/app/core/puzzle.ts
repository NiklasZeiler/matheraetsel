import { Expression } from './expression';
import { LevelId } from './levels';
import { WaagePuzzle } from './waage';

export type PuzzleType = 'gleichung' | 'waage';

export const PUZZLE_TYPE_LABEL: Record<PuzzleType, string> = {
  gleichung: 'Gleichungen',
  waage: 'Waage',
};

export function isPuzzleType(value: unknown): value is PuzzleType {
  return value === 'gleichung' || value === 'waage';
}

export interface Equation {
  expression: Expression;
  result: number;
}

export type Question =
  | { kind: 'symbol'; symbol: number; answer: number }
  | { kind: 'expression'; expression: Expression; answer: number };

export interface Puzzle {
  kind: 'gleichung';
  level: LevelId;
  seed: number;
  themeId: string;
  /** Picture for each symbol index. */
  symbols: string[];
  /** Hidden value for each symbol index. */
  values: number[];
  equations: Equation[];
  question: Question;
  /** Symbol indices in the order they can be deduced; hints reveal them in this order. */
  hintOrder: number[];
}

export type AnyPuzzle = Puzzle | WaagePuzzle;
