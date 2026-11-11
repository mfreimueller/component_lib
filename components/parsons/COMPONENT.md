# parsons: Parsons puzzles

Version 1.0.0 · status stable · used in ParsonXam

The solver gets code pieces and puts them in order (**line** variant) or into the gaps of fixed code
(**template** variant). Drag and drop, tap, and keyboard all work. Scoring is exact and shared by
every implementation.

## 1. Use it when / don't use it when

Use it when:
- the point is to recognise or order code: algorithms, control flow, SQL clauses, annotations,
  config files;
- typing code would be in the way (tablets, phones, beginners, exams on paper-like terms);
- you want automatic, explainable scoring.

Don't use it when:
- the solver must write code freely (use an editor and tests);
- the order of pieces does not matter and there is nothing to place (use a quiz);
- the code must be built from a grammar with types and completions (that is a token builder, a
  different component).

## 2. Variants

| Variant | The solver | Good for |
|---|---|---|
| `lines` | orders whole lines; optionally sets their indentation; red herring lines must be left out | algorithms, loops, conditions, functions (where the sequence of statements matters) |
| `template` | drops small pieces into gaps of fixed code; a gap can take several pieces, in order or in any order; a gap can be a decoy that must stay empty; pieces can be reusable | SQL, JPA/annotations, REST controllers, YAML/JSON/HTML (where a line holds several meaningful pieces or most code is boilerplate) |

One puzzle file may mix both.

## 3. Data format

A puzzle file (the ParsonXam import format). Schema: `schema/puzzle.schema.json`. Full check:
`core/validate.ts`, or on the command line `node core/cli.ts file.json` (in this repo) or
`node skills/create-puzzle-json/validate.mjs file.json` (anywhere).

```json
{
  "puzzles": [
    {
      "title": "Sum of 1 to N",
      "description": "Read n and print 1 + 2 + ... + n.",
      "solution": [
        { "code": "n = int(input())", "indent": 0 },
        { "code": "total = 0", "indent": 0 },
        { "code": "for i in range(1, n + 1):", "indent": 0 },
        { "code": "total += i", "indent": 1 },
        { "code": "print(total)", "indent": 0 }
      ],
      "redHerrings": [{ "code": "for i in range(n):", "indent": 0 }]
    },
    {
      "kind": "template",
      "title": "Employees above their department average",
      "description": "List name and salary of every employee earning more than their department's average.",
      "template": "{{SELECT}} {{e.name}}, {{e.salary}}\n{{FROM}} {{employees e}}\n{{WHERE}} {{e.salary > (}}\n    {{SELECT}} {{AVG(x.salary)}}\n    {{FROM}} {{employees x}}\n    {{WHERE}} {{x.dept_id = e.dept_id}}\n{{)}}",
      "redHerrings": ["GROUP BY", "HAVING"],
      "reusable": ["SELECT", "FROM", "WHERE"]
    }
  ]
}
```

### Common fields

| Field | Rules |
|---|---|
| `puzzles` | 1 to 50. The top level is always this object. |
| `kind` | `"lines"` (or left out) or `"template"`. |
| `title` | Required, 1 to 120 characters. |
| `description` | Task text, up to 2000 characters, may be empty or left out. |

### Line puzzles

| Field | Rules |
|---|---|
| `solution` | Lines in the correct order, 2 to 30. |
| `redHerrings` | Lines that belong nowhere, up to 10. Must not equal a solution line. |
| line `code` | One line, up to 200 characters, no leading spaces or tabs, no line breaks. Trailing blanks are dropped. |
| line `indent` | Nesting level 0 to 6 (not a number of spaces). Default 0. |

No `id` fields: ids are generated.

### Template puzzles

| Field | Rules |
|---|---|
| `template` | The correct code with markers. Up to 6000 characters, 80 lines, 30 gaps, 60 pieces, 200 characters per piece. |
| `redHerrings` | Strings: wrong extra pieces, up to 15, not empty. |
| `reusable` | Strings that may be placed any number of times; each must occur as a piece or a red herring. |

Template syntax:
- `{{text}}` makes `text` a piece; everything else is fixed code.
- A **gap** is a run of markers on one line separated only by blanks: `{{@Id}} {{@GeneratedValue}}`
  is one gap with two pieces in order. Any fixed text between markers (even `,`) ends the gap.
- `{{}}` is an **empty gap** (decoy): the right answer is to leave it empty. It must stand alone.
- `{{~a}} {{b}}`: `~` on the first marker makes the gap **any order**. Only the first marker may
  carry it; `{{~}}` is invalid.
- Escapes: `\{{` is a literal `{{`; inside a marker `\}}` is `}}` and a leading `\~` is `~`.
- Leading tabs become 4 spaces, trailing blanks are dropped, whitespace inside a piece is collapsed
  to one space.

## 4. Rules

- **Line score** = share of solution slots holding the right line (same code and same indent), 0–100.
  Lines are compared by content, so identical lines are interchangeable. A red herring in a slot is
  wrong. Pieces past the end are ignored. A missing early line shifts and fails everything after it.
- **Indentation**: with `studentsIndent` the pieces come without indent and the solver sets it
  (part of the answer). Without it, each piece carries its solution indent.
- **Template score** = Σ matching pieces / Σ max(expected, placed) over all gaps. Matching pieces:
  longest common subsequence for ordered gaps (backtrack takes the earliest match), multiset
  intersection for any-order gaps. Missing, extra and wrong pieces, red herrings, and anything in an
  empty gap all cost. Nothing placed = 0.
- **Rounding**: keep unrounded values; round once with `round2` (half up) when showing or storing.
  Several puzzles: `round2(mean(percents))`, an unanswered puzzle counts 0.
- **Shuffle**: seeded (mulberry32 + Fisher–Yates), so a reload shows the same order. `mixSeed(seed,
  puzzleId)` gives each puzzle its own order.
- **Reusable pieces** appear once in the pool (with ∞) and stay there when placed.

The conformance cases in `conformance/` are the reference for all of these.

## 5. Install (copy in)

1. Copy the folders you need, keeping them side by side (the Svelte files import `../core/*.ts`):
   - always `core/`, without `cli.ts` (a Node tool that does not type-check in a browser app) and
     without the tests (`*.test.ts`); no dependencies, no DOM;
   - Svelte 5 UI: `svelte/` (`LinePuzzle`, `LineReview`, `TemplatePuzzle`, `TemplateReview`, `theme.css`);
   - a page without a Svelte build (e.g. a Reveal.js deck): only the built `parsons.js`, see §6.4.
   Typical place: `src/lib/parsons/{core,svelte}`.
2. Dependencies for the Svelte UI: `npm i svelte-dnd-action@^0.9` (and Svelte 5).
3. Imports end in `.ts`. In TypeScript set `"allowImportingTsExtensions": true` (with `noEmit`, as
   SvelteKit/Vite projects have) or replace the suffixes with `.js`.
4. Import `svelte/theme.css` once (global CSS). Override tokens on `:root` (they have no
   specificity), e.g. `--pz-primary: var(--brand); --pz-font-mono: 'JetBrains Mono'`. Pin a scheme
   with `data-theme="light"` or `"dark"` on `<html>`.
5. Put a header comment on every copied file so later updates are traceable:
   `// from component_lib parsons@1.0.0 (components/parsons/core/score.ts)` (Svelte: `<!-- … -->`).
6. Optional: copy `skills/create-puzzle-json/` into the project's skills folder (e.g.
   `.claude/skills/`) so agents can write puzzle files. It is self-contained: its `validate.mjs` is
   the core validator bundled into one file.

## 6. API

### 6.1 Core (`core/index.ts`)

```ts
// Practice mode: the browser has the whole puzzle.
const { pieces, lineOf } = linePieces(puzzle, seed, studentsIndent);    // LinePiece[], Map<id, Line>
const { percent, submission } = evaluateLines(puzzle.solution, lineOf, placed);

const { lines, tiles, textOf } = templateSetup(puzzle, seed);           // segments, Tile[], Map<id, text>
const { percent, lines: review } = evaluateTemplate(puzzle.template, textOf, gaps);

validatePuzzleFile(json)   // { ok, problems: [{path, message}], warnings, file? (normalised) }
linePercent / lineFlags / templatePercent / correctFlags / round2 / mean
parseTemplate / buildPool / LIMITS / FILE_LIMITS
shuffled(items, seed) / mixSeed(seed, salt) / randomSeed()
```

Arrangements: lines `PlacedLine[] = [{ pieceId, indent }]` in placed order; templates
`GapState = { "<gap index>": [pieceId, …] }` (empty gaps left out).

### 6.2 Svelte components (controlled, never score)

```svelte
<LinePuzzle {pieces} placed={saved} studentsIndent onchange={(p) => (placed = p)} />
<LineReview submission={outcome.submission} solution={puzzle.solution} redHerrings={puzzle.redHerrings} showSolution />
<TemplatePuzzle lines={setup.lines} pieces={setup.tiles} placed={gaps} onchange={(g) => (gaps = g)} />
<TemplateReview lines={outcome.lines} redHerrings={puzzle.redHerrings} showExpected />
```

| Component | Props |
|---|---|
| `LinePuzzle` | `pieces`, `placed?`, `studentsIndent?`, `disabled?`, `labels?`, `onchange?` |
| `LineReview` | `submission`, `solution`, `redHerrings?`, `showSolution?` (default true), `labels?` |
| `TemplatePuzzle` | `lines`, `pieces`, `placed?`, `disabled?`, `labels?`, `onchange?` |
| `TemplateReview` | `lines`, `redHerrings?`, `showExpected?` (default true), `labels?` |

- `placed` is read once, at mount. To show another puzzle or reset, re-create the component
  (`{#key puzzleId}`).
- `labels`: any visible text, e.g. German: `labels={{ pool: 'Bausteine', solution: 'Deine Lösung',
  left: (n) => `${n} übrig`, placed: (n) => `${n} platziert`, dropHere: 'Hierher ziehen' }}`.
  English defaults are exported (`lineLabelsEn`, …).
- Several puzzles may share a page (ids and drag types are per instance).

### 6.3 Example: practice page

```svelte
<script lang="ts">
  import { evaluateLines, linePieces, randomSeed, round2, type LinePuzzle as P, type PlacedLine } from '$lib/parsons/core/index.ts';
  import LinePuzzle from '$lib/parsons/svelte/LinePuzzle.svelte';
  import LineReview from '$lib/parsons/svelte/LineReview.svelte';

  let { puzzle }: { puzzle: P } = $props();
  const seed = randomSeed();
  const setup = $derived(linePieces(puzzle, seed, true));
  let placed = $state<PlacedLine[]>([]);
  let checked = $state(false);
  const outcome = $derived(evaluateLines(puzzle.solution, setup.lineOf, placed));
</script>

{#if checked}
  <p>{round2(outcome.percent)}%</p>
  <LineReview submission={outcome.submission} solution={puzzle.solution} redHerrings={puzzle.redHerrings} />
{:else}
  <LinePuzzle pieces={setup.pieces} {placed} studentsIndent onchange={(p) => (placed = p)} />
  <button onclick={() => (checked = true)}>Check</button>
{/if}
```

### 6.4 `<parsons-puzzle>` (embed, no build)

```html
<script type="module" src="https://mfreimueller.github.io/component_lib/embed/parsons.js"></script>
<parsons-puzzle src="puzzles.json" index="0" check reveal-solution reset theme="light"></parsons-puzzle>
```

| Attribute | Meaning |
|---|---|
| `src`, `index` | Puzzle file URL (relative to the page) and which puzzle (default 0). Or an inline `<script type="application/json">` child. |
| `seed` | Fixed shuffle (default random). |
| `students-indent` | The solver sets indentation. |
| `check`, `reveal-solution`, `reset` | Show these buttons. |
| `theme` | `light` or `dark` (default: page tokens / OS scheme). |

Methods `check()` (returns the percentage), `showSolution()`, `reset()`. Events `change`
(`detail.placed` or `detail.gaps`) and `check` (`detail.percent`). Property `labels`
(`{ buttons, line, lineReview, template, templateReview }`). Invalid content shows the problems.

**Reveal.js**: works at any slide scale (keys, swipes and theme styles are handled). Two things go
in the deck script: re-layout when a puzzle resizes, and optionally a fragment that reveals the
solution. Working deck: `site/static/demos/reveal/index.html`.

```js
const ro = new ResizeObserver(() => deck.layout());
document.querySelectorAll('parsons-puzzle').forEach((p) => ro.observe(p));
deck.on('fragmentshown', (e) => {
  const id = e.fragment.dataset.parsonsSolution;              // <span class="fragment" data-parsons-solution="sum">
  if (id) document.getElementById(id)?.showSolution();
});
```

At 960×700 a puzzle of about 6 lines plus its review fits on a slide. Speaker view is an independent
copy of the deck; PDF export shows the unsolved puzzles.

## 7. Security: where the solution lives

- **Practice** (the helpers above, the embed): the browser has the whole puzzle. Fine for learning;
  anyone can read the solution in the page.
- **Exam**: the server keeps the puzzle and scores. It sends only pieces with **random** ids (never
  derived from the solution order) and, for lines, without indent when the solver indents. The client
  sends back the arrangement. Only after the exam does the server send review data
  (`evaluateLines`/`evaluateTemplate` output). The Svelte components work unchanged, because they
  never score. ParsonXam is the reference.

## 8. Pitfalls (learned the hard way)

- **One valid order only.** Two neighbouring independent lines (`a = 0`, `b = 0`) can be swapped
  without changing behaviour; scoring is exact-position, so a correct solver loses points. Rewrite.
- **A red herring must be wrong everywhere**, not just "not in the model solution".
- **Indent by the `indent` field**, never by spaces in `code`.
- **Template granularity**: never split a token (`Gen` + `erationType`); avoid many tiny identical
  pieces like `)`; if two pieces could swap between gaps, the solver is marked down for a valid answer.
- **Drag library placeholder**: `svelte-dnd-action` inserts a shadow item while dragging; filter it
  (`real()`, `isDndShadowItem`) before saving or counting. Chip ids must be unique per chip, not per
  piece, when pieces are reusable.
- **Keyboard**: Space picks up / drops (keyboard drag), Enter moves between pool and solution,
  Alt+←/→ indents (lines) or reorders inside a gap (template).
- **Inside Reveal.js** (or any page that styles bare elements or scales content): no `<section>` in
  components, hit-test at the cursor (`useCursorForDetection`), stop propagation of handled keys,
  layout from the component's own width (`bind:clientWidth`), not media or container queries
  (`container-type` collapses it in content-sized hosts). All already done; keep it that way when changing the
  components. Details: SPEC.md §6a.
- **Automated drag tests** need paced pointer moves (one per frame) and a short pause before
  release, or the drop is missed.

## 9. Verify

- Core or a port: all cases in `conformance/*.json` pass (`npm test` runs them for the TS core).
- A puzzle file: `node core/cli.ts file.json` prints `OK`.
- UI, by hand: move pieces by mouse drag, by touch drag, by tap/click and by keyboard (Space, arrows,
  Enter, Alt+arrows); indent; check that a screen reader announces piece and position (grip labels);
  narrow width (< 700 px container) stacks the columns; dark and light theme.

## 10. Used in

- **ParsonXam**: exams (exam mode, server scoring), the source of this component.
- **Mars Rover**: a different variant (nested blocks with execution) in JavaFX; see `ports/java.md`.
