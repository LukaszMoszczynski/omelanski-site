# Radosław Omelański – Zarządzanie Nieruchomościami

Static website built with [Astro](https://astro.build). Pages are pre-rendered HTML; navigation between them happens without full reloads (Astro ClientRouter).

Design source: `design/` (Claude Design export). Spec: `docs/superpowers/specs/`.

## Requirements

- Node.js 22.19 or newer (`.nvmrc`)

## Commands

| Command | What it does |
|---|---|
| `npm ci` | Install dependencies |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Build the site into `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm test` | Type check, unit tests, build, link check, `/pl` base check, browser + accessibility tests |
| `npm run og` | Regenerate `public/og.jpg` and favicon PNGs |

First time running tests: `npx playwright install chromium`.

## Deploying

1. `npm ci && npm run build`
2. `npm run preview` and click through the site.
3. Upload **the contents** of `dist/` (including the hidden `.htaccess` files) to the server's document root over FTP/SFTP, replacing the previous files. Delete old files in `_astro/` that are no longer in `dist/_astro/`.

The generated `.htaccess` files are Apache-only. On nginx or another server they are ignored: configure the 404 page (`404.html`) and caching headers yourself using your server's own mechanism.

**Troubleshooting:** if the whole site returns HTTP 500 right after upload, the host may not allow the `Options` directive in `.htaccess`. Delete the `Options -Indexes` line from `dist/.htaccess` and re-upload.

## Domain

The site is built for **https://omelanski.com** (served from the domain root). Canonical links, the sitemap, `robots.txt`, `llms.txt`, structured data and the social-share image all take their address from `site` in `astro.config.mjs`.

The e-mail address is `biuro@omelanski.com`. E-kartoteka still links to `ekartoteka.omelanska.com`, because `ekartoteka.omelanski.com` has no DNS record yet — once that subdomain works, change `EKARTOTEKA_URL` in `src/data/site.ts`.

### Switching over from omelanska.com

Once omelanski.com serves the new site, redirect the old domain permanently so search rankings and bookmarks carry over. In the old domain's root `.htaccess`:

```apache
RewriteEngine On
RewriteRule ^(.*)$ https://omelanski.com/$1 [R=301,L]
```

Then add omelanski.com to Google Search Console and submit `https://omelanski.com/sitemap-index.xml`.

### Serving from a sub-folder instead (optional)

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
- With a `/pl` base, `llms.txt` and `llms-full.txt` are served at `/pl/llms.txt` and `/pl/llms-full.txt`. If you want them reachable at the domain root as well, copy them there too.

## Preview for the client (GitHub Pages)

`.github/workflows/preview.yml` builds the site on every push to `main` and publishes it to GitHub Pages,
so the client can click through a working copy before launch. The real site is still uploaded by hand
(see **Deploying**) — Pages is only a preview.

One-time setup:

1. Create the repository on GitHub and push `main`. Pages needs a **public** repository, unless the account has GitHub Pro.
2. In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push again, or start the workflow from the **Actions** tab. The address shows up in the workflow summary,
   normally `https://<user>.github.io/<repo>/`.

The preview build differs from the production build only through `PREVIEW=1`:

- every page gets `<meta name="robots" content="noindex">` and no canonical link,
- `robots.txt` answers `Disallow: /`.

So the preview stays out of search results and never competes with omelanski.com. Content, styles and
behaviour are identical. Pages ignores `.htaccess`, so the custom 404 page and the caching rules only
take effect on the real server.

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
