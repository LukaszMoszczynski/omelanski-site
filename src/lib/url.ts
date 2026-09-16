/** Joins an Astro base path and a site-relative path without doubling slashes. */
export function joinBase(base: string, path: string): string {
  const b = base.endsWith('/') ? base : `${base}/`;
  return b + path.replace(/^\/+/, '');
}

/** Site-relative URL that respects `base` from astro.config.mjs. */
export function url(path: string): string {
  return joinBase(import.meta.env.BASE_URL, path);
}

/** Absolute URL (for canonical, og:url, sitemap references, JSON-LD). */
export function absoluteUrl(path: string): string {
  return new URL(url(path), import.meta.env.SITE).href;
}
