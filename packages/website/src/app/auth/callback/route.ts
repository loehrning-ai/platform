import { NextResponse, type NextRequest } from "next/server";
import { AuthError } from "@supabase/supabase-js";
import { sanitizeNextPath } from "@/lib/auth/routes";
import { SITE_ORIGIN } from "@/lib/seo/entity";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

const CANONICAL_ORIGIN = new URL(SITE_ORIGIN);
const PRODUCTION_HOSTNAMES = new Set([
  CANONICAL_ORIGIN.hostname,
  `www.${CANONICAL_ORIGIN.hostname}`,
]);
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);
const SUPABASE_PKCE_CODE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function previewDeploymentOrigin(requestUrl: URL): URL | null {
  if (process.env.VERCEL_ENV !== "preview" || requestUrl.protocol !== "https:") {
    return null;
  }

  for (const candidate of [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
  ]) {
    if (!candidate) continue;
    try {
      const parsed = new URL(`https://${candidate}`);
      if (
        parsed.protocol === "https:" &&
        parsed.username === "" &&
        parsed.password === "" &&
        parsed.hostname.endsWith(".vercel.app") &&
        parsed.port === "" &&
        parsed.pathname === "/" &&
        parsed.search === "" &&
        parsed.hash === "" &&
        parsed.origin === requestUrl.origin
      ) {
        return parsed;
      }
    } catch {
      // Vercel system variables are expected to contain a bare hostname.
    }
  }
  return null;
}

/**
 * Redirects never derive their authority from an arbitrary Host header.
 * Production has one canonical origin, previews must exactly match a Vercel
 * system hostname, and loopback origins are allowed only outside production.
 */
function trustedCallbackOrigin(requestUrl: URL): URL | null {
  if (
    requestUrl.protocol === "https:" &&
    requestUrl.username === "" &&
    requestUrl.password === "" &&
    requestUrl.port === "" &&
    PRODUCTION_HOSTNAMES.has(requestUrl.hostname)
  ) {
    return new URL(CANONICAL_ORIGIN);
  }

  const previewOrigin = previewDeploymentOrigin(requestUrl);
  if (previewOrigin) return previewOrigin;

  if (
    process.env.NODE_ENV !== "production" &&
    (requestUrl.protocol === "http:" || requestUrl.protocol === "https:") &&
    requestUrl.username === "" &&
    requestUrl.password === "" &&
    LOOPBACK_HOSTNAMES.has(requestUrl.hostname)
  ) {
    return new URL(requestUrl.origin);
  }

  return null;
}

function isSupabasePkceCode(value: string | null): value is string {
  return value !== null && SUPABASE_PKCE_CODE.test(value);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const trustedOrigin = trustedCallbackOrigin(requestUrl);
  const redirectOrigin = trustedOrigin ?? CANONICAL_ORIGIN;

  function noStoreRedirect(url: URL) {
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

  function redirectToLogin(reason: string) {
    const loginUrl = new URL("/login", redirectOrigin);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("reason", reason);
    return noStoreRedirect(loginUrl);
  }

  function classifyAuthError(error: unknown): string {
    if (error instanceof AuthError) {
      const msg = error.message.toLowerCase();
      const code = "code" in error ? String(error.code) : "";
      if (code === "otp_expired" || msg.includes("expired")) return "abgelaufen";
      if (msg.includes("code verifier") || msg.includes("pkce")) return "anderes-geraet";
      return "ungueltig";
    }
    return "invalid-link";
  }

  if (!trustedOrigin) return redirectToLogin("untrusted-origin");
  if (code === null) return redirectToLogin("missing-code");
  if (!isSupabasePkceCode(code)) return redirectToLogin("invalid-code-format");

  const supabase = await createAuthServerClient();
  if (!supabase) return redirectToLogin("auth-not-configured");

  let exchange;
  try {
    exchange = await supabase.auth.exchangeCodeForSession(code);
  } catch (error) {
    return redirectToLogin(classifyAuthError(error));
  }
  if (exchange.error) return redirectToLogin(classifyAuthError(exchange.error));
  if (!exchange.data.session || !exchange.data.user?.id) {
    return redirectToLogin("invalid-link");
  }

  let verification;
  try {
    verification = await supabase.auth.getUser();
  } catch {
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    return redirectToLogin("invalid-link");
  }
  if (
    verification.error ||
    !verification.data.user?.id ||
    verification.data.user.id !== exchange.data.user.id
  ) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    return redirectToLogin(
      verification.error ? classifyAuthError(verification.error) : "invalid-link",
    );
  }

  return noStoreRedirect(new URL(next, trustedOrigin));
}
