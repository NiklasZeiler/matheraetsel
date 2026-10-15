export interface Theme {
  id: string;
  name: string;
  symbols: readonly string[];
}

/** Order is part of the seed contract: changing it changes every existing puzzle link. */
export const THEMES: readonly Theme[] = [
  { id: 'obst', name: 'Obst', symbols: ['🍋', '🍌', '🍎', '🍒', '🍇', '🍓', '🍊', '🍍'] },
  { id: 'tiere', name: 'Tiere', symbols: ['🐭', '🐱', '🐶', '🐰', '🐸', '🐼', '🐷', '🦊'] },
  { id: 'monster', name: 'Monster', symbols: ['👾', '👻', '🤖', '👽', '🦖', '🐙', '🦄', '🐲'] },
  { id: 'winter', name: 'Winter', symbols: ['⛄', '🧣', '🧤', '🎿', '🎄', '🔔', '🍪', '⭐'] },
  { id: 'gemuese', name: 'Gemüse', symbols: ['🥕', '🌽', '🍅', '🥦', '🥒', '🍆', '🥔', '🧅'] },
];
