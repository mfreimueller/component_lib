// The one place the site reaches into ../components: the demos run the real component code.
export * from '../../../components/parsons/core/index.ts';
// The puzzle components get a suffix: the core already exports types named LinePuzzle and TemplatePuzzle.
export { default as LinePuzzleView } from '../../../components/parsons/svelte/LinePuzzle.svelte';
export { default as LineReview } from '../../../components/parsons/svelte/LineReview.svelte';
export { default as TemplatePuzzleView } from '../../../components/parsons/svelte/TemplatePuzzle.svelte';
export { default as TemplateReview } from '../../../components/parsons/svelte/TemplateReview.svelte';
export { default as examples } from '../../../components/parsons/examples/mixed.json';
export { default as scoreLines } from '../../../components/parsons/conformance/score-lines.json';
export { default as scoreTemplate } from '../../../components/parsons/conformance/score-template.json';
export { default as catalog } from '../../../catalog.json';
