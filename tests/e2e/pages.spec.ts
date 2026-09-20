import { expect, test } from '@playwright/test';

test('Akty prawne lists acts linking to Dz.U. in a new tab', async ({ page }) => {
  await page.goto('akty-prawne/');
  await expect(page.getByRole('heading', { level: 2, name: 'Ustawa o własności lokali' })).toBeVisible();
  const link = page.getByRole('link', { name: /Otwórz w Dz\.U\..*Ustawa o własności lokali/ });
  await expect(link).toHaveAttribute('href', 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19940850388');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toContainText('otwiera się w nowej karcie');
  await expect(page.getByRole('link', { name: 'Przejdź do E-kartoteki' })).toHaveAttribute('href', 'https://ekartoteka.omelanska.com/');
});

test('Oferta shows four duty sections and contact CTAs', async ({ page }) => {
  await page.goto('oferta/');
  for (const head of [
    'Reprezentacja i obsługa prawna Wspólnoty',
    'Obsługa rachunkowo-księgowa',
    'Obsługa administracyjna',
    'Obsługa techniczna nieruchomości',
  ]) {
    await expect(page.getByRole('heading', { level: 2, name: head })).toBeVisible();
  }
  await expect(page.getByRole('listitem').filter({ hasText: 'Ubezpieczenie budynku.' })).toBeVisible();
  await expect(page.getByText('wystarczy telefon albo wiadomość na biuro@omelanski.com.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'biuro@omelanski.com', exact: true }).first()).toHaveAttribute(
    'href',
    'mailto:biuro@omelanski.com',
  );
  await expect(page.getByRole('link', { name: 'Napisz do nas' })).toHaveAttribute('href', 'mailto:biuro@omelanski.com');
  await expect(page.getByRole('link', { name: /518 629 878/ }).last()).toHaveAttribute('href', 'tel:+48518629878');
});

test('RODO table of contents jumps to sections', async ({ page }) => {
  await page.goto('rodo/');
  const toc = page.getByRole('navigation', { name: 'Spis treści' });
  await toc.getByRole('link', { name: /Obowiązek podania danych/ }).click();
  await expect(page).toHaveURL(/#obowiazek-podania-danych$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Obowiązek podania danych' })).toBeInViewport();
  await expect(page.getByText(/nie używa własnych plików cookies/)).toBeVisible();
  await toc.getByRole('link', { name: /Pliki cookies/ }).click();
  await expect(page).toHaveURL(/#cookies$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Pliki cookies' })).toBeInViewport();
});

test('Kontakt offers call, e-mail, fax, after-hours numbers and map link', async ({ page }) => {
  await page.goto('kontakt/');
  await expect(page.getByRole('link', { name: /Zadzwoń/ }).first()).toHaveAttribute('href', 'tel:+48518629878');
  await expect(page.getByRole('link', { name: /Napisz/ }).first()).toHaveAttribute('href', 'mailto:biuro@omelanski.com');
  await expect(page.getByText('91 32 17 878').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Pogotowie gazowe: 992' })).toHaveAttribute('href', 'tel:992');
  await expect(page.getByRole('link', { name: /Pokaż na mapie Google/ })).toHaveAttribute('href', /google\.com\/maps/);
});
