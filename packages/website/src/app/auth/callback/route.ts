import { NextResponse, type NextRequest } from "next/server";
import { AuthError, type User } from "@supabase/supabase-js";
import { trustedRequestOrigin } from "@/lib/auth/origin";
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
const MAX_IDENTITY_AMR_SKEW_SECONDS = 5;

type SupportedLoginMethod = "google" | "magic-link";

function isCurrentGoogleOAuthIdentity(user: User, timestamp: number): boolean {
  const providers = user.app_metadata?.providers;
  if (
    !Array.isArray(providers) ||
    !providers.every((provider) => typeof provider === "string") ||
    !providers.includes("google") ||
    !Array.isArray(user.identities)
  ) {
    return false;
  }

  return user.identities.some((identity) => {
    if (identity.provider !== "google" || !identity.last_sign_in_at) {
      return false;
    }
    const identityTimestamp = Date.parse(identity.last_sign_in_at) / 1_000;
    return (
      Number.isFinite(identityTimestamp) &&
      Math.abs(identityTimestamp - timestamp) <= MAX_IDENTITY_AMR_SKEW_SECONDS
    );
  });
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
      rawMethod === "oauth" && isCurrentGoogleOAuthIdentity(user, timestamp)
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
  const requestUrl = new URL(request.url);
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
