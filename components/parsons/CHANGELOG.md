# Changelog: parsons

Versions follow semver: major = puzzle file format or scoring changes, minor = new features,
patch = fixes. Copied files carry `parsons@<version>` in their header comment.

## 1.0.0 (2026-11-11)

First version, taken from ParsonXam (backend scoring and template parser, student components).

- Core: line and template scoring, template parser and pool, seeded shuffle, validator and CLI,
  practice-mode helpers (`linePieces`, `evaluateLines`, `templateSetup`, `evaluateTemplate`).
- Svelte 5 UI: `LinePuzzle`, `LineReview`, `TemplatePuzzle`, `TemplateReview`, `theme.css`.
- Embed: `<parsons-puzzle>` custom element, also for Reveal.js decks.
- Conformance cases, JSON Schema, PORTING.md with Java notes, `create-puzzle-json` skill.

Changes against ParsonXam's code: per-instance ids and drag types (several puzzles per page),
`--pz-*` tokens with dark mode, labels for other languages, `disabled` on the template puzzle,
fixes for Reveal.js (SPEC.md §6a), a guard against placing a line twice.
