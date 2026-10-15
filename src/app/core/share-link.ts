import { LevelId, isLevelId } from './levels';
import { MAX_SEED } from './random';

export interface ChallengeResult {
  seconds: number;
  hints: number;
}

export function encodeSeed(seed: number): string {
  return seed.toString(36);
}

export function decodeSeed(text: string | null | undefined): number | null {
  if (!text || !/^[0-9a-z]{1,7}$/.test(text)) {
    return null;
  }
  const seed = parseInt(text, 36);
  return seed <= MAX_SEED ? seed : null;
}

export function parseLevel(text: string | null | undefined): LevelId | null {
  return isLevelId(text) ? text : null;
}

export function parseChallenge(
  seconds: string | null | undefined,
  hints: string | null | undefined,
): ChallengeResult | null {
  if (!seconds || !hints || !/^\d{1,5}$/.test(seconds) || !/^\d{1,2}$/.test(hints)) {
    return null;
  }
  return { seconds: Number(seconds), hints: Number(hints) };
}

/** Relative route for the router (hash routing keeps this working on any static host). */
export function puzzleRoute(level: LevelId, seed: number): string[] {
  return ['/r', level, encodeSeed(seed)];
}

export function puzzleUrl(
  appBaseUrl: string,
  level: LevelId,
  seed: number,
  result?: ChallengeResult,
): string {
  const query = result ? `?t=${result.seconds}&h=${result.hints}` : '';
  return `${appBaseUrl}#/r/${level}/${encodeSeed(seed)}${query}`;
}
