import { LevelId } from './levels';
import { Random, createRandom, randomInt, shuffled } from './random';
import { CodeClue, CodePuzzle, codeText, feedback } from './zahlenschloss';
import { CODE_LEVELS, CodeLevelConfig } from './zahlenschloss-levels';

const MAX_ATTEMPTS = 3000;
/** Random guesses tried per clue before the attempt is given up. */
const GUESS_TRIES = 60;

/** Every code of the given length, optionally without repeated digits. */
export function allCodes(length: number, repeats: boolean): number[][] {
  const codes: number[][] = [];
  const extend = (prefix: number[]): void => {
    if (prefix.length === length) {
      codes.push(prefix);
      return;
    }
    for (let digit = 0; digit < 10; digit++) {
      if (repeats || !prefix.includes(digit)) {
        extend([...prefix, digit]);
      }
    }
  };
  extend([]);
  return codes;
}

/** Codes that agree with every clue; the puzzle is fair when exactly one is left. */
export function solveCode(
  clues: readonly CodeClue[],
  length: number,
  repeats: boolean,
): number[][] {
  return allCodes(length, repeats).filter((code) => fits(code, clues));
}

function fits(code: readonly number[], clues: readonly CodeClue[]): boolean {
  return clues.every((clue) => {
    const answer = feedback(code, clue.guess);
    return answer.correct === clue.correct && answer.misplaced === clue.misplaced;
  });
}

/**
 * Deterministic like the other generators: level and seed always give the same lock.
 * Keep the order of random draws stable once links are shared (golden test in the spec).
 */
export function generateCode(levelId: LevelId, seed: number): CodePuzzle {
  const level = CODE_LEVELS[levelId];
  const random = createRandom(seed);
  const candidates = allCodes(level.length, level.repeats);
  const guesses = allCodes(level.length, level.simpleClues ? false : level.repeats);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const puzzle = tryGenerate(level, seed, random, candidates, guesses);
    if (puzzle) {
      return puzzle;
    }
  }
  throw new Error(`No code found for level ${levelId} and seed ${seed}`);
}

function tryGenerate(
  level: CodeLevelConfig,
  seed: number,
  random: Random,
  candidates: number[][],
  guesses: number[][],
): CodePuzzle | null {
  const code = candidates[randomInt(random, 0, candidates.length - 1)];
  const clues: CodeClue[] = [];
  let remaining = candidates;

  while (remaining.length > 1 && clues.length < level.clues[1]) {
    const next = pickClue(level, random, code, guesses, remaining);
    if (!next) {
      return null;
    }
    clues.push(next.clue);
    remaining = next.remaining;
  }
  if (remaining.length !== 1 || clues.length < level.clues[0]) {
    return null;
  }

  return {
    kind: 'zahlenschloss',
    level: level.id,
    seed,
    symbols: [],
    length: level.length,
    repeats: level.repeats,
    code,
    clues,
    question: { kind: 'code', answer: codeText(code) },
    hintOrder: shuffled(
      random,
      code.map((_, position) => position),
    ).slice(0, level.maxHints),
  };
}

/** A random clue that rules out at least one more code without giving the code away. */
function pickClue(
  level: CodeLevelConfig,
  random: Random,
  code: number[],
  guesses: number[][],
  remaining: number[][],
): { clue: CodeClue; remaining: number[][] } | null {
  for (let attempt = 0; attempt < GUESS_TRIES; attempt++) {
    const guess = guesses[randomInt(random, 0, guesses.length - 1)];
    const answer = feedback(code, guess);
    if (answer.correct === level.length || (level.simpleClues && answer.misplaced > 0)) {
      continue;
    }
    const clue: CodeClue = { guess, ...answer };
    const left = remaining.filter((candidate) => fits(candidate, [clue]));
    if (left.length < remaining.length) {
      return { clue, remaining: left };
    }
  }
  return null;
}
