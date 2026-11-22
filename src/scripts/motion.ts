// Page-level motion. Every animation on the site starts here, so there is one place
// that decides whether motion runs at all.
//
// How hiding stays safe:
// - The inline head script adds `motion` to <html> only when reduced motion is off.
// - CSS hides [data-intro] / [data-reveal] only while <html> has `motion` but not yet
//   `motion-ready`, so nothing flashes before this module runs.
// - Here, each registered setup puts its elements in their starting state with GSAP,
//   then `motion-ready` lifts the CSS hiding. An element no setup claims is simply shown.
// - If this module never runs, the head script drops `motion` after 2 s.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { motionEnabled } from './motion-state';

export { EASE_IN, EASE_OUT, motionEnabled } from './motion-state';

gsap.registerPlugin(ScrollTrigger);

// A refresh can scroll the window back to a stale cached position (e.g. 0 after Astro
// restored the position on Back, jumped to an anchor, or the browser restored it on
// reload). Keep wherever the page really is.
let keptScroll: [number, number] | null = null;
ScrollTrigger.addEventListener('refreshInit', () => {
  keptScroll = [window.scrollX, window.scrollY];
});
ScrollTrigger.addEventListener('refresh', () => {
  if (keptScroll && (window.scrollX !== keptScroll[0] || window.scrollY !== keptScroll[1])) {
    window.scrollTo(keptScroll[0], keptScroll[1]);
  }
  keptScroll = null;
});

type Setup = () => void;
const setups: Setup[] = [];
let context: gsap.Context | null = null;

/** Adds page-level animations; each setup runs on every page load, inside one context. */
export function registerMotion(setup: Setup): void {
  setups.push(setup);
}

function start() {
  const root = document.documentElement;
  // Already running for this page (the first load starts before astro:page-load).
  if (context || !motionEnabled()) return;
  // One failing setup must not keep the page hidden: each runs on its own, and
  // motion-ready (which lifts the CSS hiding) is added whatever happens.
  context = gsap.context(() => {
    for (const setup of setups) {
      try {
        setup();
      } catch (error) {
        console.error(error);
      }
    }
  });
  root.classList.add('motion-ready');
  ScrollTrigger.refresh();
}

function stop() {
  context?.revert();
  context = null;
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

// astro:page-load waits for the window load event, i.e. for the hero photo, which would
// keep the text hidden on a slow connection. The first page starts on DOMContentLoaded:
// it fires after every module script of the page has run, so all setups are registered
// no matter which component's script loaded this module first. Later pages start on
// astro:page-load, which is also the backstop if DOMContentLoaded has already passed.
if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', start, { once: true });
// After a page change, start inside the swap itself (astro:after-swap runs before the
// browser draws the new page), so no frame shows it before its animations are set up.
// astro:page-load (after the page's scripts ran) stays as the backstop.
document.addEventListener('astro:after-swap', start);
document.addEventListener('astro:page-load', start);
document.addEventListener('astro:before-swap', stop);

declare global {
  interface Window {
    __motionIdle?: () => Promise<void>;
  }
}

/** For tests: resolves once no tween is running. */
window.__motionIdle = () =>
  new Promise((resolve) => {
    const check = () => {
      const busy = gsap.globalTimeline.getChildren(true, true, false).some((tween) => tween.isActive());
      if (busy) requestAnimationFrame(check);
      else resolve();
    };
    check();
  });
