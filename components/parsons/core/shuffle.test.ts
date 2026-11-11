import { describe, expect, it } from 'vitest';
import { mixSeed, randomSeed, shuffled } from './shuffle.ts';

const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

describe('shuffled', () => {
  // Reference orders produced by ParsonXam's implementation: existing attempts keep their order.
  it.each([
    [0, 'ehdfgbac'],
    [1, 'cbghedaf'],
    [42, 'chbagfde'],
    [4294967295, 'acgdfebh'],
  ])('seed %i gives the reference order', (seed, order) => {
    expect(shuffled(items, seed).join('')).toBe(order);
  });

  it('returns a permutation and leaves the input unchanged', () => {
    const input = [...items];
    const out = shuffled(input, 7);
    expect(input).toEqual(items);
    expect([...out].sort()).toEqual(items);
  });

  it('treats seeds modulo 2^32', () => {
    expect(shuffled(items, -1)).toEqual(shuffled(items, 4294967295));
  });

  it('handles empty and single-item lists', () => {
    expect(shuffled([], 1)).toEqual([]);
    expect(shuffled(['x'], 1)).toEqual(['x']);
  });
});

describe('mixSeed', () => {
  it('matches ParsonXam puzzleSeed', () => {
    expect(mixSeed(42, 1)).toBe(2730589350);
    expect(mixSeed(42, 2)).toBe(1702111963);
    expect(mixSeed(0, 0)).toBe(3238976083);
    expect(mixSeed(4294967295, 7)).toBe(199761589);
  });
});

describe('randomSeed', () => {
  it('is an unsigned 32-bit integer', () => {
    const s = randomSeed();
    expect(Number.isInteger(s) && s >= 0 && s <= 0xffffffff).toBe(true);
  });
});
