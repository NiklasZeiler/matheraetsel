import { LevelId } from './levels';

/** What the lock answers to a tried code, like in Mastermind. */
export interface CodeFeedback {
  /** Digits that are right and in the right place. */
  correct: number;
  /** Digits that are in the code but in another place. */
  misplaced: number;
}

export interface CodeClue extends CodeFeedback {
  guess: number[];
}

export interface CodePuzzle {
  kind: 'zahlenschloss';
  level: LevelId;
  seed: number;
  /** Unused; the puzzle page reads `symbols` from every puzzle type. */
  symbols: string[];
  length: number;
  /** Whether the code may use a digit more than once. */
  repeats: boolean;
  code: number[];
  clues: CodeClue[];
  question: { kind: 'code'; answer: string };
  /** Code positions in the order hints reveal them. */
  hintOrder: number[];
}

export function feedback(code: readonly number[], guess: readonly number[]): CodeFeedback {
  const inCode = new Array<number>(10).fill(0);
  const inGuess = new Array<number>(10).fill(0);
  let correct = 0;
  for (let position = 0; position < code.length; position++) {
    if (code[position] === guess[position]) {
      correct++;
    }
    inCode[code[position]]++;
    inGuess[guess[position]]++;
  }
  let shared = 0;
  for (let digit = 0; digit < 10; digit++) {
    shared += Math.min(inCode[digit], inGuess[digit]);
  }
  return { correct, misplaced: shared - correct };
}

function digitsText(count: number): string {
  return `${count} ${count === 1 ? 'Ziffer' : 'Ziffern'}`;
}

export function clueText(clue: CodeFeedback): string {
  if (clue.correct === 0 && clue.misplaced === 0) {
    return 'Keine Ziffer ist richtig';
  }
  if (clue.misplaced === 0) {
    return `${digitsText(clue.correct)} richtig und richtig platziert`;
  }
  if (clue.correct === 0) {
    return `${digitsText(clue.misplaced)} richtig, aber falsch platziert`;
  }
  return `${clue.correct} richtig platziert, ${clue.misplaced} richtig, falsch platziert`;
}

export function codeText(code: readonly number[]): string {
  return code.join('');
}
