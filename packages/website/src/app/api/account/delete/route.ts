import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
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

  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    reportApiError({ step: "account_delete", error });
    return privateJson({ error: "delete_failed" }, { status: 500 });
  }

  // Client must clear localStorage and redirect to / on receiving { deleted: true }
  return privateJson({ deleted: true });
}
