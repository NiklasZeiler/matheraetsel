import { describe, expect, it } from 'vitest';
import { blankCells } from './cells';
import { LEVEL_IDS } from './levels';
import { pyramidCellCount, pyramidIndex } from './pyramid';
import { generatePyramid } from './pyramid-generator';
import { PYRAMID_LEVELS } from './pyramid-levels';

const SEEDS = Array.from({ length: 80 }, (_, index) => index * 3989 + 7);

describe('generatePyramid', () => {
  for (const levelId of LEVEL_IDS) {
    const level = PYRAMID_LEVELS[levelId];

    describe(levelId, () => {
      it('is deterministic for the same seed', () => {
        for (const seed of SEEDS.slice(0, 10)) {
          expect(generatePyramid(levelId, seed)).toEqual(generatePyramid(levelId, seed));
        }
      });

      it('is a valid sum pyramid within the number range', () => {
        for (const seed of SEEDS) {
          const puzzle = generatePyramid(levelId, seed);
          expect(puzzle.values).toHaveLength(pyramidCellCount(level.rows));
          for (let row = 0; row < level.rows - 1; row++) {
            for (let column = 0; column <= row; column++) {
              expect(puzzle.values[pyramidIndex(row, column)]).toBe(
                puzzle.values[pyramidIndex(row + 1, column)] +
                  puzzle.values[pyramidIndex(row + 1, column + 1)],
              );
            }
          }
          expect(Math.max(...puzzle.values)).toBeLessThanOrEqual(level.limit);
          expect(Math.min(...puzzle.values)).toBeGreaterThanOrEqual(1);
        }
      });

      it('has the configured blanks and valid hints', () => {
        for (const seed of SEEDS) {
          const puzzle = generatePyramid(levelId, seed);
          const blanks = blankCells(puzzle);
          expect(blanks).toHaveLength(level.blanks);
          expect(puzzle.hintOrder).toHaveLength(level.blanks - 1);
          expect(puzzle.hintOrder.every((cell) => blanks.includes(cell))).toBe(true);
        }
      });
    });
  }

  it('keeps existing links stable (golden puzzle)', () => {
    const summary = LEVEL_IDS.map((levelId) => {
      const puzzle = generatePyramid(levelId, 42);
      return { levelId, values: puzzle.values, given: puzzle.given };
    });
    expect(summary).toMatchSnapshot();
  });
});
