<!--
  parsons component: review of a line puzzle. Shows the solver's lines marked right or wrong and,
  unless `showSolution` is false, the solution and the red herrings. Build `submission` with
  core evaluateLines (practice) or get it from your server (exam). Needs theme.css.
-->
<script lang="ts" module>
  export interface LineReviewLabels {
    mine: string;
    solution: string;
    correctOf: (right: number, total: number) => string;
    correctAnswer: string;
    nothingPlaced: string;
    herrings: string;
    right: string;
    wrong: string;
  }

  export const lineReviewLabelsEn: LineReviewLabels = {
    mine: 'Your answer',
    solution: 'Solution',
    correctOf: (right, total) => `${right} of ${total} correct`,
    correctAnswer: 'Correct answer',
    nothingPlaced: 'No pieces placed.',
    herrings: 'Red herrings (not part of the solution)',
    right: 'correct',
    wrong: 'wrong',
  };
</script>

<script lang="ts">
  import type { Line } from '../core/types.ts';

  interface Props {
    submission: (Line & { correct: boolean })[];
    solution: Line[];
    redHerrings?: Line[];
    showSolution?: boolean;
    labels?: Partial<LineReviewLabels>;
  }
  let { submission, solution, redHerrings = [], showSolution = true, labels = {} }: Props = $props();
  // The component's own width (not the window's): right inside scaled hosts such as Reveal.js slides.
  let width = $state(0);
  const t = $derived({ ...lineReviewLabelsEn, ...labels });
  const uid = $props.id();
  const right = $derived(submission.filter((l) => l.correct).length);
  const tone = $derived(solution.length > 0 && right === solution.length ? 'ok' : right === 0 ? 'bad' : 'mid');
</script>

<div class="parsons-review" bind:clientWidth={width} class:narrow={width > 0 && width < 700}>
  <div class="panels" class:single={!showSolution}>
    <div class="panel" role="group" aria-labelledby="{uid}-mine">
      <header>
        <h3 id="{uid}-mine">{t.mine}</h3>
        <span class="pill {tone}">{t.correctOf(right, solution.length)}</span>
      </header>
      {#if submission.length === 0}
        <p class="empty">{t.nothingPlaced}</p>
      {:else}
        <ol>
          {#each submission as line, i (i)}
            <li class:right={line.correct} class:wrong={!line.correct}>
              <code style:padding-left="calc(var(--pz-indent) * {line.indent})">{line.code}</code>
              <span class="sr">{line.correct ? t.right : t.wrong}</span>
              <span aria-hidden="true" class="mark">{line.correct ? '✓' : '✕'}</span>
            </li>
          {/each}
        </ol>
      {/if}
    </div>

    {#if showSolution}
      <div class="panel" role="group" aria-labelledby="{uid}-solution">
        <header>
          <h3 id="{uid}-solution">{t.solution}</h3>
          <span class="pill ok">{t.correctAnswer}</span>
        </header>
        <ol>
          {#each solution as line, i (i)}
            <li><code style:padding-left="calc(var(--pz-indent) * {line.indent})">{line.code}</code></li>
          {/each}
        </ol>
        {#if redHerrings.length > 0}
          <h4>{t.herrings}</h4>
          <ul>
            {#each redHerrings as line, i (i)}
              <li class="herring"><code>{line.code}</code></li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .parsons-review {
    text-align: start;
    font-size: 14px;
    line-height: 1.4;
    color: var(--pz-text);
  }
  .panels {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
    align-items: start;
  }
  .panels.single {
    grid-template-columns: minmax(0, 1fr);
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px;
    border: 1px solid var(--pz-border);
    border-radius: var(--pz-radius-lg);
    background: var(--pz-surface);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .parsons-review h3 {
    margin: 0;
    font-family: inherit;
    line-height: 1.3;
    text-transform: none;
    letter-spacing: normal;
    text-shadow: none;
    color: inherit;
    font-size: 15px;
    font-weight: 600;
  }
  .parsons-review h4 {
    margin: 0;
    font-family: inherit;
    line-height: 1.3;
    text-transform: none;
    letter-spacing: normal;
    text-shadow: none;
    color: inherit;
    margin: 8px 0 0;
    color: var(--pz-text-muted);
    font-size: 12px;
    font-weight: 600;
  }
  .pill {
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }
  .pill.ok {
    background: var(--pz-success-soft);
    color: var(--pz-success);
  }
  .pill.mid {
    background: var(--pz-warn-soft);
    color: var(--pz-warn);
  }
  .pill.bad {
    background: var(--pz-danger-soft);
    color: var(--pz-danger);
  }
  .parsons-review ol,
  .parsons-review ul {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .parsons-review li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 40px;
    padding: 0 12px;
    border: 1px solid var(--pz-border-strong);
    border-radius: var(--pz-radius);
    background: var(--pz-surface);
    font: var(--pz-font-size) var(--pz-font-mono);
  }
  li.right {
    border-color: var(--pz-success);
    background: var(--pz-success-soft);
  }
  li.wrong {
    border-color: var(--pz-danger);
    background: var(--pz-danger-soft);
  }
  li.herring {
    border: 1px dashed var(--pz-warn);
    background: var(--pz-warn-soft);
  }
  .parsons-review code {
    min-width: 0;
    padding: 0;
    border-radius: 0;
    background: none;
    color: inherit;
    font: inherit;
    white-space: pre;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mark {
    font-weight: 700;
  }
  .right .mark {
    color: var(--pz-success);
  }
  .wrong .mark {
    color: var(--pz-danger);
  }
  .empty {
    margin: 0;
    padding: 12px;
    border: 1px dashed var(--pz-border-strong);
    border-radius: var(--pz-radius);
    color: var(--pz-text-muted);
    font-size: 13px;
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .narrow .panels {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
</style>
