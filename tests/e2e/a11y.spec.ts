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

const TAB_CAP = 200;

for (const route of ROUTES) {
  test(`keyboard: every focusable element on /${route.path} shows a focus indicator`, async ({ page }) => {
    await page.goto(route.path);
    await page.evaluate(() => {
      (window as any).__focusIds = new WeakMap<Element, number>();
      (window as any).__focusCounter = 0;
    });

    type FocusInfo = {
      id: number;
      tag: string;
      text: string;
      href: string | null;
      outlineStyle: string;
      outlineWidth: string;
    };

    let firstId: number | null = null;
    let checked = 0;
    let steps = 0;

    while (steps < TAB_CAP) {
      steps++;
      await page.keyboard.press('Tab');
      const info: FocusInfo | null = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const w = window as any;
        let id = w.__focusIds.get(el);
        if (id === undefined) {
          id = w.__focusCounter++;
          w.__focusIds.set(el, id);
        }
        const s = getComputedStyle(el);
        return {
          id,
          tag: el.tagName.toLowerCase(),
          text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40),
          href: el.getAttribute('href'),
          outlineStyle: s.outlineStyle,
          outlineWidth: s.outlineWidth,
        };
      });

      if (!info) {
        // Landed on <body>. If we had already left it, the tab order has
        // wrapped all the way around the page — traversal is complete.
        if (firstId !== null) break;
        continue;
      }

      if (firstId === null) {
        firstId = info.id;
      } else if (info.id === firstId) {
        // Back to the first focused element — full circle, stop here.
        break;
      }

      checked++;
      const label = `${info.tag}${info.href ? ` [${info.href}]` : ''} "${info.text}"`;
      if (info.tag === 'iframe') {
        // Tabbing into the embedded Google map moves focus into the frame's own document,
        // so the <iframe> matches neither :focus nor :focus-within and no CSS of ours can
        // draw its ring — the browser draws it. Counted, but not asserted on.
        continue;
      }
      expect(info.outlineStyle, `${label} on /${route.path} has no focus-visible outline (outline-style: ${info.outlineStyle})`).not.toBe(
        'none',
      );
      expect(info.outlineWidth, `${label} on /${route.path} has a zero-width focus outline`).not.toBe('0px');
    }

    expect(steps, `keyboard traversal of /${route.path} did not complete within ${TAB_CAP} Tab presses`).toBeLessThan(TAB_CAP);
    expect(checked, `no focusable elements were found on /${route.path}`).toBeGreaterThan(0);
    console.log(`keyboard traversal /${route.path || ''}: ${checked} focusable elements checked`);
  });
}
