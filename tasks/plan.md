# Plan

Order follows dependencies. Each task is one short branch and one or more atomic commits.

## Phase 1: Skeleton

**T1. Repo skeleton**
- Root `package.json` (workspaces, scripts from SPEC §7), `tsconfig.json` (erasable syntax only,
  `allowImportingTsExtensions`), vitest config, `.gitignore`, `README.md`, `CLAUDE.md` → `AGENTS.md`.
- Done when: `npm install && npm test && npm run check` succeed on an empty project.

## Phase 2: Parsons core

**T2. Core types, scoring, shuffle**
- Port `scoring.ts` and `shuffle.ts` from ParsonXam into `components/parsons/core/`.
- Done when: unit tests pass, and Node 22.18+ can import the files directly (no build).

**T3. Template parser and pool**
- Port `template.ts` (parser, `buildPool`, `LIMITS`) and the board logic from `template_state.ts`
  (without the svelte-dnd-action specifics, which move to the UI).
- Done when: unit tests ported from ParsonXam pass.

**T4. Conformance cases + runner**
- Define the case file format (documented in PORTING.md later). Write cases for line scoring,
  template scoring, parsing (incl. errors), pool, shuffle (fixed seeds → fixed orders).
- Values taken from ParsonXam's existing tests and current output.
- Done when: the runner executes every case file and all pass.

**T5. Validator + schema**
- `core/validate.ts` with the rules of ParsonXam's `validate.mjs` (errors + warnings), runnable as
  `node components/parsons/core/validate.ts file.json`. `schema/puzzle.schema.json`.
- `conformance/validate.json` with invalid files and expected messages.
- Done when: ParsonXam's `example.json` validates OK; every invalid case fails as expected.

## Phase 3: Parsons UI

**T6. LinePuzzle + LineReview (Svelte 5)**
- From ParsonXam `Puzzle.svelte`; controlled props, `theme.css` with custom properties.
- Add `--fail-on-warnings` back to `npm run check` (removed in T1: it fails while no .svelte files exist).
- Done when: `svelte-check` clean; works with mouse, touch, keyboard in the site demo (T9).

**T7. TemplatePuzzle + TemplateReview**
- From ParsonXam `TemplatePuzzle.svelte` / `TemplateReview.svelte`, using `core/board.ts`.
- Done when: as T6.

## Phase 3a: Embed

**T7a. Spike: drag and drop in a scaled Reveal slide**
- A throwaway deck with `LinePuzzle` mounted in a slide, at several window sizes (scale < 1 and
  > 1), mouse, touch and keyboard.
- Done when: we know whether `svelte-dnd-action` works under Reveal's scaling and which fixes are
  needed (or we pick another approach). Findings go into SPEC §6a.

**T7b. Custom-element build**
- `<parsons-puzzle>` wrapping LinePuzzle/TemplatePuzzle, attributes and events from SPEC §6a,
  keyboard isolation, `data-prevent-swipe`. `npm run build:embed`.
- Done when: a plain HTML page with one script tag shows and scores both variants.

**T7c. Reveal demo deck**
- In the site, using the published embed; includes check, reveal-solution as a fragment, reset.
- Done when: the deck works on Pages with mouse, keyboard and touch.

## Phase 4: Agent docs

**T8. COMPONENT.md, PORTING.md, ports/java.md, skill, manifest**
- COMPONENT.md in the fixed section order (SPEC §4.2). PORTING.md platform-agnostic (SPEC §4.4).
- Move the `create-puzzle-json` skill, pointing to `core/validate.ts`.
- `component.json`, `CHANGELOG.md` (1.0.0), `AGENTS.md`, `scripts/build-catalog.ts` → `catalog.json`, `llms.txt`.
- Done when: a fresh agent session in an empty Svelte project, given only the one-line prompt,
  installs the line variant and it runs. (Manual check.)

## Phase 5: Site

**T9. Site skeleton + component page with demos**
- SvelteKit static, base path from env, home with catalog cards, `/components/parsons` with demos
  per variant and "Check".
- Done when: `npm run build` works and `npm run preview` shows working demos.

**T10. Playground, rules explainer, "Tell your agent"**
- Done when: editing JSON updates the puzzle; invalid JSON shows errors with line numbers.

**T11. CI + Pages deploy**
- `ci.yml` (check, test, catalog up to date, Playwright smoke), `pages.yml`.
- Done when: a push to `main` deploys the site.

## Later

- Block variant (Mars Rover): nested blocks, endless palette, parameters, `maxBlocks`.
- Token builder component (Streamerman).
- Switch ParsonXam to the copied component (separate repo, separate task).
