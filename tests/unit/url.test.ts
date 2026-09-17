import { describe, expect, it } from 'vitest';
import { joinBase } from '../../src/lib/url';

describe('joinBase', () => {
  it('joins with root base', () => {
    expect(joinBase('/', '/oferta/')).toBe('/oferta/');
    expect(joinBase('/', '/')).toBe('/');
    expect(joinBase('/', 'oferta/')).toBe('/oferta/');
  });

  it('joins with a sub-path base with or without trailing slash', () => {
    // Astro 7 with trailingSlash: 'always' exposes BASE_URL as '/pl/'
    expect(joinBase('/pl/', '/oferta/')).toBe('/pl/oferta/');
    expect(joinBase('/pl', '/oferta/')).toBe('/pl/oferta/');
    expect(joinBase('/pl/', '/')).toBe('/pl/');
  });

  it('keeps file paths without adding a slash', () => {
    expect(joinBase('/pl/', '/og.jpg')).toBe('/pl/og.jpg');
    expect(joinBase('/', 'favicon.svg')).toBe('/favicon.svg');
  });
});
