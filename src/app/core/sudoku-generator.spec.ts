import { describe, expect, it } from 'vitest';
import { blankCells } from './cells';
import { LEVEL_IDS } from './levels';
import { boxOf, columnOf, conflictCells, peersOf, rowOf } from './sudoku';
import { generateSudoku, solveBySingles } from './sudoku-generator';
import { SUDOKU_LEVELS } from './sudoku-levels';

const SEEDS = Array.from({ length: 20 }, (_, index) => index * 2999 + 5);

describe('generateSudoku', () => {
  for (const levelId of LEVEL_IDS) {
    const level = SUDOKU_LEVELS[levelId];

    describe(levelId, () => {
      it('is deterministic for the same seed', () => {
        for (const seed of SEEDS.slice(0, 5)) {
          expect(generateSudoku(levelId, seed)).toEqual(generateSudoku(levelId, seed));
        }
      });

      it('has a valid solution', () => {
        for (const seed of SEEDS) {
          const puzzle = generateSudoku(levelId, seed);
          const units = new Map<string, number[]>();
          puzzle.values.forEach((digit, cell) => {
            expect(digit).toBeGreaterThanOrEqual(1);
            expect(digit).toBeLessThanOrEqual(level.size);
            for (const key of [
              `r${rowOf(puzzle, cell)}`,
              `c${columnOf(puzzle, cell)}`,
              `b${boxOf(puzzle, cell)}`,
            ]) {
              units.set(key, [...(units.get(key) ?? []), digit]);
            }
          });
          for (const digits of units.values()) {
            expect(new Set(digits).size).toBe(level.size);
          }
        }
      });

      it('has about the configured givens and is solvable by logic without guessing', () => {
        for (const seed of SEEDS) {
          const puzzle = generateSudoku(levelId, seed);
          const givens = puzzle.given.filter(Boolean).length;
          expect(givens).toBeGreaterThanOrEqual(level.givens);
          expect(givens).toBeLessThanOrEqual(level.givens + level.tolerance);

          const grid = puzzle.values.map((digit, cell) => (puzzle.given[cell] ? digit : 0));
          const order = solveBySingles(puzzle, grid);
          expect(order).not.toBeNull();
          expect(order?.length).toBe(blankCells(puzzle).length);
        }
      });

      it('offers a few valid hints and leaves at least one blank to the player', () => {
        for (const seed of SEEDS) {
          const puzzle = generateSudoku(levelId, seed);
          const blanks = blankCells(puzzle);
          expect(puzzle.hintOrder.length).toBeLessThanOrEqual(level.maxHints);
          expect(puzzle.hintOrder.length).toBeLessThan(blanks.length);
          expect(puzzle.hintOrder.every((cell) => blanks.includes(cell))).toBe(true);
        }
      });
    });
  }

  it('keeps existing links stable (golden puzzle)', () => {
    const summary = LEVEL_IDS.map((levelId) => {
      const puzzle = generateSudoku(levelId, 42);
      return { levelId, values: puzzle.values, given: puzzle.given };
    });
    expect(summary).toMatchSnapshot();
  });
});

describe('sudoku rules', () => {
  const dimensions = { size: 4, boxRows: 2, boxCols: 2 };

  it('finds peers in row, column and box', () => {
    expect(peersOf(dimensions, 0).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 8, 12]);
  });

  it('marks equal digits that share a unit as conflicts', () => {
    const digits = [1, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(conflictCells(dimensions, digits)).toEqual([0, 3]);
    expect(conflictCells(dimensions, [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])).toEqual([]);
  });
});
