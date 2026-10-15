import { LevelId } from './levels';
import { WaageMode } from './waage';

export interface WaageLevelConfig {
  id: LevelId;
  description: string;
  mode: WaageMode;
  /** Weights, sums and answers stay within 1..limit (ratio mode: answers up to 12). */
  limit: number;
  symbolCount: readonly [number, number];
  /** Weights mode: range of the hidden weight behind each picture. */
  valueRange: readonly [number, number];
  /** Ratio mode: how many of the next picture one picture weighs. */
  multipleRange: readonly [number, number];
  question: 'count' | 'symbol' | 'expression';
  /** Pictures and weights together per pan, so a pan fits a phone screen. */
  maxPanItems: number;
  /** Weights mode: a balancing weight may be split into two weights. */
  splitWeights: boolean;
}

export const WAAGE_LEVELS: Record<LevelId, WaageLevelConfig> = {
  leicht: {
    id: 'leicht',
    description: 'Verhältnisse · 2 Bilder',
    mode: 'ratio',
    limit: 12,
    symbolCount: [2, 2],
    valueRange: [1, 1],
    multipleRange: [2, 4],
    question: 'count',
    maxPanItems: 6,
    splitWeights: false,
  },
  mittel: {
    id: 'mittel',
    description: 'Verhältnisse · 3 Bilder',
    mode: 'ratio',
    limit: 12,
    symbolCount: [3, 3],
    valueRange: [1, 1],
    multipleRange: [2, 3],
    question: 'count',
    maxPanItems: 6,
    splitWeights: false,
  },
  schwer: {
    id: 'schwer',
    description: 'Gewichte bis 100 · Gewicht eines Bildes',
    mode: 'weights',
    limit: 100,
    symbolCount: [3, 4],
    valueRange: [2, 15],
    multipleRange: [1, 1],
    question: 'symbol',
    maxPanItems: 5,
    splitWeights: false,
  },
  knobler: {
    id: 'knobler',
    description: 'Gewichte bis 1000 · mehrere Bilder zusammen',
    mode: 'weights',
    limit: 1000,
    symbolCount: [4, 5],
    valueRange: [3, 60],
    multipleRange: [1, 1],
    question: 'expression',
    maxPanItems: 5,
    splitWeights: true,
  },
};
