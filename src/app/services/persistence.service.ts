import { Injectable } from '@angular/core';
import { LEVEL_IDS, LevelId, isLevelId } from '../core/levels';

export interface LevelStats {
  solved: number;
  bestSeconds: number | null;
  totalHints: number;
}

export type Stats = Record<LevelId, LevelStats>;

export interface Session {
  level: LevelId;
  seed: number;
  elapsedSeconds: number;
  hintsUsed: number;
  solved: boolean;
}

const STATS_KEY = 'raetsel.stats.v1';
const SESSION_KEY = 'raetsel.session.v1';

function emptyStats(): Stats {
  return Object.fromEntries(
    LEVEL_IDS.map((level) => [level, { solved: 0, bestSeconds: null, totalHints: 0 }]),
  ) as Stats;
}

/** Wraps localStorage; storage may be unavailable (private mode), so every access is guarded. */
@Injectable({ providedIn: 'root' })
export class PersistenceService {
  loadStats(): Stats {
    const stats = emptyStats();
    const stored = this.read(STATS_KEY);
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

  recordSolved(level: LevelId, seconds: number, hints: number): Stats {
    const stats = this.loadStats();
    const entry = stats[level];
    stats[level] = {
      solved: entry.solved + 1,
      totalHints: entry.totalHints + hints,
      bestSeconds: entry.bestSeconds === null ? seconds : Math.min(entry.bestSeconds, seconds),
    };
    this.write(STATS_KEY, stats);
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
      return stored as Session;
    }
    return null;
  }

  saveSession(session: Session): void {
    this.write(SESSION_KEY, session);
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
