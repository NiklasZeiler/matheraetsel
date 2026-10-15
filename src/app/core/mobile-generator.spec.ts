import { describe, expect, it } from 'vitest';
import { LEVEL_IDS } from './levels';
import { MobileBar, allBars, barWeight, barWidth, sideWeight, subMobiles } from './mobile';
import { generateMobile } from './mobile-generator';
import { MOBILE_LEVELS } from './mobile-levels';

const SEEDS = Array.from({ length: 80 }, (_, index) => index * 5003 + 11);

/** Numbers mode keeps the answer inside the "unknown" leaf; use it as a one-element value list. */
function weightsFor(values: number[]): number[] {
  return values;
}

describe('generateMobile', () => {
  for (const levelId of LEVEL_IDS) {
    const level = MOBILE_LEVELS[levelId];

    describe(levelId, () => {
      it('is deterministic for the same seed', () => {
        for (const seed of SEEDS.slice(0, 10)) {
          expect(generateMobile(levelId, seed)).toEqual(generateMobile(levelId, seed));
        }
      });

      it('balances every bar and keeps the mobile small', () => {
        for (const seed of SEEDS) {
          const puzzle = generateMobile(levelId, seed);
          const values = weightsFor(puzzle.values);
          const bars: MobileBar[] = allBars(puzzle.root);
          expect(bars.length).toBeGreaterThanOrEqual(level.bars[0]);
          expect(bars.length).toBeLessThanOrEqual(level.bars[1]);
          for (const bar of bars) {
            expect(sideWeight(bar.left, values)).toBe(sideWeight(bar.right, values));
            expect(bar.left.length).toBeGreaterThanOrEqual(1);
            expect(bar.left.length).toBeLessThanOrEqual(2);
            expect(bar.right.length).toBeGreaterThanOrEqual(1);
            expect(bar.right.length).toBeLessThanOrEqual(2);
          }
          expect(barWidth(puzzle.root)).toBeLessThanOrEqual(level.maxWidth);
          expect(barWeight(puzzle.root, values)).toBeLessThanOrEqual(level.limit);
        }
      });

      it('has the question type configured for the level', () => {
        for (const seed of SEEDS) {
          const puzzle = generateMobile(levelId, seed);
          expect(puzzle.question.kind).toBe(level.question);
          expect(puzzle.question.answer).toBeGreaterThanOrEqual(1);
          expect(puzzle.question.answer).toBeLessThanOrEqual(level.limit);
        }
      });

      it('offers hints that match the mode', () => {
        for (const seed of SEEDS) {
          const puzzle = generateMobile(levelId, seed);
          if (puzzle.mode === 'numbers') {
            const ids = subMobiles(puzzle.root).map((item) => item.id);
            expect(puzzle.hintOrder.length).toBeGreaterThanOrEqual(1);
            expect(puzzle.hintOrder.every((id) => ids.includes(id))).toBe(true);
          } else {
            expect(puzzle.symbols.length).toBeGreaterThanOrEqual(level.symbolCount[0]);
            expect(puzzle.hintOrder.every((symbol) => symbol < puzzle.symbols.length)).toBe(true);
          }
        }
      });

      it('answers with the real weight', () => {
        for (const seed of SEEDS) {
          const puzzle = generateMobile(levelId, seed);
          const { question } = puzzle;
          if (question.kind === 'symbol') {
            expect(question.answer).toBe(puzzle.values[question.symbol]);
          } else if (question.kind === 'part') {
            const asked = subMobiles(puzzle.root).filter((item) => item.asked);
            expect(asked).toHaveLength(1);
            expect(question.answer).toBe(barWeight(asked[0].bar, puzzle.values));
          }
        }
      });
    });
  }

  it('keeps existing links stable (golden puzzle)', () => {
    const summary = LEVEL_IDS.map((levelId) => {
      const puzzle = generateMobile(levelId, 42);
      return { levelId, symbols: puzzle.symbols, root: puzzle.root, question: puzzle.question };
    });
    expect(summary).toMatchSnapshot();
  });
});
