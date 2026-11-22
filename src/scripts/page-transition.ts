// Page changes: the old content lifts and fades out while the next page is fetched
// (the two run together, so this adds no waiting), then the new page plays its own
// opening sequence (intro.ts). The browser's default crossfade is turned off in CSS.
import { gsap } from 'gsap';
import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';
import { EASE_IN, motionEnabled } from './motion';

document.addEventListener('astro:before-preparation', (event) => {
  if (!motionEnabled()) return;
  const preparation = event as TransitionBeforePreparationEvent;
  const main = document.querySelector('main');
  if (!main) return;
  const load = preparation.loader;
  preparation.loader = async () => {
    await Promise.all([load(), gsap.to(main, { opacity: 0, y: -8, duration: 0.2, ease: EASE_IN })]);
  };
});

// Back/forward can swap without the fade-out above finishing; make sure nothing on the
// new page inherits a half-faded state.
document.addEventListener('astro:after-swap', () => {
  const main = document.querySelector('main');
  if (main) gsap.set(main, { clearProps: 'all' });
});
