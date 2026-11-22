import { expect, test, type Locator } from '@playwright/test';

/** True when the logo looks exactly like the static one: filled houses, no outline, everything shown. */
function finished(logo: Locator) {
  return logo.evaluate((svg) => {
    const houses = Array.from(svg.querySelectorAll('.logo__house'));
    const shown = Array.from(svg.querySelectorAll('.logo__win, .logo__tag, .logo__bar, .logo__name'));
    return houses.length === 3
      && houses.every((house) => {
        const style = getComputedStyle(house);
        return style.fillOpacity === '1' && (style.strokeOpacity === '0' || parseFloat(style.strokeWidth) === 0);
      })
      && shown.length > 0
      && shown.every((part) => {
        const style = getComputedStyle(part);
        return style.opacity === '1' && (style.transform === 'none' || style.transform === 'matrix(1, 0, 0, 1, 0, 0)');
      });
  });
}

test('the header logo draws itself on the first visit and ends as the normal logo', async ({ page }) => {
  await page.goto('', { waitUntil: 'domcontentloaded' });
  const logo = page.locator('header svg.logo');
  await page.waitForTimeout(250);
  const drawing = await logo.evaluate((svg) => {
    const house = svg.querySelector('.logo__house')!;
    return [getComputedStyle(house).strokeDashoffset, getComputedStyle(house).fillOpacity];
  });
  expect(parseFloat(drawing[0])).toBeGreaterThan(0);
  expect(parseFloat(drawing[1])).toBeLessThan(1);
  await expect.poll(() => finished(logo), { timeout: 2500, intervals: [100] }).toBe(true);
});

test('the header logo does not draw again after a page change', async ({ page }) => {
  await page.goto('');
  await page.waitForTimeout(2000);
  await page.evaluate(() => document.querySelector<HTMLAnchorElement>('footer a[href="/kontakt/"]')!.click());
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kontakt');
  const logo = page.locator('header svg.logo');
  expect(await logo.evaluate((svg) => getComputedStyle(svg.querySelector('.logo__house')!).animationName)).toBe('none');
  expect(await finished(logo)).toBe(true);
});

test('the footer logo waits and draws when it comes into view', async ({ page }) => {
  await page.goto('');
  await page.waitForSelector('html.motion-ready');
  const logo = page.locator('footer svg.logo');
  await expect(logo).toHaveClass(/is-waiting/);
  expect(await finished(logo)).toBe(false);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(logo).toHaveClass(/is-drawing/);
  await expect.poll(() => finished(logo), { timeout: 2500, intervals: [100] }).toBe(true);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('both logos are simply there', async ({ page }) => {
    await page.goto('');
    expect(await finished(page.locator('header svg.logo'))).toBe(true);
    expect(await finished(page.locator('footer svg.logo'))).toBe(true);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the footer logo is the normal logo', async ({ page }) => {
    await page.goto('');
    expect(await finished(page.locator('footer svg.logo'))).toBe(true);
  });
});

test('printing shows the whole logo even before it was drawn', async ({ page }) => {
  await page.goto('');
  await page.waitForSelector('html.motion-ready');
  await page.emulateMedia({ media: 'print' });
  expect(await finished(page.locator('footer svg.logo'))).toBe(true);
});

test('the home page has a large logo in "O nas" that draws when scrolled to', async ({ page }, testInfo) => {
  await page.goto('');
  await page.waitForSelector('html.motion-ready');
  const logo = page.locator('section.about svg.logo');
  await expect(logo).toHaveCount(1);
  await expect(logo).toHaveAttribute('aria-hidden', 'true');
  const width = (await logo.boundingBox())!.width;
  expect(width).toBeGreaterThanOrEqual(testInfo.project.name === 'desktop' ? 200 : 150);
  // Waiting below the fold, or already drawing if it is on screen at load.
  await expect(logo).toHaveClass(/is-waiting|is-drawing/);
  await logo.scrollIntoViewIfNeeded();
  await expect(logo).toHaveClass(/is-drawing/);
  await expect.poll(() => finished(logo), { timeout: 2500, intervals: [100] }).toBe(true);
});
