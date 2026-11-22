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

/** Waits until every element matching the selector is fully shown and not shifted. */
async function expectSettled(page: Page, selector: string, timeout: number) {
  await expect.poll(() => page.evaluate((sel) =>
    Array.from(document.querySelectorAll(sel)).every((element) => {
      const style = getComputedStyle(element);
      return style.opacity === '1' && (style.transform === 'none' || style.transform === 'matrix(1, 0, 0, 1, 0, 0)');
    }), selector), { timeout }).toBe(true);
}

test.describe('opening sequence', () => {
  for (const route of ROUTES) {
    test(`/${route.path} ends fully visible within 1.2 s`, async ({ page }) => {
      await page.goto(route.path);
      expect(await page.locator('[data-intro]').count()).toBeGreaterThan(2);
      await expectSettled(page, '[data-intro]', 1200);
    });
  }

  test('the home page plays it: the heading starts hidden and rises', async ({ page }) => {
    await page.goto('', { waitUntil: 'commit' });
    await page.waitForSelector('html.motion-ready');
    const start = await page.locator('h1').evaluate((element) => Number(getComputedStyle(element).opacity));
    expect(start).toBeLessThan(1);
    await expectSettled(page, '[data-intro]', 1200);
  });

  test('does not wait for the photo: text is in place while the image still loads', async ({ page }) => {
    await page.route("**/_astro/hero.*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.continue();
    });
    await page.goto('', { waitUntil: 'domcontentloaded' });
    await expectSettled(page, '[data-intro="1"], [data-intro="2"]', 1200);
  });

  test('a home tile works when clicked straight after load', async ({ page }) => {
    await page.goto('', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /Akty prawne/ }).first().click();
    await expect(page).toHaveURL(/\/akty-prawne\/$/);
  });

  test('the phone link is on top and clickable straight after load', async ({ page }) => {
    await page.goto('kontakt/', { waitUntil: 'domcontentloaded' });
    const onTop = await page.locator('a[href^="tel:"]').first().evaluate((link) => {
      const box = link.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return hit === link || link.contains(hit);
    });
    expect(onTop).toBe(true);
  });

  test('switching theme during the intro ends visible in the new theme', async ({ page }) => {
    await page.goto('', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Jasny motyw' }).click();
    await expectSettled(page, '[data-intro]', 1500);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
