// @vitest-environment jsdom
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlacedLine } from '../core/types.ts';
import LinePuzzle from './LinePuzzle.svelte';
import LineReview from './LineReview.svelte';

const pieces = [
  { pieceId: 'p0', code: 'print(i)', indent: 1 },
  { pieceId: 'p1', code: 'for i in range(3):', indent: 0 },
];

let apps: Record<string, any>[] = [];
afterEach(() => {
  apps.forEach((a) => unmount(a));
  apps = [];
  document.body.innerHTML = '';
});

function setup(props: Record<string, unknown>) {
  const target = document.createElement('div');
  document.body.append(target);
  const onchange = vi.fn<(p: PlacedLine[]) => void>();
  apps.push(mount(LinePuzzle, { target, props: { pieces, onchange, ...props } }));
  flushSync();
  const zone = (id: string) => target.querySelector(`[data-testid="${id}"]`)!;
  const codes = (id: string) => [...zone(id).querySelectorAll('.code')].map((e) => e.textContent);
  const piece = (id: string, code: string) => [...zone(id).querySelectorAll<HTMLElement>('.piece')].find((p) => p.textContent!.includes(code))!;
  return { target, onchange, codes, piece };
}

describe('LinePuzzle', () => {
  it('moves pieces by click and reports the arrangement', () => {
    const { onchange, codes, piece } = setup({});
    expect(codes('pool')).toEqual(['print(i)', 'for i in range(3):']);
    piece('pool', 'for i').click();
    piece('pool', 'print').click();
    flushSync();
    expect(codes('solution')).toEqual(['for i in range(3):', 'print(i)']);
    expect(onchange).toHaveBeenLastCalledWith([{ pieceId: 'p1', indent: 0 }, { pieceId: 'p0', indent: 1 }]);
    piece('solution', 'for i').click();
    flushSync();
    expect(onchange).toHaveBeenLastCalledWith([{ pieceId: 'p0', indent: 1 }]);
  });

  it('places a piece only once when clicked twice in one task', () => {
    const { onchange, codes, piece } = setup({});
    const p = piece('pool', 'print');
    p.click();
    p.click();
    flushSync();
    expect(codes('solution')).toEqual(['print(i)']);
    expect(onchange).toHaveBeenLastCalledWith([{ pieceId: 'p0', indent: 1 }]);
  });

  it('moves pieces with Enter', () => {
    const { onchange, piece } = setup({});
    piece('pool', 'print').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onchange).toHaveBeenLastCalledWith([{ pieceId: 'p0', indent: 1 }]);
  });

  it('restores a saved arrangement', () => {
    const { codes } = setup({ placed: [{ pieceId: 'p1', indent: 0 }] });
    expect(codes('solution')).toEqual(['for i in range(3):']);
    expect(codes('pool')).toEqual(['print(i)']);
  });

  it('lets the solver indent when studentsIndent is on', () => {
    const flat = pieces.map(({ pieceId, code }) => ({ pieceId, code }));
    const { onchange, piece, target } = setup({ pieces: flat, studentsIndent: true });
    piece('pool', 'print').click();
    flushSync();
    target.querySelector<HTMLButtonElement>('button[aria-label="Indent more"]')!.click();
    expect(onchange).toHaveBeenLastCalledWith([{ pieceId: 'p0', indent: 1 }]);
    piece('solution', 'print').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', altKey: true, bubbles: true }));
    expect(onchange).toHaveBeenLastCalledWith([{ pieceId: 'p0', indent: 0 }]);
  });

  it('ignores input when disabled', () => {
    const { onchange, piece } = setup({ disabled: true });
    piece('pool', 'print').click();
    expect(onchange).not.toHaveBeenCalled();
  });

  it('uses custom labels', () => {
    const { target } = setup({ labels: { pool: 'Bausteine', left: (n: number) => `${n} übrig` } });
    expect(target.querySelector('h2')!.textContent).toBe('Bausteine');
    expect(target.querySelector('header span')!.textContent).toBe('2 übrig');
  });

  it('gives two instances different element ids', () => {
    const a = setup({});
    const b = setup({});
    expect(a.target.querySelector('h2')!.id).not.toBe(b.target.querySelector('h2')!.id);
  });
});

describe('LineReview', () => {
  it('marks lines and counts the right ones', () => {
    const target = document.createElement('div');
    apps.push(
      mount(LineReview, {
        target,
        props: {
          submission: [{ code: 'a', indent: 0, correct: true }, { code: 'x', indent: 0, correct: false }],
          solution: [{ code: 'a', indent: 0 }, { code: 'b', indent: 0 }],
          redHerrings: [{ code: 'x', indent: 0 }],
        },
      })
    );
    flushSync();
    expect(target.querySelector('.pill')!.textContent).toBe('1 of 2 correct');
    expect(target.querySelectorAll('li.right')).toHaveLength(1);
    expect(target.querySelectorAll('li.wrong')).toHaveLength(1);
    expect(target.querySelectorAll('li.herring')).toHaveLength(1);
  });
});
