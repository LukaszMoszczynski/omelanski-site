import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ROUTES } from './routes';

test.use({ reducedMotion: 'reduce' });

for (const theme of ['dark', 'light'] as const) {
  for (const route of ROUTES) {
    test(`axe: /${route.path} (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
      await page.goto(route.path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
}

test('axe: mobile menu open', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile only');
  await page.goto('');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const results = await new AxeBuilder({ page }).include('#mobile-menu').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('keyboard: every interactive element on home shows a focus indicator', async ({ page }) => {
  await page.goto('');
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return 'none';
      const s = getComputedStyle(el);
      return s.outlineStyle === 'none' ? 'none' : s.outlineWidth;
    });
    expect(outline).not.toBe('none');
  }
});
