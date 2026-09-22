import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The dark block doubles as the bare :root, so any token it defines and a light
// theme forgets silently keeps its dark value — which is how the hero cards once
// turned up dark on the light theme. This guards every token at once.
const css = readFileSync('src/styles/tokens.css', 'utf8');

function tokensOf(selector: string): Set<string> {
  const at = css.indexOf(selector);
  if (at < 0) throw new Error(`selector not found: ${selector}`);
  const body = css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at));
  const names = body.match(/--[\w-]+(?=\s*:)/g) ?? [];
  return new Set(names);
}

describe('theme tokens', () => {
  const dark = tokensOf(":root[data-theme='dark']");

  it.each([
    ['the OS light preference', ":root:not([data-theme='dark'])"],
    ['the light theme chosen with the toggle', ":root[data-theme='light']"],
  ])('%s defines every token the dark theme does', (_name, selector) => {
    const light = tokensOf(selector);
    const missing = [...dark].filter((t) => !light.has(t));
    expect(missing).toEqual([]);
  });
});
