import { LevelId } from './levels';
import { PyramidPuzzle, pyramidCellCount, pyramidIndex } from './pyramid';
import { PYRAMID_LEVELS, PyramidLevelConfig } from './pyramid-levels';
import { Random, createRandom, randomInt, shuffled } from './random';

const MAX_ATTEMPTS = 2000;

/**
 * Deterministic like the other generators: level and seed always give the same pyramid.
 * Keep the order of random draws stable once links are shared (golden test in the spec).
 */
export function generatePyramid(levelId: LevelId, seed: number): PyramidPuzzle {
  const level = PYRAMID_LEVELS[levelId];
  const random = createRandom(seed);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const puzzle = tryGenerate(level, seed, random);
    if (puzzle) {
      return puzzle;
    }
  }
  throw new Error(`No pyramid found for level ${levelId} and seed ${seed}`);
}

function tryGenerate(
  level: PyramidLevelConfig,
  seed: number,
  random: Random,
): PyramidPuzzle | null {
  const { rows } = level;
  const values: number[] = new Array(pyramidCellCount(rows)).fill(0);

  for (let column = 0; column < rows; column++) {
    values[pyramidIndex(rows - 1, column)] = randomInt(
      random,
      level.baseRange[0],
      level.baseRange[1],
    );
  }
  for (let row = rows - 2; row >= 0; row--) {
    for (let column = 0; column <= row; column++) {
      values[pyramidIndex(row, column)] =
        values[pyramidIndex(row + 1, column)] + values[pyramidIndex(row + 1, column + 1)];
    }
  }
  if (values.some((value) => value > level.limit)) {
    return null;
  }

  const blanks = shuffled(
    random,
    values.map((_, cell) => cell),
  ).slice(0, level.blanks);
  const order = deduceOrder(rows, values, blanks);
  if (!order) {
    return null;
  }

  return {
    kind: 'pyramide',
    level: level.id,
    seed,
    themeId: '',
    symbols: [],
    values,
    rows,
    given: values.map((_, cell) => !blanks.includes(cell)),
    question: { kind: 'cells', answer: blanks.length },
    // The last blank is left to the player: hints never solve the whole puzzle.
    hintOrder: order.slice(0, -1),
  };
}

/**
 * Fills blanks by repeatedly using a stone with its two children where exactly one of the
 * three is unknown. Returns the order, or null if the pyramid needs guessing.
 */
function deduceOrder(
  rows: number,
  values: readonly number[],
  blanks: readonly number[],
): number[] | null {
  const known: boolean[] = values.map((_, cell) => !blanks.includes(cell));
  const order: number[] = [];

  while (order.length < blanks.length) {
    let progressed = false;
    for (let row = 0; row < rows - 1 && !progressed; row++) {
      for (let column = 0; column <= row && !progressed; column++) {
        const triple = [
          pyramidIndex(row, column),
          pyramidIndex(row + 1, column),
          pyramidIndex(row + 1, column + 1),
        ];
        const unknown = triple.filter((cell) => !known[cell]);
        if (unknown.length === 1) {
          known[unknown[0]] = true;
          order.push(unknown[0]);
          progressed = true;
        }
      }
    }
    if (!progressed) {
      return null;
    }
  }
  return order;
}
