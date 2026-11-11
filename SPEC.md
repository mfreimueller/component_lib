# Spec: component_lib

A library of reusable components for my own projects. Agents are the main users: they read a
component's contract, copy its code into a project and adapt it. Humans get a GitHub Pages site
that explains and demonstrates each component.

## 1. Objective

I keep rebuilding the same tools (Parsons puzzles in ParsonXam, Mars Rover, …) and re-explaining
them to agents every time. This repo holds each tool once, with everything learned so far: the data
format, the rules, the pitfalls, tested code and test cases.

**Users**
- **Agents** working in another repo. They need: which component fits, the exact data format and
  rules, files to copy, how to check that their copy or port is correct.
- **Humans** (me, colleagues). They need: what exists, what it looks like, how to try it, what to
  tell an agent.

**Success looks like**
- In a new project I write *"Add the parsons component from github.com/mfreimueller/component_lib,
  line variant"* and the agent does it without further explanation.
- An agent porting a component to another platform (Java, …) can prove the port is correct by
  running the shared conformance cases.
- The site shows a working live demo of every variant.

## 2. Decisions

| Topic | Decision |
|---|---|
| Distribution | **Copy the code in** (like shadcn/ui). No npm package, no plugin. Plain files only. |
| Reference stack | **TypeScript core** (no UI, no dependencies) + **Svelte 5 UI**. |
| Other platforms | Platform-agnostic `PORTING.md` per component + short per-platform notes (`ports/java.md`). |
| Correctness across ports | Shared **conformance cases** as JSON. Every implementation (TS core, any port) must pass them. |
| Agent entry points | `AGENTS.md` (`CLAUDE.md` points to it), `catalog.json`, `llms.txt`. |
| Human entry point | SvelteKit static site on GitHub Pages, demos import the real component code. |
| First component | `parsons`: **line** and **template** variants, taken from ParsonXam. |
| Later | Mars Rover's **block** variant (nested blocks, endless palette, execution); Streamerman's token builder as its own component. |
| Language | English everywhere. |

### Assumptions (correct me if wrong)
1. The repo is published as `mfreimueller/component_lib`; the site lives at
   `https://mfreimueller.github.io/component_lib/`. The base path comes from config, not code.
2. Core TS uses only **erasable syntax** (no `enum`, no `namespace`, no parameter properties) and
   `.ts` import suffixes, so Node 22.18+ can run the core and the validator directly (`node validate.ts`)
   without a build step.
3. The Svelte UI may depend on `svelte-dnd-action` (as ParsonXam does: touch + keyboard). Each
   component lists its npm dependencies in its manifest.
4. The UI components are **controlled**: they get pieces and the current arrangement, report changes
   through a callback, and never score. Scoring lives in the core. This keeps "the client never sees
   the solution" possible (ParsonXam exam mode), while practice apps can score in the browser.
5. Components are versioned on their own (semver in `component.json`). A copied file starts with a
   header comment naming component and version, so an agent can later see what to update.

## 3. Repository layout

```
AGENTS.md                 entry point for agents: what this is, how to pick, copy and adapt a component
CLAUDE.md                 one line: see AGENTS.md
README.md                 for humans: what this is, link to the site
SPEC.md                   this file
catalog.json              generated: all components, variants, versions, paths
llms.txt                  generated: short index with links to every COMPONENT.md
components/
  parsons/
    component.json        manifest (see 4.1)
    COMPONENT.md          the contract for agents (see 4.2)
    PORTING.md            platform-agnostic port guide (see 4.4)
    CHANGELOG.md
    schema/
      puzzle.schema.json  JSON Schema for the puzzle file (lines + template)
    conformance/
      score-lines.json
      score-template.json
      parse-template.json
      pool.json
      shuffle.json
      validate.json       invalid files and the errors they must produce
    core/                 TS, no dependencies, no DOM
      types.ts
      template.ts         parseTemplate, buildPool, normalisePiece, LIMITS
      score.ts            linePercent, templatePercent, correctFlags, round2, mean
      shuffle.ts          seeded shuffle (mulberry32 + Fisher–Yates), seed mixing
      validate.ts         validates a puzzle file, same rules as the schema plus semantics
      board.ts            template board state (pool + gaps), pure functions
      index.ts
      *.test.ts           unit tests + a runner over conformance/*.json
    svelte/
      LinePuzzle.svelte
      TemplatePuzzle.svelte
      LineReview.svelte
      TemplateReview.svelte
      theme.css           CSS custom properties the components use, with defaults
    ports/
      java.md             JavaFX notes, based on Mars Rover
    skills/
      create-puzzle-json/ authoring skill for agents: SKILL.md, example.json (uses core/validate.ts)
    examples/             puzzle files used by tests and the site demos
site/                     SvelteKit (adapter-static), imports components/* directly
scripts/
  build-catalog.ts        component.json files -> catalog.json + llms.txt
.github/workflows/
  ci.yml                  check, test, catalog is up to date
  pages.yml               build site, deploy to GitHub Pages
tasks/
  plan.md
```

## 4. A component

### 4.1 `component.json`

```json
{
  "name": "parsons",
  "version": "1.0.0",
  "title": "Parsons puzzle",
  "summary": "Put given code pieces in the right order, or into the gaps of fixed code.",
  "status": "stable",
  "tags": ["education", "drag-and-drop", "code"],
  "variants": [
    { "id": "lines", "summary": "Order whole lines, optional indentation, red herrings." },
    { "id": "template", "summary": "Fixed code with gaps; drop small pieces into the gaps." }
  ],
  "files": {
    "core": ["core/types.ts", "core/template.ts", "core/score.ts", "core/shuffle.ts", "core/validate.ts", "core/board.ts", "core/index.ts"],
    "svelte": ["svelte/LinePuzzle.svelte", "svelte/TemplatePuzzle.svelte", "svelte/LineReview.svelte", "svelte/TemplateReview.svelte", "svelte/theme.css"]
  },
  "dependencies": { "svelte": "^5", "svelte-dnd-action": "^0.9" },
  "skills": ["skills/create-puzzle-json"],
  "ports": ["ports/java.md"]
}
```

### 4.2 `COMPONENT.md` (fixed section order, so agents know where to look)

1. **Use it when / don't use it when** (e.g. "lines: order of statements matters; template: SQL,
   annotations, config, where most code is fixed").
2. **Variants**: one paragraph each and how to choose.
3. **Data format**: the puzzle file, field by field, with limits. Points to the schema.
4. **Rules**: scoring, normalisation, shuffle, indentation, reusable pieces, empty gaps, any-order gaps.
5. **Install** (copy-in): which files, where they usually go, npm deps, the header comment to add,
   which CSS custom properties to set.
6. **API**: core functions and Svelte props/events, with a short example each.
7. **Security**: modes, see 4.3.
8. **Pitfalls**: lessons from earlier projects (see 5.4).
9. **Verify**: run the conformance cases; for a UI, the manual checklist (mouse, touch, keyboard,
   screen reader labels).
10. **Used in**: ParsonXam, …

### 4.3 Modes (where the solution lives)

- **Practice**: the browser has the full puzzle and scores locally with the core.
- **Exam**: the server keeps the solution. The client only gets pieces with random ids (no order
  information) and sends the arrangement back. The UI components work the same in both modes,
  because they never score.

### 4.4 `PORTING.md` (platform-agnostic)

For an agent rebuilding the component on another platform. No TypeScript in it: plain data
shapes and pseudocode.

1. **Data model**: puzzle file, pieces, arrangement (state), review result, as language-neutral shapes.
2. **Algorithms in pseudocode**: template tokenising and gap runs, escapes, whitespace
   normalisation, pool building, line scoring, template scoring (LCS with earliest-match backtrack,
   multiset for any-order), rounding (once, at the end, 2 decimals), mulberry32 + Fisher–Yates
   with 32-bit unsigned arithmetic, seed mixing.
3. **Number traps**: 32-bit integer overflow and unsigned shifts in languages without `>>>`
   (Java: `>>>` and `Integer.toUnsignedLong`; C#: `uint`; Python: `& 0xFFFFFFFF`); `Math.imul`
   equivalents; rounding half-up vs banker's rounding.
4. **Interaction contract**: what every UI must support. Move between pool and solution by drag,
   by tap/click, and by keyboard; indentation controls when the student sets indentation;
   reusable pieces stay in the pool; every visible piece has its own id even when texts repeat;
   the drag library's placeholder never counts as a placed piece; nothing is saved or scored
   while a drag is in progress.
5. **Conformance**: the format of `conformance/*.json` and how to write a runner for it. A port
   counts as correct when every case passes.
6. **Platform notes**: links to `ports/*.md`.

`ports/java.md` adds only Java-specific notes: records and sealed interfaces for the model,
no JavaFX in the core, JavaFX drag and drop (`Dragboard`, drag-over feedback), loading the
conformance JSON in JUnit, Mars Rover as an example.

## 5. Parsons component, content

### 5.1 Puzzle file

The ParsonXam import format, unchanged, so existing files and the existing skill keep working.

```json
{
  "puzzles": [
    { "title": "...", "description": "...",
      "solution": [{ "code": "n = int(input())", "indent": 0 }],
      "redHerrings": [{ "code": "for i in range(n):", "indent": 0 }] },
    { "kind": "template", "title": "...", "description": "...",
      "template": "{{SELECT}} {{e.name}}\n{{FROM}} {{employees e}}",
      "redHerrings": ["HAVING"], "reusable": ["SELECT"] }
  ]
}
```

Limits and template syntax as in ParsonXam's `docs/puzzle-import.md` (copied into COMPONENT.md).
Limits are exported as `LIMITS` so a project can change them in one place.

### 5.2 Arrangement (what a UI reports)

- Lines: `[{ pieceId, indent }]` in placed order.
- Template: `{ "<gap index>": [pieceId, …] }`, empty gaps left out.

### 5.3 Rules (from ParsonXam, unchanged)

- **Lines**: share of solution slots holding a line with the same code and indent, 0–100.
  Lines are compared by content, so identical lines are interchangeable. Extra pieces past the
  end are ignored. When the student does not set indentation, each piece carries its solution
  indent, so the same comparison applies.
- **Template**: per gap, matching pieces (ordered: LCS; any-order: multiset intersection) over
  `max(expected, placed)`; the puzzle is the sum over all gaps. Empty puzzle → 0.
- **Rounding**: keep unrounded values, round to 2 decimals once when showing or storing.
- **Shuffle**: seeded, so a reload shows the same order.

### 5.4 Pitfalls to document (collected from ParsonXam)

- The solution must have exactly one valid order; neighbouring independent lines get a correct
  student marked wrong.
- A red herring must be wrong in every position.
- Never send `solution_position` or piece order information to the client in exam mode;
  piece ids must be random.
- Indentation by `indent` field, never by spaces in `code`.
- Template: never split a token across pieces; avoid many tiny identical pieces like `)`.
- `svelte-dnd-action` placeholder items must be filtered before saving; chip ids must be unique per
  chip, not per piece, when pieces are reusable.
- Space picks up for keyboard drag; Enter moves between lists.

## 6. Site (GitHub Pages)

SvelteKit, `adapter-static`, base path from `BASE_PATH` env. Imports the components directly from
`components/`, so the demos run the real code.

- **Home**: what the library is, a card per component (from `catalog.json`), and "How to use this
  with an agent" (the one-line prompt, copy button).
- **Component page** (`/components/parsons`):
  - live demo per variant, with a "Check" button that scores in the browser and shows the review;
  - **playground**: a JSON editor with an example; the puzzle updates as you type, and validation
    errors are shown with line numbers;
  - rules explained with small worked examples (taken from the conformance cases);
  - **Tell your agent**: ready prompts per variant, with copy button;
  - links: COMPONENT.md, PORTING.md, schema, source on GitHub.
- Works on a phone (360 px), light and dark, keyboard usable.

## 6a. Embed (custom elements, e.g. for Reveal.js)

For pages without a Svelte build, mainly Reveal.js teaching decks. The same Svelte components are
compiled a second time as custom elements into one ES module per component.

```html
<script type="module" src="https://mfreimueller.github.io/component_lib/embed/parsons.js"></script>
<parsons-puzzle src="puzzles/loops.json" index="0" check reveal-solution></parsons-puzzle>
```

- Built by `npm run build:embed` into `site/static/embed/`, so Pages serves it. The file may also
  be copied into a deck (copy-in still holds).
- Content: `src` (puzzle file URL) + `index`, or inline `<script type="application/json">` child.
- Attributes: `check` (button that scores locally), `reveal-solution` (show-solution button),
  `reset`, `students-indent`, `seed`. Events: `change`, `check` (with the percentage).
- Theming through the same CSS custom properties (they pass into shadow DOM).
- Practice mode only (the page holds the whole puzzle).
- **Reveal.js rules**: key events inside the element must not reach Reveal (Space, arrows); the
  element sets `data-prevent-swipe`; drag and drop must work while Reveal scales the slide
  (transform or `zoom`). Speaker view is an independent copy and PDF export shows the start state;
  both are documented, not fixed.
- The site includes a small Reveal demo deck that uses the published embed.

## 7. Commands

```
npm install
npm test                # vitest: core unit tests + conformance runner, all components
npm run check           # svelte-check + tsc
npm run catalog         # regenerate catalog.json and llms.txt
npm run dev             # site dev server
npm run build           # static site in site/build
node components/parsons/core/validate.ts <file.json>   # validate a puzzle file (Node 22.18+)
```

One root `package.json` (npm workspaces: root + `site`). No build for `components/`.

## 8. Testing

- Core: unit tests next to the code, plus one runner that loads every `conformance/*.json` file.
- Conformance cases are seeded from ParsonXam's backend tests (scoring, template, shuffle) and must
  give the same results as ParsonXam today.
- Svelte components: `svelte-check`; a Playwright smoke test on the built site (demo loads, a
  piece can be moved by click and by keyboard, Check shows a score).
- CI fails if `catalog.json` / `llms.txt` are out of date.

## 9. Boundaries

- **Always**: keep core free of dependencies and DOM; add a conformance case for every rule change;
  bump the component version and CHANGELOG on any change to format, rules or API.
- **Ask first**: changing the puzzle file format (breaks ParsonXam imports); adding a dependency;
  adding a new component.
- **Never**: put project-specific code (backend, DB, auth) in a component; publish to npm.

## 10. Out of scope (for now)

npm package, Claude Code plugin/marketplace, other UI frameworks, the block variant, the token
builder, a hosted backend.
