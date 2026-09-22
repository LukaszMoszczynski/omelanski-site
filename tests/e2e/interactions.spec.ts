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
    // One screen down, but not as far as the footer: the button steps aside there.
    await page.evaluate(() => window.scrollTo(0, window.innerHeight + 200));
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
    test(`/${path} embeds the Google map`, async ({ page }) => {
      await page.goto(path);
      const frame = page.locator('iframe.map__frame');
      await expect(frame).toHaveCount(1);
      await expect(frame).toHaveAttribute('src', /google\.com\/maps\/embed/);
      // Titled for screen readers, and deferred so it never blocks first paint.
      await expect(frame).toHaveAttribute('title', /Mapa Google/);
      await expect(frame).toHaveAttribute('loading', 'lazy');
      await expect(page.getByRole('link', { name: /Pokaż na mapie Google/ })).toHaveAttribute(
        'href',
        /google\.com\/maps/,
      );
    });
  }

  test('the map looks the same on the home page and on Kontakt', async ({ page }) => {
    // Below ~200px Google switches to a compact map (short "Mapy" button, no
    // fullscreen/satellite controls), so both pages must use the same size.
    const heights: number[] = [];
    for (const path of ['', 'kontakt/']) {
      await page.goto(path);
      const box = await page.locator('iframe.map__frame').boundingBox();
      heights.push(Math.round(box!.height));
    }
    expect(heights[0]).toBe(heights[1]);
    expect(heights[0]).toBeGreaterThanOrEqual(170);
  });

  test('RODO says the Google map may set cookies', async ({ page }) => {
    await page.goto('rodo/');
    await expect(page.getByText(/mapa Google Maps/)).toBeVisible();
    await expect(page.getByText(/nie używa własnych plików cookies/)).toBeVisible();
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
