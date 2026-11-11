# component_lib for agents

Reusable components, written down once: data format, rules, tested code, test cases and the
lessons from earlier projects. **You copy a component into a project and adapt it. Nothing here is
installed as a package.**

Machine-readable index: `catalog.json` (also `llms.txt`). Human showcase:
https://mfreimueller.github.io/component_lib/

## Components

| Name | What | Contract |
|---|---|---|
| `parsons` | Parsons puzzles: order code lines, or drop pieces into the gaps of fixed code. Svelte 5 UI, embeddable `<parsons-puzzle>` (also in Reveal.js), porting guide for other platforms. | `components/parsons/COMPONENT.md` |

## Using a component in another project

1. **Pick.** Read the component's `COMPONENT.md` §1 (use it when / don't) and §2 (variants). If
   nothing fits, say so instead of bending a component.
2. **Choose the form.**
   - Svelte 5 app → copy `core/` and `svelte/`.
   - Page without a Svelte build (static HTML, Reveal.js deck, another framework) → the embed: one
     script tag, see `COMPONENT.md` §6.4.
   - Another language or UI toolkit → port it: `PORTING.md` + `ports/<platform>.md`, and make the
     port pass every case in `conformance/`.
3. **Copy, don't rewrite.** Follow `COMPONENT.md` §5 (Install). Keep `core/` files unchanged where
   possible: they are the tested part. Adapt the UI freely (layout, texts via `labels`, tokens).
4. **Mark every copied file** with a header comment:
   `// from component_lib <name>@<version> (components/<name>/<path>)`. Note local changes below it.
5. **Respect the security notes** (`COMPONENT.md` §7), e.g. never send a solution to an exam client.
6. **Verify** as in `COMPONENT.md` §9, and read §8 (pitfalls) before you change behaviour.
7. **Content**: if the component has an authoring skill (`skills/`), copy its folder into the
   project's skills folder (e.g. `.claude/skills/`). Skills are self-contained.

### Updating a copied component

Compare the version in the header comments with `component.json`; read `CHANGELOG.md` between the
two versions; re-copy changed files and re-apply the local changes noted in the headers.

### When the component is missing something

Prefer a small, local adaptation in the project. If it is a general improvement (bug, rule, missing
option), tell the user it belongs in component_lib, so the next project gets it too.

## Working on this repo

- `SPEC.md` is the spec (layout, decisions, the Reveal.js findings in §6a). `tasks/plan.md` is the
  plan.
- Commands: `npm test` (vitest: unit, component and conformance tests), `npm run check`
  (tsc + svelte-check), `npm run catalog` (regenerate `catalog.json`/`llms.txt`),
  `npm run build:embed` (custom element bundle into `site/static/embed/`).
- Core code (`components/*/core/`): erasable TypeScript only (no `enum`, no `namespace`, no
  parameter properties), `.ts` import suffixes, no dependencies, no DOM. Node 22.18+ runs it directly.
- Svelte components: no `<section>` elements, width-based layout from the component's own width (`bind:clientWidth`, no media or container queries), element
  rules nested under the root class, per-instance ids (`$props.id()`), stop propagation of handled
  keys. These keep them working inside Reveal.js and other hosts (SPEC.md §6a).
- Any change to a component's format, rules or API: add or change a conformance case first, bump the
  version in `component.json`, add a `CHANGELOG.md` entry, run `npm run catalog`.
- Ask the user before: changing a puzzle file format (breaks existing files), adding a runtime
  dependency to a component, adding a new component.
- Never put project-specific code (backend, database, auth) into a component.
- One short branch per task, atomic commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), merge to
  `main` when `npm test`, `npm run check` and `npm run catalog:check` pass.

### Adding a component

`components/<name>/` with `component.json`, `COMPONENT.md` (same section order as parsons:
use/don't, variants, data format, rules, install, API, security, pitfalls, verify, used in),
`PORTING.md` if it has portable logic, `CHANGELOG.md`, `core/`, UI folder(s), `conformance/` with a
runner, examples. Then `npm run catalog` and a page on the site.
