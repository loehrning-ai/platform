import { NextResponse, type NextRequest } from "next/server";
import { AuthError } from "@supabase/supabase-js";
import { trustedRequestOrigin } from "@/lib/auth/origin";
import { sanitizeNextPath } from "@/lib/auth/routes";
import { SITE_ORIGIN } from "@/lib/seo/entity";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

const CANONICAL_ORIGIN = new URL(SITE_ORIGIN);
const SUPABASE_PKCE_CODE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isSupabasePkceCode(value: string | null): value is string {
  return value !== null && SUPABASE_PKCE_CODE.test(value);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const trustedOrigin = trustedRequestOrigin(requestUrl);
  const redirectOrigin = trustedOrigin ?? CANONICAL_ORIGIN;

  function noStoreRedirect(url: URL) {
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

  function failureRedirect(reason: string) {
    const loginUrl = new URL("/login", redirectOrigin);
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
  if (!isSupabasePkceCode(code)) return failureRedirect("invalid-code-format");

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
  if (!exchange.data.session || !exchange.data.user?.id) {
    return failureRedirect("invalid-link");
  }

  let verification;
  try {
    verification = await supabase.auth.getUser();
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

  return noStoreRedirect(new URL(next, trustedOrigin));
}
