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

const ACCOUNT_ROUTE_PREFIX = "/konto";

const OWNER_INDEPENDENT_OPEN_SOURCE_ROUTE =
  /^\/kurse\/open-source(?:\/[^/]+(?:\/verifizierung)?)?$/;

function matchesPrefix(
  routePathname: string,
  prefixes: readonly string[],
): boolean {
  return prefixes.some(
    (prefix) =>
      routePathname === prefix || routePathname.startsWith(`${prefix}/`),
  );
}

/**
 * Routes that can read or mutate the unified learning ledger.
 *
 * Keep this pure and dependency-free: the root-layout gates import it on every
 * route so the actual progress store, badge catalog, and animation runtime can
 * remain in a learning-only async chunk.
 */
export function isProgressUiRoute(pathname: string): boolean {
  const routePathname = canonicalLocalePathname(pathname);
  if (routePathname === null) return false;
  return matchesPrefix(routePathname, PROGRESS_UI_ROUTE_PREFIXES);
}

/**
 * Routes where account and progress reconciliation can be observed at all, and
 * therefore the only routes on which the root layout mounts its runtime.
 *
 * This is the widest of the three predicates on purpose, because it must cover
 * every surface the runtime can affect, and neither other predicate does:
 *
 * - `isProgressUiRoute` covers every module that imports the progress store,
 *   but misses `/konto`, whose sync notice is the only reader of the failure
 *   the runtime publishes, and `/konto/datenschutz`, which runs deletion.
 * - `isLearningOwnerRoute` covers `/konto/datenschutz` but misses `/kurse`
 *   and `/buecher`, and deliberately excludes owner-independent open-source
 *   pages that still read the ledger.
 *
 * No module outside this route set imports the progress store or the sync
 * notice, so no route outside it can create progress to flush or expose
 * learning data to scrub. A deletion tombstone is durable in browser storage
 * and is replayed by the next mount, and deletion itself is only reachable
 * from `/konto/datenschutz`, which is inside the set.
 */
export function isProgressRuntimeRoute(pathname: string): boolean {
  const routePathname = canonicalLocalePathname(pathname);
  if (routePathname === null) return false;
  return (
    routePathname === ACCOUNT_ROUTE_PREFIX ||
    routePathname.startsWith(`${ACCOUNT_ROUTE_PREFIX}/`) ||
    matchesPrefix(routePathname, PROGRESS_UI_ROUTE_PREFIXES)
  );
}

/**
 * Show the explicit local-continuation choice only on course surfaces whose
 * controls depend on the shared progress store. Reads and writes fail closed
 * in the store while the owner is unknown; the page itself remains interactive.
 * Open-source landing and verification pages either do not use progress or
 * render owner-aware readouts, so they do not need the choice.
 */
export function isLearningOwnerRoute(pathname: string): boolean {
  const routePathname = canonicalLocalePathname(pathname);
  if (routePathname === null) return false;
  if (OWNER_INDEPENDENT_OPEN_SOURCE_ROUTE.test(routePathname)) return false;

  return (
    routePathname === "/ai-native" ||
    routePathname === "/konto/datenschutz" ||
    routePathname.startsWith("/konto/datenschutz/") ||
    matchesPrefix(routePathname, LEARNING_OWNER_ROUTE_PREFIXES)
  );
}
