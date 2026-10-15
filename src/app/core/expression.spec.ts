import { describe, expect, it } from 'vitest';
import { binary, groupRepeatedSymbols, symbolLeaf, toTokens } from './expression';

const a = symbolLeaf(0);
const b = symbolLeaf(1);

function grouped(expression: Parameters<typeof toTokens>[0]) {
  return groupRepeatedSymbols(toTokens(expression));
}

describe('groupRepeatedSymbols', () => {
  it('groups a repeated sum term', () => {
    // a + a + b
    const result = grouped(binary('+', binary('+', a, a), b));
    expect(result).toEqual([
      { kind: 'group', symbol: 0, count: 2 },
      { kind: 'operator', operator: '+' },
      { kind: 'symbol', symbol: 1 },
    ]);
  });

  it('groups three in a row', () => {
    const result = grouped(binary('+', binary('+', a, a), a));
    expect(result).toEqual([{ kind: 'group', symbol: 0, count: 3 }]);
  });

  it('does not group when a multiplication follows: a + a • b', () => {
    const result = grouped(binary('+', a, binary('*', a, b)));
    expect(result.some((token) => token.kind === 'group')).toBe(false);
  });

  it('does not group when a subtraction precedes: b - a + a', () => {
    const result = grouped(binary('+', binary('-', b, a), a));
    expect(result.some((token) => token.kind === 'group')).toBe(false);
  });

  it('groups inside brackets: (a + a) • b', () => {
    const result = grouped(binary('*', binary('+', a, a), b));
    expect(result.filter((token) => token.kind === 'group')).toHaveLength(1);
  });

  it('does not group different symbols', () => {
    const result = grouped(binary('+', a, b));
    expect(result.some((token) => token.kind === 'group')).toBe(false);
  });
});
