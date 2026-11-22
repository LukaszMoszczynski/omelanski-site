# Animations with GSAP, light theme by default

## Why

The owner finds the current motion too plain. It is limited to hover lifts, a tab rise, the mobile menu slide and the default crossfade between pages. The site should feel more alive and smoother. It must still suit its audience: residents and housing-community boards, often older people. They come for a phone number, a PDF or the office hours.

## Goals

- **Home page opening:** an orchestrated entrance. The photo settles, then the text rises line by line, then the four tiles come in one after another.
- **Page headings:** subpages open with the same gentle rise of the heading block.
- **Scrolling:** sections and cards slide in as they reach the screen, in sequence rather than all at once.
- **Page changes:** the old content leaves quickly and the new one comes in, replacing the plain crossfade.
- **Interface pieces:** the mobile menu, the Oferta tabs and the back-to-top button get smoother GSAP motion.
- **Hovers:** they stay in CSS but share one timing, so everything moves the same way.
- **Light theme by default:** "Jasny" applies for everyone unless the visitor picked "Ciemny" with the switch.
- **Tests:** end-to-end tests on desktop (1280 px) and phone (Pixel 7) for all of the above.

## Anti-goals (a failure even if it works)

- **No waiting:** the visitor never waits for content. No element starts later than 0.4 s after the page appears, and the whole home-page entrance ends within about 0.9 s.
- **No large movements:** at most about 20 px of travel, with no bounce, spin or parallax that moves text while someone is reading.
- **Links stay usable:** a link or phone number must never be unclickable or covered, even mid-animation.
- **Nothing lost without JavaScript:** if JavaScript is off or GSAP fails to load, all content stays visible exactly as it is today.
- **Respect reduced motion:** when the system asks for less motion, there is no movement at all and content is simply there.

## Approaches

- **A. GSAP for everything, hovers included.** One tool everywhere, but it means more code and per-element wiring that has to survive page changes. It gives no visible gain over CSS for hovers, and phones have no hover anyway.
- **B. GSAP for the orchestrated motion, CSS for micro-reactions.** **Chosen by the owner.** It gives the same visible result with less code, and hovers stay instant.
- **C. CSS only, with scroll-driven animations and view-transition keyframes.** Ruled out: the owner uses GSAP for animation, and sequencing in CSS is clumsier.

## Decided

- **GSAP setup:** GSAP from npm, plus the ScrollTrigger plugin. One module sets up all motion on every `astro:page-load` and cleans up on `astro:before-swap` (a `gsap.context` revert, with ScrollTriggers killed).
- **Safe hiding:**
  - The inline head script adds `motion` to `<html>` only when reduced motion is off.
  - CSS hides elements marked to animate only under `html.motion`.
  - If the module hasn't confirmed it started within 2 s, the class is removed.
  - Without JavaScript the class is never added.
- **Page changes:** the outgoing `<main>` fades and lifts out in about 0.2 s, raced with the page loader so it adds no extra waiting. The incoming page plays its intro. The default view-transition animation on `<main>` is turned off.
- **Mobile menu:** the backdrop fades, the sheet slides up and the links come in one after another. Closing plays the reverse, faster.
- **Tabs:** a highlight slides from the old tab to the new one, and the panel content crossfades and rises.
- **Back-to-top:** the button fades and scales in and out.
- **Kept in CSS:**
  - the theme switch knob,
  - the pulsing dot in the top bar,
  - hovers and underlines, with timings unified in shared CSS variables.
- **Light default:** the head script defaults to `light` when nothing is stored, without checking the OS setting. The `theme-color` meta follows.

## Left to the builder

Exact easings, distances (within the limits above) and which elements get the scroll reveal on each page. The aim is cards, lists and section headings, not every paragraph.

## Tests (Playwright, desktop and mobile projects)

- **After load and after scrolling to the bottom:** every element marked to animate ends fully visible, with opacity 1 and no transform.
- **Instant clicks:** a home tile and a phone link work when clicked straight after load.
- **Page changes:** content ends visible, focus lands on the new `h1`, and there are no console errors.
- **Reduced motion:** nothing is hidden or moving at any time.
- **Without JavaScript:** all content is visible.
- **Mobile menu:** it opens and closes, with focus and scroll lock still working.
- **Tabs:** they switch with the mouse and the keyboard.
- **Theme:** light by default, even when the OS prefers dark. A stored dark choice still wins.
- The existing test suite stays green, with the theme tests updated for the new default.
