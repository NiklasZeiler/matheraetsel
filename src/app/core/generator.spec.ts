import { describe, expect, it } from 'vitest';
import { describe as describeExpression, evaluate, hasParentheses } from './expression';
import { generatePuzzle } from './generator';
import { LEVELS, LEVEL_IDS } from './levels';
import { solve } from './solver';

const SEEDS = Array.from({ length: 60 }, (_, index) => index * 7919 + 13);

describe('generatePuzzle', () => {
  for (const levelId of LEVEL_IDS) {
    const level = LEVELS[levelId];

    describe(levelId, () => {
      it('is deterministic for the same seed', () => {
        for (const seed of SEEDS.slice(0, 10)) {
          expect(generatePuzzle(levelId, seed)).toEqual(generatePuzzle(levelId, seed));
        }
      });

      it('produces uniquely deducible puzzles within the number range', () => {
        for (const seed of SEEDS) {
          const puzzle = generatePuzzle(levelId, seed);
          const solution = solve(puzzle.equations, puzzle.symbols.length, level.limit);

          expect(solution?.values).toEqual(puzzle.values);
          expect(new Set(puzzle.symbols).size).toBe(puzzle.symbols.length);
          expect(new Set(puzzle.values).size).toBe(puzzle.values.length);
          for (const equation of puzzle.equations) {
            expect(equation.result).toBeGreaterThanOrEqual(1);
            expect(equation.result).toBeLessThanOrEqual(level.limit);
            expect(evaluate(equation.expression, puzzle.values, level.limit)).toBe(equation.result);
            if (!level.allowParentheses) {
              expect(hasParentheses(equation.expression)).toBe(false);
            }
          }
          if (puzzle.question.kind === 'symbol') {
            expect(puzzle.question.answer).toBe(puzzle.values[puzzle.question.symbol]);
          } else {
            expect(evaluate(puzzle.question.expression, puzzle.values, level.limit)).toBe(
              puzzle.question.answer,
            );
          }
        }
      });

      it('asks the question type configured for the level', () => {
        expect(generatePuzzle(levelId, SEEDS[0]).question.kind).toBe(level.question);
      });
    });
  }

  it('keeps existing links stable (golden puzzle)', () => {
    const puzzle = generatePuzzle('leicht', 1);
    const rendered = puzzle.equations.map(
      (equation) => `${describeExpression(equation.expression, puzzle.symbols)} = ${equation.result}`,
    );
    expect({ symbols: puzzle.symbols, values: puzzle.values, rendered }).toMatchSnapshot();
  });
});
