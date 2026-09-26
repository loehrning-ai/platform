/**
 * The site's sections as canonical route prefixes (no locale prefix).
 *
 * One table feeds every piece of chrome that marks "where am I": the header's
 * task groups (Lernen, Praxis) and the companion tab bar below lg, whose
 * Lernen and Praxis tabs are those same two groups. A new course route added
 * here marks the Lernen menu and the Lernen tab together, so the two can
 * never disagree about a page.
 *
 * Keep this module dependency-free apart from the locale helper: the tab bar's
 * client island imports it on every route.
 */
import { canonicalLocalePathname } from "@/lib/i18n/locale";

/** Courses, the diagnostic and the books: the header's Lernen menu. */
export const LEARNING_ROUTES = [
  "/kurse",
  "/ki-fuehrerschein",
  "/eu-ai-act-kurs",
  "/ai-native",
  "/ki-und-gesellschaft",
  "/ki-check",
  "/buecher",
] as const;

export const WORKSHOP_ROUTES = ["/workshops"] as const;

export const EXAMPLE_ROUTES = ["/demos"] as const;

export const OPEN_SOURCE_ROUTES = ["/open-source"] as const;

/**
 * Workshops, applied examples and the open-source surface: the header's
 * Praxis menu, the menu sheet's Praxis group, the footer's Praxis column and
 * the Praxis tab. Workshops come first, because the tab lands there.
 */
export const PRACTICE_ROUTES = [
  ...WORKSHOP_ROUTES,
  ...EXAMPLE_ROUTES,
  ...OPEN_SOURCE_ROUTES,
] as const;

/**
 * `/konto` sends a signed-out visitor to `/login`, so the sign-in page belongs
 * to the account section: the Konto tab stays marked after that redirect.
 */
export const ACCOUNT_ROUTES = ["/konto", "/login"] as const;

/**
 * True when `pathname` is one of `prefixes` or sits below one of them. The
 * locale prefix is resolved first, so `/en/demos/excel` matches `/demos`.
 * `/` only ever matches itself, because every path starts with it.
 */
export function matchesSection(
  prefixes: readonly string[],
  pathname: string | null | undefined,
): boolean {
  const canonical = canonicalLocalePathname(pathname);
  if (canonical === null) return false;
  return prefixes.some((prefix) =>
    prefix === "/"
      ? canonical === "/"
      : canonical === prefix || canonical.startsWith(`${prefix}/`),
  );
}
