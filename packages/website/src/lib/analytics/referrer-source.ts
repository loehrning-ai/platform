import type { AnalyticsReferrerSource } from "./registry";

/**
 * Same-origin surfaces, checked in order. A prefix matches the path itself or
 * any path below it, never a sibling that merely starts with the same letters.
 */
const SOURCE_PREFIXES: readonly (readonly [string, AnalyticsReferrerSource])[] =
  [
    ["/ki-check", "ki_check"],
    ["/demos", "demo"],
    ["/kurse", "katalog"],
    ["/lernpfad", "hub"],
  ];

const ENGLISH_PREFIX = "/en";

function withoutLocalePrefix(pathname: string): string {
  if (pathname === ENGLISH_PREFIX) return "/";
  if (pathname.startsWith(`${ENGLISH_PREFIX}/`)) {
    return pathname.slice(ENGLISH_PREFIX.length);
  }
  return pathname;
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Classifies where a course start came from. Only the closed union can be
 * returned: an external referrer never contributes a host, a path or a query
 * string, it is simply `direct`.
 */
export function classifyReferrerSource(): AnalyticsReferrerSource {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return "direct";
  }
  const referrer = document.referrer;
  if (!referrer) return "direct";

  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return "direct";
  }
  if (url.origin !== window.location.origin) return "direct";

  const pathname = withoutLocalePrefix(url.pathname);
  if (pathname === "/") return "home";
  const match = SOURCE_PREFIXES.find(([prefix]) =>
    matchesPrefix(pathname, prefix),
  );
  return match ? match[1] : "direct";
}
