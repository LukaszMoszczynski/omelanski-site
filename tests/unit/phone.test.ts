import { describe, expect, it } from 'vitest';
import { telHref } from '../../src/lib/phone';

describe('telHref', () => {
  it('prefixes 9-digit Polish numbers with +48', () => {
    expect(telHref('518 629 878')).toBe('tel:+48518629878');
    expect(telHref('91 32 17 878')).toBe('tel:+48913217878');
  });

  it('keeps short emergency numbers as-is', () => {
    expect(telHref('112')).toBe('tel:112');
    expect(telHref('998')).toBe('tel:998');
  });
});
