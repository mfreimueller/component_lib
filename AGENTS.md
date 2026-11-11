# component_lib for agents

Reusable components to **copy into a project** and adapt. Nothing here is installed as a package.

> Work in progress. The full agent guide (how to pick, copy and adapt a component) is written in
> task T8 of `tasks/plan.md`. Until then, `SPEC.md` describes the layout and rules.

## Components

| Name | Status | Contract |
|---|---|---|
| `parsons` | in progress | `components/parsons/COMPONENT.md` |

## Working on this repo

- Spec: `SPEC.md`. Plan and task list: `tasks/plan.md`.
- `npm test` (vitest), `npm run check` (tsc + svelte-check). Both must pass before a commit.
- Core code (`components/*/core/`) uses only erasable TypeScript and `.ts` import suffixes, has no
  dependencies and no DOM, so Node 22.18+ runs it directly.
- Any change to a component's format, rules or API: add a conformance case, bump its version, update
  its `CHANGELOG.md`.
- One short branch per task, atomic commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
