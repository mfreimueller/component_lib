# component_lib

Components I reuse across projects, written down once: data format, rules, tested code, test cases
and the lessons from earlier projects. Think "Bootstrap for agents": an agent copies a component into
a project and adapts it; people browse and try the components on the site.

**Site:** https://mfreimueller.github.io/component_lib/

| Component | What |
|---|---|
| [`parsons`](components/parsons/COMPONENT.md) | Parsons puzzles: order code lines, or drop pieces into gaps of fixed code. Svelte 5, an embeddable `<parsons-puzzle>` (works in Reveal.js decks), porting guide. |

## Using it with an agent

Tell the agent, for example:

> Add the parsons component from github.com/mfreimueller/component_lib to this project (line variant).

The agent starts at [AGENTS.md](AGENTS.md). For a plain web page or a Reveal.js deck, no build is
needed:

```html
<script type="module" src="https://mfreimueller.github.io/component_lib/embed/parsons.js"></script>
<parsons-puzzle src="puzzles.json" index="0" check reveal-solution reset></parsons-puzzle>
```

## Development

```bash
npm install
npm test               # unit, component and conformance tests
npm run check          # tsc + svelte-check
npm run build:embed    # <parsons-puzzle> bundle
npm run catalog        # catalog.json + llms.txt from the component manifests
```

Requires Node 22.18 or newer. Spec: [SPEC.md](SPEC.md), plan: [tasks/plan.md](tasks/plan.md).
