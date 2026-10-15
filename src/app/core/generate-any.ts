import { generatePuzzle } from './generator';
import { LevelId } from './levels';
import { AnyPuzzle, PuzzleType } from './puzzle';
import { generateWaage } from './waage-generator';

export function generateAny(type: PuzzleType, level: LevelId, seed: number): AnyPuzzle {
  return type === 'waage' ? generateWaage(level, seed) : generatePuzzle(level, seed);
}
