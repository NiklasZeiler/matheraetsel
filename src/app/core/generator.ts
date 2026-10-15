import {
  Expression,
  Operator,
  binary,
  distinctSymbols,
  evaluate,
  hasCancellingSymbols,
  hasParentheses,
  hasRedundantParentheses,
  symbolLeaf,
} from './expression';
import { LEVELS, LevelConfig, LevelId } from './levels';
import { Equation, Puzzle, Question } from './puzzle';
import { Random, createRandom, pickOne, randomInt, shuffled } from './random';
import { candidateValues, solve } from './solver';
import { THEMES } from './themes';

const MAX_PUZZLE_ATTEMPTS = 500;
const MAX_EXPRESSION_TRIES = 80;
/** Chance that a level with grouped repeats builds an equation around a repeated picture. */
const REPEAT_CHANCE = 0.7;

/**
 * Deterministic: the same level and seed always yield the same puzzle, because shared
 * links only carry those two values. Changing the order of random draws below breaks
 * existing links, so the golden tests in generator.spec.ts must stay green.
 */
export function generatePuzzle(levelId: LevelId, seed: number): Puzzle {
  const level = LEVELS[levelId];
  const random = createRandom(seed);
  for (let attempt = 0; attempt < MAX_PUZZLE_ATTEMPTS; attempt++) {
    const puzzle = tryGenerate(level, seed, random);
    if (puzzle) {
      return puzzle;
    }
  }
  throw new Error(`No puzzle found for level ${levelId} and seed ${seed}`);
}

function tryGenerate(level: LevelConfig, seed: number, random: Random): Puzzle | null {
  const theme = pickOne(random, THEMES);
  const symbolCount = randomInt(random, level.symbolCount[0], level.symbolCount[1]);
  const symbols = shuffled(random, theme.symbols).slice(0, symbolCount);
  const values = distinctValues(random, symbolCount, level.valueRange);

  const equations: Equation[] = [];
  for (let symbol = 0; symbol < symbolCount; symbol++) {
    const equation = buildEquation(random, level, symbol, values);
    if (!equation) {
      return null;
    }
    equations.push(equation);
  }

  const solution = solve(equations, symbolCount, level.limit);
  const question = buildQuestion(random, level, values);
  if (!solution || !question) {
    return null;
  }

  return {
    kind: 'gleichung',
    level: level.id,
    seed,
    themeId: theme.id,
    symbols,
    values,
    equations,
    question,
    hintOrder: solution.order,
  };
}

function distinctValues(random: Random, count: number, range: readonly [number, number]): number[] {
  const all: number[] = [];
  for (let value = range[0]; value <= range[1]; value++) {
    all.push(value);
  }
  return shuffled(random, all).slice(0, count);
}

function randomTree(
  random: Random,
  leaves: readonly number[],
  operators: readonly Operator[],
  plusBetweenEqual: boolean,
): Expression {
  if (leaves.length === 1) {
    return symbolLeaf(leaves[0]);
  }
  const split = randomInt(random, 1, leaves.length - 1);
  const picked = pickOne(random, operators);
  // Equal neighbours joined by "+" are displayed as a group, e.g. "🍌🍌".
  const operator = plusBetweenEqual && leaves[split - 1] === leaves[split] ? '+' : picked;
  return binary(
    operator,
    randomTree(random, leaves.slice(0, split), operators, plusBetweenEqual),
    randomTree(random, leaves.slice(split), operators, plusBetweenEqual),
  );
}

/** Builds a random expression; on grouping levels it often centres it on a repeated picture. */
function buildExpression(
  random: Random,
  level: LevelConfig,
  leaves: readonly number[],
): Expression {
  const repeat = level.groupRepeats && random() < REPEAT_CHANCE;
  let ordered = shuffled(random, leaves);
  if (repeat) {
    if (new Set(ordered).size === ordered.length) {
      ordered = [...ordered, pickOne(random, ordered)];
    }
    const firstPosition = new Map<number, number>();
    ordered.forEach((symbol, position) => {
      if (!firstPosition.has(symbol)) {
        firstPosition.set(symbol, position);
      }
    });
    const positionOf = (symbol: number) => firstPosition.get(symbol) ?? 0;
    ordered = [...ordered].sort((left, right) => positionOf(left) - positionOf(right));
  }
  return randomTree(random, ordered, level.operators, repeat);
}

function isUnsuitable(expression: Expression, level: LevelConfig): boolean {
  return (
    hasRedundantParentheses(expression) ||
    hasCancellingSymbols(expression) ||
    (!level.allowParentheses && hasParentheses(expression))
  );
}

/**
 * Equation k introduces symbol k and always mentions symbol k-1, so the last symbol
 * can only be found by working through the whole chain.
 */
function buildEquation(
  random: Random,
  level: LevelConfig,
  symbol: number,
  values: readonly number[],
): Equation | null {
  const required = symbol === 0 ? [0] : [symbol, symbol - 1];
  const pool = Array.from({ length: symbol + 1 }, (_, index) => index);
  const known = values.map((value, index) => (index < symbol ? value : undefined));

  for (let attempt = 0; attempt < MAX_EXPRESSION_TRIES; attempt++) {
    const count = Math.max(
      symbol === 0 ? 2 : required.length,
      randomInt(random, level.occurrences[0], level.occurrences[1]),
    );
    const extras = Array.from({ length: count - required.length }, () => pickOne(random, pool));
    const expression = buildExpression(random, level, [...required, ...extras]);
    if (isUnsuitable(expression, level)) {
      continue;
    }
    const result = evaluate(expression, values, level.limit);
    if (result === null) {
      continue;
    }
    if (candidateValues(expression, result, symbol, known, level.limit).length !== 1) {
      continue;
    }
    return { expression, result };
  }
  return null;
}

function buildQuestion(
  random: Random,
  level: LevelConfig,
  values: readonly number[],
): Question | null {
  const last = values.length - 1;
  if (level.question === 'symbol') {
    return { kind: 'symbol', symbol: last, answer: values[last] };
  }

  const others = shuffled(
    random,
    Array.from({ length: last }, (_, index) => index),
  );
  for (let attempt = 0; attempt < MAX_EXPRESSION_TRIES; attempt++) {
    const extraCount = randomInt(random, 0, 1);
    const leaves = [
      last,
      others[0],
      others[1],
      ...Array.from({ length: extraCount }, () => pickOne(random, others)),
    ];
    const expression = buildExpression(random, level, leaves);
    if (isUnsuitable(expression, level)) {
      continue;
    }
    const answer = evaluate(expression, values, level.limit);
    if (answer === null || distinctSymbols(expression).length < 3) {
      continue;
    }
    return { kind: 'expression', expression, answer };
  }
  return null;
}
