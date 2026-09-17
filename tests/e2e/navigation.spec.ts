import { expect, test } from '@playwright/test';

test('footer links navigate without a full reload and focus the h1', async ({ page }) => {
  await page.goto('');
  await page.evaluate(() => { (window as unknown as { __spa: boolean }).__spa = true; });
  await page.getByRole('contentinfo').getByRole('link', { name: 'Oferta' }).click();
  await expect(page).toHaveURL(/\/oferta\/$/);
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveText('Oferta');
  await expect(h1).toBeFocused();
  expect(await page.evaluate(() => (window as unknown as { __spa?: boolean }).__spa)).toBe(true);
  await expect(page).toHaveTitle(/^Oferta dla Wspólnot i Spółdzielni \|/);
});

test('back button restores the previous page', async ({ page }) => {
  await page.goto('');
  await page.getByRole('contentinfo').getByRole('link', { name: 'RODO' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Klauzula informacyjna RODO');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Administrowanie i rozliczanie Wspólnot Mieszkaniowych');
});

test('desktop nav updates aria-current after client navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop nav only');
  await page.goto('');
  const nav = page.getByRole('navigation', { name: 'Główna' });
  await nav.getByRole('link', { name: 'Akty prawne' }).click();
  await expect(page).toHaveURL(/\/akty-prawne\/$/);
  await expect(nav.getByRole('link', { name: 'Akty prawne' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Strona główna' })).not.toHaveAttribute('aria-current');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('links still work as normal page loads', async ({ page }) => {
    await page.goto('');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Kontakt' }).click();
    await expect(page).toHaveURL(/\/kontakt\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kontakt');
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('disables the view-transition cross-fade in CSS', async ({ page }) => {
    await page.goto('');
    const found = await page.evaluate(() => {
      const matches = (rule: CSSRule): boolean => {
        if ('selectorText' in rule && (rule as CSSStyleRule).selectorText?.includes('::view-transition-old')) {
          return true;
        }
        if ('cssRules' in rule) {
          return Array.from((rule as CSSMediaRule).cssRules).some(matches);
        }
        return false;
      };
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        if (Array.from(rules).some(matches)) return true;
      }
      return false;
    });
    expect(found).toBe(true);
  });
});
