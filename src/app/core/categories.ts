import { LEVEL_IDS, LEVELS, LevelId } from './levels';
import { KREUZ_LEVELS } from './kreuzzahl-levels';
import { MOBILE_LEVELS } from './mobile-levels';
import { PUZZLE_TYPE_LABEL, PuzzleType } from './puzzle';
import { SUDOKU_LEVELS } from './sudoku-levels';
import { PYRAMID_LEVELS } from './pyramid-levels';
import { WAAGE_LEVELS } from './waage-levels';

export interface CategoryLevel {
  id: LevelId;
  label: string;
  description: string;
}

export interface Category {
  type: PuzzleType;
  title: string;
  summary: string;
  levels: CategoryLevel[];
}

function levelsOf(describe: (id: LevelId) => string): CategoryLevel[] {
  return LEVEL_IDS.map((id) => ({ id, label: LEVELS[id].label, description: describe(id) }));
}

export const CATEGORIES: readonly Category[] = [
  {
    type: 'gleichung',
    title: PUZZLE_TYPE_LABEL.gleichung,
    summary: 'Jedes Bild steht für eine Zahl. Löse das Gleichungssystem.',
    levels: levelsOf((id) => LEVELS[id].description),
  },
  {
    type: 'waage',
    title: PUZZLE_TYPE_LABEL.waage,
    summary: 'Waagen im Gleichgewicht. Finde heraus, wie viel etwas wiegt.',
    levels: levelsOf((id) => WAAGE_LEVELS[id].description),
  },
  {
    type: 'mobile',
    title: PUZZLE_TYPE_LABEL.mobile,
    summary: 'Verschachtelte Balken. Finde die fehlende Zahl oder das Gewicht.',
    levels: levelsOf((id) => MOBILE_LEVELS[id].description),
  },
  {
    type: 'kreuzzahl',
    title: PUZZLE_TYPE_LABEL.kreuzzahl,
    summary: 'Zeilen und Spalten müssen stimmen. Fülle die Lücken.',
    levels: levelsOf((id) => KREUZ_LEVELS[id].description),
  },
  {
    type: 'pyramide',
    title: PUZZLE_TYPE_LABEL.pyramide,
    summary: 'Jeder Stein ist die Summe der beiden darunter. Fülle die Lücken.',
    levels: levelsOf((id) => PYRAMID_LEVELS[id].description),
  },
  {
    type: 'sudoku',
    title: PUZZLE_TYPE_LABEL.sudoku,
    summary: 'In jeder Zeile, Spalte und jedem Block steht jede Ziffer einmal.',
    levels: levelsOf((id) => SUDOKU_LEVELS[id].description),
  },
];

export function categoryOf(type: PuzzleType): Category | undefined {
  return CATEGORIES.find((category) => category.type === type);
}
