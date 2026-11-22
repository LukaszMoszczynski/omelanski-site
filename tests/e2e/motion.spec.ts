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
      // Not rendered at this width (e.g. desktop-only): nothing to see, nothing to check.
      if (element.getClientRects().length === 0) return true;
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

test.describe('scroll reveals', () => {
  for (const route of ROUTES) {
    test(`/${route.path}: scrolling to the bottom reveals everything`, async ({ page }) => {
      await page.goto(route.path);
      expect(await page.locator('[data-reveal]').count()).toBeGreaterThan(1);
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      const step = await page.evaluate(() => Math.round(innerHeight * 0.8));
      for (let top = 0; top <= height; top += step) {
        await page.evaluate((y) => window.scrollTo(0, y), top);
        await page.waitForTimeout(100);
      }
      await expectSettled(page, '[data-reveal]', 2000);
    });
  }

  test('elements start hidden below the fold and reveal when reached', async ({ page }) => {
    await page.goto('rodo/');
    await page.waitForSelector('html.motion-ready');
    const last = page.locator('[data-reveal]').last();
    const offscreen = await last.evaluate((element) => element.getBoundingClientRect().top > innerHeight);
    expect(offscreen).toBe(true);
    expect(Number(await last.evaluate((element) => getComputedStyle(element).opacity))).toBeLessThan(1);
    await last.scrollIntoViewIfNeeded();
    await expect.poll(() => last.evaluate((element) => getComputedStyle(element).opacity), { timeout: 1500 }).toBe('1');
  });

  test('jumping to the bottom at once still reveals what is on screen', async ({ page }) => {
    await page.goto('rodo/');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(800);
    const hidden = await page.evaluate(() => Array.from(document.querySelectorAll('[data-reveal]')).filter((element) => {
      const box = element.getBoundingClientRect();
      return box.bottom > 0 && box.top < innerHeight && getComputedStyle(element).opacity !== '1';
    }).length);
    expect(hidden).toBe(0);
  });

  test('arriving on /rodo/#cookies shows that section', async ({ page }) => {
    await page.goto('rodo/#cookies');
    const heading = page.getByRole('heading', { level: 2, name: 'Pliki cookies' });
    await expect(heading).toBeInViewport();
    await expect.poll(() => heading.evaluate((element) => getComputedStyle(element.closest('[data-reveal]') ?? element).opacity), { timeout: 1000 }).toBe('1');
  });

  test('the table of contents jump shows the target', async ({ page }) => {
    await page.goto('rodo/');
    await page.getByRole('navigation', { name: 'Spis treści' }).getByRole('link', { name: /Pliki cookies/ }).click();
    const heading = page.getByRole('heading', { level: 2, name: 'Pliki cookies' });
    await expect(heading).toBeInViewport();
    await expect.poll(() => heading.evaluate((element) => getComputedStyle(element.closest('[data-reveal]') ?? element).opacity), { timeout: 1500 }).toBe('1');
  });
});

test.describe('page changes', () => {
  test('the old page fades out before the new one comes in', async ({ page }) => {
    await page.goto('');
    await page.waitForSelector('html.motion-ready');
    await page.evaluate(() => {
      const main = document.querySelector('main')!;
      (window as any).__minOpacity = 1;
      const sample = () => {
        if (!main.isConnected) return;
        (window as any).__minOpacity = Math.min((window as any).__minOpacity, Number(getComputedStyle(main).opacity));
        requestAnimationFrame(sample);
      };
      sample();
    });
    await page.getByRole('contentinfo').getByRole('link', { name: 'Kontakt' }).click();
    await expect(page).toHaveURL(/\/kontakt\/$/);
    expect(await page.evaluate(() => (window as any).__minOpacity)).toBeLessThan(0.5);
  });

  test('the browser crossfade is off, GSAP does the change', async ({ page }) => {
    await page.goto('');
    const ruleOutsideMedia = await page.evaluate(() => Array.from(document.styleSheets).some((sheet) => {
      try {
        return Array.from(sheet.cssRules).some((rule) => rule instanceof CSSStyleRule
          && rule.selectorText.includes('::view-transition-old(root)') && rule.style.animationName === 'none');
      } catch { return false; }
    }));
    expect(ruleOutsideMedia).toBe(true);
  });

  test('client navigation ends with visible content, focus on h1 and no errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Kontakt' }).click();
    await expect(page).toHaveURL(/\/kontakt\/$/);
    await expectSettled(page, 'main, [data-intro]', 1500);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    expect(errors).toEqual([]);
  });

  test('back and forward leave content visible', async ({ page }) => {
    await page.goto('');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Oferta' }).click();
    await expect(page).toHaveURL(/\/oferta\/$/);
    await expectSettled(page, 'main, [data-intro]', 1500);
    // On back/forward the address changes before the page is fetched and swapped in,
    // so wait for the new heading, then give the opening sequence its usual time.
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(ROUTES[0].h1);
    await expectSettled(page, 'main, [data-intro]', 1200);
    await page.goForward();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Oferta');
    await expectSettled(page, 'main, [data-intro]', 1200);
  });

  test('clicking a link mid-intro does not leave the next page hidden or leak triggers', async ({ page }) => {
    await page.goto('rodo/');
    await page.waitForSelector('html.motion-ready');
    const fresh = await page.evaluate(() => window.__motionTriggerCount!());

    await page.goto('', { waitUntil: 'domcontentloaded' });
    await page.getByRole('contentinfo').getByRole('link', { name: /RODO/ }).click();
    await expect(page).toHaveURL(/\/rodo\/$/);
    await expectSettled(page, 'main, [data-intro]', 1500);
    expect(await page.evaluate(() => window.__motionTriggerCount!())).toBe(fresh);
  });
});
