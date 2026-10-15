import { Operator, evaluate } from './expression';
import { LevelId } from './levels';
import { KreuzPuzzle, columnCells, lineExpression, rowCells } from './kreuzzahl';
import { KREUZ_LEVELS, KreuzLevelConfig } from './kreuzzahl-levels';
import { Random, createRandom, pickOne, randomInt, shuffled } from './random';

const MAX_ATTEMPTS = 5000;
/** Division needs exact results, so it is drawn less often than the other operators. */
const DIVISION_WEIGHT = 0.4;

interface Line {
  cells: number[];
  operators: Operator[];
  result: number;
}

/**
 * Deterministic like the other generators: level and seed always give the same grid.
 * Keep the order of random draws stable once links are shared (golden test in the spec).
 */
export function generateKreuzzahl(levelId: LevelId, seed: number): KreuzPuzzle {
  const level = KREUZ_LEVELS[levelId];
  const random = createRandom(seed);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const puzzle = tryGenerate(level, seed, random);
    if (puzzle) {
      return puzzle;
    }
  }
  throw new Error(`No kreuzzahl found for level ${levelId} and seed ${seed}`);
}

function randomOperators(random: Random, level: KreuzLevelConfig): Operator[] {
  return Array.from({ length: level.size - 1 }, () => {
    const operator = pickOne(random, level.operators);
    return operator === '/' && random() > DIVISION_WEIGHT
      ? pickOne(
          random,
          level.operators.filter((other) => other !== '/'),
        )
      : operator;
  });
}

function tryGenerate(level: KreuzLevelConfig, seed: number, random: Random): KreuzPuzzle | null {
  const { size, limit } = level;
  const values = Array.from({ length: size * size }, () =>
    randomInt(random, level.valueRange[0], level.valueRange[1]),
  );

  const rowOperators: Operator[][] = [];
  const columnOperators: Operator[][] = [];
  const rowResults: number[] = [];
  const columnResults: number[] = [];
  const lines: Line[] = [];

  for (let index = 0; index < size; index++) {
    const rowOps = randomOperators(random, level);
    const rowResult = evaluate(
      lineExpression(rowOps),
      rowCells(size, index).map((c) => values[c]),
      limit,
    );
    const columnOps = randomOperators(random, level);
    const columnResult = evaluate(
      lineExpression(columnOps),
      columnCells(size, index).map((c) => values[c]),
      limit,
    );
    if (rowResult === null || columnResult === null) {
      return null;
    }
    rowOperators.push(rowOps);
    columnOperators.push(columnOps);
    rowResults.push(rowResult);
    columnResults.push(columnResult);
    lines.push({ cells: rowCells(size, index), operators: rowOps, result: rowResult });
    lines.push({ cells: columnCells(size, index), operators: columnOps, result: columnResult });
  }

  const blankCount = randomInt(random, level.blanks[0], level.blanks[1]);
  const blanks = shuffled(
    random,
    Array.from({ length: size * size }, (_, cell) => cell),
  ).slice(0, blankCount);

  const order = deduceOrder(lines, values, blanks, limit);
  if (!order) {
    return null;
  }

  const given = values.map((_, cell) => !blanks.includes(cell));
  return {
    kind: 'kreuzzahl',
    level: level.id,
    seed,
    themeId: '',
    symbols: [],
    values,
    size,
    rowOperators,
    columnOperators,
    rowResults,
    columnResults,
    given,
    question: { kind: 'cells', answer: blankCount },
    // The last blank is left to the player: hints never solve the whole puzzle.
    hintOrder: order.slice(0, -1),
  };
}

/**
 * Solves by repeatedly picking a line with exactly one unknown cell that has exactly one
 * fitting value. Returns the order of deduction, or null if some step needs guessing.
 */
function deduceOrder(
  lines: readonly Line[],
  values: readonly number[],
  blanks: readonly number[],
  limit: number,
): number[] | null {
  const known: (number | undefined)[] = values.map((value, cell) =>
    blanks.includes(cell) ? undefined : value,
  );
  const order: number[] = [];

  while (order.length < blanks.length) {
    const next = lines.find(
      (line) => line.cells.filter((cell) => known[cell] === undefined).length === 1,
    );
    if (!next) {
      return null;
    }
    const unknown = next.cells.find((cell) => known[cell] === undefined) ?? 0;
    const expression = lineExpression(next.operators);
    const candidates: number[] = [];
    for (let candidate = 1; candidate <= limit; candidate++) {
      const lineValues = next.cells.map((cell) => (cell === unknown ? candidate : known[cell]));
      if (evaluate(expression, lineValues, limit) === next.result) {
        candidates.push(candidate);
      }
    }
    if (candidates.length !== 1 || candidates[0] !== values[unknown]) {
      return null;
    }
    known[unknown] = candidates[0];
    order.push(unknown);
  }
  return order;
}
