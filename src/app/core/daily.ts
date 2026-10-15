import { LevelId } from './levels';
import { PuzzleType } from './puzzle';

/** Days a player completed daily puzzles: date key (YYYY-MM-DD) -> "type:level" entries. */
export type DailyState = Record<string, string[]>;

/** Local calendar day, so "today" changes at the player's midnight. */
export function dayKey(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function previousDayKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  return dayKey(new Date(year, month - 1, day - 1));
}

/**
 * Same inputs, same seed, on every device: everybody gets the same daily puzzle.
 * FNV-1a over the text keeps the result a stable 32-bit number.
 */
export function dailySeed(day: string, type: PuzzleType, level: LevelId): number {
  let hash = 0x811c9dc5;
  for (const character of `${day}|${type}|${level}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function dailyEntry(type: PuzzleType, level: LevelId): string {
  return `${type}:${level}`;
}

export function isDailyDone(
  state: DailyState,
  day: string,
  type: PuzzleType,
  level: LevelId,
): boolean {
  return (state[day] ?? []).includes(dailyEntry(type, level));
}

/**
 * Consecutive days with at least one daily puzzle solved. A streak stays alive until the end
 * of the following day, so it does not read "0" in the morning before today's puzzle.
 */
export function dailyStreak(state: DailyState, today: string): number {
  let day = (state[today] ?? []).length > 0 ? today : previousDayKey(today);
  let streak = 0;
  while ((state[day] ?? []).length > 0) {
    streak++;
    day = previousDayKey(day);
  }
  return streak;
}
