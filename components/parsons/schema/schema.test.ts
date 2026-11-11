// The schema must accept every valid conformance file and reject the structural errors.
import { readFileSync } from 'node:fs';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const validate = new Ajv2020({ allErrors: true }).compile(read('./puzzle.schema.json'));
const cases: { name: string; input: unknown; expected: { ok: boolean } }[] = read('../conformance/validate.json').cases;

// Errors only core/validate.ts can find (they need parsing or comparing values).
const semanticOnly = new Set([
  'error: red herring equal to a solution line',
  'error: template syntax',
  'error: reusable text that occurs nowhere',
]);

describe('puzzle.schema.json', () => {
  it('accepts the example file', () => {
    expect(validate(read('../examples/mixed.json'))).toBe(true);
  });

  for (const c of cases) {
    const want = c.expected.ok || semanticOnly.has(c.name);
    it(`${want ? 'accepts' : 'rejects'}: ${c.name}`, () => {
      expect(validate(c.input), JSON.stringify(validate.errors)).toBe(want);
    });
  }
});
