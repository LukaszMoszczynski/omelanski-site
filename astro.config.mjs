import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Domain settings. The site lives at the root of https://omelanski.pl.
// To serve it from a sub-folder instead, change base, e.g. base: '/pl'.
// SITE_URL / BASE_PATH env vars exist only for scripts/test-base.mjs.
const SITE = process.env.SITE_URL ?? 'https://omelanski.pl';
const BASE = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  // Page-specific CSS (small) goes into the page. The shared stylesheet, which carries the
  // fonts, stays a cached file: Astro keeps it across page changes, so the fonts never
  // blink (a per-page inline block would be swapped, fonts included, on every change).
  build: { format: 'directory', inlineStylesheets: 'auto' },
  // Only stylesheets get the higher limit; fonts and images keep the default.
  vite: { build: { assetsInlineLimit: (filePath, content) => (filePath.endsWith(".css") ? content.length < 12 * 1024 : undefined) } },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [sitemap()],
});
