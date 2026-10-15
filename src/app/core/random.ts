export type Random = () => number;

/** Mulberry32: tiny seeded generator, stable across platforms so shared links stay valid. */
export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(random: Random, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

export function pickOne<T>(random: Random, items: readonly T[]): T {
  return items[randomInt(random, 0, items.length - 1)];
}

export function shuffled<T>(random: Random, items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = randomInt(random, 0, index);
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

export const MAX_SEED = 0xffffffff;

export function createSeed(): number {
  return Math.floor(Math.random() * (MAX_SEED + 1));
}
