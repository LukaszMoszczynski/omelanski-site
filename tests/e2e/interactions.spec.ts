import { expect, test } from '@playwright/test';
import { ROUTES } from './routes';

test.describe('duty tabs', () => {
  test('switching tabs does not change the section height', async ({ page }) => {
    await page.goto('');
    const panels = page.locator('tabs-widget');
    await expect(page.getByRole('tabpanel', { name: 'Prawo' })).toBeVisible();
    const first = (await panels.boundingBox())!.height;
    for (const name of ['Księgowość', 'Administracja', 'Technika']) {
      await page.getByRole('tab', { name }).click();
      await expect(page.getByRole('tabpanel', { name })).toBeVisible();
      const height = (await panels.boundingBox())!.height;
      expect(Math.abs(height - first)).toBeLessThanOrEqual(1);
    }
  });

  test('items in a panel line up in equal rows', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'two columns only on desktop');
    await page.goto('');
    const items = page.getByRole('tabpanel', { name: 'Prawo' }).getByRole('listitem');
    const boxes = await items.evaluateAll((nodes) =>
      nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return { top: Math.round(r.top), height: Math.round(r.height) };
      }),
    );
    // Items 1 and 2 share a row, 3 and 4 the next, and so on: same top and height.
    for (let i = 0; i < boxes.length; i += 2) {
      expect(boxes[i].top).toBe(boxes[i + 1].top);
      expect(boxes[i].height).toBe(boxes[i + 1].height);
    }
  });
});

test.describe('back to top', () => {
  test('appears after scrolling and returns to the top', async ({ page }) => {
    await page.goto('');
    const button = page.getByRole('button', { name: 'Do góry' });
    await expect(button).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
    await expect(button).toBeVisible();
    await button.click();
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBe(0);
    await expect(button).toBeHidden();
  });

  test('is reachable by keyboard and has a visible focus ring', async ({ page }) => {
    // RODO is the longest page, so there is always more than one screen to scroll.
    await page.goto('rodo/');
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
    const button = page.getByRole('button', { name: 'Do góry' });
    await expect(button).toBeVisible();
    await button.focus();
    const outline = await button.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });
});

test.describe('in-page anchors', () => {
  test('RODO table of contents scrolls smoothly', async ({ page }) => {
    await page.goto('rodo/');
    const behaviour = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
    expect(behaviour).toBe('smooth');
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('smooth scrolling is turned off', async ({ page }) => {
      await page.goto('rodo/');
      const behaviour = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
      expect(behaviour).toBe('auto');
    });
  });
});

test.describe('office map', () => {
  for (const path of ['', 'kontakt/']) {
    test(`/${path} shows the map picture with attribution`, async ({ page }) => {
      await page.goto(path);
      const map = page.getByRole('img', { name: /Mapa/ });
      await expect(map).toBeVisible();
      // A real raster picture, not the old striped placeholder.
      const loaded = await map.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
      expect(loaded).toBe(true);
      await expect(page.getByRole('link', { name: /Pokaż na mapie Google/ })).toHaveAttribute(
        'href',
        /google\.com\/maps/,
      );
      await expect(page.getByRole('link', { name: /OpenStreetMap/ })).toHaveAttribute(
        'href',
        'https://www.openstreetmap.org/copyright',
      );
    });
  }

  test('the map is served from our own server', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      const host = new URL(request.url()).host;
      if (!host.startsWith('localhost') && !host.startsWith('127.0.0.1')) external.push(request.url());
    });
    await page.goto('kontakt/');
    await page.waitForLoadState('networkidle');
    expect(external).toEqual([]);
  });
});

test.describe('every page', () => {
  for (const route of ROUTES) {
    test(`/${route.path} has no horizontal overflow`, async ({ page }) => {
      await page.goto(route.path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
