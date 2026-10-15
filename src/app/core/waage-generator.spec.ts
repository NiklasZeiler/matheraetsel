import { describe, expect, it } from 'vitest';
import { LEVEL_IDS } from './levels';
import { panItemCount, panWeight } from './waage';
import { generateWaage } from './waage-generator';
import { WAAGE_LEVELS } from './waage-levels';
import { solveScales } from './waage-solver';

const SEEDS = Array.from({ length: 80 }, (_, index) => index * 6007 + 5);

describe('generateWaage', () => {
  for (const levelId of LEVEL_IDS) {
    const level = WAAGE_LEVELS[levelId];

    describe(levelId, () => {
      it('is deterministic for the same seed', () => {
        for (const seed of SEEDS.slice(0, 10)) {
          expect(generateWaage(levelId, seed)).toEqual(generateWaage(levelId, seed));
        }
      });

      it('balances every scale and keeps pans small', () => {
        for (const seed of SEEDS) {
          const puzzle = generateWaage(levelId, seed);
          expect(puzzle.scales.length).toBe(
            puzzle.symbols.length - (level.mode === 'ratio' ? 1 : 0),
          );
          for (const scale of puzzle.scales) {
            expect(panWeight(scale.left, puzzle.values)).toBe(
              panWeight(scale.right, puzzle.values),
            );
            expect(panItemCount(scale.left)).toBeLessThanOrEqual(level.maxPanItems);
            expect(panItemCount(scale.right)).toBeLessThanOrEqual(level.maxPanItems);
          }
        }
      });

      it('can be deduced step by step', () => {
        for (const seed of SEEDS) {
          const puzzle = generateWaage(levelId, seed);
          const initial = puzzle.values.map((value, index) =>
            index === puzzle.unit ? value : undefined,
          );
          const solved = solveScales(
            puzzle.scales,
            puzzle.symbols.length,
            level.mode === 'ratio' ? 10000 : level.limit,
            initial,
          );
          expect(solved).toEqual(puzzle.values);
        }
      });

      it('has an answer that matches the hidden values and the level limit', () => {
        for (const seed of SEEDS) {
          const puzzle = generateWaage(levelId, seed);
          const { question } = puzzle;
          if (question.kind === 'symbol') {
            expect(question.answer).toBe(puzzle.values[question.symbol]);
          } else {
            expect(question.answer).toBe(panWeight(question.pan, puzzle.values));
          }
          expect(question.answer).toBeGreaterThanOrEqual(1);
          expect(question.answer).toBeLessThanOrEqual(level.limit);
        }
      });
    });
  }

  it('keeps existing links stable (golden puzzle)', () => {
    const summary = LEVEL_IDS.map((levelId) => {
      const puzzle = generateWaage(levelId, 42);
      return { levelId, symbols: puzzle.symbols, scales: puzzle.scales, question: puzzle.question };
    });
    expect(summary).toMatchSnapshot();
  });
});
