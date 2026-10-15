import { LevelId } from './levels';
import { MobileMode } from './mobile';

export interface MobileLevelConfig {
  id: LevelId;
  description: string;
  mode: MobileMode;
  /** The whole mobile weighs at most `limit`, so every number stays within 1..limit. */
  limit: number;
  /** Weight on each side of the top bar (an even number within this range). */
  sideWeight: readonly [number, number];
  bars: readonly [number, number];
  /** Pictures mode only: how many different pictures appear. */
  symbolCount: readonly [number, number];
  /** Range of the hidden picture weights; in numbers mode also the smallest number leaf. */
  valueRange: readonly [number, number];
  /** Largest free number leaf (the balancing number of a side may be larger). */
  numberMax: number;
  question: 'unknown' | 'symbol' | 'part';
  /** Drawing width in leaf units so the mobile fits a phone screen. */
  maxWidth: number;
}

export const MOBILE_LEVELS: Record<LevelId, MobileLevelConfig> = {
  leicht: {
    id: 'leicht',
    description: 'Zahlen bis 20 · 2 Balken · eine Lücke',
    mode: 'numbers',
    limit: 20,
    sideWeight: [6, 10],
    bars: [2, 2],
    symbolCount: [0, 0],
    valueRange: [1, 9],
    numberMax: 9,
    question: 'unknown',
    maxWidth: 8,
  },
  mittel: {
    id: 'mittel',
    description: 'Zahlen bis 100 · 3 Balken · eine Lücke',
    mode: 'numbers',
    limit: 100,
    sideWeight: [20, 50],
    bars: [3, 3],
    symbolCount: [0, 0],
    valueRange: [2, 30],
    numberMax: 30,
    question: 'unknown',
    maxWidth: 10,
  },
  schwer: {
    id: 'schwer',
    description: 'Bilder bis 100 · 3–4 Balken · Gewicht eines Bildes',
    mode: 'pictures',
    limit: 100,
    sideWeight: [40, 50],
    bars: [3, 4],
    symbolCount: [2, 3],
    valueRange: [2, 7],
    numberMax: 30,
    question: 'symbol',
    maxWidth: 11,
  },
  knobler: {
    id: 'knobler',
    description: 'Bilder bis 1000 · 4–5 Balken · Gewicht eines Untermobiles',
    mode: 'pictures',
    limit: 1000,
    sideWeight: [160, 250],
    bars: [4, 5],
    symbolCount: [3, 4],
    valueRange: [3, 16],
    numberMax: 120,
    question: 'part',
    maxWidth: 14,
  },
};
