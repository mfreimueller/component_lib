# Conformance cases

Language-neutral test cases for the parsons core. Every implementation (the TS core, any port)
must pass all of them. The TS runner is `../core/conformance.test.ts`.

## File format

```json
{
  "function": "linePercent",
  "description": "what is compared and how",
  "cases": [{ "name": "…", "input": { … }, "expected": … }]
}
```

Compare `expected` by deep equality (object key order does not matter, array order does).

| File | Function | Input | Expected |
|---|---|---|---|
| `score-lines.json` | `linePercent` | `solution`, `placed` (lines) | `flags` (per placed line), `percentRounded` |
| `score-template.json` | `templatePercent` | `gaps`, `placed` (texts per gap; missing = empty) | `flags` per gap, `percentRounded` |
| `parse-template.json` | `parseTemplate` | `source` | `lines`, `gaps`, `pieces`, `errorLines: []`; or only `errorLines` (sorted) when there are errors |
| `pool.json` | `buildPool` | `template`, `redHerrings`, `reusable` | `tiles`, `errorCount: 0`; or only `errorCount` |
| `shuffle.json` | `shuffled` | `items`, `seed` | the shuffled items |
| `mix-seed.json` | `mixSeed` | `seed`, `salt` | unsigned 32-bit integer |
| `round.json` | `round2` | `round2: x`, or `meanRounded: [values]` | the rounded number |
| `validate.json` | `validate` | a parsed puzzle file | `ok`, `problemPaths`, `warningPaths` (sorted) |

Error messages are never compared, only where errors are (line numbers) or how many there are, so a
port may word or translate messages freely.

## Adding cases

Every rule change gets a case here first. Expected values must come from reasoning about the rule,
not only from running the TS core.
