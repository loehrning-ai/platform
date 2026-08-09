import { NextResponse, type NextRequest } from "next/server";
import { AuthError, type User } from "@supabase/supabase-js";
import { externalRequestUrl, trustedRequestOrigin } from "@/lib/auth/origin";
import { sanitizeNextPath } from "@/lib/auth/routes";
import { localizeHref, parseLocalePathname } from "@/lib/i18n/locale";
import {
  isAccountRuntimeReady,
  isGoogleOAuthRuntimeReady,
  isMagicLinkRuntimeReady,
} from "@/lib/provider-readiness";
import { SITE_ORIGIN } from "@/lib/seo/entity";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

const CANONICAL_ORIGIN = new URL(SITE_ORIGIN);
const MAX_AUTHORIZATION_CODE_LENGTH = 2_048;
const NON_OAUTH_IDENTITY_PROVIDERS = new Set(["email", "phone"]);

type SupportedLoginMethod = "google" | "magic-link";

/**
 * Attributes an `oauth` authentication event to Google.
 *
 * The signed `amr` claim already proves this session was created through OAuth.
 * What it does not carry is which provider, and the user object has no
 * per-event provider field either — `app_metadata.provider` records the
 * original sign-up method. Google is therefore inferred from the linked
 * identities, and only when it is the account's sole OAuth identity. With a
 * second one present the event cannot be attributed to either, so it is
 * refused rather than guessed.
 *
 * An earlier revision instead required the Google identity's `last_sign_in_at`
 * to fall within five seconds of the `amr` timestamp. GoTrue does not advance
 * that column on a returning sign-in — it keeps the value written when the
 * identity was linked — so the window rejected every user who had signed in
 * with Google before, and did so after the one-time code had already been
 * consumed, leaving no way to recover but to fail again. Measured on this
 * project, an existing account's identity timestamp trailed its user timestamp
 * by 41,670 seconds against that five-second tolerance.
 */
function isGoogleOAuthEvent(user: User): boolean {
  const providers = user.app_metadata?.providers;
  if (
    !Array.isArray(providers) ||
    !providers.every((provider) => typeof provider === "string") ||
    !providers.includes("google") ||
    !Array.isArray(user.identities)
  ) {
    return false;
  }

  const oauthIdentities = user.identities.filter(
    (identity) =>
      typeof identity.provider === "string" &&
      !NON_OAUTH_IDENTITY_PROVIDERS.has(identity.provider),
  );
  return (
    oauthIdentities.length === 1 && oauthIdentities[0]?.provider === "google"
  );
}

function supportedLoginMethodFromClaims(
  claims: Record<string, unknown>,
  user: User,
): SupportedLoginMethod | null {
  if (claims.sub !== user.id || !Array.isArray(claims.amr)) return null;

  let latest:
    | { readonly method: SupportedLoginMethod; readonly timestamp: number }
    | undefined;
  for (const entry of claims.amr) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const rawMethod = Reflect.get(entry, "method");
    const timestamp = Reflect.get(entry, "timestamp");
    if (
      typeof rawMethod !== "string" ||
      typeof timestamp !== "number" ||
      !Number.isFinite(timestamp)
    ) {
      continue;
    }
    const method: SupportedLoginMethod | null =
      rawMethod === "oauth" && isGoogleOAuthEvent(user)
        ? "google"
        : rawMethod === "magiclink" ||
            rawMethod === "otp" ||
            rawMethod === "email/signup"
          ? "magic-link"
          : null;
    if (method && (!latest || timestamp > latest.timestamp)) {
      latest = { method, timestamp };
    }
  }
  return latest?.method ?? null;
}

function isBoundedOpaqueAuthorizationCode(value: string): boolean {
  if (
    value.length === 0 ||
    value.length > MAX_AUTHORIZATION_CODE_LENGTH ||
    value.trim().length === 0
  ) {
    return false;
  }
  return !Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127;
  });
}

export async function GET(request: NextRequest) {
  const requestUrl = externalRequestUrl(request);
  const codeValues = requestUrl.searchParams.getAll("code");
  const code = codeValues[0] ?? null;
  const next = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const nextLocale = parseLocalePathname(
    new URL(next, CANONICAL_ORIGIN).pathname,
  ).locale;
  const trustedOrigin = trustedRequestOrigin(requestUrl);
  const redirectOrigin = trustedOrigin ?? CANONICAL_ORIGIN;

  function noStoreRedirect(url: URL) {
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

  function failureRedirect(reason: string) {
    const loginUrl = new URL(
      localizeHref("/login", nextLocale),
      redirectOrigin,
    );
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("reason", reason);
    return noStoreRedirect(loginUrl);
  }

  // Next's host redirect normally runs first. Keep the callback safe if a
  // proxy or future routing change invokes this route on www directly: never
  // exchange a one-time code on a host whose host-only auth cookie would be
  // discarded by the following apex redirect.
  if (
    requestUrl.protocol === "https:" &&
    requestUrl.hostname === `www.${CANONICAL_ORIGIN.hostname}` &&
    requestUrl.port === ""
  ) {
    return noStoreRedirect(
      new URL(`${requestUrl.pathname}${requestUrl.search}`, CANONICAL_ORIGIN),
    );
  }

  function classifyAuthError(error: unknown): string {
    if (error instanceof AuthError) {
      if (typeof error.status === "number" && error.status >= 500) {
        return "auth-unavailable";
      }
      const msg = error.message.toLowerCase();
      const code = "code" in error ? String(error.code) : "";
      if (code === "otp_expired" || msg.includes("expired")) return "abgelaufen";
      if (msg.includes("code verifier") || msg.includes("pkce")) return "anderes-geraet";
      return "ungueltig";
    }
    return "invalid-link";
  }

  if (!trustedOrigin) return failureRedirect("untrusted-origin");
  if (code === null) return failureRedirect("missing-code");
  if (
    codeValues.length !== 1 ||
    !isBoundedOpaqueAuthorizationCode(code)
  ) {
    return failureRedirect("invalid-code-format");
  }

  // Public Supabase configuration is enough to construct an auth client, but
  // it is not enough to authorize an account transaction. Bind direct callback
  // requests to the same server-only privacy, region, abuse-protection, and
  // provider attestations that control the login page. This prevents a stale
  // or hand-crafted callback from bypassing a disabled login surface.
  const accountReady = isAccountRuntimeReady();
  const magicLinkReady = isMagicLinkRuntimeReady();
  const googleReady = isGoogleOAuthRuntimeReady();
  if (!accountReady || (!magicLinkReady && !googleReady)) {
    return failureRedirect("auth-not-configured");
  }

  let supabase;
  try {
    supabase = await createAuthServerClient();
  } catch {
    return failureRedirect("auth-unavailable");
  }
  if (!supabase) return failureRedirect("auth-not-configured");

  let exchange;
  try {
    exchange = await supabase.auth.exchangeCodeForSession(code);
  } catch (error) {
    return failureRedirect(
      error instanceof AuthError
        ? classifyAuthError(error)
        : "auth-unavailable",
    );
  }
  if (exchange.error) return failureRedirect(classifyAuthError(exchange.error));
  if (
    !exchange.data.session?.access_token ||
    !exchange.data.user?.id
  ) {
    return failureRedirect("invalid-link");
  }

  let verification;
  let claimsResult;
  try {
    [verification, claimsResult] = await Promise.all([
      supabase.auth.getUser(exchange.data.session.access_token),
      supabase.auth.getClaims(exchange.data.session.access_token),
    ]);
  } catch {
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    return failureRedirect("auth-unavailable");
  }
  if (
    verification.error ||
    !verification.data.user?.id ||
    verification.data.user.id !== exchange.data.user.id
  ) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    return failureRedirect(verification.error
      ? classifyAuthError(verification.error)
      : "invalid-link");
  }

  if (claimsResult.error || !claimsResult.data?.claims) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    return failureRedirect(
      claimsResult.error instanceof AuthError
        ? classifyAuthError(claimsResult.error)
        : "auth-unavailable",
    );
  }
  const loginMethod = supportedLoginMethodFromClaims(
    claimsResult.data.claims as Record<string, unknown>,
    verification.data.user,
  );
  const methodReady =
    loginMethod === "google"
      ? googleReady
      : loginMethod === "magic-link"
        ? magicLinkReady
        : false;
  if (!methodReady) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    return failureRedirect("auth-not-configured");
  }

  return noStoreRedirect(new URL(next, trustedOrigin));
}
