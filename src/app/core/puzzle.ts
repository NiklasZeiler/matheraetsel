import { Expression } from './expression';
import { LevelId } from './levels';
import { KreuzPuzzle } from './kreuzzahl';
import { MobilePuzzle } from './mobile';
import { PyramidPuzzle } from './pyramid';
import { SudokuPuzzle } from './sudoku';
import { WaagePuzzle } from './waage';
import { CodePuzzle } from './zahlenschloss';

export type PuzzleType =
  'gleichung' | 'waage' | 'mobile' | 'kreuzzahl' | 'pyramide' | 'sudoku' | 'zahlenschloss';

export const PUZZLE_TYPE_LABEL: Record<PuzzleType, string> = {
  gleichung: 'Gleichungen',
  waage: 'Waage',
  mobile: 'Mobile',
  kreuzzahl: 'Kreuzzahl',
  pyramide: 'Pyramide',
  sudoku: 'Sudoku',
  zahlenschloss: 'Zahlenschloss',
};

export const PUZZLE_TYPES: readonly PuzzleType[] = [
  'gleichung',
  'waage',
  'mobile',
  'kreuzzahl',
  'pyramide',
  'sudoku',
  'zahlenschloss',
];

export function isPuzzleType(value: unknown): value is PuzzleType {
  return typeof value === 'string' && (PUZZLE_TYPES as readonly string[]).includes(value);
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

export type AnyPuzzle =
  Puzzle | WaagePuzzle | MobilePuzzle | KreuzPuzzle | PyramidPuzzle | SudokuPuzzle | CodePuzzle;
