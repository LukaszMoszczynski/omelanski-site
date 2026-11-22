# Animations with GSAP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Omelański site smoother, richer motion with GSAP (entrances, scroll reveals, page changes, menu, tabs, back-to-top) and make the light theme the default. Every behaviour is covered by Playwright tests on desktop and mobile.

**Architecture:**
- One client module, `src/scripts/motion.ts`, owns all page-level GSAP motion. It sets up on every `astro:page-load` inside a `gsap.context` and reverts on `astro:before-swap`.
- Elements opt in with `data-intro` (opening sequence) or `data-reveal` (scroll reveal). They are hidden only under `html.motion`. The inline head script adds that class, and a 2 s failsafe removes it.
- Components that already own their behaviour (MobileMenu, Tabs, BackToTop) keep it. They swap their CSS keyframes for GSAP tweens, which they import directly.

**Tech Stack:** Astro 7 (static, ClientRouter), TypeScript, GSAP 3 + ScrollTrigger, Playwright (projects `desktop` 1280×800 and `mobile` Pixel 7), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-22-animations-design.md`

## Global Constraints

- **Timing:** no element starts later than 0.4 s after the page appears, and the whole home-page entrance ends within about 0.9 s.
- **Distance:** at most about 20 px of travel, with no bounce, spin or parallax that moves text while someone is reading.
- **Links:** a link or phone number must never be unclickable or covered, even mid-animation.
- **No JavaScript:** if JavaScript is off or GSAP fails to load, all content stays visible exactly as it is today.
- **Reduced motion:** when the system asks for less motion, there is no movement at all and content is simply there.
- **Kept in CSS:** hovers, underlines, the theme-switch knob and the top-bar pulse. Their timings are unified in shared CSS variables.
- **Light default:** "Jasny" applies when nothing is stored. The OS preference is not consulted.
- **Names:** new code uses readable names (`element`, `index`, `item`), never one-letter ones. Commits carry no attribution trailers.
- **Gate:** `npm test` must pass at the end of every task.

## Review Focus

1. **Print:** elements not yet scrolled to are still hidden when printing (Ctrl+P on RODO). Expected: everything prints. Test in Task 2.
2. **Back/forward and fast clicks:** using browser back, or clicking a link mid-intro, must not leave content stuck at opacity 0 or ScrollTriggers firing on a dead page. Test in Task 5.
3. **Arriving on an anchor:** a direct load of `/rodo/#cookies`, or a jump from the table of contents, lands below the fold. Expected: the content at the anchor is visible. Test in Task 4.
4. **Rotating or resizing while the mobile menu is open, or mid-close:** expected that the sheet ends hidden and the page unlocked. Test in Task 6.
5. **Theme switch during the intro:** the colour change and the motion must not fight. Expected: the final state is visible in the new theme. Test in Task 3.

---

### Task 1: Light theme by default

**Files:**
- Modify: `src/layouts/BaseLayout.astro` (inline theme script, about lines 76–87; `theme-color` metas, lines 51–52)
- Modify: `src/styles/*` wherever the tokens pick a theme from `prefers-color-scheme` without `data-theme` (the no-JS fallback must also be light)
- Test: `tests/e2e/theme.spec.ts`

**Interfaces:**
- Produces: `html[data-theme]` is always set to `light` or `dark` before first paint. That's unchanged, but the fallback is now `light`.

- [ ] **Step 1: Rewrite the theme tests for the new default**
  - "system dark preference / follows the OS" becomes `test('light by default even when the OS prefers dark')`. Under `colorScheme: 'dark'`, after `goto('')`: `html` has `data-theme="light"`, and the toggle `Jasny motyw` has `aria-pressed="true"`.
  - Add `test('stored dark choice wins')`: `addInitScript(() => localStorage.setItem('theme','dark'))`, then expect `data-theme="dark"` at `domcontentloaded`.
  - The existing "toggle switches, persists…" test now starts from light. Its first click goes to dark: assert `data-theme="dark"`, `aria-pressed="false"`, `localStorage.theme === 'dark'`, and persistence across reload and footer navigation.
  - "without JavaScript" under `colorScheme: 'dark'`: body background is `rgb(246, 240, 230)`.
  - `theme-color` test: the page has a single `meta[name="theme-color"]` with content `#ffffff`, or the light value, when no media attribute matches.

- [ ] **Step 2: Run** `npx playwright test tests/e2e/theme.spec.ts`. Expected: FAIL in both projects; the dark OS test still gets `dark`.

- [ ] **Step 3: Implement.**
  - The inline script falls back to `'light'` instead of reading `matchMedia`.
  - Replace the two media-scoped `theme-color` metas with one `#ffffff` meta that the toggle keeps in sync. Update its `content` in `ThemeToggle` on click and in the inline script when the stored theme is dark, using the dark value `#0c1723`.
  - CSS: wherever dark tokens are applied under `@media (prefers-color-scheme: dark)` without `[data-theme]`, scope them to `[data-theme="dark"]` only.

- [ ] **Step 4: Run** `npm test`. Expected: all green.

- [ ] **Step 5: Commit**: `feat: light theme by default, a stored dark choice still wins`

---

### Task 2: Motion foundation (GSAP, safe hiding, failsafe, print)

**Files:**
- Modify: `package.json` (add `gsap` to `dependencies`, exact current version)
- Create: `src/scripts/motion.ts`
- Modify: `src/layouts/BaseLayout.astro` (inline head script; import `motion.ts` in the body script)
- Modify: `src/styles/global.css` (hiding rules, print rule, shared timing variables)
- Test: `tests/e2e/motion.spec.ts` (new)

**Interfaces:**
- Produces:
  - **CSS:** `html.motion [data-intro], html.motion [data-reveal] { opacity: 0 }`.
  - **Print:** `@media print` forces `opacity: 1; transform: none` on both.
  - **Timing variables:** `--dur-fast: .2s`, `--dur: .32s`, `--ease-out: cubic-bezier(.22,1,.36,1)`.
  - **Head script:** adds `motion` to `<html>` when `!matchMedia('(prefers-reduced-motion: reduce)').matches`. It sets `setTimeout(…, 2000)` to remove `motion` unless `html.motion-ready` is present.
  - **`motion.ts`:**
    - exports `registerMotion(setup: (context: { root: Document }) => void): void`, which later tasks call to add their page-level animations;
    - on `astro:page-load` it adds `motion-ready`, runs every registered setup inside one `gsap.context`, and calls `ScrollTrigger.refresh()`;
    - on `astro:before-swap` it reverts the context and kills all ScrollTriggers;
    - if `html.motion` is absent, it does nothing and the setups never run.
  - **Easing constants** exported for the components: `EASE_OUT = 'power3.out'`, `EASE_IN = 'power2.in'`.
  - **Exposed for tests:** `window.__motionIdle(): Promise<void>` resolves when no GSAP tween is active.

- [ ] **Step 1: Write `tests/e2e/motion.spec.ts` with the safety tests**, over every route in `ROUTES` and both projects:
  - `test('without JavaScript every element is visible')`, with `javaScriptEnabled: false`. Every `[data-intro], [data-reveal]` has computed opacity `1`, and `html` has no `motion` class.
  - `test('reduced motion: nothing is hidden at any time')`, with `reducedMotion: 'reduce'`. Read the opacity of every marked element at `domcontentloaded`; each is `1`. `html` has no `motion` class.
  - `test('if the motion script never loads, content appears within 2.5 s')`: `page.route('**/_astro/*.js', route => route.abort())`. After `goto`, poll until every marked element has opacity `1`, with a 2500 ms timeout. `html` lost `motion`.
  - `test('printing shows every element')`: `page.emulateMedia({ media: 'print' })` right after `goto` and before scrolling. Every marked element has opacity `1`.
  - A guard assertion in each test: at least one marked element exists on `''`, `kontakt/` and `rodo/`, so the tests can't pass vacuously. On its own this guard makes Step 2 fail until markers exist; add a temporary `data-reveal` on the home `h2#about-title`. Task 4 places markers properly.

- [ ] **Step 2: Run** `npx playwright test tests/e2e/motion.spec.ts`. Expected: FAIL; there's no marker, class or failsafe yet.

- [ ] **Step 3: Implement** the interfaces above. `npm i gsap --save-exact`. Register ScrollTrigger once in `motion.ts`.

- [ ] **Step 4: Run** `npm test`. Expected: all green.

- [ ] **Step 5: Commit**: `feat: GSAP motion foundation, hidden only when motion can run`

---

### Task 3: Opening sequences (home hero and page intros)

**Files:**
- Modify: `src/pages/index.astro`: mark the hero items. The photo layer is `.hero` itself, so animate a pseudo-free wrapper or the background via a `--hero-scale` custom property. Then the eyebrow, `h1`, lead and CTA paragraph, then each tile `li`.
- Modify: `src/components/PageIntro.astro`: mark the eyebrow, `h1`, subtitle and lead.
- Create: `src/scripts/intro.ts`, which calls `registerMotion`
- Test: `tests/e2e/motion.spec.ts`

**Interfaces:**
- Consumes: `registerMotion`, `EASE_OUT` and `window.__motionIdle` from Task 2.
- Produces:
  - `data-intro` takes an integer order: `data-intro="0"` for the photo, `1` for the text and `2` for the tiles.
  - The timeline (values pinned to the constraints):
    - photo: scale 1.06→1 with opacity, 0.9 s;
    - text items: `y: 16 → 0`, opacity, 0.5 s, stagger 0.08, starting at 0.1 s;
    - tiles: `y: 18 → 0`, stagger 0.07, starting at 0.3 s.
  - Every start is at most 0.4 s and the end is about 0.9 s.

- [ ] **Step 1: Write the tests**
  - `test('opening sequence ends fully visible within 1.2 s')` for each route: after `goto`, poll every `[data-intro]` until opacity `1` and transform `none`, with a 1200 ms timeout.
  - `test('a home tile works when clicked straight after load')`: `goto('')`, then immediately click the tile `Akty prawne` without waiting. Expect the URL `/akty-prawne/`.
  - `test('phone link is clickable straight after load')` on `kontakt/`: `elementFromPoint` at the centre of the `tel:` link returns the link or its descendant. Do this at `domcontentloaded`.
  - (Review Focus 5) `test('switching theme during the intro ends visible')`: click `Jasny motyw` within 100 ms of `goto`. After `__motionIdle()`, every `[data-intro]` has opacity `1` and `html[data-theme="dark"]`.

- [ ] **Step 2: Run.** Expected: the sequence test fails, because nothing has `data-intro` yet. The guard from Task 2 has been extended to `data-intro`.

- [ ] **Step 3: Implement** `intro.ts`: `gsap.timeline` from the hidden state with `clearProps: 'transform,opacity'` on complete. Import it in `BaseLayout.astro`'s script next to `motion.ts`.

- [ ] **Step 4: Run** `npm test`. Expected: all green.

- [ ] **Step 5: Commit**: `feat: opening sequence on the home page and page headings`

---

### Task 4: Scroll reveals

**Files:**
- Modify (add `data-reveal`):
  - `src/pages/index.astro`: section headings, the `about__text` block, the tabs block, the phone grid, the office box and the map;
  - `src/components/PhoneGrid.astro`: each phone `li`, `data-reveal="item"`;
  - `src/pages/akty-prawne.astro`: each `.act`;
  - `src/pages/oferta.astro`: section headings and list blocks;
  - `src/pages/kontakt.astro`: cards, the after-hours list and the facts;
  - `src/pages/rodo.astro`: the table of contents and each `.clause`;
  - `src/components/Footer.astro`: nothing; the footer stays still.
- Create: `src/scripts/reveal.ts`, which calls `registerMotion`
- Test: `tests/e2e/motion.spec.ts`

**Interfaces:**
- Consumes: `registerMotion`, `EASE_OUT`.
- Produces: `ScrollTrigger.batch('[data-reveal]', { start: 'top 92%', once: true, onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: .6, stagger: .06, ease: EASE_OUT, clearProps: 'transform' }) })`. The initial `y` is 18 px, set by `gsap.set` in setup; CSS only does the opacity. Elements already on screen at setup reveal immediately.

- [ ] **Step 1: Write the tests**
  - `test('scrolling to the bottom reveals everything')` for each route: scroll the window in steps of `innerHeight * 0.8` to the bottom, waiting 100 ms per step. Then every `[data-reveal]` has opacity `1` and transform `none` after `__motionIdle()`.
  - `test('jumping to the bottom at once still reveals what is on screen')`: `window.scrollTo(0, document.body.scrollHeight)`. After 800 ms, every `[data-reveal]` whose rect intersects the viewport has opacity `1`.
  - (Review Focus 3) `test('arriving on /rodo/#cookies shows that section')`: `goto('rodo/#cookies')`. The heading `Pliki cookies` is in the viewport and its `.clause` ancestor has opacity `1` within 1000 ms.
  - (Review Focus 3) `test('table of contents jump shows the target')`: on `rodo/`, click the TOC link `Pliki cookies`. Same expectation.

- [ ] **Step 2: Run.** Expected: FAIL; markers are missing, or they stay hidden.

- [ ] **Step 3: Implement** `reveal.ts`, add the markers and remove the temporary marker from Task 2.

- [ ] **Step 4: Run** `npm test`. Expected: all green, including the existing `RODO table of contents jumps to sections` and overflow tests.

- [ ] **Step 5: Commit**: `feat: cards and sections slide in on scroll`

---

### Task 5: Page changes

**Files:**
- Create: `src/scripts/page-transition.ts` (a module-level listener, not a `registerMotion` setup)
- Modify: `src/styles/global.css`: turn off the default root crossfade with `::view-transition-old(root), ::view-transition-new(root) { animation: none }`, keeping the existing reduced-motion rule
- Modify: `tests/e2e/navigation.spec.ts`: the existing `disables the view-transition cross-fade in CSS` test must keep passing, or be updated to assert the new rule
- Test: `tests/e2e/motion.spec.ts`

**Interfaces:**
- Consumes: `EASE_IN`, and `html.motion`; without it nothing happens.
- Produces:
  - On `astro:before-preparation` the handler wraps `event.loader`, so the fade-out and the loader run together:
    ```ts
    const original = event.loader;
    event.loader = async () => {
      await Promise.all([original(), gsap.to('main', { opacity: 0, y: -8, duration: .2, ease: EASE_IN })]);
    };
    ```
  - The incoming page starts from opacity 1, and its intro (Task 3) plays.
  - On `astro:after-swap`, `main` gets `clearProps: 'all'`. This guards a back/forward swap that skipped preparation.

- [ ] **Step 1: Write the tests**
  - `test('client navigation ends with visible content and focus on h1')`: click the footer `Kontakt`. URL `/kontakt/`; `main` has opacity `1`; `h1` is focused; no `console.error` collected during the run.
  - (Review Focus 2) `test('back and forward leave content visible')`: go home → `oferta/` → back → forward. After each step, `main` and all `[data-intro]` have opacity `1` within 1200 ms.
  - (Review Focus 2) `test('clicking a link mid-intro does not leave the next page hidden')`: on `goto('')`, immediately click the footer `RODO`. Every `[data-intro]` and on-screen `[data-reveal]` on `/rodo/` reaches opacity `1` within 1500 ms. `ScrollTrigger.getAll().length` matches only the new page's triggers, so there's no leak: it equals the number of batches created by `reveal.ts`, exposed as `window.__motionTriggerCount()`.

- [ ] **Step 2: Run.** Expected: the leak or crossfade assertions fail.

- [ ] **Step 3: Implement.** Import it in the `BaseLayout.astro` script.

- [ ] **Step 4: Run** `npm test`. Expected: all green.

- [ ] **Step 5: Commit**: `feat: smoother page changes`

---

### Task 6: Mobile menu on GSAP

**Files:**
- Modify: `src/components/MobileMenu.astro`. Remove `sheet-in`, `sheet-out` and `.is-closing` from the CSS. `open()` and `close()` animate with GSAP; the burger→cross morph stays in CSS.
- Test: `tests/e2e/mobile-menu.spec.ts`

**Interfaces:**
- Consumes: `EASE_OUT` and `EASE_IN` from `src/scripts/motion.ts`.
- Produces:
  - **open:** sheet `yPercent: 100 → 0`, 0.4 s `EASE_OUT`. Then the links `y: 12 → 0` with opacity, stagger 0.05, starting at 0.12 s; then the E-kartoteka button.
  - **close:** sheet `yPercent: 0 → 100`, 0.26 s `EASE_IN`, then `hidden = true`. The kill-and-hide fallback stays.
  - Without `html.motion`: instant show and hide, as today with reduced motion.
  - Focus, inert and scroll-lock behaviour stay unchanged.

- [ ] **Step 1: Write the tests** (mobile only, like the file's `beforeEach`):
  - `test('menu links are fully visible once open')`: open the menu. Every link in `Menu mobilne` and `E-kartoteka` has opacity `1` within 800 ms.
  - (Review Focus 4) `test('turning to desktop width mid-close ends closed and unlocked')`: open the menu, click the cross and immediately `setViewportSize({ width: 1280, height: 800 })`. The dialog is hidden, `html` has no `is-locked` class, and `main` has no `inert`.
  - `test('reduced motion opens and closes instantly')`, with `reducedMotion: 'reduce'`. The dialog is visible straight after the click: check `toBeVisible` with a timeout of 50 ms.

- [ ] **Step 2: Run** `npx playwright test tests/e2e/mobile-menu.spec.ts --project=mobile`. Expected: the new stagger assertion fails if it's checked mid-animation, or passes trivially. In that case confirm by reading `gsap.isTweening` in the test that a tween ran.

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Run** `npm test`. Expected: all green, including the existing menu tests.

- [ ] **Step 5: Commit**: `feat: mobile menu slides and staggers with GSAP`

---

### Task 7: Tabs with a sliding highlight

**Files:**
- Modify: `src/components/Tabs.astro`.
  - Add `<span class="tabs__indicator" aria-hidden="true">` inside `.tabs__list`. It's an absolutely positioned pill behind the selected tab, with the selected-tab background moved onto it.
  - In `select()`, GSAP-tween it to the selected tab's `offsetLeft`, `offsetTop`, `offsetWidth` and `offsetHeight` (0.35 s `EASE_OUT`).
  - The panel enters with `opacity 0→1, y 8→0`, 0.3 s, replacing the CSS `rise` keyframes.
  - On first `select(0)` and on resize, place it without a tween.
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `EASE_OUT`.
- Produces: `.tabs__indicator`. After any selection settles, its box equals the selected tab's box within 1 px.

- [ ] **Step 1: Write the tests**
  - `test('the highlight follows the selected tab')`: click the second tab. After `__motionIdle()`, the indicator's bounding box matches that tab's within 1 px. Press `ArrowRight` and check again for the third tab.
  - `test('the highlight follows after a resize')` (desktop project): select the third tab, resize to 900×800, and the boxes still match.
  - `test('without motion the selected tab is still marked')`, with `reducedMotion: 'reduce'`: the indicator matches the selected tab immediately.

- [ ] **Step 2: Run.** Expected: FAIL; there's no indicator.

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Run** `npm test`. Expected: all green, including `tabs follow the WAI-ARIA pattern`, `switching tabs does not change the section height` and `tabs re-initialise after client-side navigation`.

- [ ] **Step 5: Commit**: `feat: tabs get a sliding highlight`

---

### Task 8: Back-to-top on GSAP, unified hover timing

**Files:**
- Modify: `src/components/BackToTop.astro`. Show and hide with GSAP: `autoAlpha 0→1`, `scale .8→1`, `y 8→0`, 0.3 s `EASE_OUT`; hiding at 0.2 s. Without `html.motion` it's an instant toggle. Remove the CSS opacity and transform transition. Keep `is-visible` as the state class that tests read.
- Modify: the hover transitions in `global.css`, `Header.astro`, `Footer.astro`, `PhoneGrid.astro`, `ThemeToggle.astro`, `index.astro`, `kontakt.astro`, `akty-prawne.astro` and `rodo.astro`. Replace literal durations with `var(--dur-fast)` or `var(--dur)`, and the ease with `var(--ease-out)`.
- Test: `tests/e2e/interactions.spec.ts`

**Interfaces:**
- Consumes: `EASE_OUT`, plus `--dur-fast`, `--dur` and `--ease-out` from Task 2.

- [ ] **Step 1: Write the tests**
  - `test('back-to-top fades in fully and does not cover footer links')`: scroll 1500 px; the button's opacity becomes `1`. Scroll to the bottom; the button is hidden (`visibility: hidden`). `elementFromPoint` at the centre of each footer link returns that link.
  - `test('hover timings use the shared variables')`: no stylesheet rule for `transition` contains a literal duration other than `0s`/`.01ms`. Read `document.styleSheets` and scan `cssText` for `/transition[^;]*\d+(\.\d+)?m?s/` outside rules using `var(`.

- [ ] **Step 2: Run.** Expected: the timing scan fails.

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Run** `npm test`. Expected: all green, including `appears after scrolling and returns to the top`.

- [ ] **Step 5: Commit**: `feat: back-to-top on GSAP, one timing for all hovers`

---

### Task 9: Final check and new hand-off package on the same link

**Files:** none in the repo; the release asset is replaced.

- [ ] **Step 1: Run** `npm test`. Expected: all green, with the counts reported.
- [ ] **Step 2: Lighthouse on the preview build** (desktop and mobile) for `/` and `/kontakt/` with the Chrome DevTools tools. Expected: Performance ≥ 90, CLS < 0.05, and Accessibility unchanged from before.
- [ ] **Step 3: Rebuild** `omelanski-wdrozenie.zip` with `C:\Windows\System32\tar.exe -a`, exactly as before: `strona/` plus both redirect files. Verify it opens with .NET `ZipFile`.
- [ ] **Step 4: Replace the asset on the same release:** `gh release upload wdrozenie-2026-11-08 omelanski-wdrozenie.zip --clobber`. Confirm the download URL returns 200 and the new size.
- [ ] **Step 5: Push** `main`.
