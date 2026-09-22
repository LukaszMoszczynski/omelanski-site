import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The palette was warmed at the client's request; these guard the change from
// quietly dropping text below WCAG 2.2 AA (4.5:1 for text, 3:1 for UI edges).
const css = readFileSync('src/styles/tokens.css', 'utf8');

function block(selector: string): Record<string, string> {
  const at = css.indexOf(selector);
  if (at < 0) throw new Error(`selector not found: ${selector}`);
  const body = css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at));
  const out: Record<string, string> = {};
  for (const line of body.split('\n')) {
    const m = line.match(/^\s*(--[\w-]+):\s*([^;]+);/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

type Rgb = [number, number, number];

function parse(value: string): { rgb: Rgb; alpha: number } {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: 1 };
  }
  const rgba = value.match(/^rgba?\(([^)]+)\)$/);
  if (!rgba) throw new Error(`cannot parse colour: ${value}`);
  const parts = rgba[1].split(',').map((p) => Number(p.trim()));
  return { rgb: [parts[0], parts[1], parts[2]], alpha: parts[3] ?? 1 };
}

function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(fg: string, bg: string): number {
  const f = parse(fg);
  const b = parse(bg);
  if (b.alpha !== 1) throw new Error('background must be opaque');
  const flat: Rgb = [0, 1, 2].map((i) => f.rgb[i] * f.alpha + b.rgb[i] * (1 - f.alpha)) as Rgb;
  const [hi, lo] = [luminance(flat), luminance(b.rgb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe.each([
  ['light', ":root[data-theme='light']"],
  ['dark', ":root[data-theme='dark']"],
])('%s theme', (_name, selector) => {
  const t = block(selector);

  it.each(['--ink', '--body', '--mid', '--dim', '--accent-text'])('%s reads on the page background', (token) => {
    expect(contrast(t[token], t['--bg'])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['--ink', '--body', '--mid', '--dim', '--accent-text'])('%s reads on panels', (token) => {
    expect(contrast(t[token], t['--surf'])).toBeGreaterThanOrEqual(4.5);
  });

  it('button text reads on the accent colour', () => {
    expect(contrast(t['--on-accent'], block(':root')['--accent'])).toBeGreaterThanOrEqual(4.5);
  });
});
