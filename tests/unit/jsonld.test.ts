import { describe, expect, it } from 'vitest';
import { breadcrumbJsonLd, businessJsonLd } from '../../src/lib/jsonld';

const abs = (p: string) => `https://example.pl${p}`;

describe('businessJsonLd', () => {
  const data = businessJsonLd(abs);
  it('describes the local business', () => {
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('RealEstateAgent');
    expect(data.name).toBe('Radosław Omelański – Zarządzanie Nieruchomościami');
    expect(data.url).toBe('https://example.pl/');
    expect(data.telephone).toBe('+48518629878');
    expect(data.faxNumber).toBe('+48913217878');
    expect(data.email).toBe('biuro@omelanska.com');
    expect(data.taxID).toBe('9860145783');
    expect(data.logo).toBe('https://example.pl/apple-touch-icon.png');
    expect(data.sameAs).toBeUndefined();
    expect(data.address).toMatchObject({
      '@type': 'PostalAddress',
      streetAddress: 'ul. Jedności Narodowej 1/4',
      postalCode: '72-400',
      addressLocality: 'Kamień Pomorski',
      addressCountry: 'PL',
    });
    expect(data.openingHoursSpecification).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '16:00' },
    ]);
  });
  it('is JSON-serialisable', () => {
    expect(() => JSON.parse(JSON.stringify(data))).not.toThrow();
  });
});

describe('breadcrumbJsonLd', () => {
  it('returns null for home', () => {
    expect(breadcrumbJsonLd(abs, { path: '/', nav: 'Strona główna' })).toBeNull();
  });
  it('builds a two-level trail for subpages', () => {
    expect(breadcrumbJsonLd(abs, { path: '/oferta/', nav: 'Oferta' })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Strona główna', item: 'https://example.pl/' },
        { '@type': 'ListItem', position: 2, name: 'Oferta', item: 'https://example.pl/oferta/' },
      ],
    });
  });
});
