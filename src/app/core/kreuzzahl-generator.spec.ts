import { describe, expect, it } from 'vitest';
import { evaluate } from './expression';
import { KreuzPuzzle, blankCells, columnCells, lineExpression, rowCells } from './kreuzzahl';
import { generateKreuzzahl } from './kreuzzahl-generator';
import { KREUZ_LEVELS } from './kreuzzahl-levels';
import { LEVEL_IDS } from './levels';

const SEEDS = Array.from({ length: 80 }, (_, index) => index * 4001 + 9);

function lineValues(puzzle: KreuzPuzzle, cells: number[]): number[] {
  return cells.map((cell) => puzzle.values[cell]);
}

describe('generateKreuzzahl', () => {
  for (const levelId of LEVEL_IDS) {
    const level = KREUZ_LEVELS[levelId];

    describe(levelId, () => {
      it('is deterministic for the same seed', () => {
        for (const seed of SEEDS.slice(0, 10)) {
          expect(generateKreuzzahl(levelId, seed)).toEqual(generateKreuzzahl(levelId, seed));
        }
      });

      it('has rows and columns that add up to the printed results', () => {
        for (const seed of SEEDS) {
          const puzzle = generateKreuzzahl(levelId, seed);
          expect(puzzle.size).toBe(level.size);
          for (let index = 0; index < puzzle.size; index++) {
            const row = evaluate(
              lineExpression(puzzle.rowOperators[index]),
              lineValues(puzzle, rowCells(puzzle.size, index)),
              level.limit,
            );
            const column = evaluate(
              lineExpression(puzzle.columnOperators[index]),
              lineValues(puzzle, columnCells(puzzle.size, index)),
              level.limit,
            );
            expect(row).toBe(puzzle.rowResults[index]);
            expect(column).toBe(puzzle.columnResults[index]);
          }
          for (const value of puzzle.values) {
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThanOrEqual(level.limit);
          }
        }
      });

      it('has the configured number of blanks and valid hints', () => {
        for (const seed of SEEDS) {
          const puzzle = generateKreuzzahl(levelId, seed);
          const blanks = blankCells(puzzle);
          expect(blanks.length).toBeGreaterThanOrEqual(level.blanks[0]);
          expect(blanks.length).toBeLessThanOrEqual(level.blanks[1]);
          expect(puzzle.hintOrder).toHaveLength(blanks.length - 1);
          expect(puzzle.hintOrder.every((cell) => blanks.includes(cell))).toBe(true);
          expect(new Set(puzzle.hintOrder).size).toBe(puzzle.hintOrder.length);
        }
      });
    });
  }

  it('keeps existing links stable (golden puzzle)', () => {
    const summary = LEVEL_IDS.map((levelId) => {
      const puzzle = generateKreuzzahl(levelId, 42);
      return {
        levelId,
        values: puzzle.values,
        given: puzzle.given,
        rowOperators: puzzle.rowOperators,
        columnOperators: puzzle.columnOperators,
        rowResults: puzzle.rowResults,
        columnResults: puzzle.columnResults,
      };
    });
    expect(summary).toMatchSnapshot();
  });
});
