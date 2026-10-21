import { generatePuzzle } from './generator';
import { LevelId } from './levels';
import { generateKreuzzahl } from './kreuzzahl-generator';
import { generatePyramid } from './pyramid-generator';
import { generateSudoku } from './sudoku-generator';
import { generateMobile } from './mobile-generator';
import { AnyPuzzle, PuzzleType } from './puzzle';
import { generateWaage } from './waage-generator';
import { generateCode } from './zahlenschloss-generator';

export function generateAny(type: PuzzleType, level: LevelId, seed: number): AnyPuzzle {
  switch (type) {
    case 'waage':
      return generateWaage(level, seed);
    case 'mobile':
      return generateMobile(level, seed);
    case 'zahlenschloss':
      return generateCode(level, seed);
    case 'sudoku':
      return generateSudoku(level, seed);
    case 'pyramide':
      return generatePyramid(level, seed);
    case 'kreuzzahl':
      return generateKreuzzahl(level, seed);
    case 'gleichung':
      return generatePuzzle(level, seed);
  }
}
