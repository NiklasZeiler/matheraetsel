import { Expression, Operator, binary, symbolLeaf } from './expression';
import { LevelId } from './levels';

/**
 * A size x size grid of numbers. Every row and every column is one calculation whose result
 * is printed at its end; the player fills the blank cells.
 */
export interface KreuzPuzzle {
  kind: 'kreuzzahl';
  level: LevelId;
  seed: number;
  themeId: string;
  symbols: string[];
  /** Cell values, row by row. */
  values: number[];
  size: number;
  /** Per row: the operators between its cells (size - 1 of them). */
  rowOperators: Operator[][];
  /** Per column: the operators between its cells, top to bottom. */
  columnOperators: Operator[][];
  rowResults: number[];
  columnResults: number[];
  /** true = the number is shown, false = the player fills it. */
  given: boolean[];
  /** Not asked as a single answer; `answer` is the number of blank cells. */
  question: { kind: 'cells'; answer: number };
  /** Blank cell indices in the order they can be deduced; hints reveal them in this order. */
  hintOrder: number[];
}

const isTight = (operator: Operator) => operator === '*' || operator === '/';

/**
 * The calculation of one line as an expression over its cells (leaf i = i-th cell).
 * Written left to right with multiplication and division binding tighter, as printed.
 */
export function lineExpression(operators: readonly Operator[]): Expression {
  if (operators.length === 1) {
    return binary(operators[0], symbolLeaf(0), symbolLeaf(1));
  }
  const [first, second] = operators;
  if (isTight(second) && !isTight(first)) {
    return binary(first, symbolLeaf(0), binary(second, symbolLeaf(1), symbolLeaf(2)));
  }
  return binary(second, binary(first, symbolLeaf(0), symbolLeaf(1)), symbolLeaf(2));
}

export function rowCells(size: number, row: number): number[] {
  return Array.from({ length: size }, (_, column) => row * size + column);
}

export function columnCells(size: number, column: number): number[] {
  return Array.from({ length: size }, (_, row) => row * size + column);
}

export function blankCells(puzzle: KreuzPuzzle): number[] {
  return puzzle.given.flatMap((given, cell) => (given ? [] : [cell]));
}
