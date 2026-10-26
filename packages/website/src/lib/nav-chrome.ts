/**
 * Which material the desktop nav wears on a page (from 1024px; below that the
 * compact bar is always opaque paper).
 *
 * Glass only where the top of the page carries moving visuals worth seeing
 * through the bar: the home page, the demo hub and every demo, the workshop
 * hub and detail pages, the open-source shelf and its tool pages. Every other
 * page is paper: lessons, articles, kit pages, legal pages, the account. Text
 * scrolling under text is never glass, and a page left off this list fails
 * safe to the solid bar.
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
