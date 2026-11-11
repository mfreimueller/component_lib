<!-- Edit a puzzle file and see it live. Invalid JSON shows where; invalid content shows the validator's problems. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { validatePuzzleFile, type Problem, type Puzzle } from './parsons.ts';
  import { jsonErrorAt } from './json-error.ts';
  import PuzzleDemo from './PuzzleDemo.svelte';

  let { initial }: { initial: string } = $props();

  let text = $state(untrack(() => initial));
  let debounced = $state(untrack(() => initial));
  let index = $state(0);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function onInput() {
    clearTimeout(timer);
    timer = setTimeout(() => (debounced = text), 300);
  }

  const result = $derived.by((): { error?: string; problems: Problem[]; warnings: Problem[]; puzzles: Puzzle[] } => {
    let data: unknown;
    try {
      data = JSON.parse(debounced);
    } catch (err) {
      const at = jsonErrorAt(debounced);
      const error = at ? `Line ${at.line}, column ${at.column}.` : (err as Error).message;
      return { error, problems: [], warnings: [], puzzles: [] };
    }
    const r = validatePuzzleFile(data);
    return { problems: r.problems, warnings: r.warnings, puzzles: r.file?.puzzles ?? [] };
  });

  const current = $derived(result.puzzles[Math.min(index, result.puzzles.length - 1)]);
</script>

<div class="playground">
  <div class="editor">
    <label for="pg-json">Puzzle file (JSON)</label>
    <textarea id="pg-json" bind:value={text} oninput={onInput} spellcheck="false" wrap="off" rows="22"></textarea>
    <div class="row">
      <button type="button" onclick={() => ((text = initial), (debounced = initial), (index = 0))}>Restore example</button>
    </div>
  </div>

  <div class="output" aria-live="polite">
    {#if result.error}
      <p class="bad"><strong>Not valid JSON.</strong> {result.error}</p>
    {:else if result.problems.length > 0}
      <div class="bad">
        <p><strong>The file has problems:</strong></p>
        <ul>
          {#each result.problems as p, i (i)}<li><code>{p.path}</code>: {p.message}</li>{/each}
        </ul>
      </div>
    {:else}
      {#if result.warnings.length > 0}
        <ul class="warn">
          {#each result.warnings as w, i (i)}<li><code>{w.path}</code>: {w.message}</li>{/each}
        </ul>
      {/if}
      {#if result.puzzles.length > 1}
        <div class="tabs" role="tablist" aria-label="Puzzles in the file">
          {#each result.puzzles as p, i (i)}
            <button type="button" role="tab" aria-selected={i === index} class:on={i === index} onclick={() => (index = i)}>{i + 1}. {p.title}</button>
          {/each}
        </div>
      {/if}
      {#if current}
        <p class="muted">{current.description}</p>
        {#key debounced + index}
          <PuzzleDemo puzzle={current} seed={7} />
        {/key}
      {/if}
    {/if}
  </div>
</div>

<style>
  .playground {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: 20px;
    align-items: start;
  }
  .editor {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  label {
    font-size: 14px;
    font-weight: 600;
  }
  textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--pz-border-strong);
    border-radius: var(--pz-radius);
    background: var(--code-bg);
    color: var(--code-text);
    font: 12.5px/1.5 var(--pz-font-mono);
    resize: vertical;
    tab-size: 2;
  }
  .row {
    display: flex;
    gap: 8px;
  }
  .output {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .bad,
  .warn {
    margin: 0;
    padding: 12px 16px;
    border-radius: var(--pz-radius);
    font-size: 14px;
  }
  .bad {
    border: 1px solid var(--pz-danger);
    background: var(--pz-danger-soft);
  }
  .bad ul {
    margin: 0;
    padding-left: 18px;
  }
  .warn {
    border: 1px solid var(--pz-warn);
    background: var(--pz-warn-soft);
    padding-left: 34px;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tabs button {
    min-height: 34px;
    font-weight: 500;
  }
  .tabs button.on {
    border-color: var(--pz-primary);
    background: var(--pz-primary-soft);
    color: var(--pz-primary);
  }
  @media (max-width: 860px) {
    .playground {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
