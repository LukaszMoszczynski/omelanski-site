# Omelański Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 5-page static website for *Radosław Omelański – Zarządzanie Nieruchomościami* from the Claude Design export, with client-side navigation, WCAG 2.2 AA, and full SEO/LLM readability.

**Architecture:** Astro 7 static site. Every route is pre-rendered HTML (`build.format: 'directory'`); `<ClientRouter />` adds SPA-style navigation on top. Interactivity (theme toggle, mobile menu, tabs) is three small vanilla custom elements. Shared text/data lives in `src/data/*.ts`; pure helpers in `src/lib/*.ts` are unit-tested with Vitest; pages are tested end-to-end with Playwright + axe against `astro preview`.

**Tech Stack:** Astro 7.3, TypeScript 5.9, @astrojs/sitemap 3.7, @fontsource (IBM Plex Sans, JetBrains Mono, Barlow for OG only), Vitest 5, Playwright 1.63, @axe-core/playwright 4.13, linkinator 8, Node ≥ 22.12.

**Spec:** `docs/superpowers/specs/2026-09-16-omelanska-site-design.md`

## Global Constraints

- Node ≥ 22.12 (Astro 7 engine requirement). `.nvmrc` = `22`.
- Output is plain static files in `dist/`, uploaded manually. No server runtime, no CI.
- `site` default `https://omelanska.com`, `base` default `/`; both set only in `astro.config.mjs` (env `SITE_URL` / `BASE_PATH` override exists only for the base-path test).
- `trailingSlash: 'always'`. Internal links are always built with `url()` from `src/lib/url.ts` — never hard-coded `/…`.
- Polish only: `<html lang="pl">`, `og:locale` `pl_PL`. All UI copy in Polish, verbatim from the design where the design has it.
- No requests to third-party origins at runtime (no Google Fonts, no map embeds, no analytics).
- No cookies. Theme preference in `localStorage` key `theme` with values `light` | `dark`, every access wrapped in `try/catch`.
- Colours only via CSS custom properties from `src/styles/tokens.css`.
- Breakpoint: desktop layout at `min-width: 900px`; below that the mobile layout.
- Motion: `cubic-bezier(.22,.61,.36,1)` (`--ease`), 180–300 ms, only `transform`/`opacity`/colours; everything disabled under `prefers-reduced-motion: reduce`.
- Business facts (use exactly): name "Radosław Omelański – Zarządzanie Nieruchomościami"; address "ul. Jedności Narodowej 1/4, 72-400 Kamień Pomorski"; tel. "518 629 878"; telefon/fax "91 32 17 878"; e-mail "biuro@omelanska.com"; hours "pon.–pt. 8.00–16.00"; NIP 9860145783; REGON 527844342; E-kartoteka `https://ekartoteka.omelanska.com/`.
- Commit after every task. Commit messages end with the line `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

## File Map

```
.nvmrc  .gitignore  package.json  astro.config.mjs  tsconfig.json
vitest.config.ts  playwright.config.ts  README.md
scripts/
  postbuild.mjs        writes dist/.htaccess and dist/_astro/.htaccess (base-aware)
  test-base.mjs        builds with base /pl/ and link-checks it
  make-og.mjs          one-off: renders public/og.png + favicon PNGs
public/
  favicon.svg  favicon-32.png  apple-touch-icon.png  og.png
src/
  assets/hero.jpg                      copy of design/WP_20150404_026.jpg
  data/site.ts                         business facts, phones, URLs
  data/pages.ts                        per-route meta + NAV order
  data/content.ts                      hero + about text
  data/duties.ts                       4 duty groups (home tabs + Oferta)
  data/acts.ts                         legal acts
  data/rodo.ts                         RODO sections
  lib/url.ts                           joinBase(), url(), absoluteUrl()
  lib/phone.ts                         telHref()
  lib/jsonld.ts                        businessJsonLd(), breadcrumbJsonLd()
  lib/llms.ts                          buildLlmsTxt(), buildLlmsFullTxt()
  styles/tokens.css                    theme variables
  styles/global.css                    reset, type, buttons, utilities, motion
  layouts/BaseLayout.astro             <head>, theme bootstrap, router, focus mgmt, shell
  components/Logo.astro                inline SVG mark (three buildings)
  components/ThemeToggle.astro         <theme-toggle>
  components/TopBar.astro
  components/MobileMenu.astro          <mobile-menu> + <dialog>
  components/Header.astro
  components/Footer.astro
  components/PageIntro.astro
  components/NumberedList.astro
  components/ExternalLink.astro
  components/Tabs.astro                <tabs-widget>
  components/PhoneGrid.astro
  components/MapLink.astro
  components/JsonLd.astro
  pages/index.astro  akty-prawne.astro  oferta.astro  rodo.astro  kontakt.astro  404.astro
  pages/robots.txt.ts  llms.txt.ts  llms-full.txt.ts
tests/
  unit/url.test.ts  phone.test.ts  jsonld.test.ts  llms.test.ts
  e2e/routes.ts  shell.spec.ts  theme.spec.ts  navigation.spec.ts  mobile-menu.spec.ts
  e2e/home.spec.ts  pages.spec.ts  seo.spec.ts  a11y.spec.ts
```

---

### Task 1: Project scaffold, URL helper, test tooling

**Files:**
- Create: `.nvmrc`, `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/lib/url.ts`, `tests/unit/url.test.ts`, `src/pages/index.astro` (temporary)
- Modify: `.gitignore`

**Interfaces:**
- Produces: `joinBase(base: string, path: string): string`, `url(path: string): string`, `absoluteUrl(path: string): string` from `src/lib/url.ts`. npm scripts `dev`, `build`, `preview`, `check`, `test:unit`.

- [ ] **Step 1: Create config files**

`.nvmrc`:
```
22
```

Append to `.gitignore`:
```
.base-test/
.og-tmp/
```

`package.json`:
```json
{
  "name": "omelanska-site",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test:unit": "vitest run"
  }
}
```

Install dependencies:
```bash
npm i astro@^7.3.3 @astrojs/sitemap@^3.7.4 @fontsource/ibm-plex-sans@^5.3.0 @fontsource/jetbrains-mono@^5.3.0
npm i -D typescript@^5.9.3 @astrojs/check@^0.9.10 vitest@^5.0.1
```

`astro.config.mjs`:
```js
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
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", ".base-test", ".og-tmp"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'] },
});
```

- [ ] **Step 2: Write the failing unit test**

`tests/unit/url.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { joinBase } from '../../src/lib/url';

describe('joinBase', () => {
  it('joins with root base', () => {
    expect(joinBase('/', '/oferta/')).toBe('/oferta/');
    expect(joinBase('/', '/')).toBe('/');
    expect(joinBase('/', 'oferta/')).toBe('/oferta/');
  });

  it('joins with a sub-path base with or without trailing slash', () => {
    // Astro 7 with trailingSlash: 'always' exposes BASE_URL as '/pl/'
    expect(joinBase('/pl/', '/oferta/')).toBe('/pl/oferta/');
    expect(joinBase('/pl', '/oferta/')).toBe('/pl/oferta/');
    expect(joinBase('/pl/', '/')).toBe('/pl/');
  });

  it('keeps file paths without adding a slash', () => {
    expect(joinBase('/pl/', '/og.png')).toBe('/pl/og.png');
    expect(joinBase('/', 'favicon.svg')).toBe('/favicon.svg');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — cannot resolve `../../src/lib/url`.

- [ ] **Step 4: Implement `src/lib/url.ts`**

```ts
/** Joins an Astro base path and a site-relative path without doubling slashes. */
export function joinBase(base: string, path: string): string {
  const b = base.endsWith('/') ? base : `${base}/`;
  return b + path.replace(/^\/+/, '');
}

/** Site-relative URL that respects `base` from astro.config.mjs. */
export function url(path: string): string {
  return joinBase(import.meta.env.BASE_URL, path);
}

/** Absolute URL (for canonical, og:url, sitemap references, JSON-LD). */
export function absoluteUrl(path: string): string {
  return new URL(url(path), import.meta.env.SITE).href;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS (3 tests).

- [ ] **Step 6: Temporary page and build smoke check**

`src/pages/index.astro`:
```astro
---
import { url } from '../lib/url';
---
<html lang="pl"><head><meta charset="utf-8" /><title>Omelański</title></head>
<body><a href={url('/')}>start</a></body></html>
```

Run: `npm run build && npm run check`
Expected: build prints `Complete!`, `dist/index.html` and `dist/sitemap-index.xml` exist; `astro check` reports 0 errors.

- [ ] **Step 7: Commit**

```bash
git add .nvmrc .gitignore package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts src tests
git commit -m "chore: scaffold Astro 7 project with base-aware url helper"
```

---

### Task 2: Data modules and phone helper

**Files:**
- Create: `src/lib/phone.ts`, `tests/unit/phone.test.ts`, `src/data/site.ts`, `src/data/pages.ts`, `src/data/content.ts`, `src/data/duties.ts`, `src/data/acts.ts`, `src/data/rodo.ts`

**Interfaces:**
- Produces:
  - `telHref(number: string): string`
  - `BUSINESS`, `CONTACT`, `EKARTOTEKA_URL`, `MAPS_URL`, `EMERGENCY: EmergencyNumber[]`, `AFTER_HOURS: {label: string; number: string}[]` from `site.ts`
  - `PAGES: Record<'home'|'acts'|'offer'|'rodo'|'contact', PageMeta>`, `NAV: PageMeta[]`, `PageMeta {path; nav; title; description}` from `pages.ts`
  - `HERO {eyebrow; title; lead}`, `ABOUT {eyebrow; title; paragraphs: string[]}` from `content.ts`
  - `DUTIES: DutyGroup[]` (`{id; label; head; items: string[]}`), `DUTIES_NOTE` from `duties.ts`
  - `ACTS: LegalAct[]` (`{kind; title; citation; href}`) from `acts.ts`
  - `RODO: RodoSection[]` (`{id; n; title; body}`) from `rodo.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/phone.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { telHref } from '../../src/lib/phone';

describe('telHref', () => {
  it('prefixes 9-digit Polish numbers with +48', () => {
    expect(telHref('518 629 878')).toBe('tel:+48518629878');
    expect(telHref('91 32 17 878')).toBe('tel:+48913217878');
  });

  it('keeps short emergency numbers as-is', () => {
    expect(telHref('112')).toBe('tel:112');
    expect(telHref('998')).toBe('tel:998');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — cannot resolve `../../src/lib/phone`.

- [ ] **Step 3: Implement `src/lib/phone.ts`**

```ts
/** `tel:` href for a displayed Polish number. 9-digit numbers get +48. */
export function telHref(display: string): string {
  const digits = display.replace(/\D/g, '');
  return digits.length === 9 ? `tel:+48${digits}` : `tel:${digits}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Create data modules**

`src/data/site.ts`:
```ts
export const BUSINESS = {
  name: 'Radosław Omelański – Zarządzanie Nieruchomościami',
  shortName: 'Radosław Omelański',
  tagline: 'Zarządzanie Nieruchomościami',
  street: 'ul. Jedności Narodowej 1/4',
  postalCode: '72-400',
  city: 'Kamień Pomorski',
  region: 'zachodniopomorskie',
  nip: '9860145783',
  regon: '527844342',
  areaServed: ['Powiat kamieński', 'Powiat gryficki'],
} as const;

export const CONTACT = {
  phone: '518 629 878',
  phoneFax: '91 32 17 878',
  email: 'biuro@omelanska.com',
  hoursShort: 'pon.–pt. 8.00–16.00',
  hoursDays: 'od poniedziałku do piątku',
  hoursTime: '8.00 – 16.00',
} as const;

export const EKARTOTEKA_URL = 'https://ekartoteka.omelanska.com/';

export const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('ul. Jedności Narodowej 1/4, 72-400 Kamień Pomorski');

export interface EmergencyNumber {
  label: string;
  number: string;
  /** Shown in the top bar: on all widths, only on desktop, or not at all. */
  topBar: 'all' | 'desktop' | false;
  /** Shown in the home phone grid on mobile. */
  mobileGrid: boolean;
  highlight?: boolean;
}

// Order and labels verbatim from design 2a.
export const EMERGENCY: EmergencyNumber[] = [
  { label: 'Tel. Alarmowy', number: '112', topBar: 'all', mobileGrid: true, highlight: true },
  { label: 'Straż pożarna', number: '998', topBar: 'all', mobileGrid: true },
  { label: 'Pogot. ratunkowe', number: '999', topBar: false, mobileGrid: true },
  { label: 'Policja', number: '997', topBar: false, mobileGrid: true },
  { label: 'Straż Miejska', number: '986', topBar: false, mobileGrid: false },
  { label: 'Gazownicze', number: '992', topBar: 'all', mobileGrid: true },
  { label: 'Ciepłownicze', number: '993', topBar: 'desktop', mobileGrid: false },
  { label: 'Wodociągowe', number: '994', topBar: 'all', mobileGrid: true },
  { label: 'Energetyczne', number: '991', topBar: 'desktop', mobileGrid: false },
];

// Kontakt page, "Awaria po godzinach pracy biura".
export const AFTER_HOURS = [
  { label: 'Pogotowie energetyczne', number: '991' },
  { label: 'Pogotowie gazowe', number: '992' },
  { label: 'Pogotowie wodno-kanalizacyjne', number: '994' },
];
```

`src/data/pages.ts`:
```ts
export interface PageMeta {
  path: string;
  nav: string;
  title: string;
  description: string;
}

export const PAGES = {
  home: {
    path: '/',
    nav: 'Strona główna',
    title: 'Radosław Omelański – Zarządzanie Nieruchomościami, Kamień Pomorski',
    description:
      'Administrowanie i rozliczanie Wspólnot Mieszkaniowych oraz Spółdzielni Mieszkaniowych w powiecie kamieńskim i gryfickim. Biuro w Kamieniu Pomorskim.',
  },
  acts: {
    path: '/akty-prawne/',
    nav: 'Akty prawne',
    title: 'Akty prawne',
    description:
      'Przepisy, na których opiera się administrowanie Wspólnotą Mieszkaniową: ustawa o własności lokali i Prawo budowlane – z odnośnikami do Dziennika Ustaw.',
  },
  offer: {
    path: '/oferta/',
    nav: 'Oferta',
    title: 'Oferta dla Wspólnot i Spółdzielni',
    description:
      'Zakres obsługi Wspólnot Mieszkaniowych: prawo, księgowość, administracja i technika. Ofertę dopasowujemy indywidualnie do potrzeb Wspólnoty.',
  },
  rodo: {
    path: '/rodo/',
    nav: 'RODO',
    title: 'Klauzula informacyjna RODO',
    description:
      'Informacja o przetwarzaniu danych osobowych właścicieli lokali i mieszkańców nieruchomości administrowanych przez Radosław Omelański Zarządzanie Nieruchomościami.',
  },
  contact: {
    path: '/kontakt/',
    nav: 'Kontakt',
    title: 'Kontakt',
    description:
      'Biuro w Kamieniu Pomorskim, ul. Jedności Narodowej 1/4. Tel. 518 629 878, e-mail biuro@omelanska.com, pon.–pt. 8.00–16.00. Numery pogotowia po godzinach.',
  },
} as const satisfies Record<string, PageMeta>;

export const NAV: PageMeta[] = [PAGES.home, PAGES.acts, PAGES.offer, PAGES.rodo, PAGES.contact];

/** Full <title>: home uses its own title, subpages get the brand suffix. */
export function fullTitle(page: PageMeta): string {
  return page.path === '/' ? page.title : `${page.title} | Radosław Omelański – Zarządzanie Nieruchomościami`;
}
```

`src/data/content.ts`:
```ts
export const HERO = {
  eyebrow: 'Powiat kamieński',
  title: 'Administrowanie i rozliczanie Wspólnot Mieszkaniowych',
  lead:
    'Profesjonalna firma zajmująca się administrowaniem, zarządzaniem i rozliczaniem Wspólnot Mieszkaniowych oraz Spółdzielni Mieszkaniowych na terenie Powiatu Kamieńskiego.',
};

export const ABOUT = {
  eyebrow: 'O nas',
  title: 'Doświadczenie i kontakt z mieszkańcami',
  paragraphs: [
    'Zarządzanie Nieruchomościami Radosław Omelański w Kamieniu Pomorskim to profesjonalna firma zajmująca się administrowaniem i rozliczaniem Wspólnot Mieszkaniowych oraz Spółdzielni Mieszkaniowych na terenie Powiatu Kamieńskiego i Gryfickiego. W pracy korzystamy z specjalistycznych programów niezbędnych do zarządzania nieruchomościami oraz rozwiązywania codziennych problemów mieszkańców budynków. Współpracujemy ze specjalistami wykonującymi przeglądy budowlane, przeglądy kominiarskie, przeglądy gazowe, przeglądy elektryczne, specjalistami sprawującymi funkcje inspektora nadzoru budowlanego, prawnikami prowadzącymi sprawy wspólnot mieszkaniowych zajmującymi się instalacjami wodno-kanalizacyjnymi, elektrycznymi itp.',
    'Naszym celem jest jak najlepsze wykonywanie swojej pracy, dlatego duży nacisk kładziemy na dobry kontakt z zarządami oraz mieszkańcami Wspólnot Mieszkaniowych i Spółdzielni Mieszkaniowych. Jesteśmy otwarci na pomysły i uwagi, chętni do wyjaśniania wszelkich niejasności lub zagadnień prawnych, księgowych lub budowlanych, które mieszczą się w granicach naszych kompetencji.',
    'Mamy wieloletnie doświadczenie w administrowaniu budynkami sezonowymi nad morzem, nowymi i kilkudziesięcioletnimi budynkami mieszkalnymi jak i budynkami w rejestrze zabytków. Przeprowadziliśmy setki małych i dużych inwestycji wymagających współpracy z mieszkańcami, konserwatorami zabytków, Gminami i innymi urzędami. Pozyskaliśmy dotację na modernizację budynków z wielu źródeł i mechanizmów finansowania.',
  ],
};
```

`src/data/duties.ts`:
```ts
export interface DutyGroup {
  id: string;
  label: string;
  head: string;
  items: string[];
}

export const DUTIES_NOTE = 'Zakres podstawowy — modyfikowany indywidualnie na życzenie wspólnoty.';

export const DUTIES: DutyGroup[] = [
  {
    id: 'prawo',
    label: 'Prawo',
    head: 'Reprezentacja i obsługa prawna Wspólnoty',
    items: [
      'Reprezentacja wspólnoty na zewnątrz przed organami administracji państwowej i samorządowej.',
      'Reprezentacja wspólnoty przed sądami i organami egzekucyjnymi.',
      'Rejestracja Wspólnoty Mieszkaniowej w Urzędzie Statystycznym i Urzędzie Skarbowym (NIP, REGON).',
      'Opracowanie uchwał i innych aktów normatywnych wspólnoty (regulaminów, statutów).',
      'Reprezentacja wspólnoty w stosunkach pomiędzy właścicielami.',
      'Obowiązkowe ubezpieczenie OC Zarządcy.',
    ],
  },
  {
    id: 'ksiegowosc',
    label: 'Księgowość',
    head: 'Obsługa rachunkowo-księgowa',
    items: [
      'Pełna ewidencja przychodów i kosztów wspólnoty.',
      'Roczne sprawozdania finansowe i rozliczenie planu gospodarczego.',
      'Rozliczenia mediów — woda, ciepło, wywóz nieczystości.',
      'Prowadzenie rozliczeń funduszu remontowego.',
      'Windykacja należności od właścicieli lokali.',
      'Rozliczenia z Urzędem Skarbowym i ZUS.',
    ],
  },
  {
    id: 'administracja',
    label: 'Administracja',
    head: 'Obsługa administracyjna',
    items: [
      'Umowy z dostawcami wody, ciepła, energii elektrycznej i gazu.',
      'Zwoływanie i obsługa zebrań Wspólnoty Mieszkaniowej.',
      'Korespondencja z właścicielami lokali.',
      'Negocjacje warunków umów z wykonawcami i dostawcami.',
      'Prowadzenie i aktualizacja spisu właścicieli lokali.',
      'Ubezpieczenie budynku.',
    ],
  },
  {
    id: 'technika',
    label: 'Technika',
    head: 'Obsługa techniczna nieruchomości',
    items: [
      'Prowadzenie książki obiektu budowlanego.',
      'Kontrole techniczne i przeglądy okresowe budynku oraz instalacji.',
      'Usuwanie awarii i ich skutków.',
      'Przygotowanie planów remontowych.',
      'Nadzór nad pracami i odbiory wykonanych robót.',
      'Utrzymanie porządku i czystości w częściach wspólnych.',
    ],
  },
];
```

`src/data/acts.ts`:
```ts
export interface LegalAct {
  kind: string;
  title: string;
  citation: string;
  href: string;
}

// Proposal from the design; client to confirm the final list.
export const ACTS: LegalAct[] = [
  {
    kind: 'Ustawa',
    title: 'Ustawa o własności lokali',
    citation: 'Dz.U. 1994 nr 85 poz. 388, z późn. zm.',
    href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19940850388',
  },
  {
    kind: 'Ustawa',
    title: 'Ustawa Prawo budowlane',
    citation: 'Dz.U. 1994 nr 89 poz. 414, z późn. zm.',
    href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19940890414',
  },
];
```

`src/data/rodo.ts` (text verbatim from the design, including "Tekst zastępczy" placeholders the client will replace):
```ts
export interface RodoSection {
  id: string;
  n: string;
  title: string;
  body: string;
}

export const RODO: RodoSection[] = [
  { id: 'administrator', n: '01', title: 'Administrator danych osobowych', body: 'Radosław Omelański, Zarządzanie Nieruchomościami, ul. Jedności Narodowej 1/4, 72-400 Kamień Pomorski, NIP: 9860145783, REGON: 527844342. Administrator odpowiada za bezpieczeństwo powierzonych danych oraz za spełnienie obowiązków informacyjnych wobec właścicieli lokali i mieszkańców. Tekst zastępczy — docelowa treść zostanie uzupełniona przez kancelarię. Miejsce na wskazanie zakresu umocowania wynikającego z umowy o administrowanie nieruchomością wspólną.' },
  { id: 'cel-i-podstawa', n: '02', title: 'Cel i podstawa przetwarzania', body: 'Tekst zastępczy. Dane przetwarzane są w celu realizacji umowy o administrowanie nieruchomością wspólną, prowadzenia rozliczeń, korespondencji z właścicielami lokali oraz wypełnienia obowiązków wynikających z przepisów prawa. Podstawą przetwarzania są art. 6 ust. 1 lit. b, c oraz f RODO. W tym miejscu znajdzie się wyliczenie poszczególnych celów wraz z przypisaną im podstawą prawną, a także informacja o prawnie uzasadnionym interesie administratora. Docelowa treść zostanie uzupełniona przez kancelarię prawną.' },
  { id: 'odbiorcy', n: '03', title: 'Odbiorcy danych', body: 'Tekst zastępczy. Odbiorcami danych mogą być dostawcy mediów, biuro rachunkowe, wykonawcy prac remontowych i konserwacyjnych, firmy ubezpieczeniowe, kancelarie prawne oraz podmioty uprawnione na podstawie przepisów prawa. Dane mogą być również powierzane dostawcom usług informatycznych w zakresie niezbędnym do utrzymania systemów. W tym miejscu pojawi się pełna lista kategorii odbiorców wraz z informacją o ewentualnym przekazywaniu danych poza Europejski Obszar Gospodarczy.' },
  { id: 'okres', n: '04', title: 'Okres przechowywania', body: 'Tekst zastępczy. Dane przechowywane są przez okres obowiązywania umowy, a po jej zakończeniu przez czas wynikający z przepisów o rachunkowości oraz terminów przedawnienia roszczeń. Dokumentacja techniczna nieruchomości przechowywana jest przez cały okres jej istnienia. W tym miejscu zostaną wskazane konkretne okresy retencji dla poszczególnych kategorii dokumentów.' },
  { id: 'prawa', n: '05', title: 'Prawa osoby, której dane dotyczą', body: 'Tekst zastępczy. Osobie, której dane dotyczą, przysługuje prawo dostępu do danych, ich sprostowania, usunięcia lub ograniczenia przetwarzania, prawo wniesienia sprzeciwu, prawo do przenoszenia danych oraz prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych. Wnioski kieruje się do administratora danych — Radosław Omelański, Zarządzanie Nieruchomościami — osobiście w biurze lub drogą elektroniczną. Docelowa treść opisze tryb i termin rozpatrywania wniosków.' },
  { id: 'kontakt', n: '06', title: 'Kontakt w sprawie danych', body: 'biuro@omelanska.com, tel. 518 629 878, pon.–pt. 8.00–16.00. Wnioski dotyczące danych osobowych można składać osobiście w biurze przy ul. Jedności Narodowej 1/4, listownie lub pocztą elektroniczną. Tekst zastępczy — do uzupełnienia informacja o ewentualnym wyznaczeniu inspektora ochrony danych.' },
];

export const RODO_COOKIES_NOTE =
  'Strona nie używa plików cookies ani narzędzi analitycznych. Wybrany motyw kolorystyczny (jasny lub ciemny) jest zapisywany wyłącznie w pamięci Twojej przeglądarki (localStorage) i nie jest przesyłany do nas.';
```

- [ ] **Step 6: Type-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src tests
git commit -m "feat: add site data modules and tel: helper"
```

---

### Task 3: Theme tokens, global styles, fonts, BaseLayout, page shell

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/components/Logo.astro`, `src/components/ThemeToggle.astro`, `src/components/TopBar.astro`, `src/components/MobileMenu.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/PageIntro.astro`, `src/components/ExternalLink.astro`, `src/pages/akty-prawne.astro`, `src/pages/oferta.astro`, `src/pages/rodo.astro`, `src/pages/kontakt.astro`, `playwright.config.ts`, `tests/e2e/routes.ts`, `tests/e2e/shell.spec.ts`
- Modify: `src/pages/index.astro` (replace temp page), `package.json` (scripts)

**Interfaces:**
- Consumes: `url`, `absoluteUrl` (Task 1); `NAV`, `PAGES`, `fullTitle`, `PageMeta`, `BUSINESS`, `CONTACT`, `EMERGENCY`, `EKARTOTEKA_URL`, `telHref` (Task 2).
- Produces:
  - `<BaseLayout page={PageMeta}>` with named slot `head` (extra head tags). Renders `<main id="main">` around the default slot.
  - `<PageIntro eyebrow title lead subtitle?>` — renders `<h1 tabindex="-1">`.
  - `<ExternalLink href class? newTab?=true>` — slot is the link text.
  - `<Logo class?>`.
  - CSS utility classes: `.wrap`, `.eyebrow`, `.btn`, `.btn--primary`, `.btn--soft`, `.btn--ghost`, `.btn--block`, `.visually-hidden`, `.desktop-only`, `.mobile-only`, `.mono`, `.section`, `.link`.
  - `tests/e2e/routes.ts` exporting `ROUTES: {path: string; h1: string}[]`.

- [ ] **Step 1: Install Playwright and write the failing e2e test**

```bash
npm i -D @playwright/test@^1.63.0 @axe-core/playwright@^4.13.0
npx playwright install chromium
```

Add scripts to `package.json`:
```json
"test:e2e": "playwright test"
```

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4321/' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    url: 'http://localhost:4321/',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
```

`tests/e2e/routes.ts`:
```ts
export const ROUTES = [
  { path: '', h1: 'Administrowanie i rozliczanie Wspólnot Mieszkaniowych' },
  { path: 'akty-prawne/', h1: 'Akty prawne' },
  { path: 'oferta/', h1: 'Oferta' },
  { path: 'rodo/', h1: 'Klauzula informacyjna RODO' },
  { path: 'kontakt/', h1: 'Kontakt' },
];
```

`tests/e2e/shell.spec.ts`:
```ts
import { expect, test } from '@playwright/test';
import { ROUTES } from './routes';

for (const route of ROUTES) {
  test(`shell: /${route.path}`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(route.h1);
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    // Skip link is the first focusable element.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Przejdź do treści' })).toBeFocused();
  });
}

test('titles are unique', async ({ page }) => {
  const titles = new Set<string>();
  for (const route of ROUTES) {
    await page.goto(route.path);
    titles.add(await page.title());
  }
  expect(titles.size).toBe(ROUTES.length);
});

test('desktop nav marks the current page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop nav only');
  await page.goto('oferta/');
  const nav = page.getByRole('navigation', { name: 'Główna' });
  await expect(nav.getByRole('link', { name: 'Oferta' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Kontakt' })).not.toHaveAttribute('aria-current');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/shell.spec.ts`
Expected: FAIL — subpages return 404, no `h1`/landmarks.

- [ ] **Step 3: Write `src/styles/tokens.css`**

```css
/* Values copied from the design's THEMES object (design/Omelanska Redesign.dc.html). */
:root {
  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --ease: cubic-bezier(.22, .61, .36, 1);
  --gutter: 18px;
  --max: 1280px;
  --bp: 900px;
  --accent: #2a5db0;
  --accent-border: rgba(42, 93, 176, .55);
  --accent-wash: rgba(42, 93, 176, .14);
  --logo-blue: #009fe3;
  --logo-window: #ffffff;
}

:root,
:root[data-theme='dark'] {
  color-scheme: dark;
  --bg: #0c1723;
  --surf: #12253d;
  --surf-hi: #173254;
  --ink: #f2f6fb;
  --on-accent: #ffffff;
  --wash: rgba(242, 246, 251, .05);
  --wash-a: rgba(242, 246, 251, .1);
  --line: rgba(242, 246, 251, .14);
  --line2: rgba(242, 246, 251, .3);
  --dim: rgba(242, 246, 251, .6);
  --mid: rgba(242, 246, 251, .72);
  --body: rgba(242, 246, 251, .85);
  --shadow: rgba(0, 0, 0, .7);
  --accent-text: #8ab6f0;
  --logo-grey: rgba(242, 246, 251, .6);
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme='dark']) {
    color-scheme: light;
    --bg: #ffffff;
    --surf: #f1f4f9;
    --surf-hi: #e6ecf5;
    --ink: #12253d;
    --on-accent: #ffffff;
    --wash: rgba(18, 37, 61, .05);
    --wash-a: rgba(18, 37, 61, .1);
    --line: rgba(18, 37, 61, .15);
    --line2: rgba(18, 37, 61, .3);
    --dim: rgba(18, 37, 61, .74);
    --mid: rgba(18, 37, 61, .82);
    --body: rgba(18, 37, 61, .9);
    --shadow: rgba(18, 37, 61, .2);
    --accent-text: #1e4c96;
    --logo-grey: #818181;
  }
}

:root[data-theme='light'] {
  color-scheme: light;
  --bg: #ffffff;
  --surf: #f1f4f9;
  --surf-hi: #e6ecf5;
  --ink: #12253d;
  --on-accent: #ffffff;
  --wash: rgba(18, 37, 61, .05);
  --wash-a: rgba(18, 37, 61, .1);
  --line: rgba(18, 37, 61, .15);
  --line2: rgba(18, 37, 61, .3);
  --dim: rgba(18, 37, 61, .74);
  --mid: rgba(18, 37, 61, .82);
  --body: rgba(18, 37, 61, .9);
  --shadow: rgba(18, 37, 61, .2);
  --accent-text: #1e4c96;
  --logo-grey: #818181;
}

@media (min-width: 900px) {
  :root { --gutter: 40px; }
}
```

- [ ] **Step 4: Write `src/styles/global.css`**

```css
*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font: 400 16px/1.6 var(--font-sans);
  transition: background-color .28s var(--ease), color .28s var(--ease);
}

h1, h2, h3 { margin: 0; font-weight: 600; letter-spacing: -.02em; text-wrap: pretty; }
p { margin: 0; }
ul, ol { margin: 0; padding: 0; }
img { display: block; max-width: 100%; height: auto; }

a { color: var(--accent-text); text-underline-offset: 3px; }
.link { text-decoration: underline; }

:focus-visible { outline: 2px solid var(--accent-text); outline-offset: 2px; }
[tabindex='-1']:focus { outline: none; }

.wrap { max-width: var(--max); margin-inline: auto; padding-inline: var(--gutter); }

.mono { font-family: var(--font-mono); }

.eyebrow {
  font: 500 10.5px var(--font-mono);
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--accent-text);
}
@media (min-width: 900px) { .eyebrow { font-size: 12px; } }

.section { border-top: 1px solid var(--line); }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5em;
  min-height: 44px;
  padding: 11px 20px;
  border: 1px solid transparent;
  border-radius: 3px;
  font: 600 14px/1.2 var(--font-sans);
  text-decoration: none;
  cursor: pointer;
  transition: transform .2s var(--ease), box-shadow .2s ease, background-color .2s ease, border-color .2s ease, color .2s ease;
}
.btn--primary { background: var(--accent); color: var(--on-accent); }
.btn--primary:hover { color: var(--on-accent); transform: translateY(-2px); box-shadow: 0 8px 22px -8px rgba(0, 0, 0, .45); }
.btn--soft { background: var(--wash); border-color: var(--line); color: var(--ink); }
.btn--soft:hover { background: var(--accent-wash); transform: translateY(-2px); }
.btn--ghost { border-color: var(--line); color: var(--body); }
.btn--ghost:hover { border-color: currentColor; color: var(--ink); }
.btn--block { display: flex; width: 100%; }

.visually-hidden {
  position: absolute !important;
  width: 1px; height: 1px;
  margin: -1px; padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.skip-link {
  position: absolute;
  left: 8px; top: 8px;
  z-index: 100;
  padding: 10px 16px;
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 600;
  border-radius: 3px;
  transform: translateY(-150%);
}
.skip-link:focus { transform: none; }

@media (max-width: 899.98px) { .desktop-only { display: none !important; } }
@media (min-width: 900px) { .mobile-only { display: none !important; } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 5: Write shared small components**

`src/components/Logo.astro` (three-building mark from `design/logo.svg`):
```astro
---
interface Props { class?: string }
const { class: className } = Astro.props;
---
<svg class:list={['logo', className]} viewBox="0 0 135 58" aria-hidden="true" focusable="false">
  <path class="logo__grey" d="M0 57.5V15.5L20.25 0L40.5 15.5V57.5Z" />
  <path class="logo__blue" d="M47 57.5V15.5L67.4 0L87.75 15.5V57.5Z" />
  <path class="logo__grey" d="M94.25 57.5V15.5L114.5 0L134.75 15.5V57.5Z" />
  {[0, 47, 94.25].map((x) => (
    <g class="logo__win" transform={`translate(${x} 0)`}>
      <rect x="6" y="22.75" width="5.5" height="5.5" /><rect x="17.75" y="22.75" width="5.5" height="5.5" /><rect x="29.5" y="22.75" width="5.5" height="5.5" />
      <rect x="6" y="34.25" width="5.5" height="5.5" /><rect x="17.75" y="34.25" width="5.5" height="5.5" /><rect x="29.5" y="34.25" width="5.5" height="5.5" />
    </g>
  ))}
</svg>

<style>
  .logo { display: block; height: auto; }
  .logo__grey { fill: var(--logo-grey); }
  .logo__blue { fill: var(--logo-blue); }
  .logo__win { fill: var(--logo-window); }
</style>
```

`src/components/ExternalLink.astro`:
```astro
---
interface Props { href: string; class?: string; newTab?: boolean }
const { href, class: className, newTab = true } = Astro.props;
---
<a href={href} class={className} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined}>
  <slot />{newTab && <span class="visually-hidden"> (otwiera się w nowej karcie)</span>}
</a>
```

`src/components/PageIntro.astro`:
```astro
---
interface Props { eyebrow: string; title: string; lead: string; subtitle?: string }
const { eyebrow, title, lead, subtitle } = Astro.props;
---
<section class="intro">
  <div class="wrap">
    <p class="eyebrow">{eyebrow}</p>
    <h1 tabindex="-1">{title}</h1>
    {subtitle && <p class="intro__subtitle">{subtitle}</p>}
    <p class="intro__lead">{lead}</p>
    <slot />
  </div>
</section>

<style>
  .intro { padding-block: 26px 20px; border-bottom: 1px solid var(--line); }
  .eyebrow { margin-bottom: 12px; }
  h1 { font-size: 30px; line-height: 1.12; letter-spacing: -.03em; margin-bottom: 12px; }
  .intro__subtitle { font-size: 15px; font-weight: 600; line-height: 1.35; margin-bottom: 12px; }
  .intro__lead { font-size: 14.5px; line-height: 1.55; color: var(--mid); max-width: 46em; }
  @media (min-width: 900px) {
    .intro { padding-block: 46px 36px; }
    .eyebrow { margin-bottom: 14px; }
    h1 { font-size: 40px; }
    .intro__subtitle { font-size: 17px; margin-bottom: 14px; }
    .intro__lead { font-size: 16px; line-height: 1.6; }
  }
</style>
```

- [ ] **Step 6: Theme toggle and top bar**

`src/components/ThemeToggle.astro`:
```astro
<theme-toggle class="toggle">
  <button type="button" class="toggle__btn" aria-pressed="false">
    <span class="visually-hidden">Jasny motyw</span>
    <span class="toggle__knob" aria-hidden="true"></span>
    <span class="toggle__label toggle__label--dark" aria-hidden="true">Ciemny</span>
    <span class="toggle__label toggle__label--light" aria-hidden="true">Jasny</span>
  </button>
</theme-toggle>

<script>
  class ThemeToggle extends HTMLElement {
    connectedCallback() {
      const button = this.querySelector('button');
      if (!button) return;
      const root = document.documentElement;
      const sync = () => button.setAttribute('aria-pressed', String(root.dataset.theme === 'light'));
      sync();
      button.addEventListener('click', () => {
        const next = root.dataset.theme === 'light' ? 'dark' : 'light';
        root.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch { /* storage unavailable */ }
        sync();
      });
    }
  }
  if (!customElements.get('theme-toggle')) customElements.define('theme-toggle', ThemeToggle);
</script>

<style>
  .toggle { display: inline-flex; }
  .toggle__btn {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 24px;
    padding: 2px;
    background: var(--wash);
    border: 1px solid var(--line);
    border-radius: 20px;
    cursor: pointer;
    font: 600 10px var(--font-mono);
    letter-spacing: .04em;
    text-transform: uppercase;
  }
  .toggle__knob {
    position: absolute;
    top: 2px; left: 2px;
    width: calc(50% - 2px);
    height: calc(100% - 4px);
    background: var(--accent);
    border-radius: 16px;
    transition: transform .28s var(--ease);
  }
  .toggle__label { position: relative; padding: 3px 9px; color: var(--dim); transition: color .24s ease; }
  .toggle__label--dark { color: var(--on-accent); }
  :global([data-theme='light']) .toggle__knob { transform: translateX(100%); }
  :global([data-theme='light']) .toggle__label--dark { color: var(--dim); }
  :global([data-theme='light']) .toggle__label--light { color: var(--on-accent); }
  @media (min-width: 900px) {
    .toggle__btn { font-size: 11px; }
    .toggle__label { padding: 4px 11px; }
  }
</style>
```

Note: `data-theme` is always set by the bootstrap script when JS runs; the toggle only exists usefully with JS, so the no-JS light-scheme case does not need knob styling.

`src/components/TopBar.astro`:
```astro
---
import { CONTACT, EMERGENCY } from '../data/site';
import { telHref } from '../lib/phone';
import ThemeToggle from './ThemeToggle.astro';

const numbers = EMERGENCY.filter((e) => e.topBar);
---
<div class="topbar">
  <div class="wrap topbar__inner">
    <p class="topbar__sos">
      <span class="topbar__dot" aria-hidden="true"></span>
      <span class="topbar__label">Awaria?</span>
      {numbers.map((e) => (
        <a
          class:list={['topbar__num', { 'desktop-only': e.topBar === 'desktop' }]}
          href={telHref(e.number)}
          aria-label={`${e.label}: ${e.number}`}
        >{e.number}</a>
      ))}
    </p>
    <p class="topbar__contact desktop-only">
      <a href={telHref(CONTACT.phone)}>tel. {CONTACT.phone}</a>
      <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
      <span>{CONTACT.hoursShort}</span>
    </p>
    <ThemeToggle />
  </div>
</div>

<style>
  .topbar { background: var(--surf); border-bottom: 1px solid var(--line); color: var(--mid); }
  .topbar__inner { display: flex; align-items: center; gap: 12px; padding-block: 7px; }
  .topbar__sos { display: flex; align-items: center; flex-wrap: wrap; gap: 0 2px; font: 500 11.5px var(--font-mono); }
  .topbar__dot { width: 6px; height: 6px; margin-right: 6px; border-radius: 50%; background: var(--accent); animation: pulse 2.2s ease-in-out infinite; }
  .topbar__label { margin-right: 6px; color: var(--accent-text); letter-spacing: .06em; text-transform: uppercase; }
  .topbar__num { display: inline-flex; align-items: center; min-height: 24px; min-width: 24px; padding-inline: 3px; color: var(--dim); text-decoration: none; }
  .topbar__num:hover { color: var(--ink); text-decoration: underline; }
  .topbar__num + .topbar__num::before { content: '·' / ''; margin-right: 6px; color: var(--dim); }
  .topbar__contact { display: flex; gap: 22px; margin-left: auto; font-size: 12.5px; }
  .topbar__contact a { color: inherit; text-decoration: none; }
  .topbar__contact a:hover { text-decoration: underline; }
  .topbar :global(.toggle) { margin-left: auto; }
  @keyframes pulse { 0%, 100% { opacity: .45; } 50% { opacity: 1; } }
  @media (min-width: 900px) {
    .topbar__inner { padding-block: 10px; gap: 22px; }
    .topbar__sos { font-size: 12.5px; }
    .topbar__dot { width: 7px; height: 7px; }
    .topbar :global(.toggle) { margin-left: 0; }
  }
</style>
```

- [ ] **Step 7: Mobile menu, header, footer**

`src/components/MobileMenu.astro`:
```astro
---
import { NAV } from '../data/pages';
import { EKARTOTEKA_URL } from '../data/site';
import { url } from '../lib/url';

interface Props { current: string }
const { current } = Astro.props;
---
<mobile-menu class="mobile-only">
  <button type="button" class="burger" aria-haspopup="dialog" aria-expanded="false" aria-controls="mobile-menu">
    <span class="visually-hidden">Menu</span>
    <span class="burger__bars" aria-hidden="true"><span></span><span></span><span></span></span>
  </button>
  <dialog id="mobile-menu" class="sheet" aria-label="Menu">
    <div class="sheet__body">
      <div class="sheet__handle" aria-hidden="true"></div>
      <nav aria-label="Menu mobilne">
        <ul class="sheet__list">
          {NAV.map((p) => (
            <li>
              <a href={url(p.path)} aria-current={url(p.path) === current ? 'page' : undefined}>{p.nav}</a>
            </li>
          ))}
        </ul>
      </nav>
      <a class="btn btn--primary btn--block sheet__cta" href={EKARTOTEKA_URL}>E-kartoteka</a>
      <button type="button" class="btn btn--ghost btn--block" data-close>Zamknij menu</button>
    </div>
  </dialog>
</mobile-menu>

<script>
  class MobileMenu extends HTMLElement {
    connectedCallback() {
      const button = this.querySelector<HTMLButtonElement>('.burger');
      const dialog = this.querySelector('dialog');
      if (!button || !dialog) return;
      button.addEventListener('click', () => {
        dialog.showModal();
        button.setAttribute('aria-expanded', 'true');
      });
      dialog.addEventListener('close', () => {
        button.setAttribute('aria-expanded', 'false');
        button.focus();
      });
      dialog.addEventListener('click', (event) => {
        const target = event.target as Element;
        if (target === dialog || target.closest('[data-close], a')) dialog.close();
      });
    }
  }
  if (!customElements.get('mobile-menu')) customElements.define('mobile-menu', MobileMenu);
</script>

<style>
  .burger { display: grid; place-items: center; width: 44px; height: 44px; margin-right: -6px; background: none; border: 0; cursor: pointer; }
  .burger__bars { display: grid; gap: 4px; width: 20px; }
  .burger__bars span { height: 2px; background: var(--ink); }
  .sheet {
    width: 100%;
    max-width: 100%;
    max-height: 85dvh;
    margin: auto 0 0;
    padding: 0;
    border: 0;
    border-top: 1px solid var(--line);
    border-radius: 12px 12px 0 0;
    background: var(--surf);
    color: var(--ink);
    box-shadow: 0 -18px 40px -12px var(--shadow);
    transition: transform .3s var(--ease), opacity .24s ease, overlay .3s allow-discrete, display .3s allow-discrete;
  }
  .sheet:not([open]) { transform: translateY(101%); opacity: 0; }
  @starting-style { .sheet[open] { transform: translateY(101%); opacity: 0; } }
  .sheet::backdrop { background: rgba(0, 0, 0, .45); }
  .sheet__body { padding: 20px 18px 24px; }
  .sheet__handle { width: 38px; height: 4px; margin: 0 auto 18px; border-radius: 2px; background: var(--line2); }
  .sheet__list { list-style: none; display: grid; gap: 2px; }
  .sheet__list a { display: block; padding: 13px 0; border-bottom: 1px solid var(--line); color: var(--mid); font-size: 17px; font-weight: 600; text-decoration: none; }
  .sheet__list a[aria-current='page'] { color: var(--ink); }
  .sheet__cta { margin-block: 16px 8px; font-size: 15px; }
</style>
```

`src/components/Header.astro`:
```astro
---
import { NAV } from '../data/pages';
import { BUSINESS, EKARTOTEKA_URL } from '../data/site';
import { url } from '../lib/url';
import Logo from './Logo.astro';
import MobileMenu from './MobileMenu.astro';
import TopBar from './TopBar.astro';

const current = Astro.url.pathname;
---
<header class="header">
  <TopBar />
  <div class="header__bar">
    <div class="wrap header__inner">
      <a class="brand" href={url('/')}>
        <Logo class="brand__mark" />
        <span class="brand__text">
          <span class="brand__name">{BUSINESS.shortName}</span>
          <span class="brand__tagline">{BUSINESS.tagline}</span>
        </span>
      </a>
      <nav class="nav desktop-only" aria-label="Główna">
        <ul>
          {NAV.map((p) => (
            <li><a href={url(p.path)} aria-current={url(p.path) === current ? 'page' : undefined}>{p.nav}</a></li>
          ))}
        </ul>
      </nav>
      <a class="btn btn--primary desktop-only" href={EKARTOTEKA_URL}>E-kartoteka</a>
      <MobileMenu current={current} />
    </div>
  </div>
</header>

<style>
  .header__bar { background: var(--bg); border-bottom: 1px solid var(--line); }
  .header__inner { display: flex; align-items: center; justify-content: space-between; gap: 26px; padding-block: 14px; }
  .brand { display: flex; align-items: center; gap: 10px; color: var(--ink); text-decoration: none; }
  .brand :global(.brand__mark) { width: 48px; }
  .brand__text { display: grid; }
  .brand__name { font-size: 13.5px; font-weight: 600; letter-spacing: -.01em; }
  .brand__tagline { font-size: 9.5px; color: var(--dim); letter-spacing: .05em; text-transform: uppercase; }
  .nav { margin-left: auto; }
  .nav ul { list-style: none; display: flex; gap: 22px; }
  .nav a { position: relative; display: inline-block; padding-block: 4px 5px; color: var(--mid); font-size: 14.5px; font-weight: 500; text-decoration: none; transition: color .2s ease; }
  .nav a::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--ink); transform: scaleX(0); transition: transform .28s var(--ease); }
  .nav a:hover, .nav a[aria-current='page'] { color: var(--ink); }
  .nav a:hover::after, .nav a[aria-current='page']::after { transform: scaleX(1); }
  .nav a[aria-current='page']::after { background: var(--accent); }
  @media (min-width: 900px) {
    .header__inner { padding-block: 20px; }
    .brand { gap: 14px; }
    .brand :global(.brand__mark) { width: 64px; }
    .brand__name { font-size: 16.5px; }
    .brand__tagline { font-size: 12px; }
  }
</style>
```

`src/components/Footer.astro`:
```astro
---
import { NAV } from '../data/pages';
import { BUSINESS } from '../data/site';
import { url } from '../lib/url';

const year = new Date().getFullYear();
---
<footer class="footer">
  <div class="wrap footer__inner">
    <p>Copyright {year} {BUSINESS.shortName}</p>
    <nav aria-label="Stopka">
      <ul>
        {NAV.map((p) => <li><a href={url(p.path)}>{p.nav}</a></li>)}
      </ul>
    </nav>
  </div>
</footer>

<style>
  .footer { background: var(--bg); border-top: 1px solid var(--line); color: var(--dim); font-size: 12.5px; }
  .footer__inner { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px 20px; padding-block: 18px; }
  .footer ul { list-style: none; display: flex; flex-wrap: wrap; gap: 4px 20px; }
  .footer a { position: relative; display: inline-flex; align-items: center; min-height: 24px; color: var(--dim); text-decoration: none; transition: color .2s ease; }
  .footer a::after { content: ''; position: absolute; left: 0; right: 0; bottom: 2px; height: 1.5px; background: currentColor; transform: scaleX(0); transition: transform .28s var(--ease); }
  .footer a:hover { color: var(--ink); }
  .footer a:hover::after { transform: scaleX(1); }
</style>
```

- [ ] **Step 8: BaseLayout**

`src/layouts/BaseLayout.astro`:
```astro
---
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import plexLatin400 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2?url';
import plexLatin600 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2?url';
import '../styles/tokens.css';
import '../styles/global.css';
import { ClientRouter } from 'astro:transitions';
import Footer from '../components/Footer.astro';
import Header from '../components/Header.astro';
import { fullTitle, type PageMeta } from '../data/pages';
import { absoluteUrl, url } from '../lib/url';

interface Props { page: PageMeta; noindex?: boolean }
const { page, noindex = false } = Astro.props;
const title = fullTitle(page);
const canonical = absoluteUrl(page.path);
const ogImage = absoluteUrl('/og.png');
---
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={page.description} />
    {noindex ? <meta name="robots" content="noindex" /> : <link rel="canonical" href={canonical} />}
    <meta name="theme-color" content="#0c1723" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    <link rel="icon" href={url('/favicon.svg')} type="image/svg+xml" />
    <link rel="icon" href={url('/favicon-32.png')} sizes="32x32" type="image/png" />
    <link rel="apple-touch-icon" href={url('/apple-touch-icon.png')} />
    <link rel="sitemap" href={url('/sitemap-index.xml')} />
    <link rel="preload" href={plexLatin400} as="font" type="font/woff2" crossorigin />
    <link rel="preload" href={plexLatin600} as="font" type="font/woff2" crossorigin />

    <meta property="og:type" content="website" />
    <meta property="og:locale" content="pl_PL" />
    <meta property="og:site_name" content="Radosław Omelański – Zarządzanie Nieruchomościami" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={page.description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />

    <script is:inline>
      (function () {
        var root = document.documentElement;
        var theme = null;
        try { theme = localStorage.getItem('theme'); } catch (e) {}
        if (theme !== 'light' && theme !== 'dark') {
          theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        root.dataset.theme = theme;
        document.addEventListener('astro:before-swap', function (event) {
          event.newDocument.documentElement.dataset.theme = root.dataset.theme;
        });
      })();
    </script>
    <ClientRouter />
    <slot name="head" />
  </head>
  <body>
    <a class="skip-link" href="#main">Przejdź do treści</a>
    <Header />
    <main id="main" tabindex="-1">
      <slot />
    </main>
    <Footer />
    <script>
      // After client-side navigation move focus to the new page's h1.
      // ClientRouter's built-in announcer reads the new title.
      // `astro:after-swap` only fires on client navigation, so the initial load is never affected
      // regardless of when this module runs.
      let swapped = false;
      document.addEventListener('astro:after-swap', () => { swapped = true; });
      document.addEventListener('astro:page-load', () => {
        if (!swapped) return;
        swapped = false;
        if (location.hash) return;
        document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
      });
    </script>
  </body>
</html>
```

If `astro check` rejects the `?url` font imports, add `src/env.d.ts` containing `/// <reference types="astro/client" />` (Astro's client types declare `*?url`).

- [ ] **Step 9: Pages with final h1s (content filled in later tasks)**

`src/pages/index.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { HERO } from '../data/content';
import { PAGES } from '../data/pages';
---
<BaseLayout page={PAGES.home}>
  <section class="wrap"><h1 tabindex="-1">{HERO.title}</h1></section>
</BaseLayout>
```

`src/pages/akty-prawne.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PageIntro from '../components/PageIntro.astro';
import { PAGES } from '../data/pages';
---
<BaseLayout page={PAGES.acts}>
  <PageIntro eyebrow="Podstawa prawna" title="Akty prawne" lead="Przepisy, na których opiera się administrowanie Wspólnotą Mieszkaniową. Każda pozycja prowadzi do aktualnego tekstu w Dzienniku Ustaw." />
</BaseLayout>
```

`src/pages/oferta.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PageIntro from '../components/PageIntro.astro';
import { PAGES } from '../data/pages';
---
<BaseLayout page={PAGES.offer}>
  <PageIntro eyebrow="Dla wspólnot i spółdzielni" title="Oferta" subtitle="Radosław Omelański Zarządzanie Nieruchomościami" lead="Poniższy zakres jest zakresem podstawowym. Modyfikujemy go indywidualnie na życzenie Wspólnoty — wystarczy telefon albo wiadomość na biuro@omelanska.com." />
</BaseLayout>
```

`src/pages/rodo.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PageIntro from '../components/PageIntro.astro';
import { PAGES } from '../data/pages';
---
<BaseLayout page={PAGES.rodo}>
  <PageIntro eyebrow="Ochrona danych osobowych" title="Klauzula informacyjna RODO" lead="Informacja o przetwarzaniu danych osobowych właścicieli lokali i mieszkańców nieruchomości administrowanych przez naszą firmę." />
</BaseLayout>
```

`src/pages/kontakt.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PageIntro from '../components/PageIntro.astro';
import { PAGES } from '../data/pages';
---
<BaseLayout page={PAGES.contact}>
  <PageIntro eyebrow="Biuro w Kamieniu Pomorskim" title="Kontakt" lead="Sprawy bieżące najszybciej załatwimy telefonicznie w godzinach pracy biura. Awarie po godzinach — bezpośrednio do właściwego pogotowia." />
</BaseLayout>
```

- [ ] **Step 10: Run tests to verify they pass**

Run: `npm run check && npx playwright test tests/e2e/shell.spec.ts`
Expected: 0 check errors; all shell tests PASS on `desktop` and `mobile` (the aria-current test is skipped on mobile).

- [ ] **Step 11: Visual check against the design**

Run `npm run dev`, open `http://localhost:4321/oferta/` at 1280 px and 390 px in both themes and compare the top bar + header with `design/3b-oferta-jasny.png` and `design/3b-oferta-ciemny.png`. Fix spacing/colour mismatches in the component `<style>` blocks.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add theme tokens, layout shell, header, footer and route stubs"
```

---

### Task 4: Theme persistence and client-side navigation behaviour

**Files:**
- Create: `tests/e2e/theme.spec.ts`, `tests/e2e/navigation.spec.ts`, `tests/e2e/mobile-menu.spec.ts`
- Modify (only if a test fails): `src/layouts/BaseLayout.astro`, `src/components/ThemeToggle.astro`, `src/components/MobileMenu.astro`

**Interfaces:**
- Consumes: shell from Task 3.
- Produces: verified behaviour; no new API.

These tests exercise code written in Task 3. Write them, run them, and fix the Task 3 code until they pass.

- [ ] **Step 1: Write theme tests**

`tests/e2e/theme.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test.describe('system light preference', () => {
  test.use({ colorScheme: 'light' });
  test('follows the OS when nothing is stored', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

test.describe('system dark preference', () => {
  test.use({ colorScheme: 'dark' });
  test('follows the OS when nothing is stored', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('stored choice wins and is applied before first paint', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto('', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded');
    const themeAtDcl = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(themeAtDcl).toBe('light');
  });

  test('toggle switches, persists across reload and navigation', async ({ page }) => {
    await page.goto('');
    const toggle = page.getByRole('button', { name: 'Jasny motyw' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.getByRole('contentinfo').getByRole('link', { name: 'Kontakt' }).click();
    await expect(page).toHaveURL(/\/kontakt\/$/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByRole('button', { name: 'Jasny motyw' })).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, colorScheme: 'light' });
  test('CSS follows the OS scheme', async ({ page }) => {
    await page.goto('');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(255, 255, 255)');
  });
});
```

- [ ] **Step 2: Write navigation tests**

`tests/e2e/navigation.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('footer links navigate without a full reload and focus the h1', async ({ page }) => {
  await page.goto('');
  await page.evaluate(() => { (window as unknown as { __spa: boolean }).__spa = true; });
  await page.getByRole('contentinfo').getByRole('link', { name: 'Oferta' }).click();
  await expect(page).toHaveURL(/\/oferta\/$/);
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveText('Oferta');
  await expect(h1).toBeFocused();
  expect(await page.evaluate(() => (window as unknown as { __spa?: boolean }).__spa)).toBe(true);
  await expect(page).toHaveTitle(/^Oferta dla Wspólnot i Spółdzielni \|/);
});

test('back button restores the previous page', async ({ page }) => {
  await page.goto('');
  await page.getByRole('contentinfo').getByRole('link', { name: 'RODO' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Klauzula informacyjna RODO');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Administrowanie i rozliczanie Wspólnot Mieszkaniowych');
});

test('desktop nav updates aria-current after client navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop nav only');
  await page.goto('');
  const nav = page.getByRole('navigation', { name: 'Główna' });
  await nav.getByRole('link', { name: 'Akty prawne' }).click();
  await expect(page).toHaveURL(/\/akty-prawne\/$/);
  await expect(nav.getByRole('link', { name: 'Akty prawne' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Strona główna' })).not.toHaveAttribute('aria-current');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('links still work as normal page loads', async ({ page }) => {
    await page.goto('');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Kontakt' }).click();
    await expect(page).toHaveURL(/\/kontakt\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kontakt');
  });
});
```

- [ ] **Step 3: Write mobile menu tests**

`tests/e2e/mobile-menu.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile menu only');
});

test('opens as a modal dialog and closes with Escape, returning focus', async ({ page }) => {
  await page.goto('');
  const burger = page.getByRole('button', { name: 'Menu', exact: true });
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await burger.click();
  const dialog = page.getByRole('dialog', { name: 'Menu' });
  await expect(dialog).toBeVisible();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(burger).toBeFocused();
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
});

test('close button closes the menu', async ({ page }) => {
  await page.goto('');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Zamknij menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
});

test('link in menu navigates and closes the menu', async ({ page }) => {
  await page.goto('');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Menu mobilne' }).getByRole('link', { name: 'Kontakt' }).click();
  await expect(page).toHaveURL(/\/kontakt\/$/);
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});

test('menu marks the current page', async ({ page }) => {
  await page.goto('rodo/');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(
    page.getByRole('navigation', { name: 'Menu mobilne' }).getByRole('link', { name: 'RODO' }),
  ).toHaveAttribute('aria-current', 'page');
});
```

- [ ] **Step 4: Run the tests**

Run: `npx playwright test tests/e2e/theme.spec.ts tests/e2e/navigation.spec.ts tests/e2e/mobile-menu.spec.ts`
Expected: all PASS. If "link in menu navigates…" fails because focus lands on the burger, it means `dialog.close()` focus restoration ran after the router focused the h1. Fix in `MobileMenu.astro` by skipping `button.focus()` when the close was caused by a link:

```ts
let viaLink = false;
dialog.addEventListener('close', () => {
  button.setAttribute('aria-expanded', 'false');
  if (!viaLink) button.focus();
  viaLink = false;
});
dialog.addEventListener('click', (event) => {
  const target = event.target as Element;
  if (target.closest('a')) viaLink = true;
  if (target === dialog || target.closest('[data-close], a')) dialog.close();
});
```

Re-run until PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: cover theme persistence, client navigation and mobile menu"
```

---

### Task 5: Home page

**Files:**
- Create: `src/assets/hero.jpg` (copy of `design/WP_20150404_026.jpg`), `src/components/NumberedList.astro`, `src/components/Tabs.astro`, `src/components/PhoneGrid.astro`, `src/components/MapLink.astro`, `tests/e2e/home.spec.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `HERO`, `ABOUT`, `DUTIES`, `DUTIES_NOTE`, `EMERGENCY`, `CONTACT`, `BUSINESS`, `EKARTOTEKA_URL`, `MAPS_URL`, `telHref`, `url`, `ExternalLink`.
- Produces:
  - `<NumberedList items={string[]} columns?={1|2}>` — `<ol role="list">` with visual 01..NN numbers.
  - `<Tabs label={string} groups={DutyGroup[]}>` — `<tabs-widget>`; panels are `<section id="panel-{id}">` with `<h3 id="duty-{id}">`.
  - `<PhoneGrid>` — emergency grid.
  - `<MapLink height={number} mobileHeight?={number}>`.

- [ ] **Step 1: Write the failing test**

`tests/e2e/home.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('hero, tiles and sections are present', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('link', { name: /Zobacz swoje rozliczenia/ })).toHaveAttribute('href', 'https://ekartoteka.omelanska.com/');
  await expect(page.getByRole('link', { name: /Oferta dla Wspólnoty/ })).toHaveAttribute('href', '/oferta/');
  await expect(page.getByRole('heading', { level: 2, name: 'Doświadczenie i kontakt z mieszkańcami' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Zakres obowiązków' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Ważne telefony' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tel. Alarmowy: 112' }).last()).toHaveAttribute('href', 'tel:112');
  await expect(page.getByRole('img', { name: /Kamieniu Pomorskim/ })).toBeVisible();
});

test('tabs follow the WAI-ARIA pattern', async ({ page }) => {
  await page.goto('');
  const tablist = page.getByRole('tablist', { name: 'Zakres obowiązków' });
  const prawo = tablist.getByRole('tab', { name: 'Prawo' });
  const ksiegowosc = tablist.getByRole('tab', { name: 'Księgowość' });
  const technika = tablist.getByRole('tab', { name: 'Technika' });

  await expect(prawo).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Prawo' })).toBeVisible();
  await expect(page.getByRole('tabpanel', { name: 'Księgowość' })).toBeHidden();

  await ksiegowosc.click();
  await expect(ksiegowosc).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Księgowość' })).toContainText('Windykacja należności');

  await ksiegowosc.focus();
  await page.keyboard.press('End');
  await expect(technika).toBeFocused();
  await expect(technika).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(prawo).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(technika).toBeFocused();
  await page.keyboard.press('Home');
  await expect(prawo).toBeFocused();
});

test('tabs re-initialise after client-side navigation', async ({ page }) => {
  await page.goto('');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Kontakt' }).click();
  await expect(page).toHaveURL(/\/kontakt\/$/);
  await page.getByRole('contentinfo').getByRole('link', { name: 'Strona główna' }).click();
  await page.getByRole('tab', { name: 'Administracja' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Administracja' })).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('all four duty groups are readable', async ({ page }) => {
    await page.goto('');
    await expect(page.getByRole('tablist')).toHaveCount(0);
    for (const head of [
      'Reprezentacja i obsługa prawna Wspólnoty',
      'Obsługa rachunkowo-księgowa',
      'Obsługa administracyjna',
      'Obsługa techniczna nieruchomości',
    ]) {
      await expect(page.getByRole('heading', { level: 3, name: head })).toBeVisible();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/home.spec.ts`
Expected: FAIL — tiles, tabs and sections not found.

- [ ] **Step 3: Copy the photo**

```bash
mkdir -p src/assets && cp design/WP_20150404_026.jpg src/assets/hero.jpg
```

Astro's image pipeline (sharp) re-encodes the image and drops EXIF, so the GPS data in the original is not published.

- [ ] **Step 4: Components**

`src/components/NumberedList.astro`:
```astro
---
interface Props { items: string[]; columns?: 1 | 2 }
const { items, columns = 2 } = Astro.props;
---
<ol role="list" class:list={['num-list', { 'num-list--two': columns === 2 }]}>
  {items.map((text, i) => (
    <li>
      <span class="num-list__n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
      <span>{text}</span>
    </li>
  ))}
</ol>

<style>
  .num-list { list-style: none; display: grid; }
  .num-list li { display: flex; gap: 12px; padding: 11px 0; border-top: 1px solid var(--line); font-size: 14px; line-height: 1.5; color: var(--body); }
  .num-list__n { flex: none; padding-top: 3px; font: 500 10.5px var(--font-mono); color: var(--accent-text); }
  @media (min-width: 900px) {
    .num-list--two { grid-template-columns: 1fr 1fr; column-gap: 40px; }
    .num-list li { gap: 14px; padding: 13px 0; font-size: 14.5px; }
    .num-list__n { font-size: 11px; }
  }
</style>
```

`src/components/Tabs.astro`:
```astro
---
import type { DutyGroup } from '../data/duties';
import NumberedList from './NumberedList.astro';

interface Props { label: string; groups: DutyGroup[] }
const { label, groups } = Astro.props;
---
<tabs-widget class="tabs">
  <div class="tabs__list" role="tablist" aria-label={label} hidden>
    {groups.map((g, i) => (
      <button
        type="button"
        role="tab"
        id={`tab-${g.id}`}
        aria-controls={`panel-${g.id}`}
        aria-selected={i === 0 ? 'true' : 'false'}
        tabindex={i === 0 ? 0 : -1}
      >{g.label}</button>
    ))}
  </div>
  {groups.map((g) => (
    <section class="tabs__panel" id={`panel-${g.id}`} aria-labelledby={`duty-${g.id}`}>
      <h3 id={`duty-${g.id}`}>{g.head}</h3>
      <NumberedList items={g.items} />
    </section>
  ))}
</tabs-widget>

<script>
  class TabsWidget extends HTMLElement {
    private tabs: HTMLButtonElement[] = [];
    private panels: HTMLElement[] = [];

    connectedCallback() {
      const list = this.querySelector<HTMLElement>('[role="tablist"]');
      if (!list) return;
      this.tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
      this.panels = this.tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')!)!);
      this.panels.forEach((panel, i) => {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', this.tabs[i].id);
        panel.tabIndex = 0;
      });
      list.hidden = false;
      this.select(0, false);
      list.addEventListener('click', (event) => {
        const tab = (event.target as Element).closest<HTMLButtonElement>('[role="tab"]');
        if (tab) this.select(this.tabs.indexOf(tab), false);
      });
      list.addEventListener('keydown', (event) => this.onKey(event));
    }

    private onKey(event: KeyboardEvent) {
      const current = this.tabs.indexOf(document.activeElement as HTMLButtonElement);
      if (current < 0) return;
      const last = this.tabs.length - 1;
      const next = {
        ArrowRight: current === last ? 0 : current + 1,
        ArrowLeft: current === 0 ? last : current - 1,
        Home: 0,
        End: last,
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      this.select(next, true);
    }

    private select(index: number, focus: boolean) {
      this.tabs.forEach((tab, i) => {
        const active = i === index;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        this.panels[i].hidden = !active;
      });
      if (focus) this.tabs[index].focus();
    }
  }
  if (!customElements.get('tabs-widget')) customElements.define('tabs-widget', TabsWidget);
</script>

<style>
  .tabs { display: block; }
  .tabs__list { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 18px; }
  .tabs__list[hidden] { display: none; }
  .tabs__list button {
    min-height: 36px;
    padding: 9px 13px;
    border: 0;
    border-radius: 2px;
    background: var(--wash);
    color: var(--mid);
    font: 600 12.5px var(--font-sans);
    white-space: nowrap;
    cursor: pointer;
    transition: background-color .22s ease, color .22s ease, transform .22s var(--ease);
  }
  .tabs__list button:hover { transform: translateY(-2px); }
  .tabs__list button[aria-selected='true'] { background: var(--accent); color: var(--on-accent); }
  .tabs__panel { animation: rise .26s var(--ease) both; }
  .tabs__panel + .tabs__panel:not([hidden]) { margin-top: 24px; }
  .tabs__panel h3 { margin-bottom: 12px; font-size: 17px; line-height: 1.3; letter-spacing: -.01em; }
  @keyframes rise { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: none; } }
  @media (min-width: 900px) {
    .tabs__list { gap: 8px; margin-bottom: 26px; }
    .tabs__list button { padding: 10px 18px; font-size: 13.5px; }
    .tabs__panel:not([hidden]) { display: grid; grid-template-columns: .55fr 1.45fr; gap: 44px; }
    .tabs__panel h3 { margin: 0; font-size: 23px; line-height: 1.25; letter-spacing: -.02em; }
  }
</style>
```

`src/components/PhoneGrid.astro`:
```astro
---
import { EMERGENCY } from '../data/site';
import { telHref } from '../lib/phone';
---
<ul class="phones" role="list">
  {EMERGENCY.map((e) => (
    <li class:list={{ 'desktop-only': !e.mobileGrid }}>
      <a class="phone" href={telHref(e.number)} aria-label={`${e.label}: ${e.number}`}>
        <span class="phone__label">{e.label}</span>
        <span class:list={['phone__num', { 'phone__num--hl': e.highlight }]}>{e.number}</span>
      </a>
    </li>
  ))}
</ul>

<style>
  .phones { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .phone {
    display: flex;
    flex-direction: column-reverse;
    gap: 3px;
    padding: 12px 14px;
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 2px;
    color: var(--ink);
    text-decoration: none;
    transition: border-color .2s ease, transform .2s var(--ease);
  }
  .phone:hover { border-color: var(--accent-border); transform: translateY(-2px); }
  .phone__label { font-size: 11.5px; color: var(--dim); }
  .phone__num { font: 700 21px var(--font-mono); }
  .phone__num--hl { color: var(--accent-text); }
  @media (min-width: 900px) {
    .phones { grid-template-columns: repeat(3, 1fr); }
    .phone { flex-direction: row; justify-content: space-between; align-items: baseline; padding: 14px 16px; }
    .phone__label { font-size: 12.5px; }
    .phone__num { font-size: 19px; }
  }
</style>
```

`src/components/MapLink.astro`:
```astro
---
import { BUSINESS, MAPS_URL } from '../data/site';
import ExternalLink from './ExternalLink.astro';

interface Props { height: number; mobileHeight?: number }
const { height, mobileHeight = 170 } = Astro.props;
---
<div class="map-wrap" style={`--map-h: ${height}px; --map-mh: ${mobileHeight}px`}>
  <ExternalLink href={MAPS_URL} class="map">
    <svg class="map__pin" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
    <span class="map__text">
      <span class="map__cta">Pokaż na mapie Google</span>
      <span class="map__addr">{BUSINESS.street}, {BUSINESS.postalCode} {BUSINESS.city}</span>
    </span>
  </ExternalLink>
</div>

<style>
  .map-wrap { height: var(--map-mh); }
  .map-wrap :global(.map) {
    display: grid;
    place-items: center;
    align-content: center;
    gap: 8px;
    height: 100%;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 3px;
    background: repeating-linear-gradient(135deg, var(--wash-a) 0 10px, var(--wash) 10px 20px);
    color: var(--ink);
    text-align: center;
    text-decoration: none;
    transition: border-color .2s ease;
  }
  .map-wrap :global(.map:hover) { border-color: var(--accent-border); }
  .map__pin { width: 28px; height: 28px; fill: var(--accent-text); }
  .map__text { display: grid; gap: 2px; }
  .map__cta { font-weight: 600; font-size: 14px; color: var(--accent-text); text-decoration: underline; text-underline-offset: 3px; }
  .map__addr { font: 500 11px var(--font-mono); color: var(--dim); }
  @media (min-width: 900px) { .map-wrap { height: var(--map-h); } }
</style>
```

Slot content passed to `ExternalLink` keeps this component's style scope, so `.map__pin`, `.map__cta` etc. are styled; only the `<a>` itself (rendered by `ExternalLink`) needs `:global(.map)`.

- [ ] **Step 5: Home page**

`src/pages/index.astro`:
```astro
---
import { Picture } from 'astro:assets';
import BaseLayout from '../layouts/BaseLayout.astro';
import MapLink from '../components/MapLink.astro';
import PhoneGrid from '../components/PhoneGrid.astro';
import Tabs from '../components/Tabs.astro';
import { ABOUT, HERO } from '../data/content';
import { DUTIES, DUTIES_NOTE } from '../data/duties';
import { PAGES } from '../data/pages';
import { BUSINESS, CONTACT, EKARTOTEKA_URL } from '../data/site';
import { telHref } from '../lib/phone';
import { url } from '../lib/url';
import hero from '../assets/hero.jpg';

const tiles = [
  { n: '01', title: 'Zobacz swoje rozliczenia', desc: 'E-kartoteka — saldo, opłaty, media', href: EKARTOTEKA_URL, primary: true },
  { n: '02', title: 'Zgłoś awarię lub usterkę', desc: `${CONTACT.phone} albo ${CONTACT.email}`, href: url('/kontakt/') },
  { n: '03', title: 'Akty prawne', desc: 'Ustawy i uchwały wspólnot', href: url('/akty-prawne/') },
  { n: '04', title: 'Oferta dla Wspólnoty', desc: 'Zakres i warunki współpracy', href: url('/oferta/') },
];
---
<BaseLayout page={PAGES.home}>
  <section class="hero">
    <div class="wrap hero__grid">
      <div class="hero__copy">
        <p class="eyebrow">{HERO.eyebrow}</p>
        <h1 tabindex="-1">{HERO.title}</h1>
        <p class="hero__lead">{HERO.lead}</p>
        <p class="hero__cta desktop-only">
          <a class="btn btn--soft" href={url('/oferta/')}>Zobacz ofertę</a>
          <a class="btn btn--ghost" href={url('/kontakt/')}>Zgłoś awarię</a>
        </p>
      </div>
      <ul class="tiles" role="list">
        {tiles.map((t) => (
          <li>
            <a class:list={['tile', { 'tile--primary': t.primary }]} href={t.href}>
              <span class="tile__n" aria-hidden="true">{t.n}</span>
              <span class="tile__title">{t.title}</span>
              <span class="tile__desc">{t.desc}</span>
              <span class="tile__arrow" aria-hidden="true">→</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  </section>

  <Picture
    src={hero}
    formats={['avif', 'webp']}
    alt="Molo i nabrzeże w Kamieniu Pomorskim z widokiem na kamienice starego miasta"
    layout="full-width"
    priority
    class="hero-photo"
  />

  <section class="about" aria-labelledby="about-title">
    <div class="wrap two-col">
      <div>
        <p class="eyebrow">{ABOUT.eyebrow}</p>
        <h2 id="about-title">Doświadczenie<br class="desktop-only" /> i kontakt z&nbsp;mieszkańcami</h2>
      </div>
      <div class="about__text">
        {ABOUT.paragraphs.map((p) => <p>{p}</p>)}
      </div>
    </div>
  </section>

  <section class="duties" aria-labelledby="duties-title">
    <div class="wrap">
      <div class="duties__head">
        <h2 id="duties-title">Zakres obowiązków</h2>
        <p class="duties__note desktop-only">{DUTIES_NOTE}</p>
      </div>
      <Tabs label="Zakres obowiązków" groups={DUTIES} />
    </div>
  </section>

  <section class="info">
    <div class="wrap info__grid">
      <section class="info__phones" aria-labelledby="phones-title">
        <h2 id="phones-title">Ważne telefony</h2>
        <PhoneGrid />
      </section>
      <section class="info__office" aria-labelledby="office-title">
        <h2 id="office-title">Biuro</h2>
        <div class="office">
          <div>
            <p class="office__label">Kontakt</p>
            <p>
              telefon/fax: <a href={telHref(CONTACT.phoneFax)}>{CONTACT.phoneFax}</a><br />
              tel.: <a href={telHref(CONTACT.phone)}>{CONTACT.phone}</a><br />
              <a class="link" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </p>
          </div>
          <div>
            <p class="office__label">Adres i godziny</p>
            <p>
              {BUSINESS.street}<br />{BUSINESS.postalCode} {BUSINESS.city}<br />
              pon.–pt. <strong>{CONTACT.hoursTime}</strong>
            </p>
          </div>
        </div>
        <MapLink height={132} />
      </section>
    </div>
  </section>
</BaseLayout>

<style>
  .hero__grid { display: grid; }
  .hero__copy { padding-block: 28px 22px; }
  .hero .eyebrow { margin-bottom: 12px; }
  h1 { margin-bottom: 14px; font-size: 30px; line-height: 1.12; letter-spacing: -.03em; }
  .hero__lead { font-size: 14.5px; line-height: 1.55; color: var(--mid); max-width: 34em; }
  .hero__cta { display: flex; gap: 12px; margin-top: 28px; }
  .hero__cta .btn { padding: 14px 24px; font-size: 15px; }

  .tiles { list-style: none; display: grid; gap: 9px; padding-bottom: 22px; }
  .tile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 52px;
    padding: 14px 18px;
    background: var(--surf);
    border: 1px solid var(--line);
    border-radius: 3px;
    color: var(--ink);
    text-decoration: none;
    transition: transform .22s var(--ease), border-color .22s ease, background-color .22s ease;
  }
  .tile:hover { border-color: var(--accent-border); }
  .tile:active { transform: scale(.975); }
  .tile--primary { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  .tile__n, .tile__desc { display: none; }
  .tile__title { font-weight: 600; font-size: 15px; }
  .tile__arrow { color: var(--dim); }
  .tile--primary .tile__arrow { color: var(--on-accent); }

  :global(.hero-photo) { width: 100%; height: 170px; object-fit: cover; object-position: 50% 55%; border-block: 1px solid var(--wash-a); }

  .about { border-bottom: 1px solid var(--wash-a); padding-block: 26px; }
  .two-col { display: grid; gap: 14px; }
  .about .eyebrow { margin-bottom: 10px; }
  .about h2 { font-size: 21px; line-height: 1.2; }
  .about__text { display: grid; gap: 14px; font-size: 14px; line-height: 1.65; color: var(--body); max-width: 46em; }

  .duties { padding-block: 26px; }
  .duties__head { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; margin-bottom: 16px; }
  .duties h2 { font-size: 21px; }
  .duties__note { font-size: 13.5px; color: var(--dim); }

  .info { background: var(--surf); border-top: 1px solid var(--wash-a); }
  .info__grid { display: grid; }
  .info h2 { margin-bottom: 14px; font-size: 20px; }
  .info__phones, .info__office { padding-block: 26px; }
  .info__office { border-top: 1px solid var(--wash-a); }
  .office { display: grid; gap: 16px; margin-bottom: 16px; font-size: 14.5px; line-height: 1.75; color: var(--body); }
  .office a { color: inherit; }
  .office .link { color: var(--accent-text); }
  .office strong { color: var(--ink); }
  .office__label { margin-bottom: 7px; font: 500 10.5px var(--font-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--dim); }

  @media (min-width: 900px) {
    .hero__grid { grid-template-columns: 1.1fr .9fr; }
    .hero__copy { padding: 56px 44px 52px 0; border-right: 1px solid var(--wash-a); }
    .hero .eyebrow { margin-bottom: 18px; }
    h1 { margin-bottom: 20px; font-size: 46px; max-width: 16em; }
    .hero__lead { font-size: 16.5px; line-height: 1.6; }
    .tiles { grid-template-columns: 1fr 1fr; gap: 10px; align-content: center; padding: 32px 0 32px 36px; }
    .tile, .tile--primary { display: block; padding: 20px; background: var(--surf); border-color: var(--line); color: var(--ink); height: 100%; }
    .tile:hover { transform: translateY(-3px); background: var(--accent-wash); }
    .tile__n { display: block; margin-bottom: 30px; font: 500 11px var(--font-mono); letter-spacing: .06em; color: var(--accent-text); }
    .tile__title { display: block; font-size: 15.5px; }
    .tile__desc { display: block; margin-top: 5px; font-size: 12.5px; color: var(--dim); }
    .tile__arrow { display: none; }
    :global(.hero-photo) { height: 280px; }
    .about { padding-block: 52px 56px; }
    .two-col { grid-template-columns: .55fr 1.45fr; gap: 44px; }
    .about .eyebrow { margin-bottom: 14px; }
    .about h2 { font-size: 30px; line-height: 1.15; }
    .about__text { gap: 18px; font-size: 15.5px; line-height: 1.7; }
    .duties { padding-block: 52px 56px; }
    .duties__head { margin-bottom: 22px; }
    .duties h2 { font-size: 30px; }
    .info__grid { grid-template-columns: 1.1fr .9fr; }
    .info h2 { margin-bottom: 20px; font-size: 24px; }
    .info__phones { padding: 44px 40px 44px 0; border-right: 1px solid var(--wash-a); }
    .info__office { padding: 44px 0 44px 40px; border-top: 0; }
    .office { grid-template-columns: 1fr 1fr; gap: 24px; }
  }
</style>
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run check && npx playwright test tests/e2e/home.spec.ts`
Expected: PASS on both projects.

- [ ] **Step 7: Visual check**

`npm run dev`; compare `/` with `design/2a-strona-glowna-ciemny.png` and `design/2a-strona-glowna-jasny.png` at 1280 px and 390 px. Adjust styles only.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: build home page with accessible duty tabs, phones and office info"
```

---

### Task 6: Akty prawne, Oferta, RODO and Kontakt pages

**Files:**
- Modify: `src/pages/akty-prawne.astro`, `src/pages/oferta.astro`, `src/pages/rodo.astro`, `src/pages/kontakt.astro`
- Create: `tests/e2e/pages.spec.ts`

**Interfaces:**
- Consumes: `ACTS`, `DUTIES`, `RODO`, `RODO_COOKIES_NOTE`, `AFTER_HOURS`, `CONTACT`, `BUSINESS`, `EKARTOTEKA_URL`, `telHref`, `PageIntro`, `NumberedList`, `ExternalLink`, `MapLink`.
- Produces: final subpages.

- [ ] **Step 1: Write the failing test**

`tests/e2e/pages.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('Akty prawne lists acts linking to Dz.U. in a new tab', async ({ page }) => {
  await page.goto('akty-prawne/');
  await expect(page.getByRole('heading', { level: 2, name: 'Ustawa o własności lokali' })).toBeVisible();
  const link = page.getByRole('link', { name: /Otwórz w Dz\.U\..*Ustawa o własności lokali/ });
  await expect(link).toHaveAttribute('href', 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19940850388');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toContainText('otwiera się w nowej karcie');
  await expect(page.getByRole('link', { name: 'Przejdź do E-kartoteki' })).toHaveAttribute('href', 'https://ekartoteka.omelanska.com/');
});

test('Oferta shows four duty sections and contact CTAs', async ({ page }) => {
  await page.goto('oferta/');
  for (const head of [
    'Reprezentacja i obsługa prawna Wspólnoty',
    'Obsługa rachunkowo-księgowa',
    'Obsługa administracyjna',
    'Obsługa techniczna nieruchomości',
  ]) {
    await expect(page.getByRole('heading', { level: 2, name: head })).toBeVisible();
  }
  await expect(page.getByRole('listitem').filter({ hasText: 'Ubezpieczenie budynku.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Napisz do nas' })).toHaveAttribute('href', 'mailto:biuro@omelanska.com');
  await expect(page.getByRole('link', { name: /518 629 878/ }).last()).toHaveAttribute('href', 'tel:+48518629878');
});

test('RODO table of contents jumps to sections', async ({ page }) => {
  await page.goto('rodo/');
  const toc = page.getByRole('navigation', { name: 'Spis treści' });
  await toc.getByRole('link', { name: /Okres przechowywania/ }).click();
  await expect(page).toHaveURL(/#okres$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Okres przechowywania' })).toBeInViewport();
  await expect(page.getByText('Strona nie używa plików cookies')).toBeVisible();
});

test('Kontakt offers call, e-mail, fax, after-hours numbers and map link', async ({ page }) => {
  await page.goto('kontakt/');
  await expect(page.getByRole('link', { name: /Zadzwoń/ }).first()).toHaveAttribute('href', 'tel:+48518629878');
  await expect(page.getByRole('link', { name: /Napisz/ }).first()).toHaveAttribute('href', 'mailto:biuro@omelanska.com');
  await expect(page.getByText('91 32 17 878').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Pogotowie gazowe: 992' })).toHaveAttribute('href', 'tel:992');
  await expect(page.getByRole('link', { name: /Pokaż na mapie Google/ })).toHaveAttribute('href', /google\.com\/maps/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/pages.spec.ts`
Expected: FAIL — page content missing.

- [ ] **Step 3: Akty prawne**

`src/pages/akty-prawne.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ExternalLink from '../components/ExternalLink.astro';
import PageIntro from '../components/PageIntro.astro';
import { ACTS } from '../data/acts';
import { PAGES } from '../data/pages';
import { EKARTOTEKA_URL } from '../data/site';
---
<BaseLayout page={PAGES.acts}>
  <PageIntro eyebrow="Podstawa prawna" title="Akty prawne" lead="Przepisy, na których opiera się administrowanie Wspólnotą Mieszkaniową. Każda pozycja prowadzi do aktualnego tekstu w Dzienniku Ustaw." />
  <div class="wrap acts">
    <ul class="acts__grid" role="list">
      {ACTS.map((act) => (
        <li class="act">
          <p class="act__meta"><span class="act__kind">{act.kind}</span><span>Dz.U.</span></p>
          <h2>{act.title}</h2>
          <p class="act__cite">{act.citation}</p>
          <p class="act__foot">
            <ExternalLink href={act.href} class="act__link">
              Otwórz w Dz.U. <span aria-hidden="true">↗</span><span class="visually-hidden"> – {act.title}</span>
            </ExternalLink>
            <span class="act__note">tekst jednolity</span>
          </p>
        </li>
      ))}
    </ul>
    <section class="cta" aria-labelledby="cta-title">
      <div>
        <h2 id="cta-title">Uchwały i regulaminy Twojej Wspólnoty</h2>
        <p>Dokumenty wewnętrzne są dostępne po zalogowaniu do E-kartoteki.</p>
      </div>
      <a class="btn btn--primary" href={EKARTOTEKA_URL}>Przejdź do E-kartoteki</a>
    </section>
  </div>
</BaseLayout>

<style>
  .acts { padding-block: 0 22px; }
  .acts__grid { list-style: none; display: grid; gap: 10px; padding-top: 20px; }
  .act { display: flex; flex-direction: column; padding: 20px; background: var(--surf); border: 1px solid var(--line); border-radius: 3px; transition: transform .24s var(--ease), border-color .22s ease, box-shadow .22s ease; }
  .act:hover { border-color: var(--accent-border); }
  .act__meta { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 14px; font: 500 10.5px var(--font-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--dim); }
  .act__kind { color: var(--accent-text); }
  .act h2 { margin-bottom: 8px; font-size: 19px; line-height: 1.25; }
  .act__cite { font: 500 11.5px/1.5 var(--font-mono); color: var(--dim); }
  .act__foot { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line); font-size: 13px; }
  :global(.act__link) { font-weight: 600; color: var(--accent-text); }
  .act__note { color: var(--dim); }
  .cta { display: grid; gap: 14px; margin-top: 22px; padding: 22px 18px 26px; background: var(--surf); border: 1px solid var(--line); border-radius: 3px; }
  .cta h2 { margin-bottom: 5px; font-size: 15.5px; letter-spacing: 0; }
  .cta p { font-size: 13.5px; line-height: 1.55; color: var(--mid); }
  @media (min-width: 900px) {
    .acts { padding-block: 0 44px; }
    .acts__grid { grid-template-columns: 1fr 1fr; gap: 16px; padding-top: 28px; }
    .act { min-height: 210px; padding: 26px 26px 22px; }
    .act:hover { transform: translateY(-3px); box-shadow: 0 14px 32px -14px rgba(0, 0, 0, .4); }
    .act__meta { margin-bottom: 20px; font-size: 11px; }
    .act h2 { margin-bottom: 10px; font-size: 24px; line-height: 1.22; }
    .act__cite { font-size: 12.5px; }
    .act__foot { margin-top: auto; padding-top: 22px; font-size: 13.5px; }
    .cta { display: flex; justify-content: space-between; align-items: center; margin-top: 26px; padding: 22px 24px; }
    .cta h2 { font-size: 16px; }
    .cta p { font-size: 14px; }
  }
</style>
```

(The design labels the card "PDF"; the link goes to the ISAP page, not a PDF, so the label reads "Dz.U." instead.)

- [ ] **Step 4: Oferta**

`src/pages/oferta.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import NumberedList from '../components/NumberedList.astro';
import PageIntro from '../components/PageIntro.astro';
import { DUTIES } from '../data/duties';
import { PAGES } from '../data/pages';
import { CONTACT } from '../data/site';
import { telHref } from '../lib/phone';
---
<BaseLayout page={PAGES.offer}>
  <PageIntro eyebrow="Dla wspólnot i spółdzielni" title="Oferta" subtitle="Radosław Omelański Zarządzanie Nieruchomościami" lead="Poniższy zakres jest zakresem podstawowym. Modyfikujemy go indywidualnie na życzenie Wspólnoty — wystarczy telefon albo wiadomość na biuro@omelanska.com." />
  {DUTIES.map((group, i) => (
    <section class="duty" aria-labelledby={`offer-${group.id}`}>
      <div class="wrap duty__grid">
        <div>
          <p class="duty__n">0{i + 1} — {group.label}</p>
          <h2 id={`offer-${group.id}`}>{group.head}</h2>
        </div>
        <NumberedList items={group.items} />
      </div>
    </section>
  ))}
  <section class="talk" aria-labelledby="talk-title">
    <div class="wrap talk__inner">
      <div>
        <h2 id="talk-title">Rozmowa o współpracy</h2>
        <p>Przygotujemy ofertę dla Twojej Wspólnoty po zapoznaniu się z budynkiem i dokumentacją.</p>
      </div>
      <p class="talk__actions">
        <a class="btn btn--primary" href={`mailto:${CONTACT.email}`}>Napisz do nas</a>
        <a class="btn btn--ghost" href={telHref(CONTACT.phone)}>
          <span class="mobile-only">Zadzwoń&nbsp;</span>{CONTACT.phone}
        </a>
      </p>
    </div>
  </section>
</BaseLayout>

<style>
  .duty { padding-block: 22px; border-bottom: 1px solid var(--line); }
  .duty__grid { display: grid; gap: 14px; }
  .duty__n { margin-bottom: 8px; font: 500 10.5px var(--font-mono); letter-spacing: .06em; color: var(--accent-text); }
  .duty h2 { font-size: 19px; line-height: 1.25; }
  .talk { background: var(--surf); padding-block: 24px 28px; }
  .talk__inner { display: grid; gap: 14px; }
  .talk h2 { margin-bottom: 8px; font-size: 20px; }
  .talk p { font-size: 14px; line-height: 1.55; color: var(--mid); }
  .talk__actions { display: grid; gap: 9px; }
  .talk__actions .btn { min-height: 50px; font-size: 14.5px; }
  @media (min-width: 900px) {
    .duty { padding-block: 36px; }
    .duty__grid { grid-template-columns: .55fr 1.45fr; gap: 44px; }
    .duty__n { margin-bottom: 10px; font-size: 11px; }
    .duty h2 { font-size: 24px; line-height: 1.2; }
    .talk { padding-block: 38px; }
    .talk__inner { display: flex; justify-content: space-between; align-items: center; gap: 40px; }
    .talk h2 { font-size: 26px; }
    .talk p { font-size: 15px; }
    .talk__actions { display: flex; gap: 10px; flex: none; }
    .talk__actions .btn { padding: 14px 22px; font-size: 15px; }
  }
</style>
```

- [ ] **Step 5: RODO**

`src/pages/rodo.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PageIntro from '../components/PageIntro.astro';
import { PAGES } from '../data/pages';
import { RODO, RODO_COOKIES_NOTE } from '../data/rodo';
import { CONTACT } from '../data/site';
---
<BaseLayout page={PAGES.rodo}>
  <PageIntro eyebrow="Ochrona danych osobowych" title="Klauzula informacyjna RODO" lead="Informacja o przetwarzaniu danych osobowych właścicieli lokali i mieszkańców nieruchomości administrowanych przez naszą firmę." />
  <div class="rodo">
    <div class="rodo__side">
      <div class="rodo__sticky">
        <nav aria-labelledby="toc-title">
          <p id="toc-title" class="rodo__toc-title">Spis treści</p>
          <ol role="list" class="toc">
            {RODO.map((r) => (
              <li><a href={`#${r.id}`}><span class="toc__n" aria-hidden="true">{r.n}</span>{r.title}</a></li>
            ))}
          </ol>
        </nav>
        <p class="rodo__ask desktop-only">
          Pytania o dane osobowe<br /><a href={`mailto:${CONTACT.email}`}><strong>{CONTACT.email}</strong></a>
        </p>
      </div>
    </div>
    <div class="rodo__body">
      {RODO.map((r) => (
        <section id={r.id} class="clause" aria-labelledby={`${r.id}-title`}>
          <h2 id={`${r.id}-title`}><span class="clause__n" aria-hidden="true">{r.n}</span>{r.title}</h2>
          <p>{r.body}</p>
        </section>
      ))}
      <section id="cookies" class="clause" aria-labelledby="cookies-title">
        <h2 id="cookies-title"><span class="clause__n" aria-hidden="true">07</span>Pliki cookies</h2>
        <p>{RODO_COOKIES_NOTE}</p>
      </section>
    </div>
  </div>
</BaseLayout>

<style>
  .rodo__side { padding: 18px var(--gutter); background: var(--surf); border-bottom: 1px solid var(--line); }
  .rodo__toc-title { margin-bottom: 10px; font: 500 10.5px var(--font-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--dim); }
  .toc { list-style: none; display: flex; flex-wrap: wrap; gap: 7px; }
  .toc a { display: flex; align-items: baseline; gap: 7px; padding: 9px 12px; border: 1px solid var(--line); border-radius: 2px; color: var(--mid); font-size: 12.5px; font-weight: 600; text-decoration: none; transition: background-color .22s ease, color .22s ease, padding-left .24s var(--ease); }
  .toc a:hover { color: var(--ink); background: var(--wash); }
  .toc__n { font: 500 10px var(--font-mono); color: var(--accent-text); }
  .rodo__body { padding: 8px var(--gutter) 28px; }
  .clause { padding: 18px 0; border-bottom: 1px solid var(--line); scroll-margin-top: 16px; transition: background-color .24s ease, border-color .24s ease; }
  .clause:target { background: var(--wash); }
  .clause h2 { display: flex; align-items: baseline; gap: 10px; margin-bottom: 7px; font-size: 17px; line-height: 1.25; letter-spacing: -.01em; }
  .clause__n { font: 500 10.5px var(--font-mono); color: var(--accent-text); }
  .clause p { margin-left: 22px; font-size: 14px; line-height: 1.6; color: var(--body); max-width: 44em; }
  .rodo__ask { margin-top: 22px; padding: 16px 18px; background: var(--bg); border: 1px solid var(--line); border-radius: 3px; font-size: 13.5px; line-height: 1.6; color: var(--mid); }
  .rodo__ask a { color: var(--ink); }
  @media (min-width: 900px) {
    .rodo { display: grid; grid-template-columns: .32fr .68fr; max-width: var(--max); margin-inline: auto; }
    .rodo__side { padding: 34px 32px 40px var(--gutter); border-bottom: 0; border-right: 1px solid var(--line); }
    .rodo__sticky { position: sticky; top: 16px; }
    .rodo__toc-title { margin-bottom: 16px; font-size: 11px; }
    .toc { display: grid; gap: 0; }
    .toc a { gap: 12px; margin-inline: -8px; padding: 11px 8px; border: 0; border-top: 1px solid var(--line); border-radius: 2px; font-size: 14px; font-weight: 400; }
    .toc a:hover { padding-left: 16px; background: none; }
    .toc__n { font-size: 11px; }
    .rodo__body { padding: 34px var(--gutter) 44px 40px; }
    .clause { margin-left: -16px; padding: 22px 18px 22px 16px; border-left: 3px solid transparent; }
    .clause:target { border-left-color: var(--accent); }
    .clause h2 { gap: 14px; margin-bottom: 8px; font-size: 20px; }
    .clause__n { font-size: 11px; }
    .clause p { margin-left: 25px; font-size: 15px; }
  }
</style>
```

- [ ] **Step 6: Kontakt**

`src/pages/kontakt.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import MapLink from '../components/MapLink.astro';
import PageIntro from '../components/PageIntro.astro';
import { PAGES } from '../data/pages';
import { AFTER_HOURS, BUSINESS, CONTACT } from '../data/site';
import { telHref } from '../lib/phone';
---
<BaseLayout page={PAGES.contact}>
  <PageIntro eyebrow="Biuro w Kamieniu Pomorskim" title="Kontakt" lead="Sprawy bieżące najszybciej załatwimy telefonicznie w godzinach pracy biura. Awarie po godzinach — bezpośrednio do właściwego pogotowia." />
  <div class="contact">
    <section class="contact__main" aria-labelledby="fast-title">
      <h2 id="fast-title">Najszybszy kontakt</h2>
      <ul class="cards" role="list">
        <li>
          <a class="card card--primary" href={telHref(CONTACT.phone)}>
            <span><span class="card__label">Telefon</span><span class="card__value">{CONTACT.phone}</span></span>
            <span class="card__action">Zadzwoń <span aria-hidden="true">→</span></span>
          </a>
        </li>
        <li>
          <a class="card" href={`mailto:${CONTACT.email}`}>
            <span><span class="card__label">E-mail</span><span class="card__value">{CONTACT.email}</span></span>
            <span class="card__action card__action--accent">Napisz <span aria-hidden="true">→</span></span>
          </a>
        </li>
        <li>
          <a class="card" href={telHref(CONTACT.phoneFax)}>
            <span><span class="card__label">Telefon / fax</span><span class="card__value">{CONTACT.phoneFax}</span></span>
            <span class="card__hint">w godzinach pracy biura</span>
          </a>
        </li>
      </ul>
      <h2 class="after__title" id="after-title">Awaria po godzinach pracy biura</h2>
      <ul class="after" role="list" aria-labelledby="after-title">
        {AFTER_HOURS.map((a) => (
          <li>
            <a href={telHref(a.number)} aria-label={`${a.label}: ${a.number}`}>
              <span>{a.label}</span><span class="after__num">{a.number}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
    <section class="contact__office" aria-labelledby="office-title">
      <h2 id="office-title">Dane biura</h2>
      <dl class="facts">
        <div><dt>Adres</dt><dd>{BUSINESS.street}<br />{BUSINESS.postalCode} {BUSINESS.city}</dd></div>
        <div><dt>Telefon</dt><dd>telefon/fax: {CONTACT.phoneFax}<br />tel.: {CONTACT.phone}</dd></div>
        <div><dt>E-mail</dt><dd><a class="link" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></dd></div>
        <div><dt>Godziny otwarcia</dt><dd>{CONTACT.hoursDays}<br /><strong>{CONTACT.hoursTime}</strong></dd></div>
      </dl>
      <MapLink height={230} />
    </section>
  </div>
</BaseLayout>

<style>
  .contact__main, .contact__office { padding: 24px var(--gutter); }
  .contact__office { background: var(--surf); border-top: 1px solid var(--line); }
  h2 { margin-bottom: 16px; font-size: 20px; }
  .cards { list-style: none; display: grid; gap: 9px; margin-bottom: 26px; }
  .card { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 18px; background: var(--surf); border: 1px solid var(--line); border-radius: 3px; color: var(--ink); text-decoration: none; transition: transform .2s var(--ease), border-color .22s ease, box-shadow .2s ease; }
  .card:hover { border-color: var(--accent-border); }
  .card--primary { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  .card__label { display: block; margin-bottom: 5px; font: 500 10.5px var(--font-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--dim); }
  .card--primary .card__label { color: var(--on-accent); opacity: .85; }
  .card__value { font-size: 17px; font-weight: 600; overflow-wrap: anywhere; }
  .card__action { flex: none; font-size: 14px; font-weight: 600; }
  .card__action--accent { color: var(--accent-text); }
  .card__hint { font-size: 13px; color: var(--dim); text-align: right; }
  .after__title { margin-bottom: 14px; font-size: 18px; }
  .after { list-style: none; font-size: 15px; line-height: 1.7; color: var(--body); }
  .after li { border-top: 1px solid var(--line); }
  .after li:last-child { border-bottom: 1px solid var(--line); }
  .after a { display: flex; justify-content: space-between; gap: 20px; padding: 13px 0; color: inherit; text-decoration: none; }
  .after a:hover .after__num { text-decoration: underline; }
  .after__num { font: 500 14px var(--font-mono); color: var(--accent-text); }
  .facts { display: grid; gap: 2px; margin: 0 0 18px; font-size: 14.5px; line-height: 1.75; color: var(--body); }
  .facts div { padding: 13px 0; border-top: 1px solid var(--line); }
  .facts div:last-child { border-bottom: 1px solid var(--line); }
  .facts dt { margin-bottom: 5px; font: 500 10.5px var(--font-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--dim); }
  .facts dd { margin: 0; }
  .facts strong { color: var(--ink); }
  @media (min-width: 900px) {
    .contact { display: grid; grid-template-columns: .58fr .42fr; max-width: var(--max); margin-inline: auto; }
    .contact__main { padding: 38px 40px 44px var(--gutter); border-right: 1px solid var(--line); }
    .contact__office { padding: 38px var(--gutter) 44px 40px; border-top: 0; }
    h2 { margin-bottom: 22px; font-size: 22px; }
    .card { padding: 20px 22px; }
    .card:hover { transform: translateY(-2px); }
    .card--primary:hover { box-shadow: 0 10px 26px -10px rgba(0, 0, 0, .45); }
    .card__label { font-size: 11px; }
    .card__value { font-size: 19px; }
    .facts { font-size: 15px; }
    .facts div { padding: 14px 0; }
    .facts dt { font-size: 11px; }
  }
</style>
```

Note: `.contact__office` has a full-width `--surf` background on mobile; on desktop the grid is constrained to `--max`, matching the design at 1280 px. If wider screens need full-bleed backgrounds, wrap `.contact` in a full-width element with a gradient background split at the column boundary — only if the visual check shows it matters.

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm run check && npx playwright test tests/e2e/pages.spec.ts`
Expected: PASS on both projects.

- [ ] **Step 8: Visual check**

`npm run dev`; compare each page with `design/3a-*`, `design/3b-*`, `design/3c-*`, `design/3d-*` (light and dark) at 1280 px and 390 px. Adjust styles only.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: build Akty prawne, Oferta, RODO and Kontakt pages"
```

---

### Task 7: 404 page, robots.txt, postbuild .htaccess

**Files:**
- Create: `src/pages/404.astro`, `src/pages/robots.txt.ts`, `scripts/postbuild.mjs`
- Modify: `package.json` (build script), `tests/e2e/seo.spec.ts` (create)

**Interfaces:**
- Consumes: `BaseLayout` (`noindex` prop), `url`, `absoluteUrl`.
- Produces: `dist/404.html`, `dist/robots.txt`, `dist/.htaccess`, `dist/_astro/.htaccess`.

- [ ] **Step 1: Write the failing test**

`tests/e2e/seo.spec.ts`:
```ts
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('404 page offers navigation and is noindex', async ({ page }) => {
  await page.goto('404.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nie znaleziono strony');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.getByRole('main').getByRole('link', { name: 'Strona główna' })).toHaveAttribute('href', '/');
});

test('robots.txt allows crawlers and points at the sitemap', async ({ request }) => {
  const res = await request.get('robots.txt');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain('User-agent: *');
  expect(body).toContain('Allow: /');
  expect(body).toContain('User-agent: GPTBot');
  expect(body).toContain('User-agent: ClaudeBot');
  expect(body).toContain('Sitemap: https://omelanska.com/sitemap-index.xml');
});

test('sitemap lists the five pages and not 404', async ({ request }) => {
  const res = await request.get('sitemap-0.xml');
  const xml = await res.text();
  for (const path of ['', 'akty-prawne/', 'oferta/', 'rodo/', 'kontakt/']) {
    expect(xml).toContain(`<loc>https://omelanska.com/${path}</loc>`);
  }
  expect(xml).not.toContain('404');
});

test('build writes .htaccess files', () => {
  const root = readFileSync('dist/.htaccess', 'utf8');
  expect(root).toContain('ErrorDocument 404 /404.html');
  const assets = readFileSync('dist/_astro/.htaccess', 'utf8');
  expect(assets).toContain('immutable');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/seo.spec.ts`
Expected: FAIL — 404 heading, robots.txt and .htaccess missing.

- [ ] **Step 3: Implement**

`src/pages/404.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PageIntro from '../components/PageIntro.astro';
import { NAV } from '../data/pages';
import { url } from '../lib/url';

const page = {
  path: '/404.html',
  nav: '',
  title: 'Nie znaleziono strony',
  description: 'Strona o podanym adresie nie istnieje.',
};
---
<BaseLayout page={page} noindex>
  <PageIntro eyebrow="Błąd 404" title="Nie znaleziono strony" lead="Strona o podanym adresie nie istnieje lub została przeniesiona. Wybierz jedną z poniższych stron." />
  <div class="wrap notfound">
    <ul role="list">
      {NAV.map((p) => <li><a class="btn btn--ghost" href={url(p.path)}>{p.nav}</a></li>)}
    </ul>
  </div>
</BaseLayout>

<style>
  .notfound { padding-block: 28px 56px; }
  ul { list-style: none; display: flex; flex-wrap: wrap; gap: 10px; }
</style>
```

`src/pages/robots.txt.ts`:
```ts
import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/url';

const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot'];

export const GET: APIRoute = () => {
  const lines = [
    'User-agent: *',
    'Allow: /',
    '',
    // Listed explicitly so the intent is clear; delete a block to opt a bot out.
    ...AI_BOTS.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
    `Sitemap: ${absoluteUrl('/sitemap-index.xml')}`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
```

Note: `robots.txt` is only honoured at the domain root. When the site moves under `/pl`, the root `robots.txt` of `omelanski.com` must contain the `Sitemap:` line — document this in the README (Task 9).

`scripts/postbuild.mjs`:
```js
// Writes Apache config into the build output. Other servers ignore these files.
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import config from '../astro.config.mjs';

const outDir = process.argv[2] ?? 'dist';
const base = (config.base ?? '/').replace(/\/?$/, '/');

const root = `# Generated by scripts/postbuild.mjs
ErrorDocument 404 ${base}404.html
Options -Indexes
AddDefaultCharset UTF-8
AddCharset UTF-8 .html .txt .xml .css .js .svg

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css text/xml application/xml application/javascript image/svg+xml
</IfModule>

<IfModule mod_headers.c>
  <FilesMatch "\\.(html|txt|xml)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <FilesMatch "\\.(png|svg|ico)$">
    Header set Cache-Control "public, max-age=604800"
  </FilesMatch>
</IfModule>
`;

const assets = `# Generated by scripts/postbuild.mjs — hashed files never change
<IfModule mod_headers.c>
  Header set Cache-Control "public, max-age=31536000, immutable"
</IfModule>
`;

writeFileSync(join(outDir, '.htaccess'), root);
if (existsSync(join(outDir, '_astro'))) writeFileSync(join(outDir, '_astro', '.htaccess'), assets);
console.log(`postbuild: wrote .htaccess files to ${outDir} (base ${base})`);
```

`package.json` build script:
```json
"build": "astro build && node scripts/postbuild.mjs"
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx playwright test tests/e2e/seo.spec.ts`
Expected: PASS. (`astro preview` serves `404.html` directly at `/404.html`.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add 404 page, robots.txt and Apache config generation"
```

---

### Task 8: JSON-LD, llms.txt and llms-full.txt

**Files:**
- Create: `src/lib/jsonld.ts`, `src/lib/llms.ts`, `tests/unit/jsonld.test.ts`, `tests/unit/llms.test.ts`, `src/components/JsonLd.astro`, `src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts`
- Modify: `src/layouts/BaseLayout.astro`, `tests/e2e/seo.spec.ts`

**Interfaces:**
- Consumes: data modules, `absoluteUrl`.
- Produces:
  - `businessJsonLd(abs: (path: string) => string): Record<string, unknown>`
  - `breadcrumbJsonLd(abs: (path: string) => string, page: {path: string; nav: string}): Record<string, unknown> | null` (null for home)
  - `buildLlmsTxt(abs: (path: string) => string): string`
  - `buildLlmsFullTxt(abs: (path: string) => string): string`

- [ ] **Step 1: Write the failing unit tests**

`tests/unit/jsonld.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { breadcrumbJsonLd, businessJsonLd } from '../../src/lib/jsonld';

const abs = (p: string) => `https://example.pl${p}`;

describe('businessJsonLd', () => {
  const data = businessJsonLd(abs);
  it('describes the local business', () => {
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('RealEstateAgent');
    expect(data.name).toBe('Radosław Omelański – Zarządzanie Nieruchomościami');
    expect(data.url).toBe('https://example.pl/');
    expect(data.telephone).toBe('+48518629878');
    expect(data.faxNumber).toBe('+48913217878');
    expect(data.email).toBe('biuro@omelanska.com');
    expect(data.taxID).toBe('9860145783');
    expect(data.address).toMatchObject({
      '@type': 'PostalAddress',
      streetAddress: 'ul. Jedności Narodowej 1/4',
      postalCode: '72-400',
      addressLocality: 'Kamień Pomorski',
      addressCountry: 'PL',
    });
    expect(data.openingHoursSpecification).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '16:00' },
    ]);
  });
  it('is JSON-serialisable', () => {
    expect(() => JSON.parse(JSON.stringify(data))).not.toThrow();
  });
});

describe('breadcrumbJsonLd', () => {
  it('returns null for home', () => {
    expect(breadcrumbJsonLd(abs, { path: '/', nav: 'Strona główna' })).toBeNull();
  });
  it('builds a two-level trail for subpages', () => {
    expect(breadcrumbJsonLd(abs, { path: '/oferta/', nav: 'Oferta' })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Strona główna', item: 'https://example.pl/' },
        { '@type': 'ListItem', position: 2, name: 'Oferta', item: 'https://example.pl/oferta/' },
      ],
    });
  });
});
```

`tests/unit/llms.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { buildLlmsFullTxt, buildLlmsTxt } from '../../src/lib/llms';

const abs = (p: string) => `https://example.pl${p}`;

describe('buildLlmsTxt', () => {
  const txt = buildLlmsTxt(abs);
  it('follows the llms.txt shape', () => {
    expect(txt.startsWith('# Radosław Omelański – Zarządzanie Nieruchomościami\n')).toBe(true);
    expect(txt).toContain('\n> ');
    expect(txt).toContain('- [Oferta](https://example.pl/oferta/)');
    expect(txt).toContain('- [Pełna treść strony](https://example.pl/llms-full.txt)');
  });
});

describe('buildLlmsFullTxt', () => {
  const txt = buildLlmsFullTxt(abs);
  it('contains all content sections', () => {
    for (const s of ['Doświadczenie i kontakt z mieszkańcami', 'Obsługa rachunkowo-księgowa', 'Ustawa Prawo budowlane', 'Okres przechowywania', 'Pogotowie gazowe: 992', 'biuro@omelanska.com', 'E-kartoteka']) {
      expect(txt).toContain(s);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement helpers**

`src/lib/jsonld.ts`:
```ts
import { BUSINESS, CONTACT, EKARTOTEKA_URL, MAPS_URL } from '../data/site';
import { telHref } from './phone';

type Abs = (path: string) => string;

const e164 = (display: string) => telHref(display).replace('tel:', '');

export function businessJsonLd(abs: Abs): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${abs('/')}#firma`,
    name: BUSINESS.name,
    url: abs('/'),
    logo: abs('/favicon.svg'),
    image: abs('/og.png'),
    description:
      'Administrowanie, zarządzanie i rozliczanie Wspólnot Mieszkaniowych oraz Spółdzielni Mieszkaniowych w powiecie kamieńskim i gryfickim.',
    telephone: e164(CONTACT.phone),
    faxNumber: e164(CONTACT.phoneFax),
    email: CONTACT.email,
    taxID: BUSINESS.nip,
    identifier: { '@type': 'PropertyValue', propertyID: 'REGON', value: BUSINESS.regon },
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.street,
      postalCode: BUSINESS.postalCode,
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.region,
      addressCountry: 'PL',
    },
    hasMap: MAPS_URL,
    areaServed: BUSINESS.areaServed.map((name) => ({ '@type': 'AdministrativeArea', name })),
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '16:00',
      },
    ],
    sameAs: [EKARTOTEKA_URL],
  };
}

export function breadcrumbJsonLd(abs: Abs, page: { path: string; nav: string }): Record<string, unknown> | null {
  if (page.path === '/') return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Strona główna', item: abs('/') },
      { '@type': 'ListItem', position: 2, name: page.nav, item: abs(page.path) },
    ],
  };
}
```

`src/lib/llms.ts`:
```ts
import { ACTS } from '../data/acts';
import { ABOUT, HERO } from '../data/content';
import { DUTIES } from '../data/duties';
import { NAV, PAGES } from '../data/pages';
import { RODO, RODO_COOKIES_NOTE } from '../data/rodo';
import { AFTER_HOURS, BUSINESS, CONTACT, EKARTOTEKA_URL, EMERGENCY } from '../data/site';

type Abs = (path: string) => string;

const SUMMARY =
  'Firma z Kamienia Pomorskiego zajmująca się administrowaniem, zarządzaniem i rozliczaniem Wspólnot Mieszkaniowych oraz Spółdzielni Mieszkaniowych w powiecie kamieńskim i gryfickim.';

export function buildLlmsTxt(abs: Abs): string {
  return [
    `# ${BUSINESS.name}`,
    '',
    `> ${SUMMARY}`,
    '',
    `Biuro: ${BUSINESS.street}, ${BUSINESS.postalCode} ${BUSINESS.city}. Tel. ${CONTACT.phone}, telefon/fax ${CONTACT.phoneFax}, e-mail ${CONTACT.email}. Godziny: ${CONTACT.hoursShort}.`,
    '',
    '## Strony',
    '',
    ...NAV.map((p) => `- [${p.nav}](${abs(p.path)}): ${p.description}`),
    '',
    '## Dodatkowe',
    '',
    `- [Pełna treść strony](${abs('/llms-full.txt')}): cała treść serwisu w jednym pliku`,
    `- [E-kartoteka](${EKARTOTEKA_URL}): panel mieszkańca (saldo, opłaty, media, uchwały) – wymaga logowania`,
    '',
  ].join('\n');
}

export function buildLlmsFullTxt(abs: Abs): string {
  const out: string[] = [`# ${BUSINESS.name}`, '', `> ${SUMMARY}`, ''];

  out.push(`## ${PAGES.home.nav} (${abs(PAGES.home.path)})`, '', `### ${HERO.title}`, '', HERO.lead, '');
  out.push(`### ${ABOUT.title}`, '', ...ABOUT.paragraphs.flatMap((p) => [p, '']));
  out.push('### Ważne telefony', '', ...EMERGENCY.map((e) => `- ${e.label}: ${e.number}`), '');

  out.push(`## ${PAGES.offer.nav} (${abs(PAGES.offer.path)})`, '', 'Zakres podstawowy, modyfikowany indywidualnie na życzenie Wspólnoty.', '');
  for (const group of DUTIES) {
    out.push(`### ${group.label}: ${group.head}`, '', ...group.items.map((i) => `- ${i}`), '');
  }

  out.push(`## ${PAGES.acts.nav} (${abs(PAGES.acts.path)})`, '');
  for (const act of ACTS) out.push(`- [${act.title}](${act.href}) – ${act.citation}`);
  out.push('', `Uchwały i regulaminy Wspólnoty są dostępne po zalogowaniu do E-kartoteki: ${EKARTOTEKA_URL}`, '');

  out.push(`## ${PAGES.rodo.title} (${abs(PAGES.rodo.path)})`, '');
  for (const r of RODO) out.push(`### ${r.n}. ${r.title}`, '', r.body, '');
  out.push('### Pliki cookies', '', RODO_COOKIES_NOTE, '');

  out.push(
    `## ${PAGES.contact.nav} (${abs(PAGES.contact.path)})`,
    '',
    `- Adres: ${BUSINESS.street}, ${BUSINESS.postalCode} ${BUSINESS.city}`,
    `- Telefon: ${CONTACT.phone}`,
    `- Telefon/fax: ${CONTACT.phoneFax}`,
    `- E-mail: ${CONTACT.email}`,
    `- Godziny otwarcia: ${CONTACT.hoursDays}, ${CONTACT.hoursTime}`,
    '',
    '### Awaria po godzinach pracy biura',
    '',
    ...AFTER_HOURS.map((a) => `- ${a.label}: ${a.number}`),
    '',
  );
  return out.join('\n');
}
```

- [ ] **Step 4: Run unit tests to verify they pass**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Wire into pages**

`src/components/JsonLd.astro`:
```astro
---
interface Props { data: Record<string, unknown> }
const { data } = Astro.props;
const json = JSON.stringify(data).replace(/</g, '\\u003c');
---
<script type="application/ld+json" set:html={json} />
```

In `src/layouts/BaseLayout.astro` frontmatter add:
```ts
import JsonLd from '../components/JsonLd.astro';
import { breadcrumbJsonLd, businessJsonLd } from '../lib/jsonld';
const breadcrumb = noindex ? null : breadcrumbJsonLd(absoluteUrl, page);
```
and in `<head>` just before `<slot name="head" />`:
```astro
<JsonLd data={businessJsonLd(absoluteUrl)} />
{breadcrumb && <JsonLd data={breadcrumb} />}
<link rel="alternate" type="text/plain" href={url('/llms.txt')} title="llms.txt" />
```

`src/pages/llms.txt.ts`:
```ts
import type { APIRoute } from 'astro';
import { buildLlmsTxt } from '../lib/llms';
import { absoluteUrl } from '../lib/url';

export const GET: APIRoute = () =>
  new Response(buildLlmsTxt(absoluteUrl), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
```

`src/pages/llms-full.txt.ts`:
```ts
import type { APIRoute } from 'astro';
import { buildLlmsFullTxt } from '../lib/llms';
import { absoluteUrl } from '../lib/url';

export const GET: APIRoute = () =>
  new Response(buildLlmsFullTxt(absoluteUrl), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
```

- [ ] **Step 6: Add e2e checks**

Add `import { ROUTES } from './routes';` to the imports at the top of `tests/e2e/seo.spec.ts`, then append:
```ts
for (const route of ROUTES) {
  test(`head metadata: /${route.path}`, async ({ page }) => {
    await page.goto(route.path);
    const canonical = `https://omelanska.com/${route.path}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://omelanska.com/og.png');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = blocks.map((b) => JSON.parse(b));
    expect(parsed.some((d) => d['@type'] === 'RealEstateAgent')).toBe(true);
    expect(parsed.some((d) => d['@type'] === 'BreadcrumbList')).toBe(route.path !== '');
  });
}

test('llms.txt and llms-full.txt are served as UTF-8 text', async ({ request }) => {
  for (const file of ['llms.txt', 'llms-full.txt']) {
    const res = await request.get(file);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');
    expect(await res.text()).toContain('Radosław Omelański');
  }
});
```

- [ ] **Step 7: Run tests**

Run: `npm run check && npm run test:unit && npx playwright test tests/e2e/seo.spec.ts`
Expected: PASS. Then paste the rendered JSON-LD from `dist/index.html` into https://validator.schema.org/ and confirm no errors (manual).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add JSON-LD business data, breadcrumbs, llms.txt and llms-full.txt"
```

---

### Task 9: OG image, favicons, README

**Files:**
- Create: `scripts/make-og.mjs`, `public/favicon.svg`, `public/og.png`, `public/favicon-32.png`, `public/apple-touch-icon.png` (the three PNGs generated), `README.md`
- Modify: `package.json` (devDependency `@fontsource/barlow`)

**Interfaces:**
- Consumes: `design/logo.svg`, `src/assets/hero.jpg`.
- Produces: static assets referenced by `BaseLayout` since Task 3.

- [ ] **Step 1: Favicon SVG**

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -24 143 106">
  <path fill="#818181" d="M0 57.5V15.5L20.25 0L40.5 15.5V57.5Z"/>
  <path fill="#009fe3" d="M47 57.5V15.5L67.4 0L87.75 15.5V57.5Z"/>
  <path fill="#818181" d="M94.25 57.5V15.5L114.5 0L134.75 15.5V57.5Z"/>
  <g fill="#fff">
    <path d="M6 22.75h5.5v5.5H6zM17.75 22.75h5.5v5.5h-5.5zM29.5 22.75H35v5.5h-5.5zM6 34.25h5.5v5.5H6zM17.75 34.25h5.5v5.5h-5.5zM29.5 34.25H35v5.5h-5.5z"/>
    <path transform="translate(47 0)" d="M6 22.75h5.5v5.5H6zM17.75 22.75h5.5v5.5h-5.5zM29.5 22.75H35v5.5h-5.5zM6 34.25h5.5v5.5H6zM17.75 34.25h5.5v5.5h-5.5zM29.5 34.25H35v5.5h-5.5z"/>
    <path transform="translate(94.25 0)" d="M6 22.75h5.5v5.5H6zM17.75 22.75h5.5v5.5h-5.5zM29.5 22.75H35v5.5h-5.5zM6 34.25h5.5v5.5H6zM17.75 34.25h5.5v5.5h-5.5zM29.5 34.25H35v5.5h-5.5z"/>
  </g>
</svg>
```

- [ ] **Step 2: OG / PNG generator**

```bash
npm i -D @fontsource/barlow@^5.3.0
```

Add to `package.json` scripts:
```json
"og": "node scripts/make-og.mjs"
```

`scripts/make-og.mjs`:
```js
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
```

- [ ] **Step 3: Generate and inspect**

Run: `npm run og`
Expected: three PNGs in `public/`. Open `public/og.png` and confirm: logo with "Radosław Omelański" in Barlow on the left, photo with headline on the right, Polish characters rendered correctly. Apple touch icon has a white background (Chromium default) — acceptable.

- [ ] **Step 4: README**

`README.md`:
````markdown
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
````

- [ ] **Step 5: Verify**

Run: `npm run check && npm run test:unit && npx playwright test`
Expected: all PASS; `dist/` contains `og.png`, `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add OG image, favicons and README with deploy instructions"
```

---

### Task 10: Accessibility sweep, link check, base-path check

**Files:**
- Create: `tests/e2e/a11y.spec.ts`, `scripts/test-base.mjs`
- Modify: `package.json` (scripts), `src/styles/tokens.css` or component styles (only for fixes axe reports)

**Interfaces:**
- Consumes: all pages.
- Produces: npm scripts `test:links`, `test:base`, `test`.

- [ ] **Step 1: Write the axe test**

`tests/e2e/a11y.spec.ts`:
```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ROUTES } from './routes';

test.use({ reducedMotion: 'reduce' });

for (const theme of ['dark', 'light'] as const) {
  for (const route of ROUTES) {
    test(`axe: /${route.path} (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
      await page.goto(route.path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
}

test('axe: mobile menu open', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile only');
  await page.goto('');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const results = await new AxeBuilder({ page }).include('#mobile-menu').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('keyboard: every interactive element on home shows a focus indicator', async ({ page }) => {
  await page.goto('');
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return 'none';
      const s = getComputedStyle(el);
      return s.outlineStyle === 'none' ? 'none' : s.outlineWidth;
    });
    expect(outline).not.toBe('none');
  }
});
```

- [ ] **Step 2: Run it and fix every violation**

Run: `npx playwright test tests/e2e/a11y.spec.ts`
Expected on first run: possibly FAIL with contrast or landmark findings. Fix each in CSS/markup (e.g. raise `--dim` alpha in a theme, or add a missing label) and re-run until PASS. Do not disable axe rules. Record each fix in the commit message.

- [ ] **Step 3: Link check and base-path scripts**

```bash
npm i -D linkinator@^8.1.0
```

`scripts/test-base.mjs`:
```js
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

execSync('npx linkinator pl/ --server-root .base-test --recurse --skip "^https?://(?!localhost)"', { stdio: 'inherit' });
```

`package.json` scripts (final set):
```json
"dev": "astro dev",
"build": "astro build && node scripts/postbuild.mjs",
"preview": "astro preview",
"check": "astro check",
"test:unit": "vitest run",
"test:e2e": "playwright test",
"test:links": "linkinator dist --recurse --skip \"^https?://(?!localhost)\"",
"test:base": "node scripts/test-base.mjs",
"test": "npm run check && npm run test:unit && npm run build && npm run test:links && npm run test:base && npm run test:e2e",
"og": "node scripts/make-og.mjs"
```

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all stages pass; linkinator reports 0 broken links in both runs; `test-base` prints five `ok` lines.

- [ ] **Step 5: Final manual verification**

1. `npm run preview`, run Lighthouse (Chrome DevTools, mobile and desktop) on all five pages; target 100 in all four categories. Fix anything below 100 that is under our control.
2. Keyboard-only pass on every page (Tab/Shift+Tab/Enter/Esc/arrow keys in tabs).
3. NVDA + Firefox or Chrome pass: page titles announced on navigation, tabs announced as tabs, menu announced as dialog.
4. Check `view-source:` of any page with JS disabled: all text present.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: add axe sweep, link check and /pl base-path verification"
```

