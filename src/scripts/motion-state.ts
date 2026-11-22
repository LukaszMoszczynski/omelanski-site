// The small, GSAP-free part of the motion code. Components import this, so their own
// behaviour (the phone menu, tabs, back-to-top) never depends on the animation library
// loading: GSAP is fetched lazily and, if that fails, they simply work without motion.
export const EASE_OUT = 'power3.out';
export const EASE_IN = 'power2.in';

export type Gsap = typeof import('gsap').gsap;

/** True when animations may run: reduced motion is off and the head script set it up. */
export function motionEnabled(): boolean {
  return document.documentElement.classList.contains('motion');
}

let loading: Promise<Gsap | null> | null = null;
let loaded: Gsap | null = null;

/** GSAP if motion is on and the library loads; null otherwise. Never rejects. */
export function loadGsap(): Promise<Gsap | null> {
  if (!motionEnabled()) return Promise.resolve(null);
  loading ??= import('gsap')
    .then((module) => (loaded = module.gsap))
    .catch(() => null);
  return loading;
}

/** GSAP if it has already loaded (for code that must act right now, e.g. a click). */
export function gsapIfLoaded(): Gsap | null {
  return motionEnabled() ? loaded : null;
}
