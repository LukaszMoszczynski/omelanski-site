import { expect, test } from '@playwright/test';

test('hero, tiles and sections are present', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('link', { name: /Zobacz swoje rozliczenia/ })).toHaveAttribute('href', 'https://ekartoteka.omelanska.com/');
  await expect(page.getByRole('link', { name: /Oferta dla Wspólnoty/ })).toHaveAttribute('href', '/oferta/');
  await expect(page.getByRole('heading', { level: 2, name: 'Doświadczenie i kontakt z mieszkańcami' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Zakres obowiązków' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Ważne telefony' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tel. Alarmowy: 112' }).last()).toHaveAttribute('href', 'tel:112');
});

test('tabs follow the WAI-ARIA pattern', async ({ page }) => {
  await page.goto('');
  const tablist = page.getByRole('tablist', { name: 'Zakres obowiązków' });
  const prawo = tablist.getByRole('tab', { name: 'Prawo' });
  const ksiegowosc = tablist.getByRole('tab', { name: 'Księgowość' });
  const technika = tablist.getByRole('tab', { name: 'Technika' });

  await expect(prawo).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Prawo' })).toBeVisible();
  await expect(page.getByRole('tabpanel', { name: 'Księgowość' })).toBeHidden();

  await ksiegowosc.click();
  await expect(ksiegowosc).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Księgowość' })).toContainText('Windykacja należności');

  await ksiegowosc.focus();
  await page.keyboard.press('End');
  await expect(technika).toBeFocused();
  await expect(technika).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(prawo).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(technika).toBeFocused();
  await page.keyboard.press('Home');
  await expect(prawo).toBeFocused();
});

test('tabs re-initialise after client-side navigation', async ({ page }) => {
  await page.goto('');
  const footerNav = page.getByRole('navigation', { name: 'Stopka' });
  await footerNav.getByRole('link', { name: 'Kontakt' }).click();
  await expect(page).toHaveURL(/\/kontakt\/$/);
  await footerNav.getByRole('link', { name: 'Strona główna' }).click();
  await page.getByRole('tab', { name: 'Administracja' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Administracja' })).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('all four duty groups are readable', async ({ page }) => {
    await page.goto('');
    await expect(page.getByRole('tablist')).toHaveCount(0);
    for (const head of [
      'Reprezentacja i obsługa prawna Wspólnoty',
      'Obsługa rachunkowo-księgowa',
      'Obsługa administracyjna',
      'Obsługa techniczna nieruchomości',
    ]) {
      await expect(page.getByRole('heading', { level: 3, name: head })).toBeVisible();
    }
  });
});

test('the photo carries the opening block', async ({ page }) => {
  await page.goto('');
  const hero = page.locator('section.hero');
  const bg = await hero.evaluate((el) => getComputedStyle(el).backgroundImage);
  // A generated image, not the original file: Astro re-encodes it.
  expect(bg).toMatch(/_astro\/hero\..*\.(avif|webp)/);
  // A veil over the photo is what keeps the white text readable.
  const veil = await hero.evaluate((el) => getComputedStyle(el, '::before').backgroundImage);
  expect(veil).toContain('linear-gradient');
});

test('the opening block is a little wider than the text, not the whole window', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'full width on a phone');
  await page.setViewportSize({ width: 1800, height: 900 });
  await page.goto('');
  const hero = (await page.locator('section.hero').boundingBox())!;
  const text = (await page.getByRole('heading', { level: 1 }).boundingBox())!;
  expect(hero.width).toBeLessThanOrEqual(1440);
  expect(hero.width).toBeGreaterThan(text.width);
  // Centred, so the same margin shows on both sides.
  expect(Math.round(hero.x)).toBe(Math.round(1800 - hero.x - hero.width));
});
test('header and footer carry the company logo', async ({ page }) => {
  await page.goto('');
  // One image, the logo file itself, named for screen readers in both places.
  const name = /Zarządzanie Nieruchomościami – Radosław Omelański/;
  await expect(page.getByRole('banner').getByRole('img', { name })).toBeVisible();
  await expect(page.getByRole('contentinfo').getByRole('img', { name })).toBeVisible();
  await expect(page.getByRole('banner').getByRole('link', { name })).toHaveAttribute('href', '/');
});
