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

gsap.registerPlugin(ScrollTrigger);

export const EASE_OUT = 'power3.out';
export const EASE_IN = 'power2.in';

type Setup = () => void;
const setups: Setup[] = [];
let context: gsap.Context | null = null;

/** Adds page-level animations; each setup runs on every page load, inside one context. */
export function registerMotion(setup: Setup): void {
  setups.push(setup);
}

export function motionEnabled(): boolean {
  return document.documentElement.classList.contains('motion');
}

function start() {
  const root = document.documentElement;
  // Already running for this page (the first load starts before astro:page-load).
  if (context || !motionEnabled()) return;
  context = gsap.context(() => setups.forEach((setup) => setup()));
  root.classList.add('motion-ready');
  ScrollTrigger.refresh();
}

function stop() {
  context?.revert();
  context = null;
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

// astro:page-load waits for the window load event, i.e. for the hero photo, which would
// keep the text hidden on a slow connection. The first page starts once its scripts have
// registered (they all run before DOMContentLoaded); later pages start on astro:page-load.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else queueMicrotask(start);
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
