import { Pan, Scale } from './waage';

function countOf(pan: Pan, symbol: number): number {
  return pan.pictures.filter((picture) => picture === symbol).length;
}

function knownWeight(pan: Pan, known: readonly (number | undefined)[]): number {
  const pictures = pan.pictures.reduce((sum, symbol) => sum + (known[symbol] ?? 0), 0);
  return pictures + pan.weights.reduce((sum, weight) => sum + weight, 0);
}

function unknownSymbols(scale: Scale, known: readonly (number | undefined)[]): number[] {
  const all = [...scale.left.pictures, ...scale.right.pictures];
  return [...new Set(all)].filter((symbol) => known[symbol] === undefined);
}

/**
 * Deduces every picture's value by repeatedly using a scale with exactly one unknown picture.
 * Returns null when a step is not solvable, not a whole number or outside 1..limit.
 * `initial` pre-sets known values, e.g. the unit picture of a ratio puzzle.
 */
export function solveScales(
  scales: readonly Scale[],
  symbolCount: number,
  limit: number,
  initial: readonly (number | undefined)[] = [],
): number[] | null {
  const known: (number | undefined)[] = Array.from(
    { length: symbolCount },
    (_, symbol) => initial[symbol],
  );
  const pending = [...scales];

  while (pending.length > 0) {
    const index = pending.findIndex((scale) => unknownSymbols(scale, known).length <= 1);
    if (index === -1) {
      return null;
    }
    const [scale] = pending.splice(index, 1);
    const [unknown] = unknownSymbols(scale, known);

    const leftTotal = knownWeight(scale.left, known);
    const rightTotal = knownWeight(scale.right, known);
    if (unknown === undefined) {
      if (leftTotal !== rightTotal) {
        return null;
      }
      continue;
    }

    const coefficient = countOf(scale.left, unknown) - countOf(scale.right, unknown);
    const value = (rightTotal - leftTotal) / coefficient;
    if (coefficient === 0 || !Number.isInteger(value) || value < 1 || value > limit) {
      return null;
    }
    known[unknown] = value;
  }

  return known.every((value) => value !== undefined) ? (known as number[]) : null;
}
