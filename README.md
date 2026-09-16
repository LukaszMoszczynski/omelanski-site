# Radosław Omelański – Zarządzanie Nieruchomościami

Static website built with [Astro](https://astro.build). Pages are pre-rendered HTML; navigation between them happens without full reloads (Astro ClientRouter).

Design source: `design/` (Claude Design export). Spec: `docs/superpowers/specs/`.

## Requirements

- Node.js 22.12 or newer (`.nvmrc`)

## Commands

| Command | What it does |
|---|---|
| `npm ci` | Install dependencies |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Build the site into `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm test` | Type check, unit tests, build, link check, `/pl` base check, browser + accessibility tests |
| `npm run og` | Regenerate `public/og.png` and favicon PNGs |

First time running tests: `npx playwright install chromium`.

## Deploying

1. `npm ci && npm run build`
2. `npm run preview` and click through the site.
3. Upload **the contents** of `dist/` (including the hidden `.htaccess` files) to the server's document root over FTP/SFTP, replacing the previous files. Delete old files in `_astro/` that are no longer in `dist/_astro/`.

## Moving to another domain or sub-folder

Edit `astro.config.mjs`:

```js
const SITE = process.env.SITE_URL ?? 'https://omelanski.com';
const BASE = process.env.BASE_PATH ?? '/pl';
```

Build and upload `dist/` into the `/pl` folder. Then:

- Add `Sitemap: https://omelanski.com/pl/sitemap-index.xml` to the **root** `robots.txt` of the new domain (crawlers only read `/robots.txt`).
- Redirect the old domain permanently, e.g. in the old domain's root `.htaccess`:
  ```apache
  RewriteEngine On
  RewriteRule ^(.*)$ https://omelanski.com/pl/$1 [R=301,L]
  ```
- Submit the new sitemap in Google Search Console.

## Editing content

| What | Where |
|---|---|
| Phone numbers, e-mail, address, hours, E-kartoteka URL | `src/data/site.ts` |
| Page titles and descriptions (SEO) | `src/data/pages.ts` |
| Home hero and "O nas" text | `src/data/content.ts` |
| Zakres obowiązków / Oferta items | `src/data/duties.ts` |
| Akty prawne | `src/data/acts.ts` |
| RODO clause | `src/data/rodo.ts` |
| Colours | `src/styles/tokens.css` |

`llms.txt`, `llms-full.txt`, the sitemap and structured data are generated from these files on build.

## Content still to provide

- RODO clause text from the law firm (current text contains "Tekst zastępczy").
- Final list of legal acts.
- Optional: a real map screenshot to replace the patterned map card.
