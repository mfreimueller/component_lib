<!--
  parsons component: template puzzle (fixed code with gaps). Controlled: shows `lines`, the pool
  `pieces` and the `placed` gaps it starts with, reports every change through `onchange`, never
  scores. To load a different puzzle, re-create it (`{#key puzzleId}`).
  Needs svelte-dnd-action and theme.css. Docs: COMPONENT.md.
-->
<script lang="ts" module>
  export interface TemplatePuzzleLabels {
    code: string;
    pool: string;
    reusableHint: string;
    gap: (n: number) => string;
    takeBack: string;
    reusable: string;
    help: string;
  }

  export const templateLabelsEn: TemplatePuzzleLabels = {
    code: 'Code with gaps',
    pool: 'Pieces',
    reusableHint: '∞ can be used more than once',
    gap: (n) => `Gap ${n}`,
    takeBack: 'tap to take back',
    reusable: 'reusable',
    help:
      'Tap a gap to select it, then tap a piece to put it there. Tap a placed piece to take it back. Or drag pieces into ' +
      'the gaps. With a keyboard: focus a gap or piece, press Enter to place or return a piece, Space to pick it up and ' +
      'the arrow keys to move it, and Alt with the left or right arrow to reorder pieces inside a gap.',
  };
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import { dndzone, setKeyboardDragTrigger } from 'svelte-dnd-action';
  import {
    addToGap,
    initBoard,
    moveInGap,
    real,
    refillPool,
    removeFromGap,
    setGap,
    tidyPool,
    toGaps,
    type Board,
    type Chip,
  } from '../core/board.ts';
  import type { Segment } from '../core/template.ts';
  import type { GapState, Tile } from '../core/types.ts';

  interface Props {
    lines: Segment[][];
    pieces: Tile[];
    placed?: GapState;
    disabled?: boolean;
    labels?: Partial<TemplatePuzzleLabels>;
    onchange?: (gaps: GapState) => void;
  }
  let { lines, pieces, placed = {}, disabled = false, labels = {}, onchange }: Props = $props();
  const t = $derived({ ...templateLabelsEn, ...labels });

  // Unique per instance: element ids, and the drag type so chips cannot move between two puzzles.
  const uid = $props.id();

  const FLIP_MS = 120;
  const gapCount = untrack(() => 1 + Math.max(-1, ...lines.flat().map((s) => ('gap' in s ? s.gap : -1))));

  // Space picks a chip up for keyboard dragging; Enter is free to move it between pool and gap.
  setKeyboardDragTrigger('space');

  let board = $state<Board>(untrack(() => initBoard(pieces, gapCount, placed)));
  // The gap that receives a chip when the solver taps or presses Enter on a pool chip.
  let selected = $state(0);
  const hasReusable = $derived(pieces.some((p) => p.reusable));

  function commit(next: Board) {
    board = next;
    onchange?.(toGaps(next));
  }

  const considerPool = (e: CustomEvent<{ items: Chip[] }>) => (board = { ...board, pool: refillPool(board.pool, e.detail.items) });
  const finalizePool = (e: CustomEvent<{ items: Chip[] }>) => commit({ ...board, pool: tidyPool(e.detail.items) });
  const considerGap = (g: number, e: CustomEvent<{ items: Chip[] }>) => (board = setGap(board, g, e.detail.items));
  const finalizeGap = (g: number, e: CustomEvent<{ items: Chip[] }>) => commit(setGap(board, g, real(e.detail.items)));

  function place(chip: Chip) {
    if (!disabled) commit(addToGap(board, chip.id, selected));
  }

  function takeBack(g: number, chip: Chip) {
    if (!disabled) commit(removeFromGap(board, g, chip.id));
  }

  function onPoolKey(e: KeyboardEvent, chip: Chip) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    place(chip);
  }

  function onPlacedKey(e: KeyboardEvent, g: number, chip: Chip) {
    if (disabled) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      takeBack(g, chip);
    } else if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      commit(moveInGap(board, g, chip.id, e.key === 'ArrowRight' ? 1 : -1));
    }
  }

  const zone = (items: Chip[]) => ({
    items,
    flipDurationMs: FLIP_MS,
    type: `parsons-${uid}`,
    dragDisabled: disabled,
    delayTouchStart: true,
    dropTargetClasses: ['over'],
    dropTargetStyle: {},
  });
</script>

<div class="parsons-template" class:locked={disabled}>
  <p class="sr" id="{uid}-help">{t.help}</p>

  <div class="code" role="group" aria-label={t.code} aria-describedby="{uid}-help">
    {#each lines as line, n (n)}
      <div class="line">
        {#each line as seg, k (k)}
          {#if 'text' in seg}
            <span class="fixed">{seg.text}</span>
          {:else}
            {@const g = seg.gap}
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
            <span
              class="gap"
              class:selected={selected === g && !disabled}
              class:empty={board.gaps[g]?.length === 0}
              role="group"
              aria-label={t.gap(g + 1)}
              data-testid="gap-{g}"
              use:dndzone={zone(board.gaps[g] ?? [])}
              onconsider={(e) => considerGap(g, e)}
              onfinalize={(e) => finalizeGap(g, e)}
              onclick={() => (selected = g)}
              onfocusin={() => (selected = g)}
            >
              {#each board.gaps[g] ?? [] as chip (chip.id)}
                <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
                <span
                  class="chip placed"
                  aria-label="{chip.text}, {t.takeBack}"
                  onclick={(e) => {
                    e.stopPropagation();
                    selected = g;
                    takeBack(g, chip);
                  }}
                  onkeydown={(e) => onPlacedKey(e, g, chip)}>{chip.text}</span
                >
              {/each}
            </span>
          {/if}
        {/each}
        {#if line.length === 0}<span class="fixed">&nbsp;</span>{/if}
      </div>
    {/each}
  </div>

  <section class="pool-box" aria-labelledby="{uid}-pool">
    <header>
      <h2 id="{uid}-pool">{t.pool}</h2>
      {#if hasReusable}<span>{t.reusableHint}</span>{/if}
    </header>
    <div class="pool" aria-label={t.pool} data-testid="pool" use:dndzone={zone(board.pool)} onconsider={considerPool} onfinalize={finalizePool}>
      {#each board.pool as chip (chip.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <span
          class="chip"
          aria-label={chip.reusable ? `${chip.text}, ${t.reusable}` : chip.text}
          onclick={() => place(chip)}
          onkeydown={(e) => onPoolKey(e, chip)}
        >
          {chip.text}{#if chip.reusable}<span class="inf" aria-hidden="true">∞</span>{/if}
        </span>
      {/each}
    </div>
  </section>
</div>

<style>
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .parsons-template {
    display: flex;
    flex-direction: column;
    gap: 20px;
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
    gap: 6px;
    min-width: 64px;
    min-height: 36px;
    margin: 0 4px;
    padding: 2px 6px;
    border: 1px dashed var(--pz-border-strong);
    border-radius: var(--pz-radius);
    background: var(--pz-bg);
    line-height: 1.2;
  }
  .gap.selected {
    border-color: var(--pz-primary);
    background: var(--pz-primary-soft);
  }
  .gap :global(.over),
  .gap:global(.over),
  .pool:global(.over) {
    outline: 2px dashed var(--pz-primary);
    outline-offset: 2px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid var(--pz-border-strong);
    border-radius: var(--pz-radius);
    background: var(--pz-surface);
    font: var(--pz-font-size) var(--pz-font-mono);
    line-height: 1.2;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  .locked .chip {
    cursor: default;
  }
  .chip:focus-visible {
    outline: 2px solid var(--pz-primary);
  }
  .chip.placed {
    border-color: var(--pz-primary);
  }
  .inf {
    color: var(--pz-primary);
    font-weight: 700;
  }
  .pool-box {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px;
    border: 1px solid var(--pz-border);
    border-radius: var(--pz-radius-lg);
    background: var(--pz-surface);
  }
  .pool-box header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
  }
  h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }
  header span {
    color: var(--pz-text-muted);
    font-size: 12px;
  }
  .pool {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 52px;
    padding: 2px;
    border-radius: 10px;
  }
  @media (max-width: 700px) {
    .code {
      padding: 12px;
      font-size: 13px;
    }
    .chip,
    .gap {
      min-height: 44px;
    }
  }
</style>
