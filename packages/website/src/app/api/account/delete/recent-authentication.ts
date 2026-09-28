import { isFirstPartySessionClaims } from "@/lib/supabase/first-party-session";

export const RECENT_AUTH_MAX_AGE_SECONDS = 15 * 60;
const MAX_AUTH_CLOCK_SKEW_SECONDS = 60;
const SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// `oauth` is the AMR method of this site's own Google sign-in, so it stays.
// A token the Supabase OAuth server issued to a third-party client is told
// apart by its client_id claim, not by this list (see below).
const APP_AUTH_METHODS = new Set([
  "magiclink",
  "otp",
  "email/signup",
  "oauth",
]);

export function hasRecentSessionAuthentication(
  claims: Record<string, unknown>,
  userId: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  maxAgeSeconds = RECENT_AUTH_MAX_AGE_SECONDS,
): boolean {
  if (!Number.isFinite(maxAgeSeconds) || maxAgeSeconds < 0) return false;
  // Only a first-party session can prove a recent sign-in by the learner. An
  // OAuth client's token (client_id present) never can, however fresh.
  if (!isFirstPartySessionClaims(claims, userId)) return false;
  const audience = claims.aud;
  const authenticatedAudience =
    audience === "authenticated" ||
    (Array.isArray(audience) && audience.includes("authenticated"));
  if (
    claims.sub !== userId ||
    claims.role !== "authenticated" ||
    claims.is_anonymous === true ||
    !authenticatedAudience ||
    typeof claims.session_id !== "string" ||
    !SESSION_ID_PATTERN.test(claims.session_id) ||
    !Array.isArray(claims.amr)
  ) {
    return false;
  }

  return claims.amr.some((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return false;
    }
    const method = Reflect.get(entry, "method");
    const timestamp = Reflect.get(entry, "timestamp");
    if (
      typeof method !== "string" ||
      !APP_AUTH_METHODS.has(method) ||
      typeof timestamp !== "number" ||
      !Number.isFinite(timestamp)
    ) {
      return false;
    }
    const age = nowSeconds - timestamp;
    return (
      age >= -MAX_AUTH_CLOCK_SKEW_SECONDS &&
      age <= maxAgeSeconds
    );
  });
}
