<!--
  parsons component: review of a template puzzle. Shows every gap with what was placed (marked
  right or wrong) and, where it is not right, what was expected. Build `lines` with core
  evaluateTemplate (practice) or get them from your server (exam). Needs theme.css.
-->
<script lang="ts" module>
  export interface TemplateReviewLabels {
    code: string;
    expected: string;
    anyOrder: string;
    nothing: string;
    leaveEmpty: string;
    herrings: string;
    right: string;
    wrong: string;
  }

  export const templateReviewLabelsEn: TemplateReviewLabels = {
    code: 'Your answer with the solution',
    expected: 'expected',
    anyOrder: '(any order)',
    nothing: 'nothing',
    leaveEmpty: 'leave empty',
    herrings: 'Red herrings (not part of the solution):',
    right: 'correct',
    wrong: 'wrong',
  };
</script>

<script lang="ts">
  import type { ReviewSegment } from '../core/template.ts';

  interface Props {
    lines: ReviewSegment[][];
    redHerrings?: string[];
    /** false: only mark what was placed, do not show what was expected (and hide the red herrings). */
    showExpected?: boolean;
    labels?: Partial<TemplateReviewLabels>;
  }
  let { lines, redHerrings = [], showExpected = true, labels = {} }: Props = $props();
  // The component's own width (not the window's): right inside scaled hosts such as Reveal.js slides.
  let width = $state(0);
  const t = $derived({ ...templateReviewLabelsEn, ...labels });

  // A gap is right when everything in it is right and nothing is missing.
  const right = (seg: Extract<ReviewSegment, { gap: number }>) =>
    seg.submitted.length === seg.expected.length && seg.submitted.every((s) => s.correct);
</script>

<div class="parsons-template-review" bind:clientWidth={width} class:narrow={width > 0 && width < 700}>
  <div class="code" role="group" aria-label={t.code}>
    {#each lines as line, n (n)}
      <div class="line">
        {#each line as seg, k (k)}
          {#if 'text' in seg}
            <span class="fixed">{seg.text}</span>
          {:else}
            <span class="gap" class:right={right(seg)} class:wrong={!right(seg)}>
              <span class="sr">{right(seg) ? t.right : t.wrong}</span>
              <span class="mine">
                {#each seg.submitted as s, i (i)}
                  <span class="chip" class:ok={s.correct} class:bad={!s.correct}>{s.text}<b aria-hidden="true">{s.correct ? '✓' : '✕'}</b></span>
                {:else}
                  <span class="none">{t.nothing}</span>
                {/each}
              </span>
              {#if !right(seg) && showExpected}
                <span class="expected">
                  <span class="label">{t.expected}{seg.anyOrder ? ` ${t.anyOrder}` : ''}</span>
                  {#each seg.expected as e, i (i)}<span class="chip want">{e}</span>{:else}<span class="none">{t.leaveEmpty}</span>{/each}
                </span>
              {/if}
            </span>
          {/if}
        {/each}
        {#if line.length === 0}<span class="fixed">&nbsp;</span>{/if}
      </div>
    {/each}
  </div>

  {#if showExpected && redHerrings.length > 0}
    <p class="herrings">
      {t.herrings}
      {#each redHerrings as h, i (i)}<code>{h}</code>{i < redHerrings.length - 1 ? ', ' : ''}{/each}
    </p>
  {/if}
</div>

<style>
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .parsons-template-review {
    text-align: start;
    font-size: 14px;
    line-height: 1.4;
    color: var(--pz-text);
  }
  .code {
    padding: 20px;
    border: 1px solid var(--pz-border);
    border-radius: var(--pz-radius-lg);
    background: var(--pz-surface);
    font: 14px/2.4 var(--pz-font-mono);
    overflow-wrap: anywhere;
  }
  .line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    min-height: 2.4em;
  }
  .fixed {
    white-space: pre-wrap;
  }
  .gap {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    min-height: 36px;
    margin: 2px 4px;
    padding: 2px 6px;
    border: 1px solid var(--pz-border-strong);
    border-radius: var(--pz-radius);
    line-height: 1.2;
  }
  .gap.right {
    border-color: var(--pz-success);
    background: var(--pz-success-soft);
  }
  .gap.wrong {
    border-color: var(--pz-danger);
    background: var(--pz-danger-soft);
  }
  .mine,
  .expected {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .expected {
    padding-left: 8px;
    border-left: 1px solid var(--pz-border-strong);
  }
  .label {
    color: var(--pz-text-muted);
    font-family: inherit;
    font-size: 11px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    padding: 0 10px;
    border: 1px solid var(--pz-border-strong);
    border-radius: 6px;
    background: var(--pz-surface);
    font: var(--pz-font-size) var(--pz-font-mono);
  }
  .chip.ok {
    border-color: var(--pz-success);
    color: var(--pz-success);
  }
  .chip.bad {
    border-color: var(--pz-danger);
    color: var(--pz-danger);
  }
  .chip.want {
    border-style: dashed;
    color: var(--pz-text-muted);
  }
  .none {
    color: var(--pz-text-muted);
    font-size: 12px;
    font-style: italic;
  }
  .herrings {
    margin: 12px 0 0;
    color: var(--pz-text-muted);
    font-size: 13px;
  }
  .herrings code {
    padding: 0;
    background: none;
    color: inherit;
    font: var(--pz-font-size) var(--pz-font-mono);
  }
  .narrow .code {
    padding: 12px;
    font-size: 13px;
  }
</style>
