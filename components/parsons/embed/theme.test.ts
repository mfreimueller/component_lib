import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hostThemeCss } from './theme.ts';

const themeCss = readFileSync(new URL('../svelte/theme.css', import.meta.url), 'utf8');

describe('hostThemeCss', () => {
  const css = hostThemeCss(themeCss);

  it('gives light and dark host rules with every token', () => {
    const tokens = [...new Set(themeCss.match(/--pz-[a-z-]+(?=:)/g))];
    const [light, dark] = css.split(":host([theme='dark'])");
    for (const t of tokens) {
      expect(light).toContain(`${t}:`);
      expect(dark).toContain(`${t}:`);
    }
  });

  it('uses the dark values in the dark rule', () => {
    const dark = css.split(":host([theme='dark'])")[1]!;
    // The dark block comes after the light one, so its values win.
    expect(dark.lastIndexOf('--pz-bg: #121317')).toBeGreaterThan(dark.indexOf('--pz-bg: #f6f6f3'));
  });
});
