// Opening sequence of every page. Elements opt in with data-intro:
//   "0" the photograph (home only), "1" heading text, "2" the home tiles.
// Every element has started by 0.4 s and the whole sequence ends by about 0.9 s.
import { gsap } from 'gsap';
import { EASE_OUT, registerMotion } from './motion';

registerMotion(() => {
  const photo = document.querySelector('[data-intro="0"]');
  const text = document.querySelectorAll('[data-intro="1"]');
  const tiles = document.querySelectorAll('[data-intro="2"]');
  const timeline = gsap.timeline({ defaults: { ease: EASE_OUT, clearProps: 'transform,opacity' } });

  if (photo) timeline.fromTo(photo, { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9 }, 0);
  if (text.length) timeline.fromTo(text, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 }, 0.1);
  if (tiles.length) timeline.fromTo(tiles, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05 }, 0.25);
});
