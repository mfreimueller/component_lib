// Runs every case in ../conformance/*.json against the TS core. Ports write the same runner in
// their own language (see ../PORTING.md).

import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as core from './index.ts';

interface Case {
  name: string;
  input: any;
  expected: any;
}
interface CaseFile {
  function: string;
  description: string;
  cases: Case[];
}

const dir = new URL('../conformance/', import.meta.url);

const run: Record<string, (input: any) => unknown> = {
  linePercent: ({ solution, placed }) => ({
    flags: core.lineFlags(solution, placed),
    percentRounded: core.round2(core.linePercent(solution, placed)),
  }),
  templatePercent: ({ gaps, placed }) => ({
    flags: gaps.map((g: core.TemplateGap, i: number) => core.correctFlags(g, placed[i] ?? [])),
    percentRounded: core.round2(core.templatePercent(gaps, placed)),
  }),
  parseTemplate: ({ source }) => {
    const p = core.parseTemplate(source);
    const errorLines = p.errors.map((e) => e.line).sort((a, b) => a - b);
    return errorLines.length > 0 ? { errorLines } : { lines: p.lines, gaps: p.gaps, pieces: p.pieces, errorLines };
  },
  buildPool: ({ template, redHerrings, reusable }) => {
    const r = core.buildPool(core.parseTemplate(template), redHerrings, reusable);
    return r.errors.length > 0 ? { errorCount: r.errors.length } : { tiles: r.tiles, errorCount: 0 };
  },
  shuffled: ({ items, seed }) => core.shuffled(items, seed),
  mixSeed: ({ seed, salt }) => core.mixSeed(seed, salt),
  round2: (input) => ('round2' in input ? core.round2(input.round2) : core.round2(core.mean(input.meanRounded))),
};

const files = readdirSync(dir).filter((f) => f.endsWith('.json'));

it('has case files', () => {
  expect(files.length).toBeGreaterThan(0);
});

for (const file of files) {
  const data = JSON.parse(readFileSync(new URL(file, dir), 'utf8')) as CaseFile;
  describe(`${file} (${data.function})`, () => {
    it('names a known function and has cases', () => {
      expect(run[data.function], `no runner for ${data.function}`).toBeDefined();
      expect(data.cases.length).toBeGreaterThan(0);
    });
    for (const c of data.cases) {
      it(c.name, () => {
        expect(run[data.function]!(c.input)).toEqual(c.expected);
      });
    }
  });
}
