import { canonicalLocalePathname } from "@/lib/i18n/locale";

const PROGRESS_UI_ROUTE_PREFIXES = [
  "/ai-native",
  "/buecher",
  "/eu-ai-act-kurs",
  "/ki-fuehrerschein",
  "/ki-und-gesellschaft",
  "/kurse",
] as const;

const LEARNING_OWNER_ROUTE_PREFIXES = [
  "/ai-native/kurs",
  "/eu-ai-act-kurs/kurs",
  "/ki-fuehrerschein/kurs",
  "/ki-und-gesellschaft/kurs",
  "/kurse/open-source",
] as const;

const OWNER_INDEPENDENT_OPEN_SOURCE_ROUTE =
  /^\/kurse\/open-source(?:\/[^/]+(?:\/verifizierung)?)?$/;

/**
 * Routes that can read or mutate the unified learning ledger.
 *
 * Keep this pure and dependency-free: the root-layout gate imports it on every
 * route so the actual progress store, badge catalog, and animation runtime can
 * remain in a learning-only async chunk.
 */
export function isProgressUiRoute(pathname: string): boolean {
  const routePathname = canonicalLocalePathname(pathname);
  if (routePathname === null) return false;
  return PROGRESS_UI_ROUTE_PREFIXES.some(
    (prefix) =>
      routePathname === prefix || routePathname.startsWith(`${prefix}/`),
  );
}

/**
 * Whole-page fencing is reserved for course surfaces whose controls depend on
 * the shared progress store. Book-reader position persistence uses the owned
 * storage API directly; its reads and writes already fail closed while the
 * owner is unknown, so the public reader itself must remain interactive.
 * Open-source landing and verification pages either do not use progress or
 * render owner-aware readouts; their public navigation must remain available.
 */
export function isLearningOwnerRoute(pathname: string): boolean {
  const routePathname = canonicalLocalePathname(pathname);
  if (routePathname === null) return false;
  if (OWNER_INDEPENDENT_OPEN_SOURCE_ROUTE.test(routePathname)) return false;

  return (
    routePathname === "/ai-native" ||
    routePathname === "/konto/datenschutz" ||
    routePathname.startsWith("/konto/datenschutz/") ||
    LEARNING_OWNER_ROUTE_PREFIXES.some(
      (prefix) =>
        routePathname === prefix || routePathname.startsWith(`${prefix}/`),
    )
  );
}
