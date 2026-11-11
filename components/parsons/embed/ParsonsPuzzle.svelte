<!--
  <parsons-puzzle>: the parsons component as a custom element, for pages without a Svelte build
  (e.g. Reveal.js decks). Practice mode: the page holds the whole puzzle and scores locally.

    <parsons-puzzle src="puzzles.json" index="0" check reveal-solution reset theme="light"></parsons-puzzle>

  Content: `src` (URL of a puzzle file) or an inline <script type="application/json"> child.
  Methods: check(), showSolution(), reset(). Events: `change` (detail: the arrangement),
  `check` (detail: { percent }). Docs: COMPONENT.md, SPEC.md §6a.
-->
<svelte:options
  customElement={{
    tag: 'parsons-puzzle',
    shadow: 'open',
    props: {
      src: { type: 'String' },
      index: { type: 'Number' },
      seed: { type: 'Number' },
      showCheck: { type: 'Boolean', attribute: 'check' },
      showSolutionButton: { type: 'Boolean', attribute: 'reveal-solution' },
      showReset: { type: 'Boolean', attribute: 'reset' },
      studentsIndent: { type: 'Boolean', attribute: 'students-indent' },
      theme: { type: 'String', reflect: true },
      labels: { type: 'Object' },
    },
  }}
/>

<script lang="ts" module>
  import themeCss from '../svelte/theme.css?raw';
  import { hostThemeCss } from './theme.ts';

  // The `theme` attribute pins light or dark tokens on one element (theme.css stays the only source).
  const themeSheet = new CSSStyleSheet();
  themeSheet.replaceSync(hostThemeCss(themeCss));

  export interface EmbedLabels {
    check: string;
    showSolution: string;
    tryAgain: string;
    reset: string;
    score: (percent: number) => string;
    loading: string;
    invalid: string;
  }

  export const embedLabelsEn: EmbedLabels = {
    check: 'Check',
    showSolution: 'Show solution',
    tryAgain: 'Try again',
    reset: 'Reset',
    score: (p) => `${p}%`,
    loading: 'Loading puzzle…',
    invalid: 'This puzzle file is not valid:',
  };
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import { evaluateLines, linePieces, type LineOutcome } from '../core/lines.ts';
  import { round2 } from '../core/score.ts';
  import { randomSeed } from '../core/shuffle.ts';
  import { evaluateTemplate, templateSetup, type TemplateOutcome } from '../core/template.ts';
  import { isTemplate, type GapState, type PlacedLine, type Puzzle } from '../core/types.ts';
  import { validatePuzzleFile, type Problem } from '../core/validate.ts';
  import LinePuzzle, { type LinePuzzleLabels } from '../svelte/LinePuzzle.svelte';
  import LineReview, { type LineReviewLabels } from '../svelte/LineReview.svelte';
  import TemplatePuzzle, { type TemplatePuzzleLabels } from '../svelte/TemplatePuzzle.svelte';
  import TemplateReview, { type TemplateReviewLabels } from '../svelte/TemplateReview.svelte';

  interface Labels {
    buttons?: Partial<EmbedLabels>;
    line?: Partial<LinePuzzleLabels>;
    lineReview?: Partial<LineReviewLabels>;
    template?: Partial<TemplatePuzzleLabels>;
    templateReview?: Partial<TemplateReviewLabels>;
  }

  interface Props {
    src?: string;
    index?: number;
    seed?: number;
    showCheck?: boolean;
    showSolutionButton?: boolean;
    showReset?: boolean;
    studentsIndent?: boolean;
    theme?: string;
    labels?: Labels;
  }
  let {
    src,
    index = 0,
    seed,
    showCheck = false,
    showSolutionButton = false,
    showReset = false,
    studentsIndent = false,
    theme,
    labels = {},
  }: Props = $props();

  const t = $derived({ ...embedLabelsEn, ...labels.buttons });
  const el = $host();
  $effect(() => {
    const root = el.shadowRoot;
    if (root && !root.adoptedStyleSheets.includes(themeSheet)) root.adoptedStyleSheets = [...root.adoptedStyleSheets, themeSheet];
  });

  let puzzle = $state<Puzzle | undefined>();
  let problems = $state<Problem[]>([]);
  let phase = $state<'solving' | 'checked' | 'solution'>('solving');
  let round = $state(0);
  let placedLines = $state<PlacedLine[]>([]);
  let placedGaps = $state<GapState>({});
  const shuffleSeed = $derived(seed ?? untrack(randomSeed));

  // Load the content: `src`, else an inline JSON script child.
  $effect(() => {
    const url = src;
    const which = index;
    let cancelled = false;
    (async () => {
      try {
        const inline = el.querySelector('script[type="application/json"]')?.textContent;
        const text = url ? await (await fetch(new URL(url, document.baseURI))).text() : inline;
        if (!text) throw new Error('No content: set src or add a <script type="application/json"> child.');
        const result = validatePuzzleFile(JSON.parse(text));
        if (cancelled) return;
        const chosen = result.file?.puzzles[which];
        problems = result.ok ? (chosen ? [] : [{ path: 'index', message: `no puzzle at index ${which}` }]) : result.problems;
        puzzle = chosen;
        // untrack: with inline content this runs synchronously inside the effect, and reset() reads `round`.
        untrack(reset);
      } catch (err) {
        if (!cancelled) problems = [{ path: src ?? 'content', message: (err as Error).message }];
      }
    })();
    return () => {
      cancelled = true;
    };
  });

  const lineSetup = $derived(puzzle && !isTemplate(puzzle) ? linePieces(puzzle, shuffleSeed, studentsIndent) : undefined);
  const templateData = $derived(puzzle && isTemplate(puzzle) ? templateSetup(puzzle, shuffleSeed) : undefined);

  const outcome = $derived.by((): LineOutcome | TemplateOutcome | undefined => {
    if (!puzzle || phase === 'solving') return undefined;
    if (isTemplate(puzzle)) return evaluateTemplate(puzzle.template, templateData!.textOf, placedGaps);
    return evaluateLines(puzzle.solution, lineSetup!.lineOf, placedLines);
  });

  function emit(type: string, detail: unknown) {
    el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  /** Scores the current arrangement and shows the review. Returns the rounded percentage. */
  export function check(): number | undefined {
    if (!puzzle) return undefined;
    phase = 'checked';
    const percent = round2(outcome!.percent);
    emit('check', { percent });
    return percent;
  }

  /** Shows the review with the solution (checks first if needed). */
  export function showSolution() {
    if (!puzzle) return;
    if (phase === 'solving') check();
    phase = 'solution';
  }

  /** Back to an empty puzzle. */
  export function reset() {
    phase = 'solving';
    placedLines = [];
    placedGaps = {};
    round++;
  }

  function tryAgain() {
    phase = 'solving';
    round++;
  }
</script>

<div class="embed">
  {#if problems.length > 0}
    <div class="problems" role="alert">
      <p>{t.invalid}</p>
      <ul>
        {#each problems as p, i (i)}<li><code>{p.path}</code>: {p.message}</li>{/each}
      </ul>
    </div>
  {:else if !puzzle}
    <p class="muted">{t.loading}</p>
  {:else}
    {#if phase === 'solving'}
      {#key round}
        {#if lineSetup}
          <LinePuzzle
            pieces={lineSetup.pieces}
            placed={placedLines}
            {studentsIndent}
            labels={labels.line}
            onchange={(p) => {
              placedLines = p;
              emit('change', { placed: p });
            }}
          />
        {:else if templateData}
          <TemplatePuzzle
            lines={templateData.lines}
            pieces={templateData.tiles}
            placed={placedGaps}
            labels={labels.template}
            onchange={(g) => {
              placedGaps = g;
              emit('change', { gaps: g });
            }}
          />
        {/if}
      {/key}
    {:else if outcome}
      <p class="score" role="status">{t.score(Math.round(outcome.percent))}</p>
      {#if 'submission' in outcome && !isTemplate(puzzle)}
        <LineReview
          submission={outcome.submission}
          solution={puzzle.solution}
          redHerrings={puzzle.redHerrings}
          showSolution={phase === 'solution'}
          labels={labels.lineReview}
        />
      {:else if 'lines' in outcome && isTemplate(puzzle)}
        <TemplateReview
          lines={outcome.lines}
          redHerrings={puzzle.redHerrings}
          showExpected={phase === 'solution'}
          labels={labels.templateReview}
        />
      {/if}
    {/if}

    {#if showCheck || showSolutionButton || showReset}
      <div class="actions">
        {#if phase === 'solving' && showCheck}<button type="button" class="primary" onclick={check}>{t.check}</button>{/if}
        {#if phase !== 'solving'}<button type="button" onclick={tryAgain}>{t.tryAgain}</button>{/if}
        {#if phase !== 'solution' && showSolutionButton}<button type="button" onclick={showSolution}>{t.showSolution}</button>{/if}
        {#if showReset}<button type="button" onclick={reset}>{t.reset}</button>{/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  :host {
    display: block;
    text-align: start;
  }
  .embed {
    display: flex;
    flex-direction: column;
    gap: 14px;
    color: var(--pz-text);
    font-family: system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.4;
  }
  .score {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
  }
  .muted {
    margin: 0;
    color: var(--pz-text-muted);
  }
  .problems {
    padding: 12px 16px;
    border: 1px solid var(--pz-danger);
    border-radius: var(--pz-radius);
    background: var(--pz-danger-soft);
    color: var(--pz-text);
  }
  .problems p,
  .problems ul {
    margin: 0;
  }
  .problems ul {
    padding-left: 18px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  button {
    min-height: 40px;
    padding: 0 16px;
    border: 1px solid var(--pz-border-strong);
    border-radius: var(--pz-radius);
    background: var(--pz-surface);
    color: var(--pz-text);
    font: 600 14px system-ui, sans-serif;
    cursor: pointer;
  }
  button.primary {
    border-color: var(--pz-primary);
    background: var(--pz-primary);
    color: #fff;
  }
  button:focus-visible {
    outline: 2px solid var(--pz-primary);
    outline-offset: 2px;
  }
</style>
