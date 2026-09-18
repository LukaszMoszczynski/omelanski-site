import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ROUTES } from './routes';

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
  expect(body).toContain('Sitemap: https://omelanski.com/sitemap-index.xml');
});

test('sitemap lists the five pages and not 404', async ({ request }) => {
  const res = await request.get('sitemap-0.xml');
  const xml = await res.text();
  for (const path of ['', 'akty-prawne/', 'oferta/', 'rodo/', 'kontakt/']) {
    expect(xml).toContain(`<loc>https://omelanski.com/${path}</loc>`);
  }
  expect(xml).not.toContain('404');
});

test('build writes .htaccess files', () => {
  const root = readFileSync('dist/.htaccess', 'utf8');
  expect(root).toContain('ErrorDocument 404 /404.html');
  expect(root).toContain('text/javascript');
  expect(root).toContain('nosniff');
  const assets = readFileSync('dist/_astro/.htaccess', 'utf8');
  expect(assets).toContain('immutable');
});

for (const route of ROUTES) {
  test(`head metadata: /${route.path}`, async ({ page }) => {
    await page.goto(route.path);
    const canonical = `https://omelanski.com/${route.path}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://omelanski.com/og.jpg');
    await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute('content', 'image/jpeg');
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /.+/);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = blocks.map((b) => JSON.parse(b));
    expect(parsed.some((d) => d['@type'] === 'RealEstateAgent')).toBe(true);
    expect(parsed.some((d) => d['@type'] === 'BreadcrumbList')).toBe(route.path !== '');
  });
}

test('llms.txt and llms-full.txt are served as UTF-8 text', async ({ request }) => {
  for (const file of ['llms.txt', 'llms-full.txt']) {
    const res = await request.get(file);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');
    expect(await res.text()).toContain('Radosław Omelański');
  }
});
