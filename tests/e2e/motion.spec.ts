import { expect, test, type Page } from '@playwright/test';
import { ROUTES } from './routes';

const MARKED = '[data-intro], [data-reveal]';

/** Opacity of every element that takes part in the motion. */
function markedOpacities(page: Page) {
  return page.evaluate((selector) =>
    Array.from(document.querySelectorAll(selector)).map((element) => getComputedStyle(element).opacity), MARKED);
}

test.describe('safety', () => {
  test('every page that animates has marked elements', async ({ page }) => {
    for (const path of ['', 'kontakt/', 'rodo/']) {
      await page.goto(path);
      expect(await page.locator(MARKED).count(), `/${path}`).toBeGreaterThan(0);
    }
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    for (const route of ROUTES) {
      test(`/${route.path} shows every element`, async ({ page }) => {
        await page.goto(route.path);
        await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/);
        for (const opacity of await markedOpacities(page)) expect(opacity).toBe('1');
      });
    }
  });

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    for (const route of ROUTES) {
      test(`/${route.path} hides nothing at any time`, async ({ page }) => {
        await page.goto(route.path, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/);
        for (const opacity of await markedOpacities(page)) expect(opacity).toBe('1');
      });
    }
  });

  test('if the motion script never loads, content appears within 2.5 s', async ({ page }) => {
    await page.route('**/_astro/*.js', (route) => route.abort());
    await page.goto('');
    await expect(page.locator('html')).toHaveClass(/\bmotion\b/);
    await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/, { timeout: 2500 });
    for (const opacity of await markedOpacities(page)) expect(opacity).toBe('1');
  });

  test('printing shows every element, scrolled to or not', async ({ page }) => {
    await page.goto('rodo/');
    await page.emulateMedia({ media: 'print' });
    for (const opacity of await markedOpacities(page)) expect(opacity).toBe('1');
  });
});
