import { Expression } from './expression';
import { LevelId } from './levels';

export interface Equation {
  expression: Expression;
  result: number;
}

export type Question =
  | { kind: 'symbol'; symbol: number; answer: number }
  | { kind: 'expression'; expression: Expression; answer: number };

export interface Puzzle {
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
