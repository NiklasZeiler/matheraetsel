import { LevelId } from './levels';
import { Random, createRandom, shuffled } from './random';
import { SudokuDimensions, SudokuPuzzle, boxOf, columnOf, peersOf, rowOf } from './sudoku';
import { SUDOKU_LEVELS, SudokuLevelConfig } from './sudoku-levels';

const MAX_ATTEMPTS = 400;
/** Backtracking budget per grid; a rare unlucky grid is simply drawn again. */
const MAX_FILL_STEPS = 20000;

/**
 * Deterministic like the other generators: level and seed always give the same sudoku.
 * Keep the order of random draws stable once links are shared (golden test in the spec).
 */
export function generateSudoku(levelId: LevelId, seed: number): SudokuPuzzle {
  const level = SUDOKU_LEVELS[levelId];
  const random = createRandom(seed);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const solution = fillGrid(level, random);
    const puzzle = solution ? carve(level, seed, solution, random) : null;
    if (puzzle) {
      return puzzle;
    }
  }
  throw new Error(`No sudoku found for level ${levelId} and seed ${seed}`);
}

/** A complete valid grid, found by randomised backtracking. */
function fillGrid(level: SudokuLevelConfig, random: Random): number[] | null {
  const dimensions: SudokuDimensions = level;
  const total = level.size * level.size;
  const grid: number[] = new Array(total).fill(0);
  const peers = Array.from({ length: total }, (_, cell) => peersOf(dimensions, cell));
  const digits = Array.from({ length: level.size }, (_, index) => index + 1);
  let steps = 0;

  const place = (cell: number): boolean => {
    if (cell === total) {
      return true;
    }
    for (const digit of shuffled(random, digits)) {
      if (++steps > MAX_FILL_STEPS) {
        return false;
      }
      if (peers[cell].every((peer) => grid[peer] !== digit)) {
        grid[cell] = digit;
        if (place(cell + 1)) {
          return true;
        }
        grid[cell] = 0;
      }
    }
    return false;
  };

  return place(0) ? grid : null;
}

/** Removes cells in random order while the puzzle stays solvable by logic alone. */
function carve(
  level: SudokuLevelConfig,
  seed: number,
  solution: number[],
  random: Random,
): SudokuPuzzle | null {
  const total = solution.length;
  const grid = [...solution];
  let givens = total;

  for (const cell of shuffled(
    random,
    Array.from({ length: total }, (_, index) => index),
  )) {
    if (givens <= level.givens) {
      break;
    }
    const digit = grid[cell];
    grid[cell] = 0;
    if (solveBySingles(level, grid)) {
      givens--;
    } else {
      grid[cell] = digit;
    }
  }
  if (givens > level.givens + level.tolerance) {
    return null;
  }

  const order = solveBySingles(level, grid);
  if (!order) {
    return null;
  }
  return {
    kind: 'sudoku',
    level: level.id,
    seed,
    themeId: '',
    symbols: [],
    values: solution,
    size: level.size,
    boxRows: level.boxRows,
    boxCols: level.boxCols,
    given: grid.map((digit) => digit !== 0),
    question: { kind: 'cells', answer: total - givens },
    // The last blank is left to the player: hints never solve the whole puzzle.
    hintOrder: order.slice(0, Math.min(level.maxHints, order.length - 1)),
  };
}

/**
 * Solves with the two simplest techniques: a cell with only one possible digit (naked
 * single) and a digit that fits only one cell of a row, column or box (hidden single).
 * Returns the cells in the order they were filled, or null if the puzzle needs more.
 */
export function solveBySingles(
  dimensions: SudokuDimensions,
  puzzle: readonly number[],
): number[] | null {
  const { size } = dimensions;
  const total = size * size;
  const grid = [...puzzle];
  const peers = Array.from({ length: total }, (_, cell) => peersOf(dimensions, cell));
  const units: number[][] = [];
  for (let index = 0; index < size; index++) {
    units.push(
      Array.from({ length: total }, (_, cell) => cell).filter(
        (cell) => rowOf(dimensions, cell) === index,
      ),
    );
    units.push(
      Array.from({ length: total }, (_, cell) => cell).filter(
        (cell) => columnOf(dimensions, cell) === index,
      ),
    );
    units.push(
      Array.from({ length: total }, (_, cell) => cell).filter(
        (cell) => boxOf(dimensions, cell) === index,
      ),
    );
  }
  const order: number[] = [];

  const candidates = (cell: number): number[] => {
    const used = new Set(peers[cell].map((peer) => grid[peer]));
    return Array.from({ length: size }, (_, index) => index + 1).filter(
      (digit) => !used.has(digit),
    );
  };

  for (;;) {
    let placed: { cell: number; digit: number } | null = null;

    for (let cell = 0; cell < total && !placed; cell++) {
      if (grid[cell] === 0) {
        const options = candidates(cell);
        if (options.length === 0) {
          return null;
        }
        if (options.length === 1) {
          placed = { cell, digit: options[0] };
        }
      }
    }
    for (let index = 0; index < units.length && !placed; index++) {
      for (let digit = 1; digit <= size && !placed; digit++) {
        if (units[index].some((cell) => grid[cell] === digit)) {
          continue;
        }
        const spots = units[index].filter(
          (cell) => grid[cell] === 0 && candidates(cell).includes(digit),
        );
        if (spots.length === 1) {
          placed = { cell: spots[0], digit };
        }
      }
    }

    if (!placed) {
      return grid.every((digit) => digit !== 0) ? order : null;
    }
    grid[placed.cell] = placed.digit;
    order.push(placed.cell);
  }
}
