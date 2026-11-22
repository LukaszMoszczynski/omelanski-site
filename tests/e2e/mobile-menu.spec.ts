import { expect, test } from '@playwright/test';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile menu only');
});

test('opens as a dialog and closes with Escape, returning focus', async ({ page }) => {
  await page.goto('');
  const burger = page.getByRole('button', { name: 'Menu', exact: true });
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await burger.click();
  const dialog = page.getByRole('dialog', { name: 'Menu' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zamknij menu' })).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(burger).toBeFocused();
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
});

test('the burger itself closes the menu and its label changes', async ({ page }) => {
  await page.goto('');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  // Same button, renamed while open: it is now the cross.
  const cross = page.getByRole('button', { name: 'Zamknij menu' });
  await expect(cross).toBeVisible();
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveCount(0);
  await cross.click();
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeVisible();
});

test('the cross sits in the top-right corner, where the burger was', async ({ page }) => {
  await page.goto('');
  const burger = page.getByRole('button', { name: 'Menu', exact: true });
  const before = await burger.boundingBox();
  await burger.click();
  const after = await page.getByRole('button', { name: 'Zamknij menu' }).boundingBox();
  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(Math.abs(after!.x - before!.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(2);
});

test('the page behind cannot scroll while the menu is open', async ({ page }) => {
  await page.goto('');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).toBe('hidden');
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
});

test('content behind the menu is hidden from assistive tech and keyboard', async ({ page }) => {
  await page.goto('');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(page.getByRole('main')).toHaveCount(0);
  await expect(page.getByRole('contentinfo')).toHaveCount(0);
});

test('link in menu navigates and closes the menu', async ({ page }) => {
  await page.goto('');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Menu mobilne' }).getByRole('link', { name: 'Kontakt' }).click();
  await expect(page).toHaveURL(/\/kontakt\/$/);
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});

test('menu marks the current page', async ({ page }) => {
  await page.goto('rodo/');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(
    page.getByRole('navigation', { name: 'Menu mobilne' }).getByRole('link', { name: 'RODO' }),
  ).toHaveAttribute('aria-current', 'page');
});

test.describe('motion', () => {
  const linkOpacities = (page: import('@playwright/test').Page) => page.evaluate(() =>
    Array.from(document.querySelectorAll('#mobile-menu a')).map((link) => Number(getComputedStyle(link).opacity)));

  test('links come in one after another and end fully visible', async ({ page }) => {
    await page.goto('');
    await page.waitForSelector('html.motion-ready');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    const first = await linkOpacities(page);
    // The last link (E-kartoteka) is still on its way in right after the click.
    expect(first[first.length - 1]).toBeLessThan(1);
    await expect.poll(async () => (await linkOpacities(page)).every((opacity) => opacity === 1), { timeout: 1000, intervals: [50] }).toBe(true);
  });

  test('turning to desktop width mid-close ends closed and unlocked', async ({ page }) => {
    await page.goto('');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: 'Zamknij menu' }).click();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('#mobile-menu')).toBeHidden();
    await expect(page.locator('html')).not.toHaveClass(/is-locked/);
    await expect(page.locator('main')).not.toHaveAttribute('inert');
  });

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('opens and closes instantly with everything visible', async ({ page }) => {
      await page.goto('');
      await page.getByRole('button', { name: 'Menu', exact: true }).click();
      expect((await linkOpacities(page)).every((opacity) => opacity === 1)).toBe(true);
      await page.getByRole('button', { name: 'Zamknij menu' }).click();
      expect(await page.locator('#mobile-menu').isHidden()).toBe(true);
    });
  });
});
