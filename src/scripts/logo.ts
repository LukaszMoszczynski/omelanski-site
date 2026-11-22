// The footer logo draws itself when it scrolls into view (the drawing is CSS, in
// Logo.astro). It is held back only once this setup has run, so if anything fails
// the logo simply stays as it is.
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { registerMotion } from './motion';

registerMotion(() => {
  const logo = document.querySelector('footer svg.logo');
  if (!logo) return;
  logo.classList.add('is-waiting');
  ScrollTrigger.create({
    trigger: logo,
    start: 'top 95%',
    once: true,
    onEnter: () => {
      logo.classList.remove('is-waiting');
      logo.classList.add('is-drawing');
    },
  });
});
