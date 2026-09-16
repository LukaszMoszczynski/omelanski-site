/** `tel:` href for a displayed Polish number. 9-digit numbers get +48. */
export function telHref(display: string): string {
  const digits = display.replace(/\D/g, '');
  return digits.length === 9 ? `tel:+48${digits}` : `tel:${digits}`;
}
