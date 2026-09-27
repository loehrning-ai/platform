/**
 * Same-origin interstitial for a form POST whose answer continues to another
 * origin.
 *
 * The enforced policy carries `form-action 'self'`. Chromium applies that
 * directive to every redirect a form submission follows, so a POST to one of
 * our own routes that answers with a 303 to another origin is refused before
 * the browser leaves this origin: the OAuth consent decision never reaches the
 * client's `redirect_uri`, and the cv-engine handoff never reaches the hosted
 * tool. Widening `form-action` would fix that by letting every form on the
 * origin post anywhere, which is the one thing the directive exists to stop.
 *
 * So the form's own answer is a small same-origin page instead of a redirect.
 * The form submission ends there, and the onward trip is an ordinary
 * navigation, which `form-action` does not govern:
 *
 * - `<meta http-equiv="refresh" content="0;url=...">` continues immediately.
 *   A zero-delay refresh replaces the current history entry, so Back returns
 *   to the page that held the form rather than to this POST result.
 * - A visible link is the fallback for a browser that blocks automatic
 *   refresh.
 *
 * The page renders no script and no inline handler, so it works unchanged
 * under the nonce policy once that is enforced. It names only the destination
 * host; the full URL, which can carry an authorization code or a one-time
 * token, appears in the two attributes that navigate and nowhere else.
 *
 * The response is private and uncacheable, sends no Referer onward and is
 * never indexed. The site-wide security headers from next.config.ts (CSP,
 * frame denial, nosniff) apply to it like to every other response.
 */
import type { Locale } from "../i18n/locale";

/** Longest destination accepted, matching the consent redirect bound. */
const MAX_DESTINATION_LENGTH = 2_048;

/** Headers every interstitial carries, in addition to the site-wide set. */
export const REDIRECT_INTERSTITIAL_HEADERS: Readonly<Record<string, string>> =
  Object.freeze({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  });

interface InterstitialCopy {
  readonly title: (host: string) => string;
  readonly lead: string;
  readonly fallback: string;
  readonly link: (host: string) => string;
}

const COPY: Readonly<Record<Locale, InterstitialCopy>> = {
  de: {
    title: (host) => `Weiter zu ${host}`,
    lead: "Du wirst weitergeleitet.",
    fallback: "Falls sich die Seite nicht von selbst öffnet, geht es hier weiter:",
    link: (host) => `Weiter zu ${host}`,
  },
  en: {
    title: (host) => `Continue to ${host}`,
    lead: "You are being forwarded.",
    fallback: "If the page does not open on its own, continue here:",
    link: (host) => `Continue to ${host}`,
  },
};

const HTML_ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escape for both element text and a double-quoted attribute value. Every
 * character that could close the attribute, open a tag or start an entity is
 * replaced, so an attacker-influenced URL stays one inert attribute value.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);
}

/**
 * The destination as a canonical absolute HTTP(S) URL, or null.
 *
 * Only an absolute `http:` or `https:` URL with a host and no embedded
 * credentials qualifies. `javascript:`, `data:`, relative and protocol-less
 * values are refused, so the refresh and the link can only ever navigate. The
 * URL is re-serialized by the WHATWG parser, which percent-encodes whitespace
 * and control characters, so the value cannot end the refresh instruction
 * early either.
 */
export function continuationUrl(value: unknown): URL | null {
  if (typeof value !== "string" || value.length > MAX_DESTINATION_LENGTH) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (
    (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.host === ""
  ) {
    return null;
  }
  return parsed;
}

/** The interstitial document for an already validated destination. */
export function renderRedirectInterstitial(
  destination: URL,
  locale: Locale,
): string {
  const copy = COPY[locale];
  const href = escapeHtml(destination.href);
  const title = escapeHtml(copy.title(destination.host));
  return [
    "<!doctype html>",
    `<html lang="${locale}">`,
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="color-scheme" content="light dark">',
    '<meta name="robots" content="noindex, nofollow, noarchive">',
    '<meta name="referrer" content="no-referrer">',
    `<meta http-equiv="refresh" content="0;url=${href}">`,
    `<title>${title}</title>`,
    "</head>",
    "<body>",
    "<main>",
    `<h1>${title}</h1>`,
    `<p>${escapeHtml(copy.lead)}</p>`,
    `<p>${escapeHtml(copy.fallback)}</p>`,
    `<p><a href="${href}" rel="noreferrer">${escapeHtml(copy.link(destination.host))}</a></p>`,
    "</main>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

/**
 * The 200 response that replaces a cross-origin 303 after a form POST.
 *
 * Throws for a destination that is not an absolute HTTP(S) URL. Callers pass
 * only destinations they have already validated, so reaching the throw is a
 * programming error; failing loudly is safer than rendering a page that could
 * navigate somewhere the caller never checked.
 */
export function redirectInterstitialResponse(
  destination: string,
  locale: Locale,
): Response {
  const url = continuationUrl(destination);
  if (!url) {
    throw new TypeError(
      "Redirect interstitial destination must be an absolute HTTP(S) URL without credentials.",
    );
  }
  return new Response(renderRedirectInterstitial(url, locale), {
    status: 200,
    headers: new Headers(REDIRECT_INTERSTITIAL_HEADERS),
  });
}
