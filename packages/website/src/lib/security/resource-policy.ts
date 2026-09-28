/**
 * Cross-Origin-Resource-Policy for the surfaces that answer per session.
 *
 * `Cross-Origin-Resource-Policy: same-origin` tells a browser to refuse a
 * no-cors load of the response from any other origin: an `<img>`, `<script>`,
 * `<link>` or `<video>` on another page, including a page on a sibling
 * subdomain that SameSite=Lax cookies would still accompany. It is defense in
 * depth next to nosniff and Opaque Response Blocking.
 *
 * What it does not touch, which is why these prefixes can carry it safely:
 *
 * - CORS reads. A browser checks the policy only for opaque (no-cors)
 *   responses, so the public machine JSON under /api that sends
 *   `Access-Control-Allow-Origin: *` stays readable from any origin.
 * - Top-level navigation. The consent page is reached by a redirect from the
 *   authorization server and the account pages by ordinary links; neither is
 *   an embed.
 * - Same-origin use, which is every fetch, prefetch and RSC request the site
 *   makes of itself.
 *
 * It is deliberately not site-wide. Social preview images, course covers and
 * fonts are meant to be loaded by other origins, and a global `same-origin`
 * would break them.
 *
 * The sources use Next's `headers()` path syntax. `:path*` also matches zero
 * segments, so each prefix covers its own root (`/api`, `/konto`, `/oauth`).
 * The account and consent trees exist under /en as well; /api has a single
 * unprefixed identity (the proxy redirects /en/api/*).
 */
export const SAME_ORIGIN_RESOURCE_SOURCES = [
  "/api/:path*",
  "/konto/:path*",
  "/en/konto/:path*",
  "/oauth/:path*",
  "/en/oauth/:path*",
] as const;

export const CROSS_ORIGIN_RESOURCE_POLICY_HEADER = Object.freeze({
  key: "Cross-Origin-Resource-Policy",
  value: "same-origin",
});

export interface HeaderRule {
  readonly source: string;
  readonly headers: { key: string; value: string }[];
}

/** One `headers()` rule per prefix, for next.config.ts to spread. */
export function buildResourcePolicyHeaderRules(): HeaderRule[] {
  return SAME_ORIGIN_RESOURCE_SOURCES.map((source) => ({
    source,
    headers: [{ ...CROSS_ORIGIN_RESOURCE_POLICY_HEADER }],
  }));
}
