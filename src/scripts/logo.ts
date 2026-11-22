// The footer logo (and any logo marked data-draw-on-view, like the large one on the home
// page) draws itself when it scrolls into view (the drawing is CSS, in
// Logo.astro). It is held back only once this setup has run, so if anything fails
// the logo simply stays as it is.
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { registerMotion } from './motion';

registerMotion(() => {
  for (const logo of document.querySelectorAll('footer svg.logo, svg.logo[data-draw-on-view]')) {
    logo.classList.add('is-waiting');
    ScrollTrigger.create({
      trigger: logo,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        logo.classList.remove('is-waiting');
        logo.classList.add('is-drawing');
      },
    });
  }
});
