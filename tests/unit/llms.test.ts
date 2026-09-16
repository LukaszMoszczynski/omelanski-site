import { describe, expect, it } from 'vitest';
import { buildLlmsFullTxt, buildLlmsTxt } from '../../src/lib/llms';

const abs = (p: string) => `https://example.pl${p}`;

describe('buildLlmsTxt', () => {
  const txt = buildLlmsTxt(abs);
  it('follows the llms.txt shape', () => {
    expect(txt.startsWith('# Radosław Omelański – Zarządzanie Nieruchomościami\n')).toBe(true);
    expect(txt).toContain('\n> ');
    expect(txt).toContain('- [Oferta](https://example.pl/oferta/)');
    expect(txt).toContain('- [Pełna treść strony](https://example.pl/llms-full.txt)');
  });
});

describe('buildLlmsFullTxt', () => {
  const txt = buildLlmsFullTxt(abs);
  it('contains all content sections', () => {
    for (const s of ['Doświadczenie i kontakt z mieszkańcami', 'Obsługa rachunkowo-księgowa', 'Ustawa Prawo budowlane', 'Okres przechowywania', 'Pogotowie gazowe: 992', 'biuro@omelanska.com', 'E-kartoteka']) {
      expect(txt).toContain(s);
    }
  });
});
