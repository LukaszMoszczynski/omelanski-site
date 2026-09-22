import { expect, test } from '@playwright/test';

test.describe('system light preference', () => {
  test.use({ colorScheme: 'light' });
  test('follows the OS when nothing is stored', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

test.describe('system dark preference', () => {
  test.use({ colorScheme: 'dark' });
  test('follows the OS when nothing is stored', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('stored choice wins and is applied before first paint', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto('', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded');
    const themeAtDcl = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(themeAtDcl).toBe('light');
  });

  test('toggle switches, persists across reload and navigation', async ({ page }) => {
    await page.goto('');
    const toggle = page.getByRole('button', { name: 'Jasny motyw' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.getByRole('contentinfo').getByRole('link', { name: 'Kontakt' }).click();
    await expect(page).toHaveURL(/\/kontakt\/$/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByRole('button', { name: 'Jasny motyw' })).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, colorScheme: 'light' });
  test('CSS follows the OS scheme', async ({ page }) => {
    await page.goto('');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // The light theme is a warm off-white now, not pure white.
    expect(bg).toBe('rgb(246, 240, 230)');
  });
});
