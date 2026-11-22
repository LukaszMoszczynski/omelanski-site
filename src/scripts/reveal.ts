// Cards, lists and section headings slide in as they reach the screen, in small
// batches one after another. Elements opt in with data-reveal.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EASE_OUT, registerMotion } from './motion';

registerMotion(() => {
  const items = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  if (!items.length) return;
  // A CSS transition on transform (hover lift on cards) would smooth every GSAP frame
  // and make the slide lag, so it is off until the element has arrived.
  gsap.set(items, { opacity: 0, y: 18, transition: 'none' });
  ScrollTrigger.batch(items, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => {
      // After a jump (an anchor link, End key) everything above the screen "enters" at
      // once: show those straight away so the target isn't kept waiting behind them.
      const passed = batch.filter((element) => element.getBoundingClientRect().bottom <= 0);
      const onScreen = batch.filter((element) => !passed.includes(element));
      if (passed.length) gsap.set(passed, { clearProps: 'transform,opacity,transition' });
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
