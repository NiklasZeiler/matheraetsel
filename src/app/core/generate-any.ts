import { generatePuzzle } from './generator';
import { LevelId } from './levels';
import { generateMobile } from './mobile-generator';
import { AnyPuzzle, PuzzleType } from './puzzle';
import { generateWaage } from './waage-generator';

export function generateAny(type: PuzzleType, level: LevelId, seed: number): AnyPuzzle {
  switch (type) {
    case 'waage':
      return generateWaage(level, seed);
    case 'mobile':
      return generateMobile(level, seed);
    case 'gleichung':
      return generatePuzzle(level, seed);
  }
}
