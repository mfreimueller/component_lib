// Validates a puzzle file (format: COMPONENT.md, schema/puzzle.schema.json). Pure, runs in the
// browser too. The command line wrapper is cli.ts.

import { buildPool, normalisePiece, parseTemplate } from './template.ts';
import type { Line, LinePuzzle, Puzzle, PuzzleFile, TemplatePuzzle } from './types.ts';

export const FILE_LIMITS = {
  puzzles: 50,
  title: 120,
  description: 2000,
  solutionLines: 30,
  minSolutionLines: 2,
  herringLines: 10,
  lineChars: 200,
  maxIndent: 6,
};

export interface Problem {
  /** Dotted path into the file, e.g. `puzzles.0.solution.2.code`. */
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  problems: Problem[];
  /** Advice; the file is still valid. */
  warnings: Problem[];
  /** The normalised file (defaults filled in, trailing blanks dropped), only when ok. */
  file?: PuzzleFile;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function validatePuzzleFile(data: unknown): ValidationResult {
  const problems: Problem[] = [];
  const warnings: Problem[] = [];
  const bad = (path: string, message: string) => problems.push({ path, message });
  const warn = (path: string, message: string) => warnings.push({ path, message });
  const out: Puzzle[] = [];

  function checkLines(path: string, value: unknown, max: number): Line[] {
    if (!Array.isArray(value)) {
      bad(path, 'must be an array of lines');
      return [];
    }
    if (value.length > max) bad(path, `at most ${max} lines`);
    const lines: Line[] = [];
    value.forEach((line: unknown, i) => {
      const at = `${path}.${i}`;
      if (!isObject(line)) return bad(at, 'must be an object {code, indent}');
      if ('id' in line) bad(`${at}.id`, 'remove it, ids are generated');
      const { code, indent = 0 } = line;
      if (typeof code !== 'string') return bad(`${at}.code`, 'must be a string');
      const trimmed = code.trimEnd();
      if (trimmed.length === 0) bad(`${at}.code`, 'must not be empty');
      if (trimmed.length > FILE_LIMITS.lineChars) bad(`${at}.code`, `at most ${FILE_LIMITS.lineChars} characters`);
      if (/[\r\n]/.test(trimmed)) bad(`${at}.code`, 'must be a single line');
      if (trimmed !== trimmed.trimStart()) bad(`${at}.code`, 'no leading spaces or tabs, use indent');
      if (!Number.isInteger(indent) || (indent as number) < 0 || (indent as number) > FILE_LIMITS.maxIndent) {
        bad(`${at}.indent`, `must be an integer 0 to ${FILE_LIMITS.maxIndent}`);
      }
      lines.push({ code: trimmed, indent: indent as number });
    });
    return lines;
  }

  function stringList(path: string, value: unknown): string[] {
    if (value === undefined) return [];
    if (!Array.isArray(value) || value.some((x) => typeof x !== 'string')) {
      bad(path, 'must be an array of strings');
      return [];
    }
    return value as string[];
  }

  function checkLinePuzzle(at: string, p: Record<string, unknown>, head: { title: string; description: string }): LinePuzzle {
    const solution = checkLines(`${at}.solution`, p.solution, FILE_LIMITS.solutionLines);
    if (Array.isArray(p.solution) && p.solution.length < FILE_LIMITS.minSolutionLines) {
      bad(`${at}.solution`, `needs at least ${FILE_LIMITS.minSolutionLines} lines`);
    }
    const redHerrings = p.redHerrings === undefined ? [] : checkLines(`${at}.redHerrings`, p.redHerrings, FILE_LIMITS.herringLines);
    const codes = new Set(solution.map((l) => l.code));
    redHerrings.forEach((l, j) => {
      if (codes.has(l.code)) bad(`${at}.redHerrings.${j}`, 'same code as a solution line, so it is not a red herring');
    });
    return { kind: 'lines', ...head, solution, redHerrings };
  }

  function checkTemplatePuzzle(at: string, p: Record<string, unknown>, head: { title: string; description: string }): TemplatePuzzle | undefined {
    const redHerrings = stringList(`${at}.redHerrings`, p.redHerrings);
    const reusable = stringList(`${at}.reusable`, p.reusable);
    if (typeof p.template !== 'string') {
      bad(`${at}.template`, 'must be a string');
      return undefined;
    }
    const parsed = parseTemplate(p.template);
    for (const e of parsed.errors) bad(`${at}.template`, `line ${e.line}: ${e.message}`);
    for (const m of buildPool(parsed, redHerrings, reusable).errors) bad(`${at}.redHerrings`, m);
    if (parsed.errors.length === 0 && parsed.pieces.length === 0) warn(`${at}.template`, 'no pieces, there is nothing to place');
    for (const h of new Set(redHerrings.map(normalisePiece))) {
      if (parsed.pieces.includes(h)) warn(`${at}.redHerrings`, `"${h}" is also a solution piece; it is only a decoy if it cannot be used validly`);
    }
    return { kind: 'template', ...head, template: p.template, redHerrings, reusable };
  }

  const puzzles = isObject(data) ? data.puzzles : undefined;
  if (!Array.isArray(puzzles)) {
    bad('puzzles', 'the top level must be {"puzzles": [...]}');
  } else {
    if (puzzles.length < 1 || puzzles.length > FILE_LIMITS.puzzles) bad('puzzles', `must contain 1 to ${FILE_LIMITS.puzzles} puzzles`);
    puzzles.forEach((p: unknown, i) => {
      const at = `puzzles.${i}`;
      if (!isObject(p)) return bad(at, 'must be an object');
      const kind = p.kind ?? 'lines';
      if (kind !== 'lines' && kind !== 'template') return bad(`${at}.kind`, 'must be "lines" or "template" (or left out for lines)');
      const title = typeof p.title === 'string' ? p.title.trim() : '';
      if (!title || title.length > FILE_LIMITS.title) bad(`${at}.title`, `required, at most ${FILE_LIMITS.title} characters`);
      let description = '';
      if (p.description !== undefined) {
        if (typeof p.description !== 'string' || p.description.trim().length > FILE_LIMITS.description) {
          bad(`${at}.description`, `must be a string of at most ${FILE_LIMITS.description} characters`);
        } else description = p.description.trim();
      }
      const head = { title, description };
      const puzzle = kind === 'template' ? checkTemplatePuzzle(at, p, head) : checkLinePuzzle(at, p, head);
      if (puzzle) out.push(puzzle);
    });
  }

  const ok = problems.length === 0;
  return ok ? { ok, problems, warnings, file: { puzzles: out } } : { ok, problems, warnings };
}
