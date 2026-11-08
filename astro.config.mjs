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
  build: { format: 'directory' },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [sitemap()],
});
