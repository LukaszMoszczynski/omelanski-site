import { expect, test } from '@playwright/test';
import { ROUTES } from './routes';

for (const route of ROUTES) {
  test(`shell: /${route.path}`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(route.h1);
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    // Skip link is the first focusable element.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Przejdź do treści' })).toBeFocused();
  });
}

test('titles are unique', async ({ page }) => {
  const titles = new Set<string>();
  for (const route of ROUTES) {
    await page.goto(route.path);
    titles.add(await page.title());
  }
  expect(titles.size).toBe(ROUTES.length);
});

test('desktop nav marks the current page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop nav only');
  await page.goto('oferta/');
  const nav = page.getByRole('navigation', { name: 'Główna' });
  await expect(nav.getByRole('link', { name: 'Oferta' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Kontakt' })).not.toHaveAttribute('aria-current');
});
