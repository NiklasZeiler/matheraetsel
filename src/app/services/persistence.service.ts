import { Injectable } from '@angular/core';
import { LEVEL_IDS, LevelId, isLevelId } from '../core/levels';
import { PuzzleType, isPuzzleType } from '../core/puzzle';

export interface LevelStats {
  solved: number;
  bestSeconds: number | null;
  totalHints: number;
}

export type Stats = Record<LevelId, LevelStats>;

export interface Session {
  type: PuzzleType;
  level: LevelId;
  seed: number;
  elapsedSeconds: number;
  hintsUsed: number;
  solved: boolean;
  /** Player's own guesses per symbol index. */
  notes: Record<number, string>;
}

/** The equation key predates the waage puzzle and is kept so existing stats survive. */
const STATS_KEYS: Record<PuzzleType, string> = {
  gleichung: 'raetsel.stats.v1',
  waage: 'raetsel.stats.waage.v1',
};
const SESSION_KEY = 'raetsel.session.v1';

function emptyStats(): Stats {
  return Object.fromEntries(
    LEVEL_IDS.map((level) => [level, { solved: 0, bestSeconds: null, totalHints: 0 }]),
  ) as Stats;
}

/** Wraps localStorage; storage may be unavailable (private mode), so every access is guarded. */
@Injectable({ providedIn: 'root' })
export class PersistenceService {
  loadStats(type: PuzzleType): Stats {
    const stats = emptyStats();
    const stored = this.read(STATS_KEYS[type]);
    if (stored && typeof stored === 'object') {
      for (const level of LEVEL_IDS) {
        const entry = (stored as Record<string, Partial<LevelStats>>)[level];
        if (entry && typeof entry.solved === 'number' && typeof entry.totalHints === 'number') {
          stats[level] = {
            solved: entry.solved,
            totalHints: entry.totalHints,
            bestSeconds: typeof entry.bestSeconds === 'number' ? entry.bestSeconds : null,
          };
        }
      }
    }
    return stats;
  }

  recordSolved(type: PuzzleType, level: LevelId, seconds: number, hints: number): Stats {
    const stats = this.loadStats(type);
    const entry = stats[level];
    stats[level] = {
      solved: entry.solved + 1,
      totalHints: entry.totalHints + hints,
      bestSeconds: entry.bestSeconds === null ? seconds : Math.min(entry.bestSeconds, seconds),
    };
    this.write(STATS_KEYS[type], stats);
    return stats;
  }

  loadSession(): Session | null {
    const stored = this.read(SESSION_KEY) as Partial<Session> | null;
    if (
      stored &&
      isLevelId(stored.level) &&
      typeof stored.seed === 'number' &&
      typeof stored.elapsedSeconds === 'number' &&
      typeof stored.hintsUsed === 'number' &&
      typeof stored.solved === 'boolean'
    ) {
      return {
        type: isPuzzleType(stored.type) ? stored.type : 'gleichung',
        level: stored.level,
        seed: stored.seed,
        elapsedSeconds: stored.elapsedSeconds,
        hintsUsed: stored.hintsUsed,
        solved: stored.solved,
        notes: this.cleanNotes(stored.notes),
      };
    }
    return null;
  }

  saveSession(session: Session): void {
    this.write(SESSION_KEY, session);
  }

  private cleanNotes(value: unknown): Record<number, string> {
    const notes: Record<number, string> = {};
    if (value && typeof value === 'object') {
      for (const [key, text] of Object.entries(value)) {
        if (/^\d+$/.test(key) && typeof text === 'string' && /^\d{1,4}$/.test(text)) {
          notes[Number(key)] = text;
        }
      }
    }
    return notes;
  }

  private read(key: string): unknown {
    try {
      const text = localStorage.getItem(key);
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }

  private write(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or blocked: the game still works, it just won't be remembered.
    }
  }
}
