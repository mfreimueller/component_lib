<script lang="ts">
  import { asset } from '$app/paths';
  import CopyBox from '#lib/CopyBox.svelte';
  import { blob, tree } from '#lib/links.ts';
  import { catalog, examples as mixed, scoreLines, scoreTemplate, type LinePuzzle, type Puzzle, type TemplatePuzzle } from '#lib/parsons.ts';
  import Playground from '#lib/Playground.svelte';
  import PuzzleDemo from '#lib/PuzzleDemo.svelte';

  const meta = catalog.components.find((c) => c.name === 'parsons')!;
  const puzzles = mixed.puzzles as Puzzle[];
  const linePuzzle = puzzles[0] as LinePuzzle;
  const sqlPuzzle = puzzles[1] as TemplatePuzzle;
  const jpaPuzzle = puzzles[2] as TemplatePuzzle;

  // Line demo options
  let studentsIndent = $state(true);
  let lcs = $state(false);
  let numbered = $state(false);
  let templateChoice = $state<'sql' | 'jpa'>('sql');

  // Worked examples, taken from the conformance cases (the same data the tests check).
  type LineCase = { name: string; input: { solution: { code: string; indent: number }[]; placed: { code: string; indent: number }[] }; expected: { flags: boolean[]; percentRounded: number } };
  type GapCase = { name: string; input: { gaps: { expected: string[]; anyOrder: boolean }[]; placed: string[][] }; expected: { flags: boolean[][]; percentRounded: number } };
  const lineCase = (name: string) => (scoreLines.cases as LineCase[]).find((c) => c.name === name)!;
  const gapCase = (name: string) => (scoreTemplate.cases as GapCase[]).find((c) => c.name === name)!;
  const missing = { position: lineCase('a missing early line fails everything after it'), lcs: lineCase('lcs: a missing early line costs only that line') };
  const swapped = { position: lineCase('one swapped pair loses two slots'), lcs: lineCase('lcs: one swapped pair loses one line') };
  const gapExamples = [
    ['Ordered gap: the longest common subsequence counts', gapCase('ordered gap uses LCS')],
    ['Any-order gap: order does not matter', gapCase('any-order gap ignores order')],
    ['Extra or wrong pieces count against you', gapCase('extra piece counts against placed length')],
    ['Anything in an empty (decoy) gap is wrong', gapCase('anything in an empty gap is penalised')],
  ] as const;
  const show = (l: { code: string; indent: number }) => '  '.repeat(l.indent) + l.code;

  const embedSnippet = `<script type="module" src="https://mfreimueller.github.io/component_lib/embed/parsons.js"><\/script>

<parsons-puzzle src="puzzles.json" index="0" students-indent check reveal-solution reset theme="light"></parsons-puzzle>`;

  const prompts = [
    ['Svelte app, line puzzles', 'Add the parsons component from github.com/mfreimueller/component_lib to this project: line variant, practice mode with a Check button and the review. Follow COMPONENT.md.'],
    ['Svelte app, template puzzles', 'Add the parsons component (template variant) from github.com/mfreimueller/component_lib to this project. Puzzles come from a JSON file in its format. Follow COMPONENT.md.'],
    ['Reveal.js deck', 'Make a Reveal.js deck on <topic> with interactive Parsons puzzles, using <parsons-puzzle> from github.com/mfreimueller/component_lib (see COMPONENT.md §6.4 and the demo deck). Write the puzzles with its create-puzzle-json skill.'],
    ['Exam with a server', 'Use the parsons component from github.com/mfreimueller/component_lib in exam mode: the server keeps the solution and scores (COMPONENT.md §7), the client uses the Svelte components.'],
    ['Another platform', 'Port the parsons component from github.com/mfreimueller/component_lib to <Java/JavaFX>. Follow PORTING.md and ports/java.md and make the port pass every case in conformance/.'],
    ['Write puzzles', 'Write 5 Parsons puzzles on <topic> for <language> in the parsons puzzle format, using the create-puzzle-json skill from github.com/mfreimueller/component_lib, and validate the file.'],
  ];
</script>

<svelte:head>
  <title>Parsons puzzle · component_lib</title>
  <meta name="description" content={meta.summary} />
</svelte:head>

<section class="intro">
  <p class="muted">{meta.name}@{meta.version} · {meta.status}</p>
  <h1>{meta.title}</h1>
  <p class="lead">
    The solver gets pieces of code and puts them in the right order, or drops them into the gaps of fixed code.
    Drag and drop, tap and keyboard all work. Scoring is exact and the same in every implementation.
  </p>
  <ul class="links">
    <li><a href={blob('components/parsons/COMPONENT.md')}>Contract (COMPONENT.md)</a></li>
    <li><a href={blob('components/parsons/PORTING.md')}>Porting guide</a></li>
    <li><a href={blob('components/parsons/schema/puzzle.schema.json')}>JSON Schema</a></li>
    <li><a href={tree('components/parsons')}>Source</a></li>
    <li><a href={blob('components/parsons/CHANGELOG.md')}>Changelog</a></li>
  </ul>
</section>

<h2 id="lines">Line puzzle</h2>
<p>Put the lines in order. Red herrings belong nowhere. With "solver sets indentation" the indentation is part of the answer.</p>
<p class="task"><strong>{linePuzzle.title}.</strong> {linePuzzle.description}</p>
<fieldset class="options">
  <legend>Options</legend>
  <label><input type="checkbox" bind:checked={studentsIndent} /> Solver sets indentation</label>
  <label><input type="checkbox" bind:checked={lcs} /> Forgiving scoring (<code>lcs</code>)</label>
  <label><input type="checkbox" bind:checked={numbered} /> Line numbers</label>
</fieldset>
<div class="panel">
  {#key `${studentsIndent}${lcs}${numbered}`}
    <PuzzleDemo puzzle={linePuzzle} seed={11} {studentsIndent} scoring={lcs ? 'lcs' : 'position'} {numbered} />
  {/key}
</div>

<h2 id="template">Template puzzle</h2>
<p>
  The code is given; drop pieces into the gaps. A gap can take several pieces, in order or in any order. Some
  gaps must stay empty, some pieces can be used more than once (∞).
</p>
<div class="switch" role="tablist" aria-label="Template example">
  <button type="button" role="tab" aria-selected={templateChoice === 'sql'} class:on={templateChoice === 'sql'} onclick={() => (templateChoice = 'sql')}>SQL with reusable keywords</button>
  <button type="button" role="tab" aria-selected={templateChoice === 'jpa'} class:on={templateChoice === 'jpa'} onclick={() => (templateChoice = 'jpa')}>JPA with any-order and empty gaps</button>
</div>
{#key templateChoice}
  {@const p = templateChoice === 'sql' ? sqlPuzzle : jpaPuzzle}
  <p class="task"><strong>{p.title}.</strong> {p.description}</p>
  <div class="panel"><PuzzleDemo puzzle={p} seed={5} /></div>
{/key}

<h2 id="playground">Playground</h2>
<p>
  Edit a puzzle file and see it right away. This is the same format ParsonXam imports and
  <code>&lt;parsons-puzzle&gt;</code> loads; the checks are the component's validator.
</p>
<Playground initial={JSON.stringify(mixed, null, 2)} />

<h2 id="rules">How scoring works</h2>
<h3>Line puzzles: two rules</h3>
<p>
  <strong>position</strong> (default, used for exams): a line counts only in its own slot.
  <strong>lcs</strong> (for practice): the longest common subsequence counts, so one mistake costs one line.
</p>
<div class="examples">
  {#each [['A missing first line', missing], ['Two lines swapped', swapped]] as const as [title, pair] (title)}
    <div class="panel">
      <h4>{title}</h4>
      <div class="cols">
        <div>
          <p class="muted small">Solution</p>
          <pre>{pair.position.input.solution.map(show).join('\n')}</pre>
        </div>
        <div>
          <p class="muted small">Placed · position · lcs</p>
          <pre>{#each pair.position.input.placed as l, i (i)}{show(l)}  <span class={pair.position.expected.flags[i] ? 'right' : 'wrong'}>{pair.position.expected.flags[i] ? '✓' : '✗'}</span> <span class={pair.lcs.expected.flags[i] ? 'right' : 'wrong'}>{pair.lcs.expected.flags[i] ? '✓' : '✗'}</span>
{/each}</pre>
        </div>
      </div>
      <p class="scores"><span>position: <strong>{pair.position.expected.percentRounded}%</strong></span><span>lcs: <strong>{pair.lcs.expected.percentRounded}%</strong></span></p>
    </div>
  {/each}
</div>

<h3>Template puzzles</h3>
<p>Each gap is scored on its own: matching pieces ÷ the larger of expected and placed. The puzzle adds up all gaps.</p>
<table>
  <thead><tr><th>Rule</th><th>Expected</th><th>Placed</th><th>Score</th></tr></thead>
  <tbody>
    {#each gapExamples as [rule, c] (rule)}
      <tr>
        <td>{rule}</td>
        <td>
          {#each c.input.gaps as g, gi (gi)}<div><code>{g.expected.length ? g.expected.join(' ') : '(empty)'}</code>{g.anyOrder ? ' any order' : ''}</div>{/each}
        </td>
        <td>
          {#each c.input.placed as pl, gi (gi)}
            <div>{#each pl as t, ti (ti)}<code class:right={c.expected.flags[gi]?.[ti]} class:wrong={!c.expected.flags[gi]?.[ti]}>{t}</code> {/each}{pl.length ? '' : '(nothing)'}</div>
          {/each}
        </td>
        <td><strong>{c.expected.percentRounded}%</strong></td>
      </tr>
    {/each}
  </tbody>
</table>
<p class="muted small">These examples are read from the conformance cases, the same data every implementation is tested against.</p>

<h2 id="embed">Without a build: &lt;parsons-puzzle&gt;</h2>
<p>
  For plain HTML pages and Reveal.js decks there is a custom element. One script tag, then a tag per puzzle.
  It works at any slide scale; the <a href={asset('demos/reveal/index.html')}>demo deck</a> shows check, reset and a
  solution revealed as a slide step.
</p>
<CopyBox text={embedSnippet} />

<h2 id="agent">Tell your agent</h2>
<p>Copy a prompt and fill in the parts in angle brackets.</p>
<div class="prompts">
  {#each prompts as [title, text] (title)}
    <div>
      <h3>{title}</h3>
      <CopyBox {text} />
    </div>
  {/each}
</div>

<style>
  .intro {
    padding: 40px 0 0;
  }
  .intro h1 {
    margin: 4px 0 12px;
    font-size: clamp(30px, 5vw, 42px);
  }
  .intro p:first-child {
    margin: 0;
    font: 13px var(--pz-font-mono);
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 18px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
    font-size: 15px;
  }
  .task {
    margin: 16px 0 12px;
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    margin: 0 0 14px;
    padding: 0;
    border: 0;
    font-size: 15px;
  }
  .options legend {
    float: left;
    margin-right: 8px;
    font-weight: 600;
  }
  .options label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .switch {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .switch button {
    font-weight: 500;
  }
  .switch button.on {
    border-color: var(--pz-primary);
    background: var(--pz-primary-soft);
    color: var(--pz-primary);
  }
  .examples {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 8px;
  }
  .examples h4 {
    margin: 0 0 10px;
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
  }
  pre {
    margin: 0;
    font: 12.5px/1.6 var(--pz-font-mono);
    white-space: pre;
    overflow-x: auto;
  }
  .right {
    color: var(--pz-success);
  }
  .wrong {
    color: var(--pz-danger);
  }
  td code.right {
    background: var(--pz-success-soft);
  }
  td code.wrong {
    background: var(--pz-danger-soft);
    color: var(--pz-danger);
  }
  .scores {
    display: flex;
    gap: 20px;
    margin: 12px 0 0;
  }
  .small {
    margin: 0 0 4px;
    font-size: 13px;
  }
  .prompts h3 {
    margin: 20px 0 8px;
    font-size: 16px;
  }
  table {
    margin: 8px 0;
  }
  @media (max-width: 640px) {
    .cols {
      grid-template-columns: minmax(0, 1fr);
    }
    table {
      display: block;
      overflow-x: auto;
    }
  }
</style>
