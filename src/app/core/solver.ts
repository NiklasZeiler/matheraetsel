import { Expression, distinctSymbols, evaluate } from './expression';
import { Equation } from './puzzle';

export interface Solution {
  values: number[];
  /** Symbol indices in the order they become deducible. */
  order: number[];
}

/** All values 1..limit for `symbol` that make the expression evaluate to `result`. */
export function candidateValues(
  expression: Expression,
  result: number,
  symbol: number,
  known: readonly (number | undefined)[],
  limit: number,
): number[] {
  const trial = [...known];
  const candidates: number[] = [];
  for (let value = 1; value <= limit; value++) {
    trial[symbol] = value;
    if (evaluate(expression, trial, limit) === result) {
      candidates.push(value);
    }
  }
  return candidates;
}

/**
 * Solves by repeatedly picking an equation with exactly one unknown symbol.
 * Returns null unless every step has exactly one candidate, which guarantees a
 * puzzle can be deduced by hand without guessing.
 */
export function solve(
  equations: readonly Equation[],
  symbolCount: number,
  limit: number,
): Solution | null {
  const known: (number | undefined)[] = new Array(symbolCount).fill(undefined);
  const order: number[] = [];
  const pending = [...equations];

  while (pending.length > 0) {
    const nextIndex = pending.findIndex(
      (equation) => distinctSymbols(equation.expression).filter((s) => known[s] === undefined).length <= 1,
    );
    if (nextIndex === -1) {
      return null;
    }
    const [equation] = pending.splice(nextIndex, 1);
    const unknown = distinctSymbols(equation.expression).filter((s) => known[s] === undefined);

    if (unknown.length === 0) {
      if (evaluate(equation.expression, known, limit) !== equation.result) {
        return null;
      }
      continue;
    }

    const candidates = candidateValues(equation.expression, equation.result, unknown[0], known, limit);
    if (candidates.length !== 1) {
      return null;
    }
    known[unknown[0]] = candidates[0];
    order.push(unknown[0]);
  }

  if (known.some((value) => value === undefined)) {
    return null;
  }
  return { values: known as number[], order };
}
