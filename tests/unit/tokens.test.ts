import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The light block doubles as the bare :root (light is the default), so any token it
// defines and the dark theme forgets silently keeps its light value. This guards every token at once.
const css = readFileSync('src/styles/tokens.css', 'utf8');

function tokensOf(selector: string): Set<string> {
  const at = css.indexOf(selector);
  if (at < 0) throw new Error(`selector not found: ${selector}`);
  const body = css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at));
  const names = body.match(/--[\w-]+(?=\s*:)/g) ?? [];
  return new Set(names);
}

describe('theme tokens', () => {
  it('the dark theme defines every token the light default does', () => {
    const light = tokensOf(":root[data-theme='light']");
    const dark = tokensOf(":root[data-theme='dark']");
    const missing = [...light].filter((token) => !dark.has(token));
    expect(missing).toEqual([]);
  });

  it('nothing follows the OS colour preference', () => {
    expect(css).not.toContain('prefers-color-scheme');
  });
});
