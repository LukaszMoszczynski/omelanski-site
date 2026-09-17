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
