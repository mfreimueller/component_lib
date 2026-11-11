// Data shapes of the parsons component. The puzzle file format is ParsonXam's import format.

/** One code line. `indent` is a nesting level (0..6), never a number of spaces. */
export interface Line {
  code: string;
  indent: number;
}

/** Line puzzle: order whole lines. `kind` may be left out. */
export interface LinePuzzle {
  kind?: 'lines';
  title: string;
  description: string;
  /** Lines in the correct order. */
  solution: Line[];
  /** Lines that belong nowhere in the solution. */
  redHerrings: Line[];
}

/** Template puzzle: fixed code with gaps, written with `{{piece}}` markers. */
export interface TemplatePuzzle {
  kind: 'template';
  title: string;
  description: string;
  template: string;
  /** Wrong extra pieces. */
  redHerrings: string[];
  /** Piece texts that may be placed any number of times. */
  reusable: string[];
}

export type Puzzle = LinePuzzle | TemplatePuzzle;

/** A puzzle file as imported or authored. */
export interface PuzzleFile {
  puzzles: Puzzle[];
}

/** A line piece as the solver sees it. `indent` is absent when the solver sets indentation. */
export interface LinePiece {
  pieceId: string;
  code: string;
  indent?: number;
}

/** One placed line in the solver's arrangement, in placed order. */
export interface PlacedLine {
  pieceId: string;
  indent: number;
}

/** A template piece in the pool as the solver sees it. */
export interface Tile {
  pieceId: string;
  text: string;
  reusable: boolean;
}

/** Template arrangement: gap index -> piece ids in order. Empty gaps are left out. */
export type GapState = Record<string, string[]>;

/** What scoring needs to know about one template gap. */
export interface TemplateGap {
  /** Expected piece texts in order. Empty for a decoy gap. */
  expected: string[];
  /** true: any order of the expected pieces is right. */
  anyOrder: boolean;
}

export const isTemplate = (p: Puzzle): p is TemplatePuzzle => p.kind === 'template';
