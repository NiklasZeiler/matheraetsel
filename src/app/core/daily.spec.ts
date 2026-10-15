import { describe, expect, it } from 'vitest';
import { dailySeed, dailyStreak, dayKey, isDailyDone, previousDayKey } from './daily';

describe('daily puzzles', () => {
  it('gives the same seed for the same day, type and level', () => {
    expect(dailySeed('2026-10-15', 'waage', 'leicht')).toBe(
      dailySeed('2026-10-15', 'waage', 'leicht'),
    );
  });

  it('differs between days, types and levels', () => {
    const seeds = new Set([
      dailySeed('2026-10-15', 'waage', 'leicht'),
      dailySeed('2026-10-16', 'waage', 'leicht'),
      dailySeed('2026-10-15', 'mobile', 'leicht'),
      dailySeed('2026-10-15', 'waage', 'knobler'),
    ]);
    expect(seeds.size).toBe(4);
  });

  it('stays a valid 32-bit seed', () => {
    const seed = dailySeed('2026-10-15', 'pyramide', 'schwer');
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffffffff);
  });

  it('formats and steps days in local time, across month and year ends', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(previousDayKey('2026-03-01')).toBe('2026-02-28');
    expect(previousDayKey('2026-01-01')).toBe('2025-12-31');
  });

  it("counts consecutive days and keeps yesterday's streak alive", () => {
    const state = {
      '2026-10-13': ['waage:leicht'],
      '2026-10-14': ['mobile:mittel', 'waage:leicht'],
    };
    expect(dailyStreak(state, '2026-10-15')).toBe(2);
    expect(dailyStreak({ ...state, '2026-10-15': ['gleichung:schwer'] }, '2026-10-15')).toBe(3);
    expect(dailyStreak(state, '2026-10-17')).toBe(0);
    expect(dailyStreak({}, '2026-10-15')).toBe(0);
  });

  it('knows which daily puzzles are done', () => {
    const state = { '2026-10-15': ['waage:leicht'] };
    expect(isDailyDone(state, '2026-10-15', 'waage', 'leicht')).toBe(true);
    expect(isDailyDone(state, '2026-10-15', 'waage', 'mittel')).toBe(false);
    expect(isDailyDone(state, '2026-10-16', 'waage', 'leicht')).toBe(false);
  });
});
