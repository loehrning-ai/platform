/**
 * Destination builders for the hosted cv-engine session handoff.
 *
 * Two destinations exist, and exactly one of them is reachable per request:
 *
 *   success   `<origin>/auth/handoff#token_hash=...&type=magiclink`
 *   fallback  `<origin>/?hinweis=anmelden`
 *
 * The one-time token travels in the URL fragment on purpose. A fragment is
 * never sent to the server by the browser, so it cannot appear in the hosted
 * host's access log, in a proxy log, or in a Referer header. Putting the same
 * value in the query string would write a working sign-in credential into
 * every log line that records the request path.
 *
 * The fallback carries no credential at all. It exists for every case where a
 * token could not be minted (an admin API that refuses to issue a magic link,
 * a timeout, a malformed response), and lands the learner on the hosted tool's
 * own sign-in with a notice that they need to sign in there.
 */

/** Path of the hosted tool's fragment-reading sign-in bridge. */
export const CV_ENGINE_HANDOFF_PATH = "/auth/handoff";

/** Query parameter and value that ask the hosted tool to explain the sign-in. */
export const CV_ENGINE_NOTICE_PARAM = "hinweis";
export const CV_ENGINE_SIGN_IN_NOTICE = "anmelden";

/** Verification type the handoff page passes to `verifyOtp`. */
export const CV_ENGINE_HANDOFF_TOKEN_TYPE = "magiclink";

/**
 * Bound and shape of an acceptable one-time token hash.
 *
 * The value is opaque to this route: it is only ever forwarded, never decoded.
 * Restricting it to unreserved URL characters keeps a malformed or hostile
 * value from introducing a second fragment, a query string, or a path segment
 * into the destination, and the length bound keeps an oversized response from
 * producing an unusable redirect.
 */
const TOKEN_HASH_PATTERN = /^[A-Za-z0-9._~-]{1,512}$/u;

export function isHandoffTokenHash(value: unknown): value is string {
  return typeof value === "string" && TOKEN_HASH_PATTERN.test(value);
}

/**
 * Sign-in destination without a credential. Used for every failed handoff.
 */
export function cvEngineSignInUrl(origin: string): string {
  const url = new URL("/", origin);
  url.searchParams.set(CV_ENGINE_NOTICE_PARAM, CV_ENGINE_SIGN_IN_NOTICE);
  return url.toString();
}

/**
 * Handoff destination carrying the one-time token in the fragment.
 *
 * Returns null for a token that fails validation so the caller has no way to
 * build a half-formed destination: the only alternative is the plain sign-in
 * fallback above.
 */
export function cvEngineHandoffUrl(
  origin: string,
  tokenHash: unknown,
): string | null {
  if (!isHandoffTokenHash(tokenHash)) return null;
  const url = new URL(CV_ENGINE_HANDOFF_PATH, origin);
  // Assigned rather than composed with `searchParams` so the token can never
  // slip into the query half of the URL.
  url.hash = `token_hash=${encodeURIComponent(tokenHash)}&type=${CV_ENGINE_HANDOFF_TOKEN_TYPE}`;
  return url.toString();
}
