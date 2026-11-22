// Opening sequence of every page. Elements opt in with data-intro:
//   "0" the photograph (home only), "1" heading text, "2" the home tiles.
// The first page plays the full sequence: every element has started by 0.4 s and it ends
// by about 0.9 s. After a page change (e.g. back to the home page) only a short, gentle
// fade plays, so returning never looks like the page is being built again.
import { gsap } from 'gsap';
import { registerMotion } from './motion';
import { EASE_OUT } from './motion-state';

let firstPage = true;

registerMotion(() => {
  const full = firstPage;
  firstPage = false;
  const photo = document.querySelector('[data-intro="0"]');
  const text = document.querySelectorAll('[data-intro="1"]');
  const tiles = document.querySelectorAll('[data-intro="2"]');
  const timeline = gsap.timeline({ defaults: { ease: EASE_OUT, clearProps: 'transform,opacity' } });

  if (!full) {
    const all = [...text, ...tiles];
    if (all.length) timeline.fromTo(all, { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.02 }, 0);
    return;
  }

  if (photo) timeline.fromTo(photo, { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9 }, 0);
  if (text.length) timeline.fromTo(text, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 }, 0.1);
  if (tiles.length) timeline.fromTo(tiles, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05 }, 0.25);
});
