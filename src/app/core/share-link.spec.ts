import { describe, expect, it } from 'vitest';
import { decodeSeed, encodeSeed, parseChallenge, puzzleRoute, puzzleUrl } from './share-link';

describe('share links', () => {
  it('keeps the existing equation link format', () => {
    expect(puzzleUrl('https://x.app/', 'gleichung', 'mittel', 1234)).toBe(
      `https://x.app/#/r/mittel/${encodeSeed(1234)}`,
    );
  });

  it('uses a separate prefix for waage puzzles and carries the result', () => {
    expect(puzzleUrl('https://x.app/', 'waage', 'schwer', 99, { seconds: 75, hints: 1 })).toBe(
      `https://x.app/#/w/schwer/${encodeSeed(99)}?t=75&h=1`,
    );
    expect(puzzleRoute('waage', 'leicht', 5)).toEqual(['/w', 'leicht', encodeSeed(5)]);
  });

  it('uses the m prefix for mobile puzzles', () => {
    expect(puzzleRoute('mobile', 'knobler', 7)).toEqual(['/m', 'knobler', encodeSeed(7)]);
  });

  it('round-trips seeds and rejects bad input', () => {
    expect(decodeSeed(encodeSeed(4294967295))).toBe(4294967295);
    expect(decodeSeed('zzzzzzzz')).toBeNull();
    expect(decodeSeed('../x')).toBeNull();
    expect(parseChallenge('75', '1')).toEqual({ seconds: 75, hints: 1 });
    expect(parseChallenge('abc', '1')).toBeNull();
  });
});
