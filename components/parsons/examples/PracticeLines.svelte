<!-- COMPONENT.md §6.3 as a checked file: a line puzzle in practice mode with a Check button. -->
<script lang="ts">
  import { evaluateLines, linePieces, randomSeed, round2, type LinePuzzle as P, type PlacedLine } from '../core/index.ts';
  import LinePuzzle from '../svelte/LinePuzzle.svelte';
  import LineReview from '../svelte/LineReview.svelte';

  let { puzzle }: { puzzle: P } = $props();
  const seed = randomSeed();
  const setup = $derived(linePieces(puzzle, seed, true));
  let placed = $state<PlacedLine[]>([]);
  let checked = $state(false);
  const outcome = $derived(evaluateLines(puzzle.solution, setup.lineOf, placed));
</script>

{#if checked}
  <p>{round2(outcome.percent)}%</p>
  <LineReview submission={outcome.submission} solution={puzzle.solution} redHerrings={puzzle.redHerrings} />
{:else}
  <LinePuzzle pieces={setup.pieces} {placed} studentsIndent onchange={(p) => (placed = p)} />
  <button onclick={() => (checked = true)}>Check</button>
{/if}
