// One-off asset generator. Run `npm run og` and commit the images in public/.
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const tmp = resolve('.og-tmp');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp);

const hero = readFileSync('src/assets/hero.jpg').toString('base64');
const houses = readFileSync('public/favicon.svg', 'utf8').replace(/viewBox="[^"]*"/, 'viewBox="0 0 134.75 57.5"');
const barlowCss = pathToFileURL(resolve('node_modules/@fontsource/barlow/600.css')).href;
const serifCss = pathToFileURL(resolve('node_modules/@fontsource/source-serif-4/600.css')).href;

const og = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${barlowCss}"><link rel="stylesheet" href="${serifCss}">
<style>
  /* Everything that matters sits in the middle 630×630: WhatsApp, Messenger and others
     crop the preview to a square from the centre; Facebook/LinkedIn show the full width. */
  body { margin: 0; width: 1200px; height: 630px; position: relative; font-family: 'Source Serif 4';
    background: url(data:image/jpeg;base64,${hero}) 50% 55% / cover; }
  body::before { content: ''; position: absolute; inset: 0; background: rgba(12,23,35,.25); }
  /* The square thumbnail is only ~70 px wide, so the middle holds just the house mark, the
     logo's bars and the name in letters big enough to read there. */
  .card { position: absolute; top: 0; bottom: 0; left: 285px; width: 630px; background: #f6f0e6;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px; box-shadow: 0 0 60px rgba(12,23,35,.35); }
  .card svg { width: 420px; height: auto; display: block; }
  .bars { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; width: 420px; }
  .bars i { height: 16px; background: #818181; }
  .bars i:nth-child(2) { background: #009fe3; }
  .name { margin-top: 4px; font: 600 92px/0.98 Barlow; color: #12253d; text-align: center; letter-spacing: -.01em; }
</style></head><body>
  <div class="card">${houses}<div class="bars"><i></i><i></i><i></i></div><div class="name">Radosław<br>Omelański</div></div>
</body></html>`;

const icon = (size) => `<!doctype html><html><body style="margin:0;background:transparent">
<img src="${pathToFileURL(resolve('public/favicon.svg')).href}" width="${size}" height="${size}"></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();

writeFileSync(`${tmp}/og.html`, og);
await page.setViewportSize({ width: 1200, height: 630 });
await page.goto(pathToFileURL(`${tmp}/og.html`).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og.jpg', type: 'jpeg', quality: 85 });

for (const [size, name] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png']]) {
  writeFileSync(`${tmp}/icon.html`, icon(size));
  await page.setViewportSize({ width: size, height: size });
  await page.goto(pathToFileURL(`${tmp}/icon.html`).href);
  await page.screenshot({ path: `public/${name}`, omitBackground: size === 32 });
}

await browser.close();
rmSync(tmp, { recursive: true, force: true });
console.log('Wrote public/og.jpg, public/favicon-32.png, public/apple-touch-icon.png');
