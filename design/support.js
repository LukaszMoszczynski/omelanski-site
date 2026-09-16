# Handoff: omelanska.com — redesign (Radosław Omelański, Zarządzanie Nieruchomościami)

## Overview
Complete redesign of omelanska.com — a small property-management company (administrowanie i rozliczanie Wspólnot Mieszkaniowych) in Kamień Pomorski, Powiat Kamieński, Poland. Five public views, Polish-language only, desktop (1280) and mobile (390) layouts, with a dark/light theme switch. Content is taken verbatim from the current site where it existed; placeholders are marked below.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes of the intended look and behavior, not production code to copy. They are Design Components (\`.dc.html\`) that run in a preview runtime (\`support.js\`) and use a small templating layer (\`{{ value }}\` holes, \`<sc-for>\`, \`<sc-if>\`, \`<dc-import>\`), plus inline styles only.

The task is to **recreate these designs in the target codebase's existing environment** (React/Next, Vue, Astro, plain HTML+CSS — whatever the project uses), following its established patterns, component library and styling approach. If no codebase exists yet, pick the most appropriate stack. Suggested for this project: a static site (Astro or Next static export) — five mostly-static pages, no backend other than the external E-kartoteka link.

Do not port the \`{{ }}\` templating or the inline-style approach. Move the values into the target project's tokens/CSS.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, radii, transitions and copy. Recreate pixel-close, but substitute the codebase's own primitives (Button, Card, etc.) where they exist.

## Screens / Views

All views share the same header (\`OmHeader.dc.html\`) and footer (\`OmFooter.dc.html\`).

### Shared: Header
Two stacked bars, desktop:
1. **Utility bar** — background \`th.surf\`, 1px bottom border \`th.line\`, padding 10px 40px, font-size 12.5px, color \`th.mid\`.
   - Left: 7px accent dot with \`omPulse\` animation (opacity .45→1→.45, 2.2s ease-in-out infinite), label \`AWARIA?\` (JetBrains Mono 500 12.5px, letter-spacing .06em, color \`accentText\`), then emergency numbers \`112 · 998 · 992 · 993 · 994 · 991\` in mono.
   - Right: \`tel. 518 629 878\`, \`biuro@omelanska.com\` (both underline on hover), \`pon.–pt. 8.00–16.00\`, then the **theme switch**: pill (border-radius 20px, 1px \`th.line\`, background \`th.wash\`) with two mono labels \`CIEMNY\` / \`JASNY\` and an absolutely-positioned accent knob (50% width, border-radius 16px) that moves \`translateX(0)\` ↔ \`translateX(100%)\`, transition \`transform .28s cubic-bezier(.22,.61,.36,1)\`; label colors cross-fade over .24s.
2. **Main bar** — background \`th.bg\`, padding 20px 40px, 1px bottom border.
   - Left: 44×44 logo slot (currently a diagonal-hatch placeholder — **needs the real logo asset**), then \`Radosław Omelański\` (600 16.5px, letter-spacing -.01em) over \`ZARZĄDZANIE NIERUCHOMOŚCIAMI\` (12px, uppercase, letter-spacing .05em, \`th.dim\`).
   - Right: nav (gap 22px, 14.5px/500) with items **Strona główna · Akty prawne · Oferta · RODO · Kontakt** — the logo/wordmark also links to the homepage. There is deliberately **no "O nas" item**: that page was identical to the homepage, so it was merged into it and the home link carries it. Each item has a 2px underline bar that scales from the center: \`transform: scaleX(0 → 1)\`, \`transform-origin: 50% 50%\`, \`transition .28s cubic-bezier(.22,.61,.36,1)\`; active item is permanently at scaleX(1) in accent.
   - Then the primary button **E-kartoteka** (accent bg, \`th.onAccent\` text, padding 11px 20px, radius 3px, 14px/600) — hover \`translateY(-2px)\` + \`box-shadow 0 8px 22px -8px rgba(0,0,0,.45)\`.

Mobile header (<= ~640px): same utility bar compressed (9px 18px, 11.5px mono, numbers shortened to \`112 · 998 · 992 · 994\`, theme switch pushed right), then a 14px 18px bar with a 32×32 logo, name block and a 38×38 hamburger. The hamburger is three 20×2px bars that morph into an X (top bar \`translateY(6px) rotate(45deg)\`, middle fades to opacity 0, bottom \`translateY(-6px) rotate(-45deg)\`, .3s cubic-bezier(.22,.61,.36,1)). Menu opens as a **bottom sheet**: absolutely positioned, \`border-radius 12px 12px 0 0\`, \`th.surf\` background, top grab handle 38×4px, nav items 17px/600 in 13px rows separated by 1px borders, E-kartoteka button at the bottom; animates \`translateY(101%) → translateY(0)\` with opacity 0 → 1.

### Shared: Footer
Compact bar: background \`th.surf\`, 1px top border, contact details and links; footer links use the same center-out underline animation as the nav.

### 1. Homepage (= "O nas")
**Purpose:** state what the company does and route residents to the three things they came for.
Layout: two-column hero grid \`1.1fr .9fr\`.
- Left cell, padding 56px 44px 52px 40px, 1px right border \`th.washA\`:
  - Eyebrow \`POWIAT KAMIEŃSKI\` (mono 500 12px, letter-spacing .08em, \`accentText\`).
  - H1 \`Administrowanie i rozliczanie Wspólnot Mieszkaniowych\` — 600 46px/1.12, letter-spacing -.03em, max-width 16em.
  - Lead paragraph (16.5px/1.6, \`th.mid\`, max-width 34em, \`text-wrap: pretty\`): "Profesjonalna firma zajmująca się administrowaniem, zarządzaniem i rozliczaniem Wspólnot Mieszkaniowych oraz Spółdzielni Mieszkaniowych na terenie Powiatu Kamieńskiego."
  - Two buttons: \`Zobacz ofertę\` (\`th.wash\` bg, 1px \`th.line\`, hover \`rgba(42,93,176,.16)\` + \`translateY(-2px)\`) and \`Zgłoś awarię\` (outline, hover border-color → currentColor).
- Right cell: 2×2 grid of numbered resident-task tiles (01–04), each \`th.surf\` + 1px \`th.line\`, radius 3px, padding 20px, mono number in accent, 15.5px/600 title, 12.5px \`th.dim\` subtitle. Hover: \`translateY(-3px)\`, border-color \`rgba(42,93,176,.55)\`, background \`th.surfHi\`, .22s.
- Below the hero: services section driven by the four **offer tabs** (see Oferta) — clicking a tab slides the accent pill and re-enters the bullet list with a cascade (each item \`opacity 0 → 1\`, \`translateY(7px) → 0\`, \`dvRise\`-style, per-item delay \`index * 45ms\`).
- Then a contact/hours band and the footer.

Mobile: single column, hero text at 30px/1.12, tiles stacked full-width, tab row horizontally scrollable, tap feedback \`transform: scale(.975)\`.

### 2. Akty prawne
**Purpose:** link to the two legal acts the administration relies on.
- Page head: padding 46px 40px 20px, 1px bottom border. Eyebrow \`PODSTAWA PRAWNA\`, H1 \`Akty prawne\` (600 40px/1.12, -.03em), lead 16px/1.6 \`th.mid\` max-width 44em. No search field (only two items).
- **Card grid**, padding 28px 40px 44px, \`grid-template-columns: 1fr 1fr\`, gap 16px. Each card: \`th.surf\`, 1px \`th.line\`, radius 3px, padding 26px 26px 22px, min-height 210px, flex column.
  - Top row: kind label (\`USTAWA\`, mono 500 11px, .06em, accent) and format label \`PDF\` (mono, \`th.dim\`), space-between.
  - Title 600 24px/1.22, letter-spacing -.02em, \`text-wrap: pretty\`.
  - Reference line: mono 500 12.5px/1.5, \`th.dim\`.
  - Footer row pushed down with \`margin-top:auto\`, 22px top padding, 1px top border: \`Otwórz w Dz.U. ↗\` (13.5px/600, accent) and \`tekst jednolity\` (\`th.dim\`, 500).
  - Hover: \`translateY(-3px)\`, border-color \`rgba(42,93,176,.55)\`, \`box-shadow 0 14px 32px -14px rgba(0,0,0,.4)\`, .24s cubic-bezier(.22,.61,.36,1).
- Below: E-kartoteka promo strip — \`th.surf\`, 1px border, radius 3px, padding 22px 24px, "Uchwały i regulaminy Twojej Wspólnoty" / "Dokumenty wewnętrzne są dostępne po zalogowaniu do E-kartoteki." + accent button \`Przejdź do E-kartoteki\`.
- **Data (VERIFY):** currently \`Ustawa o własności lokali — Dz.U. 1994 nr 85 poz. 388, z późn. zm.\` and \`Ustawa Prawo budowlane — Dz.U. 1994 nr 89 poz. 414, z późn. zm.\`. The client stated the page holds exactly two documents; confirm the titles, the Dz.U. references and the target URLs/PDFs before shipping.

Mobile: cards stacked (gap 10px), title 19px/1.25, tap \`scale(.985)\`, promo strip becomes a full-width block with a full-width button.

### 3. Oferta
**Purpose:** full scope of services, four sections.
- Head: eyebrow \`DLA WSPÓLNOT I SPÓŁDZIELNI\`, H1 \`Oferta\`, lead: "Poniższy zakres jest zakresem podstawowym. Modyfikujemy go indywidualnie na życzenie Wspólnoty — wystarczy telefon albo wiadomość na biuro@omelanska.com."
- Four sections, each padding 36px 40px, 1px bottom border, grid \`.55fr 1.45fr\` gap 44px:
  - Left: \`0N — <Label>\` (mono 11px accent) + H2 600 24px/1.2.
  - Right: two-column bullet grid (\`1fr 1fr\`, gap 0 40px); each bullet is a 13px-padded row with 1px top border, mono two-digit number in accent + 14.5px/1.5 \`th.body\` text.
- Sections and their bullets (all copy verbatim from the current site's Oferta page):
  1. **Prawo** — "Reprezentacja i obsługa prawna Wspólnoty" (6 bullets).
  2. **Księgowość** — "Obsługa rachunkowo-księgowa" (6 bullets).
  3. **Administracja** — "Obsługa administracyjna" (6 bullets).
  4. **Technika** — "Obsługa techniczna nieruchomości" (6 bullets).
  Exact strings live in the \`TABS\` constant in \`Omelanska Redesign.dc.html\`.
- Closing band: \`th.surf\`, padding 38px 40px, H2 "Rozmowa o współpracy" + paragraph + accent button \`Napisz do nas\` and outline button \`518 629 878\`.

Mobile: sections stacked, single-column bullets, closing band with two full-width buttons.

### 4. RODO
**Purpose:** the GDPR information clause, navigable.
- Head: eyebrow \`OCHRONA DANYCH OSOBOWYCH\`, H1 \`Klauzula informacyjna RODO\` (600 40px), lead.
- Body grid \`.32fr .68fr\`:
  - **Left / table of contents** — \`th.surf\`, padding 34px 32px 40px 40px, 1px right border. Label \`SPIS TREŚCI\` (mono 11px \`th.dim\`). Six rows, each with a mono number in accent and the section title, 1px top border, radius 2px. **Clicking a row selects the matching section** (see Interactions). Hover: \`padding-left: 16px\`, color → \`th.ink\`. Below, a small contact box (\`th.bg\`, 1px border) — "Pytania o dane osobowe / biuro@omelanska.com".
  - **Right / sections** — padding 34px 40px 44px; each section padding 22px, 1px bottom border, 3px transparent left border that turns accent when selected; mono number + H2 600 20px; paragraph 15px/1.6 \`th.body\`, max-width 44em, indented 25px.
- **Content (PLACEHOLDER):** section 01 and 06 are real; 02–05 read "Do uzupełnienia…" and must be replaced with the client's legal text before launch. Titles: 01 Administrator danych osobowych · 02 Cel i podstawa przetwarzania · 03 Odbiorcy danych · 04 Okres przechowywania · 05 Prawa osoby, której dane dotyczą · 06 Kontakt w sprawie danych.

Mobile: ToC becomes a wrapping chip row on a \`th.surf\` band (chips 12.5px/600, radius 2px, accent background when selected), sections stacked below at 17px headings.

### 5. Kontakt
**Purpose:** phone-first contact. **There is deliberately no contact form** anywhere in the design.
- Head: eyebrow \`BIURO W KAMIENIU POMORSKIM\`, H1 \`Kontakt\`, lead: "Sprawy bieżące najszybciej załatwimy telefonicznie w godzinach pracy biura. Awarie po godzinach — bezpośrednio do właściwego pogotowia."
- Grid \`.58fr .42fr\`:
  - **Left, padding 38px 40px 44px, 1px right border:** H2 "Najszybszy kontakt", then three action rows (radius 3px, padding 20px 22px, space-between; each has a mono uppercase label over a 19px/600 value):
    1. \`TELEFON / 518 629 878\` — accent background, \`Zadzwoń →\`; hover \`translateY(-2px)\` + \`box-shadow 0 10px 26px -10px rgba(0,0,0,.45)\`. Links to \`tel:\`.
    2. \`E-MAIL / biuro@omelanska.com\` — \`th.surf\` + 1px border, \`Napisz →\` in accent; hover lifts and border-color → \`rgba(42,93,176,.55)\`. Links to \`mailto:\`.
    3. \`TELEFON / FAX / 91 32 17 878\` — static, note "w godzinach pracy biura".
    Then H2 "Awaria po godzinach pracy biura" (600 18px) and three rows (label left, mono accent number right, 1px separators): Pogotowie energetyczne **991**, Pogotowie gazowe **992**, Pogotowie wodno-kanalizacyjne **994**. Verify these against the numbers the client wants listed.
  - **Right, padding 38px 40px 44px, background \`th.surf\`:** H2 "Dane biura" and a definition list (mono 11px label + 15px/1.75 value): ADRES "ul. Jedności Narodowej 1/4, 72-400 Kamień Pomorski" · TELEFON "telefon/fax: 91 32 17 878 / tel.: 518 629 878" · E-MAIL "biuro@omelanska.com" (accent) · GODZINY OTWARCIA "od poniedziałku do piątku, **8.00 – 16.00**". Below, a 230px map slot (1px border, radius 3px, diagonal-hatch placeholder) — replace with an embedded Google map of ul. Jedności Narodowej 1/4.
- Mobile: two full-width tap tiles (\`Zadzwoń / 518 629 878\` accent, \`Napisz e-mail / biuro@omelanska.com\` surface), then the office-data list and a 170px map slot. No form.

### Not designed yet
**E-kartoteka** (login + balance view) is out of scope in this bundle — the header button and two CTAs point at it. It is presumably an external third-party system; confirm the URL and whether it opens in a new tab.

## Interactions & Behavior
- **Theme switch** (utility bar, both breakpoints): toggles light/dark. Initial value follows \`prefers-color-scheme\` ("Systemowy"); an explicit user choice overrides it and should persist (localStorage). All theme-dependent colors transition; the knob moves .28s cubic-bezier(.22,.61,.36,1).
- **Nav underline:** center-out \`scaleX\` growth on hover, .28s cubic-bezier(.22,.61,.36,1); active page stays underlined in accent. Same treatment in the footer.
- **Mobile menu:** hamburger morphs to X (.3s), bottom sheet slides up from \`translateY(101%)\` with opacity fade (.24s); tapping the sheet or the X closes it. Body scroll should lock while open.
- **Offer tabs (homepage):** clicking a tab moves the accent pill and re-mounts the bullet list with a staggered rise (per-item delay \`index * 45ms\`, \`opacity/translateY(7px)\`). Keyed by tab id so the animation replays on each switch.
- **RODO ToC:** clicking a ToC row selects that section — the row gets the accent background and \`th.onAccent\` text, and the corresponding section gets a 3px accent left border plus \`th.wash\` background (.24s). Clicking the same row again deselects. In implementation, also scroll the section into view (smooth) and reflect the selection in the URL hash (\`#rodo-03\`) so sections are linkable. All sections stay expanded — do not build an accordion; the clause must remain fully readable, ctrl+F-able and printable.
- **Cards/tiles hover:** \`translateY(-2/-3px)\` + border-color \`rgba(42,93,176,.55)\` + shadow, .22–.24s.
- **Mobile tap feedback:** \`transform: scale(.975–.985)\`.
- **Motion policy:** everything animates only \`transform\`/\`opacity\`/\`color\`/\`background\`, 180–300ms, easing \`cubic-bezier(.22,.61,.36,1)\`. Respect \`prefers-reduced-motion: reduce\` by disabling transforms and cascades.
- **No forms** — no validation, no submit endpoints. All contact is \`tel:\` / \`mailto:\` links.
- **Responsive:** designs exist at 1280 and 390. Between them, collapse the hero and RODO grids to one column, the Oferta bullet grid to one column, and the Akty prawne card grid to one column at roughly < 900px; switch to the mobile header at roughly < 700px.

## State Management
Minimal, all client-side:
- \`theme: 'system' | 'dark' | 'light'\` — persisted; derived boolean \`isLight\`.
- \`activeTab: 'prawo' | 'ksiegowosc' | 'administracja' | 'technika'\` — homepage services section.
- \`menuOpen: boolean\` — mobile sheet.
- \`rodoSelected: string | null\` — selected RODO section number, mirrored to the URL hash.
- \`navHover: string | null\` — only if hover underlines are done in JS; CSS \`:hover\` is preferable in production.
No data fetching. Content (acts, offer sections, RODO sections, contact details) is static — put it in content files (MDX/JSON/CMS) rather than hardcoding in components.

## Design Tokens

Three-colour palette: navy \`#12253d\`, blue accent \`#2a5db0\`, white \`#ffffff\`.

**Dark theme (default when the OS prefers dark)**
| token | value |
|---|---|
| bg | \`#0c1723\` |
| surf | \`#12253d\` |
| surfHi | \`#173254\` |
| ink | \`#f2f6fb\` |
| onAccent | \`#ffffff\` |
| wash | \`rgba(242,246,251,.05)\` |
| washA | \`rgba(242,246,251,.1)\` |
| line | \`rgba(242,246,251,.14)\` |
| line2 | \`rgba(242,246,251,.3)\` |
| dim | \`rgba(242,246,251,.6)\` |
| mid | \`rgba(242,246,251,.72)\` |
| body | \`rgba(242,246,251,.85)\` |
| shadow | \`rgba(0,0,0,.7)\` |
| accentText | \`#8ab6f0\` |

**Light theme**
| token | value |
|---|---|
| bg | \`#ffffff\` |
| surf | \`#f1f4f9\` |
| surfHi | \`#e6ecf5\` |
| ink | \`#12253d\` |
| onAccent | \`#ffffff\` |
| wash | \`rgba(18,37,61,.05)\` |
| washA | \`rgba(18,37,61,.1)\` |
| line | \`rgba(18,37,61,.15)\` |
| line2 | \`rgba(18,37,61,.3)\` |
| dim | \`rgba(18,37,61,.74)\` |
| mid | \`rgba(18,37,61,.82)\` |
| body | \`rgba(18,37,61,.9)\` |
| shadow | \`rgba(18,37,61,.2)\` |
| accentText | \`#1e4c96\` |

Accent is themeable; alternates used during exploration: \`#1f6f8b\`, \`#3d5a80\`, \`#12253d\`.

**Typography** — \`IBM Plex Sans\` (400/500/600) for everything, \`JetBrains Mono\` (500/600) for labels, numbers and Dz.U. references. Both from Google Fonts.
Scale: H1 desktop 40–46px/1.12 letter-spacing -.03em · H2 20–26px/1.2 -.02em · card title 24px/1.22 · body lead 16–16.5px/1.6 · body 14.5–15px/1.5–1.6 · small 12.5–13.5px · mono labels 10.5–12.5px with letter-spacing .06–.08em, uppercase.
Mobile: H1 28–30px/1.12 · H2 17–20px · body 14–14.5px. Never below 12px.

**Spacing** — 5 · 7 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 26 · 28 · 32 · 36 · 38 · 40 · 44 · 46 · 56 px. Desktop page gutter 40px; mobile 18px.

**Radii** — 2px (chips, small tags), 3px (buttons, cards, inputs), 12px (mobile sheet top), 20px/16px (theme pill and knob), 50% (status dots).

**Shadows** — button hover \`0 8px 22px -8px rgba(0,0,0,.45)\` · card hover \`0 14px 32px -14px rgba(0,0,0,.4)\` · tile hover \`0 10px 26px -10px rgba(0,0,0,.45)\` · mobile sheet \`0 -18px 40px -12px var(--shadow)\`.

**Motion** — durations 180 / 200 / 220 / 240 / 280 / 300 ms; easing \`cubic-bezier(.22,.61,.36,1)\`; keyframes \`omPulse\` (opacity .45 ↔ 1, 2.2s infinite) and a rise-in (\`opacity 0 → 1\`, \`translateY(7px) → 0\`).

## Assets
Nothing final is bundled. Needed from the client:
- **Logo** — currently a 44×44 (32×32 mobile) hatch placeholder in the header.
- **Map** — Google map embed for ul. Jedności Narodowej 1/4, 72-400 Kamień Pomorski (230px desktop / 170px mobile slot).
- **Two legal documents** for Akty prawne — either PDFs or links to the current consolidated texts in Dziennik Ustaw / ISAP.
- **RODO clause text** for sections 02–05.
- **E-kartoteka URL.**
- Fonts: IBM Plex Sans and JetBrains Mono (Google Fonts, or self-hosted).

## Files
- \`Omelanska Redesign.dc.html\` — all five views, desktop and mobile, plus the exploration turns (turn 3 = the final subpages, turn 2 = homepage dark/light mix, turn 1 = the three original directions). Content constants (\`TABS\`, \`RODO\`, \`acts\`) and both theme objects live in the \`<script data-dc-script>\` block at the bottom.
- \`OmHeader.dc.html\` — shared header, desktop + mobile, theme switch, nav, mobile sheet.
- \`OmFooter.dc.html\` — shared footer.
- \`support.js\` — the preview runtime these files need in order to open in a browser. Not part of the deliverable; do not port it.
- `screenshots/` — PNG renders of every final view, desktop and mobile side by side, in both themes: `2a-strona-glowna`, `3a-akty-prawne`, `3b-oferta`, `3c-rodo`, `3d-kontakt`, each as `-ciemny` (dark) and `-jasny` (light). Use these as the visual target when the preview runtime is unavailable.

## Note on RODO placeholder copy
Sections 02–05 (and the tails of 01 and 06) currently hold Polish **placeholder** paragraphs of 3–5 sentences, written only to size the cards and test the spis-treści highlight at realistic length. Each contains the phrase `Tekst zastępczy`. Do not ship that copy — replace it with the client's legal text.

Open the \`.dc.html\` files directly in a browser to see the designs, including the animations and the theme switch. The final views are the top-most turn (ids 3a–3d) plus the homepage in turn 2 (id 2a).


## Client feedback applied — 16.09.2026

1. **Nazwa firmy.** Wszystkie wystąpienia poprawione na *Radosław Omelański*. Na podstronie **Oferta** pod nagłówkiem dodany drugi wers: "Radosław Omelański Zarządzanie Nieruchomościami" (desktop i mobile).
2. **RODO.** Punkt 01 *Administrator danych osobowych* zawiera teraz NIP: 9860145783 i REGON: 527844342. Punkt 05 wskazuje administratora imiennie. Uwaga dla developera: numeracja punktów w makiecie (01–06) nie odpowiada numeracji ze starej strony — klient pisał o "pkt 3 i pkt 5" starego dokumentu; dane rejestrowe trafiły do punktu o administratorze, a nie do punktu nr 3.
3. **O nas.** Nowa sekcja na stronie głównej (2a), nad "Zakres obowiązków", trzy akapity dostarczone przez klienta — verbatim, bez korekty. Podstrona *O nas* nadal nie istnieje; treść żyje na stronie głównej.

### Do potwierdzenia przez klienta (język polskiego oryginału, nie poprawiane)
- "korzystamy **z** specjalistycznych programów" → poprawnie: "ze specjalistycznych".
- "prawnikami prowadzącymi sprawy wspólnot mieszkaniowych **zajmującymi się instalacjami wodno-kanalizacyjnymi, elektrycznymi itp.**" — wyliczenie się zlewa: wychodzi na to, że prawnicy zajmują się instalacjami. Prawdopodobnie brakuje "oraz specjalistami" przed "zajmującymi się".
- "Pozyskaliśmy dotację" — jeśli chodzi o wiele inwestycji, powinno być "dotacje".
