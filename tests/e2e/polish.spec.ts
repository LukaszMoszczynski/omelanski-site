import { expect, test, type Page } from '@playwright/test';

const settled = (page: Page, selector: string) => page.evaluate((sel) =>
  Array.from(document.querySelectorAll(sel)).every((element) => {
    const style = getComputedStyle(element);
    return style.opacity === '1' && (style.transform === 'none' || style.transform === 'matrix(1, 0, 0, 1, 0, 0)');
  }), selector);

test('a PDF opens in a new tab, the site stays where it was', async ({ page, context }) => {
  await page.goto('akty-prawne/');
  const link = page.locator('a.act__pdf').first();
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toContainText('otwiera się w nowej karcie');
  const popup = context.waitForEvent('page');
  await link.click();
  await popup;
  await expect(page).toHaveURL(/\/akty-prawne\/$/);
  await expect.poll(() => page.locator('main').evaluate((main) => getComputedStyle(main).opacity)).toBe('1');
});

test('returning to the home page plays a short version, not the whole opening', async ({ page }) => {
  await page.goto('');
  await page.waitForSelector('html.motion-ready');
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelector<HTMLAnchorElement>('footer a[href="/kontakt/"]')!.click());
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kontakt');
  await page.waitForTimeout(800);
  await page.evaluate(() => document.querySelector<HTMLAnchorElement>('footer a[href="/"]')!.click());
  await page.waitForFunction(() => document.querySelector('.tiles'));
  const started = Date.now();
  await expect.poll(() => settled(page, '[data-intro]'), { timeout: 1000, intervals: [25] }).toBe(true);
  // The entrance on return is meant to be seen, but done within a second.
  expect(Date.now() - started).toBeLessThan(1000);
});

test.describe('tabs', () => {
  test('switching tabs brings the items in one after another', async ({ page }) => {
    await page.goto('');
    await page.waitForSelector('html.motion-ready');
    await page.getByRole('tab').nth(1).click();
    const panel = page.locator('[role="tabpanel"]:not([inert])');
    const last = await panel.locator('li').last().evaluate((item) => Number(getComputedStyle(item).opacity));
    expect(last).toBeLessThan(1);
    await expect.poll(() => panel.locator('li').evaluateAll((items) => items.every((item) => getComputedStyle(item).opacity === '1')), { timeout: 1500, intervals: [50] }).toBe(true);
  });
});

test.describe('hovers', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover needs a mouse');
  });

  test('hero buttons fill with colour sweeping in from the left', async ({ page }) => {
    await page.goto('');
    await page.waitForTimeout(1200);
    const button = page.locator('.hero .btn--soft');
    // Horizontal offset of the fill: far left (hidden) at rest, in place on hover.
    const offset = () => button.evaluate((element) => new DOMMatrix(getComputedStyle(element, '::before').transform).e);
    const width = (await button.boundingBox())!.width;
    expect(await offset()).toBeLessThan(-width);
    await button.hover();
    await expect.poll(offset, { timeout: 1200 }).toBeGreaterThan(-1);
  });

  test('a contact card lifts and its arrow moves on', async ({ page }) => {
    await page.goto('kontakt/');
    await page.waitForTimeout(1200);
    const card = page.locator('.card').nth(1);
    const arrow = card.locator('.card__arrow');
    await card.hover();
    await expect.poll(() => arrow.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).e), { timeout: 1000 }).toBeGreaterThan(2);
    await expect.poll(() => card.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).f), { timeout: 1000 }).toBeLessThan(-1);
  });

  test('an after-hours row gets a background and a blue number', async ({ page }) => {
    await page.goto('kontakt/');
    await page.waitForTimeout(1200);
    const row = page.locator('.after a').first();
    const before = await row.evaluate((element) => new DOMMatrix(getComputedStyle(element, '::before').transform).a);
    await row.hover();
    await expect.poll(() => row.evaluate((element) => new DOMMatrix(getComputedStyle(element, '::before').transform).a), { timeout: 1000 }).toBeGreaterThan(0.95);
    expect(before).toBeLessThan(0.05);
  });

  test('an inactive tab reacts to the mouse', async ({ page }) => {
    await page.goto('');
    await page.waitForTimeout(1200);
    const tab = page.getByRole('tab').nth(2);
    const colour = () => tab.evaluate((element) => getComputedStyle(element).backgroundColor);
    const rest = await colour();
    await tab.hover();
    await expect.poll(colour, { timeout: 1000 }).not.toBe(rest);
  });
});

test.describe('round 2', () => {
  test('hero buttons stay in place on hover', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover needs a mouse');
    await page.goto('');
    await page.waitForTimeout(1200);
    for (const selector of ['.hero .btn--soft', '.hero .btn--ghost']) {
      const button = page.locator(selector);
      const before = (await button.boundingBox())!;
      await button.hover();
      await page.waitForTimeout(450);
      const after = (await button.boundingBox())!;
      expect(Math.abs(after.y - before.y), selector).toBeLessThan(0.5);
      expect(Math.abs(after.width - before.width), selector).toBeLessThan(0.5);
    }
  });

  test('after-hours numbers keep their weight and width on hover', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover needs a mouse');
    await page.goto('kontakt/');
    await page.waitForTimeout(1200);
    const number = page.locator('.after__num').first();
    const before = await number.evaluate((element) => [getComputedStyle(element).fontWeight, element.getBoundingClientRect().width]);
    await page.locator('.after a').first().hover();
    await page.waitForTimeout(450);
    const after = await number.evaluate((element) => [getComputedStyle(element).fontWeight, element.getBoundingClientRect().width]);
    expect(after).toEqual(before);
  });

  test('the first page opening does not wait for scripts', async ({ page }) => {
    await page.route('**/_astro/*.js', (route) => route.abort());
    await page.goto('', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.locator('h1').evaluate((element) => getComputedStyle(element).opacity), { timeout: 1200, intervals: [50] }).toBe('1');
  });

  test('only the shared, cached stylesheet blocks the first paint', async ({ page }) => {
    await page.goto('');
    expect(await page.locator('link[rel="stylesheet"]').count()).toBeLessThanOrEqual(1);
  });

  test('the footer logo link is named by what it shows', async ({ page }) => {
    await page.goto('');
    const link = page.locator('footer a.footer__brand-link');
    const name = await link.evaluate((element) => element.getAttribute('aria-label') ?? element.textContent ?? '');
    const visible = (await link.innerText()).replace(/\s+/g, ' ').trim().toLowerCase();
    expect(visible.length).toBeGreaterThan(0);
    expect(name.replace(/\s+/g, ' ').trim().toLowerCase()).toContain(visible);
  });

  test('tab content comes in clearly, not in a blink', async ({ page }) => {
    await page.goto('');
    await page.waitForSelector('html.motion-ready');
    await page.getByRole('tab').nth(2).click();
    await page.waitForTimeout(300);
    const items = page.locator('[role="tabpanel"]:not([inert]) li');
    const third = await items.nth(2).evaluate((item) => Number(getComputedStyle(item).opacity));
    expect(third).toBeLessThan(0.8);
    await expect.poll(() => items.evaluateAll((all) => all.every((item) => getComputedStyle(item).opacity === '1')), { timeout: 1500 }).toBe(true);
  });
});

test('the hero photo is requested early, at high priority', async ({ page }) => {
  await page.goto('');
  const preloads = await page.locator('link[rel="preload"][as="image"]').evaluateAll((links) =>
    links.map((link) => [link.getAttribute('href'), link.getAttribute('media'), link.getAttribute('fetchpriority')]));
  expect(preloads).toHaveLength(2);
  for (const [href, , priority] of preloads) {
    expect(href).toMatch(/_astro\/hero\..*\.avif$/);
    expect(priority).toBe('high');
  }
});

test('every E-kartoteka link opens in a new tab and says so', async ({ page }) => {
  for (const path of ['', 'akty-prawne/']) {
    await page.goto(path);
    const links = page.locator('a[href^="https://ekartoteka."]');
    expect(await links.count(), `/${path}`).toBeGreaterThan(0);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
      expect(await link.evaluate((element) => element.textContent ?? '')).toContain('otwiera się w nowej karcie');
    }
  }
});

test('returning home: the cards come in visibly, one after another, without a hidden pause', async ({ page }) => {
  await page.goto('');
  await page.waitForSelector('html.motion-ready');
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelector<HTMLAnchorElement>('footer a[href="/kontakt/"]')!.click());
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kontakt');
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    (window as any).__tiles = [];
    const started = performance.now();
    const sample = () => {
      const tiles = document.querySelectorAll('.tiles li');
      if (tiles.length) {
        (window as any).__tiles.push([performance.now() - started, ...Array.from(tiles).map((tile) => Number(getComputedStyle(tile).opacity))]);
        (window as any).__smallest = Math.min((window as any).__smallest ?? 1, ...Array.from(tiles).map((tile) => new DOMMatrix(getComputedStyle(tile).transform).a));
      }
      if (performance.now() - started < 1500) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    document.querySelector<HTMLAnchorElement>('footer a[href="/"]')!.click();
  });
  await page.waitForTimeout(1600);
  const frames: number[][] = await page.evaluate(() => (window as any).__tiles);
  // The cards visibly grow into place (no up-and-down travel, which reads as a bounce).
  expect(await page.evaluate(() => (window as any).__smallest)).toBeLessThanOrEqual(0.97);
  const first = frames[0][0];
  // Visible movement: the last card is still clearly on its way in 150 ms after the cards appear.
  const at150 = frames.find((frame) => frame[0] - first >= 150)!;
  expect(at150[4]).toBeLessThan(0.7);
  // No hidden pause: the first card is already appearing within 120 ms.
  const at120 = frames.find((frame) => frame[0] - first >= 120)!;
  expect(at120[1]).toBeGreaterThan(0.1);
  // And everything has arrived within a second.
  expect(frames[frames.length - 1].slice(1).every((opacity) => opacity === 1)).toBe(true);
  const settledAt = frames.find((frame) => frame.slice(1).every((opacity) => opacity === 1))![0] - first;
  expect(settledAt).toBeLessThan(1000);
});

test.describe('page changes without bounce', () => {
  async function traceChange(page: import('@playwright/test').Page, from: string, linkHref: string) {
    await page.goto(from);
    await page.waitForSelector('html.motion-ready');
    await page.waitForTimeout(1500);
    await page.evaluate((href) => {
      (window as any).__frames = [];
      const started = performance.now();
      const sample = () => {
        const main = document.querySelector('main')!;
        const heading = document.querySelector('main h1')!;
        const onScreen = Array.from(document.querySelectorAll('main [data-reveal]')).filter((element) => {
          const box = element.getBoundingClientRect();
          return box.top < innerHeight && box.bottom > 0;
        });
        (window as any).__frames.push({
          heading: heading.textContent,
          headingOpacity: Number(getComputedStyle(heading).opacity),
          // How much of the heading is uncovered (the wipe): 0 = hidden, 100 = whole.
          headingShown: (() => {
            const clip = getComputedStyle(heading).clipPath;
            const match = clip.match(/inset\(\S+ ([\d.]+)%/);
            return match ? 100 - Number(match[1]) : 100;
          })(),
          headingShift: new DOMMatrix(getComputedStyle(heading).transform).f,
          mainShift: new DOMMatrix(getComputedStyle(main).transform).f,
          cardShift: Math.max(0, ...onScreen.map((element) => Math.abs(new DOMMatrix(getComputedStyle(element).transform).f))),
        });
        if (performance.now() - started < 1400) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
      document.querySelector<HTMLAnchorElement>(`header nav a[href="${href}"]`)!.click();
    }, linkHref);
    await page.waitForTimeout(1500);
    return page.evaluate(() => (window as any).__frames) as Promise<Array<{ heading: string; headingOpacity: number; headingShown: number; headingShift: number; mainShift: number; cardShift: number }>>;
  }

  test('nothing moves up and down when changing pages', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'the header nav is desktop-only');
    const frames = await traceChange(page, 'oferta/', '/kontakt/');
    expect(Math.max(...frames.map((frame) => Math.abs(frame.mainShift)))).toBeLessThan(0.5);
    expect(Math.max(...frames.map((frame) => Math.abs(frame.headingShift)))).toBeLessThan(0.5);
    const arrived = frames.filter((frame) => frame.heading === 'Kontakt');
    expect(Math.max(...arrived.map((frame) => frame.cardShift))).toBeLessThan(0.5);
  });

  test('the new page never flashes in before it fades in', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'the header nav is desktop-only');
    for (let attempt = 0; attempt < 3; attempt++) {
      const frames = await traceChange(page, 'oferta/', '/kontakt/');
      const first = frames.find((frame) => frame.heading === 'Kontakt')!;
      // Either still transparent or still mostly covered by the wipe: never fully shown at once.
      expect(first.headingOpacity < 0.5 || first.headingShown < 50).toBe(true);
    }
  });
});

test('the font definitions stay in place across a page change (no font blink)', async ({ page }) => {
  await page.goto('');
  await page.waitForSelector('html.motion-ready');
  const marked = await page.evaluate(() => {
    const sheet = Array.from(document.querySelectorAll<HTMLElement>('head style, head link[rel="stylesheet"]')).find((element) => {
      const rules = (element as HTMLStyleElement | HTMLLinkElement).sheet?.cssRules;
      return rules && Array.from(rules).some((rule) => rule instanceof CSSFontFaceRule);
    });
    if (!sheet) return false;
    sheet.dataset.fontMarker = 'kept';
    return true;
  });
  expect(marked).toBe(true);
  await page.evaluate(() => document.querySelector<HTMLAnchorElement>('footer a[href="/kontakt/"]')!.click());
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kontakt');
  await expect(page.locator('head [data-font-marker="kept"]')).toHaveCount(1);
});

test('a page heading wipes in after a page change, without moving up or down', async ({ page }) => {
  await page.goto('');
  await page.waitForSelector('html.motion-ready');
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    (window as any).__clips = [];
    const started = performance.now();
    const sample = () => {
      const heading = document.querySelector('main h1');
      if (heading && heading.textContent === 'Kontakt') {
        const style = getComputedStyle(heading);
        (window as any).__clips.push([style.clipPath, new DOMMatrix(style.transform).f]);
      }
      if (performance.now() - started < 1500) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    document.querySelector<HTMLAnchorElement>('footer a[href="/kontakt/"]')!.click();
  });
  await page.waitForTimeout(1600);
  const clips: Array<[string, number]> = await page.evaluate(() => (window as any).__clips);
  expect(clips.some(([clip]) => /inset\(-?[\d.]+(px|%)? [1-9]/.test(clip))).toBe(true);
  expect(clips.every(([, shift]) => Math.abs(shift) < 0.5)).toBe(true);
  expect(clips[clips.length - 1][0]).toBe('none');
});

test('page headings are as wide as their text, so the wipe crosses the words', async ({ page }) => {
  await page.goto('kontakt/');
  const heading = page.locator('main h1');
  const width = await heading.evaluate((element) => element.getBoundingClientRect().width);
  const textWidth = await heading.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect().width;
  });
  expect(width - textWidth).toBeLessThan(4);
});
