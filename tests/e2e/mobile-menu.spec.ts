import { expect, test } from '@playwright/test';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile menu only');
});

test('opens as a modal dialog and closes with Escape, returning focus', async ({ page }) => {
  await page.goto('');
  const burger = page.getByRole('button', { name: 'Menu', exact: true });
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await burger.click();
  const dialog = page.getByRole('dialog', { name: 'Menu' });
  await expect(dialog).toBeVisible();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(burger).toBeFocused();
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
});

test('close button closes the menu', async ({ page }) => {
  await page.goto('');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Zamknij menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
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
