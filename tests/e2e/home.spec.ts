import { expect, test } from '@playwright/test';

test('hero, tiles and sections are present', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('link', { name: /Zobacz swoje rozliczenia/ })).toHaveAttribute('href', 'https://ekartoteka.omelanska.com/');
  await expect(page.getByRole('link', { name: /Oferta dla Wspólnoty/ })).toHaveAttribute('href', '/oferta/');
  await expect(page.getByRole('heading', { level: 2, name: 'Doświadczenie i kontakt z mieszkańcami' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Zakres obowiązków' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Ważne telefony' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tel. Alarmowy: 112' }).last()).toHaveAttribute('href', 'tel:112');
  await expect(page.getByRole('img', { name: /Kamieniu Pomorskim/ })).toBeVisible();
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

test('the photo sits beside the headline, tiles below', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one column on a phone');
  await page.goto('');
  const photo = page.getByRole('img', { name: /Kamieniu Pomorskim/ });
  const heading = page.getByRole('heading', { level: 1 });
  const tiles = page.getByRole('link', { name: /Zobacz swoje rozliczenia/ });
  const [p, t, k] = await Promise.all([photo.boundingBox(), heading.boundingBox(), tiles.boundingBox()]);
  // Side by side: the photo starts to the right of the headline and shares its row.
  expect(p!.x).toBeGreaterThan(t!.x + t!.width - 1);
  expect(p!.y).toBeLessThan(t!.y + t!.height);
  // The quick tiles moved under both.
  expect(k!.y).toBeGreaterThan(p!.y + p!.height - 1);
});

test('the photo is a generous picture, not a thin band', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop widths only');
  // The client complained that on a monitor the photo was cropped to a strip.
  for (const width of [1280, 1800]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('');
    const box = (await page.getByRole('img', { name: /Kamieniu Pomorskim/ }).boundingBox())!;
    expect(box.height).toBeGreaterThan(400);
    expect(box.width / box.height).toBeLessThan(2.2);
  }
});
test('the brand shows the logo wording the way the printed logo does', async ({ page }) => {
  await page.goto('');
  const brand = page.getByRole('banner').getByRole('link', { name: /Radosław Omelański/ }).first();
  await expect(brand).toContainText('Zarządzanie Nieruchomościami');
  await expect(brand).toContainText('Radosław Omelański');
});
