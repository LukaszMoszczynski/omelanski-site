import { expect, test, type Locator, type Page } from '@playwright/test';

/** Horizontal scale of each separator line drawn in front of the list items (1 = fully drawn). */
function lineScales(list: Locator) {
  return list.locator('li').evaluateAll((items) => items
    .filter((item) => getComputedStyle(item, '::before').display !== 'none')
    .map((item) => new DOMMatrix(getComputedStyle(item, '::before').transform).a));
}

const lastDutyList = (page: Page) => page.locator('section.duty .num-list').last();

test('a separator line is the same thin line as before, just drawn', async ({ page }) => {
  await page.goto('oferta/');
  const item = page.locator('.num-list li').first();
  const line = await item.evaluate((element) => {
    const style = getComputedStyle(element, '::before');
    return [style.height, style.content, getComputedStyle(element).borderTopWidth];
  });
  expect(line[0]).toBe('1px');
  expect(line[1]).not.toBe('none');
  expect(line[2]).toBe('0px');
});

test('Oferta lines wait below the fold and draw when scrolled to, one after another', async ({ page }) => {
  await page.goto('oferta/');
  await page.waitForSelector('html.motion-ready');
  const list = lastDutyList(page);
  expect(Math.max(...(await lineScales(list)))).toBeLessThan(0.05);
  await list.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  const midway = await lineScales(list);
  expect(midway[0]).toBeGreaterThan(midway[midway.length - 1]);
  await expect.poll(async () => Math.min(...(await lineScales(list))), { timeout: 2500, intervals: [100] }).toBe(1);
});

test('the divider between Oferta sections draws too', async ({ page }) => {
  await page.goto('oferta/');
  await page.waitForSelector('html.motion-ready');
  const section = page.locator('section.duty').last();
  const divider = () => section.evaluate((element) => new DOMMatrix(getComputedStyle(element, '::after').transform).a);
  expect(await divider()).toBeLessThan(0.05);
  await section.scrollIntoViewIfNeeded();
  await expect.poll(divider, { timeout: 2500, intervals: [100] }).toBe(1);
});

test('switching tabs draws the lines again', async ({ page }) => {
  await page.goto('');
  await page.waitForSelector('html.motion-ready');
  await page.locator('.tabs').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.getByRole('tab').nth(1).click();
  const list = page.locator('[role="tabpanel"]:not([inert]) .num-list');
  await page.waitForTimeout(120);
  expect(Math.min(...(await lineScales(list)))).toBeLessThan(0.9);
  await expect.poll(async () => Math.min(...(await lineScales(list))), { timeout: 2500, intervals: [100] }).toBe(1);
});

test('the line under the page heading draws itself', async ({ page }) => {
  await page.goto('kontakt/', { waitUntil: 'domcontentloaded' });
  const intro = page.locator('section.intro');
  const scale = () => intro.evaluate((element) => new DOMMatrix(getComputedStyle(element, '::after').transform).a);
  expect(await intro.evaluate((element) => getComputedStyle(element, '::after').animationName)).toBe('line-draw');
  await expect.poll(scale, { timeout: 2000, intervals: [100] }).toBe(1);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('every line is simply there', async ({ page }) => {
    await page.goto('oferta/');
    expect(Math.min(...(await lineScales(lastDutyList(page))))).toBe(1);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('every line is simply there', async ({ page }) => {
    await page.goto('oferta/');
    expect(Math.min(...(await lineScales(lastDutyList(page))))).toBe(1);
  });
});

test('printing shows every line, drawn or not', async ({ page }) => {
  await page.goto('oferta/');
  await page.waitForSelector('html.motion-ready');
  await page.emulateMedia({ media: 'print' });
  expect(Math.min(...(await lineScales(lastDutyList(page))))).toBe(1);
});

test.describe('text links', () => {
  test('at rest: a thin underline in the accent colour, no default underline', async ({ page }) => {
    await page.goto('oferta/');
    const link = page.locator('.intro__lead a.link');
    const look = await link.evaluate((element) => {
      const style = getComputedStyle(element);
      return { decoration: style.textDecorationLine, sizes: style.backgroundSize };
    });
    expect(look.decoration).toBe('none');
    expect(look.sizes).toContain('1px');
  });

  test('on hover a highlight grows up behind the text', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover needs a mouse');
    await page.goto('oferta/');
    await page.waitForTimeout(1200);
    const link = page.locator('.intro__lead a.link');
    const band = () => link.evaluate((element) => getComputedStyle(element).backgroundSize.split(',')[0].trim());
    expect(await band()).toBe('100% 0%');
    await link.hover();
    await expect.poll(band, { timeout: 1000 }).toBe('100% 100%');
  });
});

test('Oferta: no second line above the first row on desktop, kept on phones', async ({ page }, testInfo) => {
  await page.goto('oferta/');
  const hasLine = (index: number) => page.locator('section.duty').first().locator('.num-list li').nth(index)
    .evaluate((item) => getComputedStyle(item, '::before').display !== 'none');
  if (testInfo.project.name === 'desktop') {
    expect(await hasLine(0)).toBe(false);
    expect(await hasLine(1)).toBe(false);
    expect(await hasLine(2)).toBe(true);
  } else {
    expect(await hasLine(0)).toBe(true);
    expect(await hasLine(1)).toBe(true);
  }
});

test('home tabs keep their top lines', async ({ page }) => {
  await page.goto('');
  const first = page.locator('[role="tabpanel"]').first().locator('.num-list li').first();
  expect(await first.evaluate((item) => getComputedStyle(item, '::before').display)).not.toBe('none');
});
