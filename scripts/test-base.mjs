// Builds the site as if hosted at https://omelanski.com/pl/ and verifies links resolve.
import { execSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';

const out = '.base-test/pl';
rmSync('.base-test', { recursive: true, force: true });
const env = { ...process.env, SITE_URL: 'https://omelanski.com', BASE_PATH: '/pl' };
execSync(`npx astro build --outDir ${out}`, { stdio: 'inherit', env });
execSync(`node scripts/postbuild.mjs ${out}`, { stdio: 'inherit', env });

const html = readFileSync(`${out}/oferta/index.html`, 'utf8');
const checks = [
  ['canonical', html.includes('<link rel="canonical" href="https://omelanski.com/pl/oferta/"')],
  ['nav link', html.includes('href="/pl/kontakt/"')],
  ['no double slash', !/href="\/pl\/\//.test(html)],
  ['htaccess 404', readFileSync(`${out}/.htaccess`, 'utf8').includes('ErrorDocument 404 /pl/404.html')],
  ['llms absolute urls', readFileSync(`${out}/llms.txt`, 'utf8').includes('https://omelanski.com/pl/oferta/')],
];
const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
if (failed.length) process.exit(1);

// linkinator's built-in static server listens on 127.0.0.1, not the literal
// host name "localhost", so the skip pattern must exclude both to avoid
// treating the site's own pages as "external" and skipping the whole crawl.
// This double-quoted --skip value has been verified to survive npm running
// this script through cmd.exe on Windows (`npm run test:base`), not just Bash.
execSync('npx linkinator pl/ --server-root .base-test --recurse --skip "^https?://(?!localhost|127\\.0\\.0\\.1)"', {
  stdio: 'inherit',
});
