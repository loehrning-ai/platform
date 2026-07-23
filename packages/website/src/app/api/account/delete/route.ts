import { NextResponse } from "next/server";
import {
  createAuthServerClient,
  getAuthenticatedUser,
} from "@/lib/supabase/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reportApiError } from "@/lib/observability/api-error";
import {
  consumeRateLimit,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";

// Account deletion is irreversible and rare: 3 attempts per client per 24h.
// Uses the durable, cross-region limiter (Supabase RPC with in-memory
// fallback) keyed on a SHA-256 digest of the Vercel-trusted client IP.
const RATE_LIMIT_WINDOW_SECONDS = 24 * 60 * 60;
const RATE_LIMIT_MAX = 3;
const RECENT_SIGN_IN_MAX_AGE_MS = 15 * 60 * 1000;

function privateJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

export async function DELETE(request: Request) {
  const { configured, user, error: authError } = await getAuthenticatedUser();
  if (!configured) return privateJson({ error: "auth_not_configured" }, { status: 503 });
  if (authError) {
    // Supabase Auth unreachable: not the same as "logged out". Report and
    // answer 503 so an outage does not masquerade as an auth failure.
    reportApiError({ route: "/api/account/delete", step: "auth-get-user", error: authError });
    return privateJson({ error: "auth_unavailable" }, { status: 503 });
  }
  if (!user) return privateJson({ error: "unauthorized" }, { status: 401 });

  // A long-lived stolen session must not be sufficient for irreversible
  // deletion. Magic-link login updates last_sign_in_at, so users with an older
  // session must sign out and authenticate again before retrying.
  const lastSignInAt = Date.parse(user.last_sign_in_at ?? "");
  if (
    !Number.isFinite(lastSignInAt) ||
    Date.now() - lastSignInAt > RECENT_SIGN_IN_MAX_AGE_MS
  ) {
    return privateJson(
      { error: "reauthentication_required" },
      { status: 403 },
    );
  }

  // Durable, forgery-resistant rate limit keyed on the hashed trusted client IP.
  const allowed = await consumeRateLimit({
    key: await hashedClientRateLimitKey("account-delete", request),
    windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    max: RATE_LIMIT_MAX,
  });
  if (!allowed) {
    return privateJson({ error: "rate_limit_exceeded" }, { status: 429 });
  }

  // user_course_progress rows are deleted via ON DELETE CASCADE on the user_id FK
  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return privateJson({ error: "admin_client_unavailable" }, { status: 503 });
  }

  const authClient = await createAuthServerClient();
  if (!authClient) {
    return privateJson({ error: "auth_not_configured" }, { status: 503 });
  }
  const {
    data: { session },
    error: sessionError,
  } = await authClient.auth.getSession();
  if (
    sessionError ||
    !session?.access_token ||
    session.user.id !== user.id
  ) {
    if (sessionError) {
      reportApiError({
        route: "/api/account/delete",
        step: "auth-get-session",
        error: sessionError,
      });
    }
    return privateJson({ error: "session_unavailable" }, { status: 503 });
  }

  // Revoke every refresh session before deleting the identity. Supabase access
  // JWTs cannot be revoked before their one-hour expiry, but deleting the user
  // cascades all owned rows and getUser() rejects subsequent application use.
  const { error: revokeError } = await adminClient.auth.admin.signOut(
    session.access_token,
    "global",
  );
  if (revokeError) {
    reportApiError({
      route: "/api/account/delete",
      step: "auth-revoke-sessions",
      error: revokeError,
    });
    return privateJson({ error: "session_revocation_failed" }, { status: 503 });
  }

  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    reportApiError({ step: "account_delete", error });
    return privateJson({ error: "delete_failed" }, { status: 500 });
  }

  // Remove the cookie-backed session from this response as well. The global
  // revocation above may make the second Auth call answer 401; auth-js treats
  // that as an expected stale session and still expires local cookies.
  const { error: localSignOutError } = await authClient.auth.signOut({
    scope: "local",
  });
  if (localSignOutError) {
    reportApiError({
      route: "/api/account/delete",
      step: "auth-clear-session",
      error: localSignOutError,
    });
  }

  // Client clears the non-auth learning cache and redirects on success.
  return privateJson({ deleted: true });
}
