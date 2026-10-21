import {
  Progress,
  SolvedPuzzle,
  applySolved,
  awardFor,
  badges,
  emptyProgress,
  settleLeague,
  weekStart,
} from './progress';

const MONDAY = '2026-10-19';

function withDays(base: Progress, days: string[]): Progress {
  return { ...base, xpByDay: Object.fromEntries(days.map((day) => [day, 10])) };
}

describe('progress', () => {
  it('starts weeks on Monday', () => {
    expect(weekStart('2026-10-21')).toBe(MONDAY);
    expect(weekStart('2026-10-25')).toBe(MONDAY);
    expect(weekStart(MONDAY)).toBe(MONDAY);
  });

  it('pays more for harder levels, no-hint solves and daily puzzles', () => {
    expect(awardFor('leicht', 1, false).total).toBe(10);
    expect(awardFor('leicht', 0, false).total).toBe(15);
    expect(awardFor('knobler', 0, true).total).toBe(50 + 25 + 25);
  });

  it('pays out only once per puzzle', () => {
    const solved: SolvedPuzzle = {
      key: 'waage:leicht:1',
      level: 'leicht',
      hints: 0,
      daily: false,
      streak: 0,
    };
    const first = applySolved(emptyProgress('2026-10-21'), solved, '2026-10-21');
    const second = applySolved(first.progress, solved, '2026-10-21');

    expect(first.award?.total).toBe(15);
    expect(second.award).toBeNull();
    expect(second.progress.totalXp).toBe(15);
    expect(second.progress.xpByDay['2026-10-21']).toBe(15);
  });

  it('moves up after a week with enough active days', () => {
    const start = withDays(emptyProgress(MONDAY), [
      '2026-10-19',
      '2026-10-20',
      '2026-10-22',
      '2026-10-24',
    ]);

    const settled = settleLeague(start, '2026-10-26');

    expect(settled.league).toBe(1);
    expect(settled.leagueWeek).toBe('2026-10-26');
  });

  it('stays in the league with a middling week and never drops below bronze', () => {
    const middling = withDays({ ...emptyProgress(MONDAY), league: 2 }, [
      '2026-10-19',
      '2026-10-20',
    ]);
    expect(settleLeague(middling, '2026-10-26').league).toBe(2);

    const idle = emptyProgress(MONDAY);
    expect(settleLeague(idle, '2026-12-28').league).toBe(0);
  });

  it('moves down once per idle week', () => {
    const gold = { ...emptyProgress(MONDAY), league: 2 };

    expect(settleLeague(gold, '2026-11-02').league).toBe(0);
    expect(settleLeague(gold, '2026-10-26').league).toBe(1);
  });

  it('settles nothing inside the running week', () => {
    const gold = { ...emptyProgress(MONDAY), league: 2 };
    expect(settleLeague(gold, '2026-10-25').league).toBe(2);
  });

  it('tracks badges from facts and progress', () => {
    const progress = { ...emptyProgress(MONDAY), bestStreak: 7, perfectKnobler: true };
    const earned = badges(progress, { solvedTotal: 12, typesSolved: 3, typesTotal: 6 })
      .filter((badge) => badge.earned)
      .map((badge) => badge.id);

    expect(earned).toEqual(['first', 'solved-10', 'streak-7', 'perfect-knobler']);
  });
});
