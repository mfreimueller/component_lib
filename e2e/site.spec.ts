import { expect, test, type Page } from '@playwright/test';

/** Paced drag: the drag library checks the pointer on a timer, so jumps and instant releases miss. */
async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= 30; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / 30, from.y + ((to.y - from.y) * i) / 30);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(250);
  await page.mouse.up();
}
const centre = (b: { x: number; y: number; width: number; height: number }) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

test('home links to the component page', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Components for agents');
  await page.locator('.card').first().click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Parsons puzzle');
});

test('line demo: solve by click and keyboard, check gives 100%', async ({ page }) => {
  await page.goto('components/parsons/');
  const demo = page.locator('#lines ~ .panel').first();
  const piece = (code: string) =>
    demo.locator('[data-testid=pool] .piece').filter({ has: page.locator('.code', { hasText: new RegExp(`^${code.replace(/[()+]/g, '\\$&')}$`) }) });
  await piece('n = int(input())').click();
  await piece('total = 0').click();
  await piece('for i in range(1, n + 1):').click();
  // Keyboard: Enter moves the focused piece into the solution.
  await piece('total += i').locator('.grip').focus();
  await page.keyboard.press('Enter');
  await demo.locator('[data-testid=solution] .piece').last().getByRole('button', { name: 'Indent more' }).click();
  await piece('print(total)').click();
  await demo.getByRole('button', { name: 'Check' }).click();
  await expect(demo.locator('.score')).toContainText('100%');
});

test('template demo: a chip can be dragged into a gap', async ({ page }) => {
  await page.goto('components/parsons/#template');
  const demo = page.locator('#template ~ .panel').first();
  const gap = demo.locator('[data-testid=gap-0]');
  await gap.scrollIntoViewIfNeeded();
  const chip = demo.locator('[data-testid=pool] .chip', { hasText: /^SELECT/ });
  await page.evaluate(() => window.scrollBy(0, 200));
  await drag(page, centre((await chip.boundingBox())!), centre((await gap.boundingBox())!));
  await expect(gap.locator('.chip')).toHaveText(['SELECT']);
});

test('playground shows JSON and validation errors', async ({ page }) => {
  await page.goto('components/parsons/');
  const editor = page.locator('#pg-json');
  await editor.fill('{ "puzzles": [ }');
  await expect(page.getByText('Not valid JSON.')).toBeVisible();
  await expect(page.locator('.playground .bad')).toContainText('Line 1, column 16');
  await editor.fill('{ "puzzles": [ { "title": "", "solution": [] } ] }');
  await expect(page.locator('.playground .bad')).toContainText('puzzles.0.title');
  await page.getByRole('button', { name: 'Restore example' }).click();
  await expect(page.locator('.playground [data-testid=pool]').first()).toBeVisible();
});

test('the Reveal.js demo deck loads the embed', async ({ page }) => {
  await page.goto('demos/reveal/index.html#/1');
  const puzzle = page.locator('parsons-puzzle#sum');
  await expect(puzzle.locator('[data-testid=pool] .piece')).toHaveCount(6);
  await expect(puzzle.getByRole('button', { name: 'Check' })).toBeVisible();
});
