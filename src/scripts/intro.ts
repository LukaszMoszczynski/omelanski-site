// Opening sequence of every page. Elements opt in with data-intro:
//   "0" the photograph (home only), "1" heading text, "2" the home tiles.
// The first page plays the full sequence: every element has started by 0.4 s and it ends
// by about 0.9 s. After a page change (e.g. back to the home page) only a short, gentle
// entrance plays that starts at once, so returning never looks like the page is being built again.
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

  // Starts at once (no hidden pause, which read as a jump) and without any up-and-down
  // travel (which, after the old page faded out, read as a bounce): the text fades in and
  // the cards follow one after another, growing slightly into place, done within a second.
  if (photo) gsap.set(photo, { clearProps: 'transform,opacity' });
  // Headings uncover from left to right and the small label above them slides in from
  // the left: an entrance you can see, still with no up-and-down travel.
  const headings = Array.from(text).filter((element) => element.matches('h1'));
  const labels = Array.from(text).filter((element) => element.matches('.eyebrow'));
  const rest = Array.from(text).filter((element) => !headings.includes(element) && !labels.includes(element));
  if (labels.length) timeline.fromTo(labels, { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, 0);
  if (headings.length) {
    // Starts uncovering at once (a slow start left the text below showing first).
    timeline.fromTo(headings, { clipPath: 'inset(-15% 100% -15% 0%)' }, {
      clipPath: 'inset(-15% 0% -15% 0%)', duration: 0.7, ease: 'power2.out', clearProps: 'clipPath,transform,opacity',
    }, 0);
  }
  // The text below follows once the heading is mostly there.
  if (rest.length) timeline.fromTo(rest, { opacity: 0 }, { opacity: 1, duration: 0.45, stagger: 0.06 }, headings.length ? 0.3 : 0.1);
  if (tiles.length) {
    timeline.fromTo(tiles, { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, stagger: 0.07 }, 0.05);
  }
});
