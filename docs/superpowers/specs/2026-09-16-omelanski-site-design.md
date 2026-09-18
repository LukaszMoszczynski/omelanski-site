# Omelański – strona firmowa: design spec

Date: 2026-09-16
Status: awaiting review

## Goal

Rebuild the website of *Zarządzanie Nieruchomościami Radosław Omelański* (Kamień Pomorski) from the Claude Design project in `design/`. The site must:

- navigate between pages without full reloads (SPA-like feel),
- meet WCAG 2.2 AA,
- be fully indexable by search engines, crawlers and LLMs (complete HTML without JavaScript),
- be deployable as plain static files, uploaded manually — no CI/CD, no server runtime.

## Constraints and decisions

| Topic | Decision |
|---|---|
| Hosting | Static files. Developer runs `npm run build` and uploads the contents of `dist/` to the server (FTP/SFTP). |
| Source control | GitHub. `dist/` and `node_modules/` are git-ignored. |
| Domain | `https://omelanski.com` at the root (decided 2026-09-18; replaces omelanska.com). A sub-folder such as `/pl` must still work by changing only `base` in `astro.config.mjs`. E-mail and E-kartoteka keep their omelanska.com addresses. |
| Language | Polish only (`<html lang="pl">`). |
| Content | Hard-coded in `.astro` components. Shared facts (nav, phones, address, hours, external URLs) live in `src/data/site.ts`. |
| Contact form | None. Contact data is shown as `tel:`/`mailto:` links. |
| E-kartoteka | External link to `https://ekartoteka.omelanska.com/` until `ekartoteka.omelanski.com` exists. |
| Analytics, CMS, i18n | Out of scope. |

## Stack

- **Astro 7** (verified 7.3.x on 2026-09-16), output `static`, `build.format: 'directory'` (URLs like `/oferta/` → `oferta/index.html`, works on any server without rewrites).
- **`<ClientRouter />`** (Astro view transitions) for client-side navigation with prefetch on hover/viewport. Links remain plain `<a href>`; site works fully with JS disabled.
- **TypeScript**, plain CSS with custom properties (theme tokens). No UI framework, no Tailwind.
- Interactive pieces as small vanilla custom elements: theme toggle, mobile menu, tabs.
- **Fonts** self-hosted via `@fontsource` (IBM Plex Sans, JetBrains Mono). Barlow is used only by the one-off OG image script (full logo lettering). No requests to Google (RODO).
- **Images** via `astro:assets` (AVIF/WebP, responsive `srcset`, explicit dimensions).
- **`@astrojs/sitemap`** for `sitemap-index.xml`.
- Node 22 LTS for development.

## Project structure

```
design/                     Claude Design export, screenshots, source photos, logo (reference only)
docs/superpowers/specs/     this spec
public/
  robots.txt  .htaccess  og.png  favicon.svg  (+ png/ico fallbacks)
src/
  layouts/BaseLayout.astro  <head> (SEO, OG, JSON-LD), theme bootstrap script, skip link,
                            ClientRouter, Header, <main id="main">, Footer
  components/
    TopBar.astro            "AWARIA?" emergency numbers, phone, email, hours, ThemeToggle
    Header.astro            logo mark + name, desktop nav, E-kartoteka button, MobileMenu trigger
    MobileMenu.astro        bottom-sheet menu (custom element)
    ThemeToggle.astro       CIEMNY / JASNY toggle (custom element)
    Tabs.astro              accessible tabs (custom element)
    PhoneGrid.astro         emergency numbers grid
    PageIntro.astro         eyebrow + h1 + lead block shared by subpages
    NumberedList.astro      numbered item list (home tabs, Oferta)
    ExternalLink.astro      link opening in a new tab with hidden hint
    MapLink.astro           map card (design pattern + pin + address) linking to Google Maps
    Logo.astro              inline SVG logo (full and mark-only variants)
    Footer.astro
  data/site.ts              nav items, phones, address, hours, URLs, business metadata
  lib/url.ts                url() helper that prefixes import.meta.env.BASE_URL
  pages/
    index.astro  akty-prawne.astro  oferta.astro  rodo.astro  kontakt.astro  404.astro
    llms.txt.ts  llms-full.txt.ts   build-time endpoints
  styles/
    tokens.css              dark/light tokens copied from the design (THEMES object)
    global.css              reset, typography, focus styles, reduced-motion rules
tests/
  e2e/*.spec.ts             Playwright + @axe-core/playwright
```

## Pages

| Route | Content (from `design/Omelanski Redesign.dc.html`) |
|---|---|
| `/` | Hero ("Administrowanie i rozliczanie Wspólnot Mieszkaniowych") with 4 quick-link tiles and two CTAs; panoramic photo; "O nas"; "Zakres obowiązków" tabs (Prawo, Księgowość, Administracja, Technika); "Ważne telefony"; "Biuro" contact block with map link. |
| `/akty-prawne/` | Intro; cards for *Ustawa o własności lokali* and *Ustawa Prawo budowlane* linking to Dz.U.; E-kartoteka CTA box. |
| `/oferta/` | Offer content as designed. |
| `/rodo/` | RODO information, plus a statement that the site sets no cookies (theme preference is stored only in `localStorage`). |
| `/kontakt/` | Phone/fax, email, address, hours, map link, emergency numbers. |
| `404.html` | Not-found message with navigation. |

Layouts must match the design screenshots at desktop (1280 px) and mobile (~390 px), with a reasonable intermediate tablet layout. Both dark and light themes are implemented from the design tokens.

## Logo

`design/logo.svg` is a vector redraw of `design/logo_top.png` with the name changed from "Danuta Omelańska" to "Radosław Omelański". On the site it is inlined via `Logo.astro`:

- **Header** uses the mark only (three buildings) next to the existing HTML name text, because the full logo is unreadable at 44 px.
- Grey parts and text use `currentColor`/theme tokens so the logo stays readable in dark mode; the blue stays `#009fe3`.
- Full logo (with text) is available for the footer / OG image.

## Navigation and routing

- All internal links built with `url('/oferta/')` so a non-root `base` (e.g. `/pl`) works.
- `ClientRouter` swaps page content with a short cross-fade; animation disabled under `prefers-reduced-motion`.
- On `astro:page-load` after a client-side navigation (not on the first load, not when the URL has a hash): focus the page `<h1>` (`tabindex="-1"`). The new title is announced by ClientRouter's built-in route announcer. `aria-current="page"` is rendered server-side per page, so the swapped header is always correct. The mobile menu closes when a link in it is clicked.
- Custom elements must re-initialise correctly after each client-side navigation.

## Theme

- Initial theme: saved preference in `localStorage` if present, otherwise `prefers-color-scheme`.
- Inline script in `<head>` sets `data-theme` on `<html>` before first paint (no flash). On `astro:before-swap` it copies the current theme onto the incoming document so navigation never flashes. Without JS the CSS follows `prefers-color-scheme`.
- Toggle is a `<button aria-pressed>` with visible "CIEMNY / JASNY" labels. All `localStorage` access wrapped in `try/catch`.

## SEO

- Per-page `<title>`, meta description, canonical, Open Graph and Twitter tags (`og:locale` `pl_PL`).
- OG image: static `public/og.png` (1200×630), created once during implementation from the hero photo and logo.
- JSON-LD on every page: `RealEstateAgent` (subtype of `LocalBusiness`) with name, address (ul. Jedności Narodowej 1/4, 72-400 Kamień Pomorski), telephone, fax, email, opening hours (Mo–Fr 08:00–16:00), `areaServed` (powiat kamieński, powiat gryficki), `url`, logo. Subpages add `BreadcrumbList`.
- `sitemap-index.xml` via `@astrojs/sitemap`; `robots.txt` references it.
- All absolute URLs derived from `site` + `base`.

## Crawlers and LLMs

- Every page's full content is in the static HTML. The tabs render all four panels in HTML; JS only toggles visibility.
- `robots.txt` allows all crawlers, including GPTBot, ClaudeBot, PerplexityBot, Google-Extended.
- `/llms.txt`: Markdown summary of the business with links to each page.
- `/llms-full.txt`: full plain text of all pages.

## Accessibility (WCAG 2.2 AA)

- Landmarks: `header`, `nav` (labelled), `main`, `footer`. One `h1` per page, logical heading order.
- Skip link "Przejdź do treści" as the first focusable element.
- Visible focus styles in both themes; targets ≥ 24×24 px.
- Contrast verified for all token pairs in both themes; the light-theme `dim` colour must be checked and adjusted if below 4.5:1.
- Mobile menu: `<button aria-expanded aria-controls>` opening a native modal `<dialog>` styled as the bottom sheet (focus trap, Esc and inert background from the platform); backdrop click and a "Zamknij menu" button close it; focus returns to the trigger.
- Tabs: WAI-ARIA tabs pattern (`role="tablist"`, `tab`, `tabpanel`, roving tabindex, Arrow/Home/End keys).
- `prefers-reduced-motion`: pulse animation, transitions and view-transition animations disabled.
- External links that open a new tab have visually hidden "(otwiera się w nowej karcie)" text.
- Phone numbers are `tel:` links; email is a `mailto:` link.
- Map: a link card styled like the design placeholder (pattern, pin icon, address, "Pokaż na mapie Google"); no third-party embed and no map tiles (no cookies, no RODO consent needed). A real map screenshot can replace the pattern later.

## Performance

- Target Lighthouse 100 in all four categories on every page (mobile and desktop).
- JS limited to the router and three small custom elements.
- Critical fonts preloaded, `font-display: swap`, subset to Latin + Latin Extended.
- Hero image prioritized (`fetchpriority="high"`), others lazy-loaded.

## Server config (`public/.htaccess`, used only on Apache)

- `ErrorDocument 404` pointing at the 404 page (respecting `base`).
- Long-lived immutable caching for `/_astro/*`; short caching for HTML.
- gzip/brotli compression where available.
- README documents the 301 redirect needed if the domain moves to `omelanski.com/pl`.

## Testing

`npm test` runs:

- Playwright e2e (Chromium, desktop and mobile viewports):
  - every route returns 200, has exactly one `h1` and a unique `<title>`,
  - client-side navigation works without full reload; navigation works with JS disabled,
  - focus lands on `h1` after navigation,
  - theme toggle works, persists across reloads and navigation, no flash,
  - mobile menu and tabs are keyboard-operable,
  - axe-core reports no violations on every page, in both themes, on both viewports.
- Build checks:
  - no broken internal links,
  - sitemap, robots.txt, llms.txt, llms-full.txt present,
  - JSON-LD parses and contains required fields,
  - a build with `base: '/pl'` produces correct links.
- Before launch: manual keyboard pass, NVDA screen reader pass, Lighthouse run.

## Deployment (README)

```
npm ci
npm run build
npm run preview        # local check
# upload contents of dist/ to the server document root (or /pl for the future domain)
```

## Out of scope

Contact form, CMS, analytics, multiple languages, CI/CD.

## Implementation notes (added after design review)

- Desktop and mobile layouts share one markup per section; CSS switches layout at 900 px. Where the design uses different labels on mobile (e.g. hero tiles "Zobacz swoje rozliczenia" vs "E-kartoteka"), the desktop label is used everywhere.
- E-kartoteka opens in the same tab. Dz.U. and Google Maps links open in a new tab.
- Long-form text (about paragraphs, duties, acts, RODO) lives in `src/data/*.ts` so the pages and `llms-full.txt` share one source.
- `.htaccess` is written by `scripts/postbuild.mjs` so the 404 path follows `base`.

## Content still owed by the client

- RODO clause: the design text contains "Tekst zastępczy" placeholders to be replaced with the law firm's text.
- Akty prawne: final list of acts (design shows two as a proposal).
- Real logo files, if the redrawn SVG is not accepted.
