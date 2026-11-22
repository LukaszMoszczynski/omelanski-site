// Opening sequence of every page. Elements opt in with data-intro:
//   "0" the photograph (home only), "1" heading text, "2" the home tiles.
// The first page plays the full sequence: every element has started by 0.4 s and it ends
// by about 0.9 s. After a page change (e.g. back to the home page) only a short, gentle
// fade plays, so returning never looks like the page is being built again.
import { gsap } from 'gsap';
import { registerMotion } from './motion';
import { EASE_OUT } from './motion-state';

registerMotion(() => {
  // The first page's opening runs on CSS (global.css), without waiting for this script.
  if (!document.documentElement.classList.contains('is-returning')) return;
  const photo = document.querySelector('[data-intro="0"]');
  const text = document.querySelectorAll('[data-intro="1"]');
  const tiles = document.querySelectorAll('[data-intro="2"]');
  const timeline = gsap.timeline({ defaults: { ease: EASE_OUT, clearProps: 'transform,opacity' } });

  const all = [...text, ...tiles];
  if (photo) gsap.set(photo, { clearProps: 'transform,opacity' });
  if (all.length) timeline.fromTo(all, { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.02 }, 0);
});
