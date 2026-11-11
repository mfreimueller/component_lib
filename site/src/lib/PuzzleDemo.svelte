<!-- One puzzle in practice mode, built from the component exactly as a copy-in project would. -->
<script lang="ts">
  import {
    evaluateLines,
    evaluateTemplate,
    isTemplate,
    linePieces,
    LinePuzzleView,
    LineReview,
    templateSetup,
    TemplatePuzzleView,
    TemplateReview,
    type GapState,
    type LineScoring,
    type PlacedLine,
    type Puzzle,
  } from './parsons.ts';

  interface Props {
    puzzle: Puzzle;
    seed?: number;
    studentsIndent?: boolean;
    scoring?: LineScoring;
    numbered?: boolean;
  }
  let { puzzle, seed = 1, studentsIndent = false, scoring = 'position', numbered = false }: Props = $props();

  let phase = $state<'solving' | 'checked' | 'solution'>('solving');
  let round = $state(0);
  let placedLines = $state<PlacedLine[]>([]);
  let placedGaps = $state<GapState>({});

  const lineSetup = $derived(isTemplate(puzzle) ? undefined : linePieces(puzzle, seed, studentsIndent));
  const templateData = $derived(isTemplate(puzzle) ? templateSetup(puzzle, seed) : undefined);
  const lineOutcome = $derived(lineSetup && !isTemplate(puzzle) ? evaluateLines(puzzle.solution, lineSetup.lineOf, placedLines, scoring) : undefined);
  const templateOutcome = $derived(templateData && isTemplate(puzzle) ? evaluateTemplate(puzzle.template, templateData.textOf, placedGaps) : undefined);
  const percent = $derived(Math.round((lineOutcome ?? templateOutcome)?.percent ?? 0));

  function reset() {
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

<div class="demo">
  {#if phase === 'solving'}
    {#key round}
      {#if lineSetup}
        <LinePuzzleView pieces={lineSetup.pieces} placed={placedLines} {studentsIndent} {numbered} onchange={(p) => (placedLines = p)} />
      {:else if templateData}
        <TemplatePuzzleView lines={templateData.lines} pieces={templateData.tiles} placed={placedGaps} onchange={(g) => (placedGaps = g)} />
      {/if}
    {/key}
  {:else}
    <p class="score" role="status"><strong>{percent}%</strong>{percent === 100 ? ' · solved' : ''}</p>
    {#if lineOutcome && !isTemplate(puzzle)}
      <LineReview
        submission={lineOutcome.submission}
        solution={puzzle.solution}
        redHerrings={puzzle.redHerrings}
        showSolution={phase === 'solution'}
        {numbered}
      />
    {:else if templateOutcome && isTemplate(puzzle)}
      <TemplateReview lines={templateOutcome.lines} redHerrings={puzzle.redHerrings} showExpected={phase === 'solution'} />
    {/if}
  {/if}

  <div class="actions">
    {#if phase === 'solving'}
      <button type="button" class="primary" onclick={() => (phase = 'checked')}>Check</button>
    {:else}
      <button type="button" onclick={tryAgain}>Try again</button>
      {#if phase === 'checked'}<button type="button" onclick={() => (phase = 'solution')}>Show solution</button>{/if}
    {/if}
    <button type="button" onclick={reset}>Reset</button>
  </div>
</div>

<style>
  .demo {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .score {
    margin: 0;
    font-size: 15px;
  }
  .score strong {
    font-size: 22px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
