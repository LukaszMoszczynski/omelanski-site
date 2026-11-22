// Cards, lists and section headings slide in as they reach the screen, in small
// batches one after another. Elements opt in with data-reveal.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { registerMotion } from './motion';
import { EASE_OUT } from './motion-state';

registerMotion(() => {
  const items = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  if (!items.length) return;
  // A CSS transition on transform (hover lift on cards) would smooth every GSAP frame
  // and make the slide lag, so it is off until the element has arrived.
  gsap.set(items, { opacity: 0, y: 18, transition: 'none' });
  // Lines inside a block (numbered lists) wait undrawn until the block arrives.
  const withLines = items.filter((item) => item.querySelector('.num-list'));
  withLines.forEach((item) => item.classList.add('lines-waiting'));
  const drawLines = (elements: Element[]) => {
    // Next frame, so the undrawn state is painted first and the lines visibly draw.
    requestAnimationFrame(() => elements.forEach((element) => element.classList.remove('lines-waiting')));
  };
  // After a page change, what is already on screen fades in where it is: sliding up there,
  // right after the old page faded out, reads as a bounce. Below the fold they still slide.
  if (document.documentElement.classList.contains('is-returning')) {
    const onScreen = items.filter((item) => item.getBoundingClientRect().top < window.innerHeight);
    gsap.set(onScreen, { y: 0 });
  }
  ScrollTrigger.batch(items, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => {
      // After a jump (an anchor link, End key) everything above the screen "enters" at
      // once: show those straight away so the target isn't kept waiting behind them.
      const passed = batch.filter((element) => element.getBoundingClientRect().bottom <= 0);
      const onScreen = batch.filter((element) => !passed.includes(element));
      if (passed.length) gsap.set(passed, { clearProps: 'transform,opacity,transition' });
      drawLines(batch);
      if (onScreen.length) {
        gsap.to(onScreen, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          // One after another, but a batch never takes more than 0.3 s to get going.
          stagger: Math.min(0.06, 0.3 / onScreen.length),
          ease: EASE_OUT,
          clearProps: 'transform,opacity,transition',
        });
      }
    },
  });
});

declare global {
  interface Window {
    __motionTriggerCount?: () => number;
  }
}

/** For tests: how many scroll triggers are alive (should be only the current page's). */
window.__motionTriggerCount = () => ScrollTrigger.getAll().length;
