/**
 * URL policy for everything Vercel Web Analytics and Speed Insights record.
 *
 * Both SDKs attach the page URL to every pageview, custom event and web-vital
 * sample. Query strings and fragments can carry sign-in codes, `next` targets,
 * shared links and other visitor-specific input, so they are removed before
 * anything is sent. The only exception is the demo gallery, whose filter
 * parameters are part of what the page shows; they survive only as short
 * lowercase slugs.
 */

const DEMO_GALLERY_PATHNAMES: ReadonlySet<string> = new Set([
  "/demos",
  "/en/demos",
]);

const DEMO_FILTER_KEYS: ReadonlySet<string> = new Set([
  "cat",
  "level",
  "industry",
  "sort",
]);

const FILTER_VALUE = /^[a-z0-9][a-z0-9_-]{0,47}$/;

const WEB_PROTOCOLS: ReadonlySet<string> = new Set(["http:", "https:"]);

function parseUrl(rawUrl: string): URL | null {
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}

function demoFilterQuery(params: URLSearchParams): string {
  const kept = Array.from(DEMO_FILTER_KEYS).flatMap((key): string[][] => {
    const value = params.get(key);
    return value !== null && FILTER_VALUE.test(value) ? [[key, value]] : [];
  });
  return new URLSearchParams(kept).toString();
}

/**
 * Returns the URL that may be recorded, or null when the event must not be
 * sent at all. Credentials, the fragment and every query parameter outside
 * the demo gallery allowlist are removed.
 */
export function sanitizeTelemetryUrl(rawUrl: string): string | null {
  if (typeof rawUrl !== "string") return null;
  const url = parseUrl(rawUrl);
  if (!url || !WEB_PROTOCOLS.has(url.protocol)) return null;

  const query = DEMO_GALLERY_PATHNAMES.has(url.pathname)
    ? demoFilterQuery(url.searchParams)
    : "";
  return `${url.origin}${url.pathname}${query ? `?${query}` : ""}`;
}
