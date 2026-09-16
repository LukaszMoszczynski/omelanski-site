// One-off asset generator. Run `npm run og` and commit the PNGs in public/.
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const tmp = resolve('.og-tmp');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp);

const hero = readFileSync('src/assets/hero.jpg').toString('base64');
const logo = readFileSync('design/logo.svg', 'utf8').replace('#2d2d2d', '#12253d');
const barlowCss = pathToFileURL(resolve('node_modules/@fontsource/barlow/600.css')).href;
const plexCss = pathToFileURL(resolve('node_modules/@fontsource/ibm-plex-sans/600.css')).href;

const og = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${barlowCss}"><link rel="stylesheet" href="${plexCss}">
<style>
  body { margin: 0; width: 1200px; height: 630px; display: grid; grid-template-columns: 520px 1fr; font-family: 'IBM Plex Sans'; }
  .l { background: #fff; display: grid; place-items: center; padding: 60px; }
  .l svg { width: 360px; height: auto; }
  .r { position: relative; background: url(data:image/jpeg;base64,${hero}) 50% 55% / cover; }
  .r::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(12,23,35,.55), rgba(12,23,35,.1)); }
  .t { position: absolute; left: 48px; bottom: 48px; right: 48px; z-index: 1; color: #fff; font-size: 40px; font-weight: 600; line-height: 1.15; letter-spacing: -.02em; }
</style></head><body>
  <div class="l">${logo}</div>
  <div class="r"><div class="t">Administrowanie i rozliczanie Wspólnot Mieszkaniowych</div></div>
</body></html>`;

const icon = (size) => `<!doctype html><html><body style="margin:0;background:transparent">
<img src="${pathToFileURL(resolve('public/favicon.svg')).href}" width="${size}" height="${size}"></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();

writeFileSync(`${tmp}/og.html`, og);
await page.setViewportSize({ width: 1200, height: 630 });
await page.goto(pathToFileURL(`${tmp}/og.html`).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og.png' });

for (const [size, name] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png']]) {
  writeFileSync(`${tmp}/icon.html`, icon(size));
  await page.setViewportSize({ width: size, height: size });
  await page.goto(pathToFileURL(`${tmp}/icon.html`).href);
  await page.screenshot({ path: `public/${name}`, omitBackground: size === 32 });
}

await browser.close();
rmSync(tmp, { recursive: true, force: true });
console.log('Wrote public/og.png, public/favicon-32.png, public/apple-touch-icon.png');
