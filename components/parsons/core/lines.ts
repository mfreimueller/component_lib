// Line puzzles in practice mode: the browser holds the whole puzzle. In exam mode a server does the
// same with its own random ids and never sends `lineOf` to the client.

import { linePercent, lineFlags, type LineScoring } from './score.ts';
import { shuffled } from './shuffle.ts';
import type { Line, LinePiece, LinePuzzle, PlacedLine } from './types.ts';

export interface LineSetup {
  /** Shuffled pieces for the UI. Ids follow the shuffled order, so they say nothing about the solution. */
  pieces: LinePiece[];
  /** Piece id -> its line, for scoring. Keep it away from the solver in exam mode. */
  lineOf: Map<string, Line>;
}

/**
 * Pieces for a line puzzle. `studentsIndent`: true sends pieces without indent (the solver sets
 * it), false gives every piece its solution indent.
 */
export function linePieces(puzzle: LinePuzzle, seed: number, studentsIndent: boolean): LineSetup {
  const all = shuffled([...puzzle.solution, ...puzzle.redHerrings], seed);
  const lineOf = new Map<string, Line>();
  const pieces = all.map((line, i): LinePiece => {
    const pieceId = `p${i}`;
    lineOf.set(pieceId, line);
    return studentsIndent ? { pieceId, code: line.code } : { pieceId, code: line.code, indent: line.indent };
  });
  return { pieces, lineOf };
}

export interface LineOutcome {
  /** Unrounded, 0..100. */
  percent: number;
  /** The placed lines with the solver's indent and whether each is right. Unknown ids are skipped. */
  submission: (Line & { correct: boolean })[];
}

export function evaluateLines(
  solution: Line[],
  lineOf: Map<string, Line>,
  placed: PlacedLine[],
  scoring: LineScoring = 'position'
): LineOutcome {
  const lines = placed.flatMap((p) => {
    const line = lineOf.get(p.pieceId);
    return line ? [{ code: line.code, indent: p.indent }] : [];
  });
  const flags = lineFlags(solution, lines, scoring);
  return { percent: linePercent(solution, lines, scoring), submission: lines.map((l, i) => ({ ...l, correct: flags[i]! })) };
}

/**
 * Lines written as text with the indentation inside (as in 1bhif: "    total += i") -> Line[].
 * A tab counts as `indentWidth` spaces; trailing blanks are dropped. Throws when an indentation is
 * not a multiple of `indentWidth` or deeper than 6 levels.
 */
export function linesFromText(texts: string[], indentWidth = 4): Line[] {
  return texts.map((text, i) => {
    const expanded = text.replace(/^[ \t]+/, (ws) => ws.replace(/\t/g, ' '.repeat(indentWidth))).trimEnd();
    const spaces = expanded.length - expanded.trimStart().length;
    if (spaces % indentWidth !== 0) throw new Error(`line ${i + 1}: indentation of ${spaces} spaces is not a multiple of ${indentWidth}`);
    const indent = spaces / indentWidth;
    if (indent > 6) throw new Error(`line ${i + 1}: more than 6 indentation levels`);
    return { code: expanded.trimStart(), indent };
  });
}

/** The reverse of linesFromText: each line as text, indented with `indentWidth` spaces per level. */
export function linesToText(lines: Line[], indentWidth = 4): string[] {
  return lines.map((l) => ' '.repeat(l.indent * indentWidth) + l.code);
}
