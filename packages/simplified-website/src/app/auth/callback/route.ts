import { NextResponse, type NextRequest } from "next/server";
import { AuthError } from "@supabase/supabase-js";
import { sanitizeNextPath } from "@/lib/auth/routes";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeNextPath(requestUrl.searchParams.get("next"));

  function noStoreRedirect(url: URL) {
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

  function redirectToLogin(reason: string) {
    const loginUrl = new URL("/login", requestUrl.origin);
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

  if (!code) return redirectToLogin("missing-code");

  const supabase = await createAuthServerClient();
  if (!supabase) return redirectToLogin("auth-not-configured");

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return redirectToLogin(classifyAuthError(error));

  return noStoreRedirect(new URL(next, requestUrl.origin));
}
