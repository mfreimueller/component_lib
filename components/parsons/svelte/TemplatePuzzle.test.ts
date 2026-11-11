// @vitest-environment jsdom
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { evaluateTemplate, templateSetup } from '../core/template.ts';
import type { GapState, TemplatePuzzle as Puzzle } from '../core/types.ts';
import TemplatePuzzle from './TemplatePuzzle.svelte';
import TemplateReview from './TemplateReview.svelte';

const puzzle: Puzzle = {
  kind: 'template',
  title: 'T',
  description: '',
  template: '{{SELECT}} {{a}}\n{{SELECT}} {{b}}',
  redHerrings: ['x'],
  reusable: ['SELECT'],
};
const setup = templateSetup(puzzle, 3);
const idOf = (text: string) => setup.tiles.find((t) => t.text === text)!.pieceId;

let apps: Record<string, any>[] = [];
afterEach(() => {
  apps.forEach((a) => unmount(a));
  apps = [];
});

function render(props: Record<string, unknown> = {}) {
  const target = document.createElement('div');
  const onchange = vi.fn<(g: GapState) => void>();
  apps.push(mount(TemplatePuzzle, { target, props: { lines: setup.lines, pieces: setup.tiles, onchange, ...props } }));
  flushSync();
  const chip = (text: string) => [...target.querySelectorAll<HTMLElement>('[data-testid="pool"] .chip')].find((c) => c.textContent!.trim().startsWith(text))!;
  const gap = (g: number) => target.querySelector<HTMLElement>(`[data-testid="gap-${g}"]`)!;
  const click = (el: HTMLElement) => {
    el.click();
    flushSync();
  };
  return { target, onchange, chip, gap, click };
}

describe('TemplatePuzzle', () => {
  it('places chips into the selected gap by click; reusable chips stay in the pool', () => {
    const { onchange, chip, gap, click } = render();
    click(chip('SELECT'));
    click(chip('a'));
    click(gap(1));
    click(chip('SELECT'));
    click(chip('b'));
    expect(onchange).toHaveBeenLastCalledWith({ '0': [idOf('SELECT'), idOf('a')], '1': [idOf('SELECT'), idOf('b')] });
    expect(chip('SELECT')).toBeDefined();
    expect(chip('a')).toBeUndefined();
  });

  it('takes a chip back by click', () => {
    const { onchange, gap, click } = render({ placed: { '0': [idOf('a')] } });
    click(gap(0).querySelector<HTMLElement>('.chip')!);
    expect(onchange).toHaveBeenLastCalledWith({});
  });

  it('reorders inside a gap with Alt+arrow', () => {
    const { onchange, gap } = render({ placed: { '0': [idOf('a'), idOf('SELECT')] } });
    gap(0).querySelector('.chip')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true }));
    expect(onchange).toHaveBeenLastCalledWith({ '0': [idOf('SELECT'), idOf('a')] });
  });

  it('ignores clicks when disabled', () => {
    const { onchange, chip, click } = render({ disabled: true });
    click(chip('a'));
    expect(onchange).not.toHaveBeenCalled();
  });

  it('only shows the reusable hint when there are reusable pieces', () => {
    expect(render().target.querySelector('header span')).not.toBeNull();
    const plain = templateSetup({ ...puzzle, reusable: [], template: '{{a}}' }, 1);
    expect(render({ lines: plain.lines, pieces: plain.tiles }).target.querySelector('header span')).toBeNull();
  });
});

describe('TemplateReview', () => {
  it('marks gaps and shows what was expected where wrong', () => {
    const { lines } = evaluateTemplate(puzzle.template, setup.textOf, { '0': [idOf('SELECT'), idOf('a')], '1': [idOf('x')] });
    const target = document.createElement('div');
    apps.push(mount(TemplateReview, { target, props: { lines, redHerrings: ['x'] } }));
    flushSync();
    expect(target.querySelectorAll('.gap.right')).toHaveLength(1);
    expect(target.querySelectorAll('.gap.wrong')).toHaveLength(1);
    expect([...target.querySelectorAll('.chip.want')].map((c) => c.textContent)).toEqual(['SELECT', 'b']);
    expect(target.querySelector('.herrings code')!.textContent).toBe('x');
  });
});
