import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Domain settings. When the site moves, change these two values, e.g.
//   site: 'https://omelanski.com', base: '/pl'
// SITE_URL / BASE_PATH env vars exist only for scripts/test-base.mjs.
const SITE = process.env.SITE_URL ?? 'https://omelanska.com';
const BASE = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [sitemap()],
});
