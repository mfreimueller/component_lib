# component_lib

Components I reuse across projects, written down once: data format, rules, tested code and test
cases. Agents copy them into a project (start at [AGENTS.md](AGENTS.md)); people can browse and
try them on the site: https://mfreimueller.github.io/component_lib/ (not live yet).

| Component | What |
|---|---|
| `parsons` | Parsons puzzles: order code lines, or drop pieces into gaps of fixed code |

## Development

```bash
npm install
npm test        # vitest
npm run check   # tsc + svelte-check
```

Requires Node 22.18 or newer. Details: [SPEC.md](SPEC.md), plan: [tasks/plan.md](tasks/plan.md).
