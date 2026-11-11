import { describe, expect, it } from 'vitest';
import { correctFlags, lineFlags, linePercent, mean, round2, templatePercent } from './score.ts';

const sol = [
  { code: 'n = 5', indent: 0 },
  { code: 'for i in range(1, 11):', indent: 0 },
  { code: 'print(n * i)', indent: 1 },
  { code: 'print("done")', indent: 0 },
];

describe('linePercent', () => {
  it('gives 100 for the exact solution', () => {
    expect(linePercent(sol, sol)).toBe(100);
  });

  it('counts correctly placed slots: one swapped pair loses two slots', () => {
    expect(linePercent(sol, [sol[0]!, sol[2]!, sol[1]!, sol[3]!])).toBe(50);
  });

  it('is strict about position: a missing early line fails everything after it', () => {
    expect(linePercent(sol, sol.slice(1))).toBe(0);
  });

  it('scores a red herring in a slot as wrong', () => {
    expect(linePercent(sol, [sol[0]!, sol[1]!, sol[2]!, { code: 'print(n)', indent: 1 }])).toBe(75);
  });

  it('requires the right indentation', () => {
    expect(linePercent(sol, [sol[0]!, sol[1]!, { code: 'print(n * i)', indent: 0 }, sol[3]!])).toBe(75);
  });

  it('gives 0 for nothing placed and ignores extra pieces past the end', () => {
    expect(linePercent(sol, [])).toBe(0);
    expect(linePercent(sol, [...sol, { code: 'extra', indent: 0 }])).toBe(100);
  });

  it('treats identical lines as interchangeable', () => {
    const twice = [{ code: 'pass', indent: 1 }, { code: 'pass', indent: 1 }];
    expect(linePercent(twice, twice)).toBe(100);
  });

  it('returns the unrounded share', () => {
    const three = [{ code: 'a', indent: 0 }, { code: 'b', indent: 0 }, { code: 'c', indent: 0 }];
    expect(linePercent(three, [three[0]!])).toBeCloseTo(33.333, 3);
    expect(round2(linePercent(three, [three[0]!]))).toBe(33.33);
  });

  it('gives 0 when the solution is empty', () => {
    expect(linePercent([], [])).toBe(0);
  });
});

describe('lineFlags', () => {
  it('flags each placed line, extras past the end are false', () => {
    expect(lineFlags(sol, [sol[0]!, sol[2]!, sol[2]!, sol[3]!, sol[0]!])).toEqual([true, false, true, true, false]);
  });
});

describe('mean and round2', () => {
  it('averages equally, untouched puzzles count as 0', () => {
    expect(round2(mean([100, 75, 60]))).toBe(78.33);
    expect(round2(mean([100, 0]))).toBe(50);
  });

  it('rounds once at the end, not per puzzle', () => {
    // 100 and 2/3: rounding the second first would give 83.34
    expect(round2(mean([100, (2 / 3) * 100]))).toBe(83.33);
  });

  it('handles no values', () => {
    expect(mean([])).toBe(0);
  });
});

describe('templatePercent', () => {
  const ordered = (...expected: string[]) => ({ expected, anyOrder: false });
  const unordered = (...expected: string[]) => ({ expected, anyOrder: true });

  it('is 100 for the solution and for a decoy gap left empty', () => {
    expect(templatePercent([ordered('a', 'b'), ordered()], [['a', 'b'], []])).toBe(100);
  });

  it('counts a missing piece against the expected length', () => {
    expect(templatePercent([ordered('a', 'b')], [['a']])).toBe(50);
  });

  it('counts an extra piece or a red herring against the placed length', () => {
    expect(templatePercent([ordered('a')], [['a', 'x']])).toBe(50);
    expect(templatePercent([ordered('a')], [['herring']])).toBe(0);
  });

  it('penalises anything placed in an empty gap', () => {
    expect(templatePercent([ordered('a'), ordered()], [['a'], ['x']])).toBe(50);
  });

  it('uses the common subsequence for ordered gaps', () => {
    expect(templatePercent([ordered('a', 'b', 'c')], [['b', 'a', 'c']])).toBeCloseTo(66.667, 2);
    expect(templatePercent([ordered('a', 'b')], [['b', 'a']])).toBe(50);
  });

  it('ignores order in any-order gaps', () => {
    expect(templatePercent([unordered('a', 'b')], [['b', 'a']])).toBe(100);
    expect(templatePercent([unordered('a', 'b')], [['b', 'b']])).toBe(50);
  });

  it('scores nothing placed as 0, even with no expected pieces at all', () => {
    expect(templatePercent([ordered('a'), ordered('b')], [[], []])).toBe(0);
    expect(templatePercent([ordered()], [[]])).toBe(0);
  });

  it('accepts a reusable piece placed twice', () => {
    expect(templatePercent([ordered('SELECT'), ordered('SELECT')], [['SELECT'], ['SELECT']])).toBe(100);
  });
});

describe('correctFlags', () => {
  it('flags the earliest-matching pieces of the LCS', () => {
    expect(correctFlags({ expected: ['a', 'b'], anyOrder: false }, ['a', 'a', 'b'])).toEqual([true, false, true]);
    expect(correctFlags({ expected: ['a', 'b'], anyOrder: false }, ['x', 'b', 'a'])).toEqual([false, true, false]);
  });

  it('flags the multiset intersection for any-order gaps', () => {
    expect(correctFlags({ expected: ['a', 'b'], anyOrder: true }, ['b', 'x', 'a', 'a'])).toEqual([true, false, true, false]);
  });
});
