import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * First-party session boundary.
 *
 * One Supabase project signs two kinds of user access token with the same
 * key, and the Auth server accepts both on `/auth/v1/user`:
 *
 * - A first-party session, created by this site's own sign-in (Google or the
 *   email link). Its audience is `authenticated` and it carries no
 *   `client_id`.
 * - An OAuth 2.1 access token, issued by the Supabase OAuth server to a
 *   third-party client the learner approved on /oauth/consent. It carries the
 *   approved client's `client_id`.
 *
 * `getUser()` alone therefore cannot tell them apart. A client holding the
 * second kind could wrap it in an `sb-<ref>-auth-token` cookie and call the
 * cookie-authenticated account routes server to server, where it would act
 * with the learner's full rights, far beyond the read-only access the consent
 * screen promised. Every place where a cookie session authorizes something
 * checks the verified claims with this module first. `@/lib/mcp/auth` remains
 * the only place an OAuth client token is accepted, and only for the
 * read-only agent tools.
 */

export const FIRST_PARTY_SESSION_AUDIENCE = "authenticated";
export const FIRST_PARTY_SESSION_ROLE = "authenticated";

function isFirstPartyAudience(value: unknown): boolean {
  if (value === FIRST_PARTY_SESSION_AUDIENCE) return true;
  // A JWT library may serialize a single audience as a one-element array.
  // Anything wider names another audience as well and is not first-party.
  return (
    Array.isArray(value) &&
    value.length === 1 &&
    value[0] === FIRST_PARTY_SESSION_AUDIENCE
  );
}

/**
 * True only for the verified claims of a session this site created itself
 * for `userId`: no `client_id` claim of any value, audience `authenticated`,
 * role `authenticated`, and the expected subject.
 *
 * The claims must come from a verified token (`getClaims()` or the Auth
 * server); this function reads them, it does not verify a signature.
 */
export function isFirstPartySessionClaims(
  claims: unknown,
  userId: string,
): boolean {
  if (!claims || typeof claims !== "object" || Array.isArray(claims)) {
    return false;
  }
  // Presence alone decides: GoTrue omits the claim for its own sessions, so
  // even an empty or null `client_id` marks a token minted for a client.
  if (Object.hasOwn(claims, "client_id")) return false;
  if (typeof userId !== "string" || userId.length === 0) return false;
  return (
    Reflect.get(claims, "sub") === userId &&
    Reflect.get(claims, "role") === FIRST_PARTY_SESSION_ROLE &&
    isFirstPartyAudience(Reflect.get(claims, "aud"))
  );
}

export type FirstPartySessionVerdict =
  /** Verified claims describe a first-party session for the user. */
  | { readonly status: "first-party" }
  /**
   * Verified, and not a first-party session (an OAuth client token, another
   * subject, or no session at all). Callers treat the request as signed out.
   */
  | { readonly status: "not-first-party" }
  /** The claims could not be verified right now. Callers fail closed. */
  | { readonly status: "unavailable"; readonly error: unknown };

/**
 * A `getClaims()` error that settles the question rather than postponing it:
 * the token itself was refused. Network failures, 5xx answers and rate limits
 * say nothing about the token, so they stay `unavailable` and never sign a
 * learner out.
 */
function isDefinitiveClaimsRejection(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = Reflect.get(error, "name");
  if (name === "AuthInvalidJwtError" || name === "AuthSessionMissingError") {
    return true;
  }
  const status = Reflect.get(error, "status");
  return status === 401 || status === 403;
}

/**
 * Verify that the session held by `supabase` (or the explicit `accessToken`)
 * is a first-party session for `userId`. Call it after `getUser()` has
 * succeeded; it never throws.
 */
export async function verifyFirstPartySession(
  supabase: Pick<SupabaseClient, "auth">,
  userId: string,
  accessToken?: string,
): Promise<FirstPartySessionVerdict> {
  let result: Awaited<ReturnType<SupabaseClient["auth"]["getClaims"]>>;
  try {
    result =
      accessToken === undefined
        ? await supabase.auth.getClaims()
        : await supabase.auth.getClaims(accessToken);
  } catch (error) {
    return { status: "unavailable", error };
  }
  if (result.error) {
    return isDefinitiveClaimsRejection(result.error)
      ? { status: "not-first-party" }
      : { status: "unavailable", error: result.error };
  }
  if (!result.data?.claims) return { status: "not-first-party" };
  return isFirstPartySessionClaims(result.data.claims, userId)
    ? { status: "first-party" }
    : { status: "not-first-party" };
}

/**
 * Drop a session that must not act here. Local scope ends only the presented
 * session (at the Auth server and in this request's cookies) and never the
 * learner's other sessions. Best effort, because the caller already treats
 * the request as signed out.
 */
export async function discardNonFirstPartySession(
  supabase: Pick<SupabaseClient, "auth">,
): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // The request is answered as signed out whether or not the cookie clears.
  }
}
