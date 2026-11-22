// Page changes: the old content fades out (in place: any movement here plus the new
// page's entrance reads as a bounce) while the next page is fetched
// (the two run together, so this adds no waiting), then the new page plays its own
// opening sequence (intro.ts). The browser's default crossfade is turned off in CSS.
import { gsap } from 'gsap';
import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';
import { EASE_IN, motionEnabled } from './motion-state';

document.addEventListener('astro:before-preparation', (event) => {
  if (!motionEnabled()) return;
  const preparation = event as TransitionBeforePreparationEvent;
  const main = document.querySelector('main');
  if (!main) return;
  const load = preparation.loader;
  preparation.loader = async () => {
    try {
      await Promise.all([load(), gsap.to(main, { opacity: 0, duration: 0.2, ease: EASE_IN })]);
    } finally {
      // Astro gives up on a client-side change for a PDF or other non-page response
      // (it hands it to the browser) and for a failed fetch: the old page stays, so
      // it must not stay faded out.
      if (preparation.defaultPrevented || preparation.signal.aborted) {
        gsap.killTweensOf(main);
        gsap.set(main, { clearProps: 'opacity,transform' });
      }
    }
  };
});

// Coming back from a PDF or another site can restore this page from the browser's
// back/forward cache exactly as it was left, i.e. mid-fade.
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  const main = document.querySelector('main');
  if (main) gsap.set(main, { clearProps: 'opacity,transform' });
});

// Back/forward can swap without the fade-out above finishing; make sure nothing on the
// new page inherits a half-faded state.
document.addEventListener('astro:after-swap', () => {
  const main = document.querySelector('main');
  if (main) gsap.set(main, { clearProps: 'all' });
});
