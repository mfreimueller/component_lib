import { describe, expect, it } from 'vitest';
import { evaluateLines, linePieces, linesFromText, linesToText } from './lines.ts';
import type { LinePuzzle } from './types.ts';

const puzzle: LinePuzzle = {
  title: 'T',
  description: '',
  solution: [
    { code: 'for i in range(3):', indent: 0 },
    { code: 'print(i)', indent: 1 },
  ],
  redHerrings: [{ code: 'for i in range(4):', indent: 0 }],
};

describe('linePieces', () => {
  it('gives every line one piece, ids in shuffled order, stable per seed', () => {
    const a = linePieces(puzzle, 42, false);
    expect(a.pieces.map((p) => p.pieceId)).toEqual(['p0', 'p1', 'p2']);
    expect(a.pieces.map((p) => p.code).sort()).toEqual(['for i in range(3):', 'for i in range(4):', 'print(i)']);
    expect(linePieces(puzzle, 42, false)).toEqual(a);
  });

  it('leaves out the indent when the solver sets it', () => {
    expect(linePieces(puzzle, 1, true).pieces.every((p) => p.indent === undefined)).toBe(true);
    expect(linePieces(puzzle, 1, false).pieces.find((p) => p.code === 'print(i)')!.indent).toBe(1);
  });
});

describe('evaluateLines', () => {
  const { lineOf } = linePieces(puzzle, 7, true);
  const idOf = (code: string) => [...lineOf].find(([, l]) => l.code === code)![0];

  it('scores with the placed indent and marks every line', () => {
    const out = evaluateLines(puzzle.solution, lineOf, [
      { pieceId: idOf('for i in range(3):'), indent: 0 },
      { pieceId: idOf('print(i)'), indent: 0 },
    ]);
    expect(out.percent).toBe(50);
    expect(out.submission).toEqual([
      { code: 'for i in range(3):', indent: 0, correct: true },
      { code: 'print(i)', indent: 0, correct: false },
    ]);
  });

  it('skips unknown ids', () => {
    expect(evaluateLines(puzzle.solution, lineOf, [{ pieceId: 'nope', indent: 0 }]).submission).toEqual([]);
  });
});

describe('lcs scoring in evaluateLines', () => {
  it('costs only the missing line', () => {
    const { lineOf } = linePieces(puzzle, 7, true);
    const idOf = (code: string) => [...lineOf].find(([, l]) => l.code === code)![0];
    const placed = [{ pieceId: idOf('print(i)'), indent: 1 }];
    expect(evaluateLines(puzzle.solution, lineOf, placed).percent).toBe(0);
    expect(evaluateLines(puzzle.solution, lineOf, placed, 'lcs').percent).toBe(50);
  });
});

describe('linesFromText / linesToText', () => {
  it('turns leading spaces and tabs into indent levels and back', () => {
    const lines = linesFromText(['for i in range(3):', '    print(i)', '\tif i:', '\t    pass  ']);
    expect(lines).toEqual([
      { code: 'for i in range(3):', indent: 0 },
      { code: 'print(i)', indent: 1 },
      { code: 'if i:', indent: 1 },
      { code: 'pass', indent: 2 },
    ]);
    expect(linesToText(lines)).toEqual(['for i in range(3):', '    print(i)', '    if i:', '        pass']);
  });

  it('supports another indent width', () => {
    expect(linesFromText(['  x'], 2)).toEqual([{ code: 'x', indent: 1 }]);
    expect(linesToText([{ code: 'x', indent: 2 }], 2)).toEqual(['    x']);
  });

  it('rejects indentation that is not a whole level or too deep', () => {
    expect(() => linesFromText(['ok', '  half'])).toThrow(/line 2/);
    expect(() => linesFromText([' '.repeat(28) + 'deep'])).toThrow(/6/);
  });
});
