import { describe, expect, it } from 'vitest';
import { jsonErrorAt } from './json-error.ts';

describe('jsonErrorAt', () => {
  it('accepts valid JSON, agreeing with JSON.parse', () => {
    for (const s of ['{}', '[]', '{"a": [1, -2.5e3, true, false, null, "x\\n\\u00e9"]}', ' 42 ', '"s"']) {
      expect(() => JSON.parse(s)).not.toThrow();
      expect(jsonErrorAt(s)).toBeUndefined();
    }
  });

  it.each([
    ['{ "puzzles": [ }', 1, 16],
    ['{\n  "a": 1,\n  "b": 2,\n}', 4, 1],
    ['{\n  "a": 1\n  "b": 2\n}', 3, 3],
    ['{"a": tru}', 1, 10],
    ['{"a": 01}', 1, 8],
    ['{"a": "x', 1, 9],
    ['[1, 2', 1, 6],
    ['{"a": 1} x', 1, 10],
    ["{'a': 1}", 1, 2],
  ])('finds the error in %j at line %i, column %i', (source, line, column) => {
    expect(() => JSON.parse(source)).toThrow();
    expect(jsonErrorAt(source)).toMatchObject({ line, column });
  });
});
