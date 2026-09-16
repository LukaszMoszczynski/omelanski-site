import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('404 page offers navigation and is noindex', async ({ page }) => {
  await page.goto('404.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nie znaleziono strony');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.getByRole('main').getByRole('link', { name: 'Strona główna' })).toHaveAttribute('href', '/');
});

test('robots.txt allows crawlers and points at the sitemap', async ({ request }) => {
  const res = await request.get('robots.txt');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain('User-agent: *');
  expect(body).toContain('Allow: /');
  expect(body).toContain('User-agent: GPTBot');
  expect(body).toContain('User-agent: ClaudeBot');
  expect(body).toContain('Sitemap: https://omelanska.com/sitemap-index.xml');
});

test('sitemap lists the five pages and not 404', async ({ request }) => {
  const res = await request.get('sitemap-0.xml');
  const xml = await res.text();
  for (const path of ['', 'akty-prawne/', 'oferta/', 'rodo/', 'kontakt/']) {
    expect(xml).toContain(`<loc>https://omelanska.com/${path}</loc>`);
  }
  expect(xml).not.toContain('404');
});

test('build writes .htaccess files', () => {
  const root = readFileSync('dist/.htaccess', 'utf8');
  expect(root).toContain('ErrorDocument 404 /404.html');
  const assets = readFileSync('dist/_astro/.htaccess', 'utf8');
  expect(assets).toContain('immutable');
});
