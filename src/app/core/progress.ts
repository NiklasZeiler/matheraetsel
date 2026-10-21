import { LevelId } from './levels';

export const LEAGUES = ['Bronze', 'Silber', 'Gold', 'Saphir', 'Diamant'] as const;
export const LEAGUE_ICONS = ['🥉', '🥈', '🥇', '💎', '👑'] as const;

/** Days with at least one solved puzzle per week to move up, and the most that still moves down. */
export const PROMOTION_DAYS = 4;
export const DEMOTION_DAYS = 1;

const LEVEL_XP: Record<LevelId, number> = { leicht: 10, mittel: 20, schwer: 35, knobler: 50 };
const NO_HINT_BONUS = 0.5;
export const DAILY_BONUS_XP = 25;
/** Older days are dropped so the stored data stays small. */
const DAYS_KEPT = 120;
const AWARDED_KEPT = 300;
/** Safety cap so a corrupt week key can never spin the settle loop. */
const MAX_SETTLED_WEEKS = 104;

export interface Progress {
  totalXp: number;
  /** XP earned per local day (YYYY-MM-DD). */
  xpByDay: Record<string, number>;
  /** Index into LEAGUES. */
  league: number;
  /** Monday (YYYY-MM-DD) of the week the current league was last settled for. */
  leagueWeek: string;
  /** Puzzles that already paid out XP, so replaying a link can't farm points. */
  awarded: string[];
  bestStreak: number;
  highestLeague: number;
  perfectKnobler: boolean;
}

export interface Award {
  base: number;
  noHintBonus: number;
  dailyBonus: number;
  total: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  earned: boolean;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parseDay(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(key: string, days: number): string {
  const date = parseDay(key);
  date.setDate(date.getDate() + days);
  return formatDay(date);
}

/** Weeks run Monday to Sunday. */
export function weekStart(key: string): string {
  const weekday = (parseDay(key).getDay() + 6) % 7;
  return addDays(key, -weekday);
}

export function weekDays(week: string): string[] {
  return Array.from({ length: 7 }, (_, offset) => addDays(week, offset));
}

export function emptyProgress(today: string): Progress {
  return {
    totalXp: 0,
    xpByDay: {},
    league: 0,
    leagueWeek: weekStart(today),
    awarded: [],
    bestStreak: 0,
    highestLeague: 0,
    perfectKnobler: false,
  };
}

export function activeDays(progress: Progress, week: string): number {
  return weekDays(week).filter((day) => (progress.xpByDay[day] ?? 0) > 0).length;
}

export function weekXp(progress: Progress, week: string): number {
  return weekDays(week).reduce((sum, day) => sum + (progress.xpByDay[day] ?? 0), 0);
}

/** Moves the league for every finished week since the last settle, then starts the current week. */
export function settleLeague(progress: Progress, today: string): Progress {
  const currentWeek = weekStart(today);
  let { league, leagueWeek, highestLeague } = progress;
  for (let step = 0; leagueWeek < currentWeek && step < MAX_SETTLED_WEEKS; step++) {
    const active = activeDays(progress, leagueWeek);
    if (active >= PROMOTION_DAYS) {
      league = Math.min(league + 1, LEAGUES.length - 1);
    } else if (active <= DEMOTION_DAYS) {
      league = Math.max(league - 1, 0);
    }
    highestLeague = Math.max(highestLeague, league);
    leagueWeek = addDays(leagueWeek, 7);
  }
  if (leagueWeek < currentWeek) {
    leagueWeek = currentWeek;
  }
  return { ...progress, league, leagueWeek, highestLeague };
}

export function puzzleKey(type: string, level: LevelId, seed: number): string {
  return `${type}:${level}:${seed}`;
}

export function awardFor(level: LevelId, hints: number, daily: boolean): Award {
  const base = LEVEL_XP[level];
  const noHintBonus = hints === 0 ? Math.round(base * NO_HINT_BONUS) : 0;
  const dailyBonus = daily ? DAILY_BONUS_XP : 0;
  return { base, noHintBonus, dailyBonus, total: base + noHintBonus + dailyBonus };
}

export interface SolvedPuzzle {
  key: string;
  level: LevelId;
  hints: number;
  daily: boolean;
  /** Daily streak after this solve. */
  streak: number;
}

/** Pays out XP once per puzzle; returns the unchanged progress and no award for a repeat. */
export function applySolved(
  progress: Progress,
  solved: SolvedPuzzle,
  today: string,
): { progress: Progress; award: Award | null } {
  const settled = settleLeague(progress, today);
  const bestStreak = Math.max(settled.bestStreak, solved.streak);
  const perfectKnobler =
    settled.perfectKnobler || (solved.level === 'knobler' && solved.hints === 0);
  if (settled.awarded.includes(solved.key)) {
    return { progress: { ...settled, bestStreak, perfectKnobler }, award: null };
  }
  const award = awardFor(solved.level, solved.hints, solved.daily);
  const days = Object.keys(settled.xpByDay).concat(today);
  const kept = [...new Set(days)].sort().slice(-DAYS_KEPT);
  const xpByDay = Object.fromEntries(
    kept.map((day) => [day, (settled.xpByDay[day] ?? 0) + (day === today ? award.total : 0)]),
  );
  return {
    progress: {
      ...settled,
      totalXp: settled.totalXp + award.total,
      xpByDay,
      awarded: [...settled.awarded, solved.key].slice(-AWARDED_KEPT),
      bestStreak,
      perfectKnobler,
    },
    award,
  };
}

export interface BadgeFacts {
  solvedTotal: number;
  typesSolved: number;
  typesTotal: number;
}

export function badges(progress: Progress, facts: BadgeFacts): Badge[] {
  return [
    {
      id: 'first',
      title: 'Erster Schritt',
      description: 'Das erste Rätsel lösen',
      earned: facts.solvedTotal >= 1,
    },
    {
      id: 'solved-10',
      title: 'Rätselfreund',
      description: '10 Rätsel lösen',
      earned: facts.solvedTotal >= 10,
    },
    {
      id: 'solved-100',
      title: 'Rätselprofi',
      description: '100 Rätsel lösen',
      earned: facts.solvedTotal >= 100,
    },
    {
      id: 'all-types',
      title: 'Allrounder',
      description: 'Jede Rätselart mindestens einmal lösen',
      earned: facts.typesSolved >= facts.typesTotal,
    },
    {
      id: 'streak-7',
      title: 'Wochenserie',
      description: '7 Tage in Folge die Tagesaufgabe lösen',
      earned: progress.bestStreak >= 7,
    },
    {
      id: 'streak-30',
      title: 'Monatsserie',
      description: '30 Tage in Folge die Tagesaufgabe lösen',
      earned: progress.bestStreak >= 30,
    },
    {
      id: 'streak-100',
      title: 'Unaufhaltsam',
      description: '100 Tage in Folge die Tagesaufgabe lösen',
      earned: progress.bestStreak >= 100,
    },
    {
      id: 'perfect-knobler',
      title: 'Meisterknobler',
      description: 'Ein Knobler-Rätsel ohne Hinweis lösen',
      earned: progress.perfectKnobler,
    },
    {
      id: 'diamond',
      title: 'Diamant-Liga',
      description: 'In die Diamant-Liga aufsteigen',
      earned: progress.highestLeague >= LEAGUES.length - 1,
    },
  ];
}
