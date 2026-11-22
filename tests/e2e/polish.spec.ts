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
  expect(Date.now() - started).toBeLessThan(650);
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

  test('no stylesheet blocks the first paint', async ({ page }) => {
    await page.goto('');
    expect(await page.locator('link[rel="stylesheet"]').count()).toBe(0);
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
