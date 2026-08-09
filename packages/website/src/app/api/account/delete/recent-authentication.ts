const RECENT_AUTH_MAX_AGE_SECONDS = 15 * 60;
const MAX_AUTH_CLOCK_SKEW_SECONDS = 60;
const SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
): boolean {
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
      age <= RECENT_AUTH_MAX_AGE_SECONDS
    );
  });
}
