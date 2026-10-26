/**
 * Which material the desktop nav wears on a page (from 1024px; below that the
 * compact bar is always opaque paper).
 *
 * Glass only where the page opens on moving visuals worth seeing through the
 * bar: the home page, the demo hub and every demo, the workshop hub and detail
 * pages (the poster and its stage), the open-source shelf and its tool pages.
 * The material is a property of the page, not of the scroll position: it
 * never switches while the page scrolls, so further down the same bar also
 * passes over that page's text (legible by the contrast proof in glass.ts).
 * Pages that are reading from the first line are paper: lessons, articles,
 * kit pages, legal pages, the account. A page left off this list fails safe
 * to the solid bar. Nothing docked under the bar is glass: glass is never
 * stacked on glass.
 */

export type NavChrome = "glass" | "paper";

const GLASS_ROUTES: readonly RegExp[] = [
  /^\/$/,
  /^\/demos(?:\/[^/]+)?$/,
  /^\/workshops(?:\/[^/]+)?$/,
  /^\/open-source(?:\/[^/]+\/[^/]+)?$/,
];

/** `pathname` is the route without its locale prefix ("/demos", not "/en/demos"). */
export function navChrome(pathname: string): NavChrome {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return GLASS_ROUTES.some((route) => route.test(path)) ? "glass" : "paper";
}
