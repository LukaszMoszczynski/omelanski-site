import { expect, test } from '@playwright/test';

const LIGHT_BG = 'rgb(246, 240, 230)';

test.describe('OS prefers dark', () => {
  test.use({ colorScheme: 'dark' });

  test('light by default even when the OS prefers dark', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByRole('button', { name: 'Jasny motyw' })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(LIGHT_BG);
  });

  test('stored dark choice wins and is applied before first paint', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.goto('', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded');
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
  });

  test('toggle switches to dark, persists across reload and navigation', async ({ page }) => {
    await page.goto('');
    const toggle = page.getByRole('button', { name: 'Jasny motyw' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.getByRole('contentinfo').getByRole('link', { name: 'Kontakt' }).click();
    await expect(page).toHaveURL(/\/kontakt\/$/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: 'Jasny motyw' })).toHaveAttribute('aria-pressed', 'false');
  });
});

test('browser bar colour follows the theme', async ({ page }) => {
  await page.goto('');
  const color = () => page.evaluate(() =>
    Array.from(document.querySelectorAll('meta[name="theme-color"]')).map((meta) => meta.getAttribute('content')));
  expect(await color()).toEqual(['#f6f0e6']);
  await page.getByRole('button', { name: 'Jasny motyw' }).click();
  expect(await color()).toEqual(['#101a22']);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, colorScheme: 'dark' });
  test('the page is light even when the OS prefers dark', async ({ page }) => {
    await page.goto('');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(LIGHT_BG);
  });
});
