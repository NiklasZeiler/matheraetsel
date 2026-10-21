import { describe, expect, it } from 'vitest';
import { LEVEL_IDS } from './levels';
import { clueText, feedback } from './zahlenschloss';
import { generateCode, solveCode } from './zahlenschloss-generator';
import { CODE_LEVELS } from './zahlenschloss-levels';

const SEEDS = Array.from({ length: 25 }, (_, index) => index * 3989 + 7);

describe('feedback', () => {
  it('counts right and misplaced digits', () => {
    expect(feedback([0, 4, 2], [6, 8, 2])).toEqual({ correct: 1, misplaced: 0 });
    expect(feedback([0, 4, 2], [2, 0, 6])).toEqual({ correct: 0, misplaced: 2 });
    expect(feedback([0, 4, 2], [7, 3, 8])).toEqual({ correct: 0, misplaced: 0 });
  });

  it('does not count a repeated digit more often than the code holds it', () => {
    expect(feedback([3, 3, 7, 1], [3, 5, 3, 3])).toEqual({ correct: 1, misplaced: 1 });
  });

  it('describes clues in words', () => {
    expect(clueText({ correct: 0, misplaced: 0 })).toBe('Keine Ziffer ist richtig');
    expect(clueText({ correct: 1, misplaced: 0 })).toBe('1 Ziffer richtig und richtig platziert');
    expect(clueText({ correct: 0, misplaced: 2 })).toBe('2 Ziffern richtig, aber falsch platziert');
  });
});

describe('generateCode', () => {
  for (const levelId of LEVEL_IDS) {
    const level = CODE_LEVELS[levelId];

    describe(levelId, () => {
      it('is deterministic for the same seed', () => {
        for (const seed of SEEDS.slice(0, 5)) {
          expect(generateCode(levelId, seed)).toEqual(generateCode(levelId, seed));
        }
      });

      it('has exactly one code that fits all clues', () => {
        for (const seed of SEEDS) {
          const puzzle = generateCode(levelId, seed);
          const solutions = solveCode(puzzle.clues, level.length, level.repeats);
          expect(solutions).toEqual([puzzle.code]);
        }
      });

      it('respects the level rules', () => {
        for (const seed of SEEDS) {
          const puzzle = generateCode(levelId, seed);
          expect(puzzle.code).toHaveLength(level.length);
          expect(puzzle.clues.length).toBeGreaterThanOrEqual(level.clues[0]);
          expect(puzzle.clues.length).toBeLessThanOrEqual(level.clues[1]);
          expect(puzzle.hintOrder).toHaveLength(level.maxHints);
          expect(new Set(puzzle.hintOrder).size).toBe(level.maxHints);
          if (!level.repeats) {
            expect(new Set(puzzle.code).size).toBe(level.length);
          }
          for (const clue of puzzle.clues) {
            expect(clue.correct).toBeLessThan(level.length);
            if (level.simpleClues) {
              expect(clue.misplaced).toBe(0);
            }
          }
        }
      });
    });
  }

  it('keeps existing links stable (golden puzzle)', () => {
    const summary = LEVEL_IDS.map((levelId) => {
      const puzzle = generateCode(levelId, 42);
      return { levelId, code: puzzle.code, clues: puzzle.clues, hintOrder: puzzle.hintOrder };
    });
    expect(summary).toMatchSnapshot();
  });
});
