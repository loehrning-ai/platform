import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient, getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { tryCreateServiceClient } from "@/lib/supabase/server";
import {
  hasJsonContentType,
  readBoundedJson,
} from "@/lib/http/read-json-body";
import { reportApiError } from "@/lib/observability/api-error";
import {
  consumeRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import { isUnifiedProgress } from "@/lib/progress/server-sync";
import {
  fetchUnifiedProgressForUser,
  upsertUnifiedProgressForUser,
} from "@/lib/progress/server-store";
import type { UnifiedProgress } from "@/lib/progress/types";

const MAX_PROGRESS_PAYLOAD_BYTES = 262_144;

// Progress sync fires on ordinary learning activity (lesson completions,
// quiz results), so writes get a generous budget: 120 per client per hour.
// Uses the durable, cross-region limiter keyed on an HMAC of the
// Vercel-trusted client IP.
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const USER_RATE_LIMIT_MAX = 120;
const CLIENT_RATE_LIMIT_MAX = 600;

const payloadSchema = z.object({
  expectedOwnerId: z.string().trim().min(1).max(256),
  progress: z.unknown().refine(isUnifiedProgress, "Invalid progress payload"),
});

type AuthenticatedUser = NonNullable<
  Awaited<ReturnType<typeof getAuthenticatedUser>>["user"]
>;
type AuthServerClient = NonNullable<
  Awaited<ReturnType<typeof createAuthServerClient>>
>;
type RequireUserResult =
  | {
      readonly ok: false;
      readonly response: NextResponse;
    }
  | {
      readonly ok: true;
      readonly user: AuthenticatedUser;
      readonly supabase: AuthServerClient;
    };

function privateJson(body: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

async function requireUser(): Promise<RequireUserResult> {
  let auth;
  try {
    auth = await getAuthenticatedUser();
  } catch (error) {
    reportApiError({
      route: "/api/progress",
      step: "auth-get-user",
      error,
    });
    return {
      ok: false,
      response: privateJson({ error: "auth_unavailable" }, { status: 503 }),
    };
  }
  const { configured, user, error: authError } = auth;
  if (!configured) {
    return {
      ok: false,
      response: privateJson({ error: "auth_not_configured" }, { status: 503 }),
    };
  }
  if (authError) {
    // Supabase Auth unreachable: not the same as "logged out". Report and
    // answer 503 so an outage does not masquerade as an auth failure.
    reportApiError({ route: "/api/progress", step: "auth-get-user", error: authError });
    return {
      ok: false,
      response: privateJson({ error: "auth_unavailable" }, { status: 503 }),
    };
  }
  if (!user) {
    return {
      ok: false,
      response: privateJson({ error: "unauthorized" }, { status: 401 }),
    };
  }
  let supabase;
  try {
    supabase = await createAuthServerClient();
  } catch (error) {
    reportApiError({
      route: "/api/progress",
      step: "auth-create-client",
      error,
    });
    return {
      ok: false,
      response: privateJson({ error: "auth_unavailable" }, { status: 503 }),
    };
  }
  if (!supabase) {
    return {
      ok: false,
      response: privateJson({ error: "auth_not_configured" }, { status: 503 }),
    };
  }
  return { ok: true, user, supabase };
}

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let fetched;
  try {
    fetched = await fetchUnifiedProgressForUser(auth.supabase, auth.user.id);
  } catch (error) {
    reportApiError({
      route: "/api/progress",
      step: "supabase-read",
      error,
    });
    return privateJson({ error: "progress_read_failed" }, { status: 500 });
  }
  if (!fetched.ok) {
    reportApiError({ route: "/api/progress", step: "supabase-read", error: fetched.error });
    return privateJson({ error: "progress_read_failed" }, { status: 500 });
  }

  return privateJson({
    ownerId: auth.user.id,
    progress: fetched.result.progress,
    updatedAt: fetched.result.updatedAt,
  });
}

export async function PUT(request: Request) {
  if (!hasJsonContentType(request)) {
    return privateJson(
      { error: "unsupported_media_type" },
      { status: 415 },
    );
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  // Pair an account budget with an IP ceiling. A new IP cannot reset the
  // authenticated user's quota, and cheap account creation cannot bypass the
  // independent client ceiling.
  let clientAllowed: boolean;
  try {
    const userAllowed = await consumeRateLimit({
      key: await hashedAuthenticatedRateLimitKey("progress", request, auth.user.id),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      max: USER_RATE_LIMIT_MAX,
    });
    if (!userAllowed) {
      return privateJson({ error: "rate_limit_exceeded" }, { status: 429 });
    }
    clientAllowed = await consumeRateLimit({
      key: await hashedClientRateLimitKey("progress-ip", request),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      max: CLIENT_RATE_LIMIT_MAX,
    });
  } catch (rateLimitError) {
    reportApiError({
      route: "/api/progress",
      step: "rate-limit",
      error: rateLimitError,
      request,
    });
    return privateJson({ error: "rate_limit_unavailable" }, { status: 503 });
  }
  if (!clientAllowed) {
    return privateJson({ error: "rate_limit_exceeded" }, { status: 429 });
  }

  const body = await readBoundedJson(request, MAX_PROGRESS_PAYLOAD_BYTES);
  if (!body.ok && body.error === "body_too_large") {
    return privateJson({ error: "payload_too_large" }, { status: 413 });
  }

  const parsed = payloadSchema.safeParse(body.ok ? body.value : null);
  if (!parsed.success) {
    return privateJson({ error: "invalid_progress" }, { status: 400 });
  }
  if (parsed.data.expectedOwnerId !== auth.user.id) {
    // The cookie-bound session changed after the browser selected its local
    // namespace. Never let a stale account-A write land in account B.
    return privateJson(
      { error: "progress_owner_mismatch" },
      { status: 409 },
    );
  }

  const incoming: UnifiedProgress = parsed.data.progress;

  // Mutations use the server-only service client after the cookie-bound
  // session has been verified with getUser(). The authenticated browser role
  // has no direct INSERT/UPDATE/DELETE grants, so callers cannot bypass this
  // route's payload validation, canonical slug set, or durable rate limit by
  // writing to PostgREST themselves. user.id remains server-derived.
  const serviceClient = tryCreateServiceClient();
  if (!serviceClient) {
    return privateJson({ error: "progress_store_unavailable" }, { status: 503 });
  }

  // Persists one row per touched course plus the cross-course ledger row
  // — a checkpoint in one course no longer requires
  // re-serializing every other course's row. The client-facing shape here is
  // unchanged: still the full aggregated UnifiedProgress object.
  let result;
  try {
    result = await upsertUnifiedProgressForUser(
      serviceClient,
      auth.user.id,
      incoming,
    );
  } catch (error) {
    reportApiError({
      route: "/api/progress",
      step: "supabase-write",
      error,
      request,
    });
    return privateJson({ error: "progress_write_failed" }, { status: 500 });
  }

  if (!result.ok && !result.conflict) {
    reportApiError({ route: "/api/progress", step: "supabase-write", error: result.error });
    return privateJson({ error: "progress_write_failed" }, { status: 500 });
  }

  if (!result.ok) {
    return privateJson(
      {
        error: "progress_conflict",
        progress: result.result.progress,
        updatedAt: result.result.updatedAt,
      },
      { status: 409 },
    );
  }

  return privateJson({
    ok: true,
    progress: result.result.progress,
    updatedAt: result.result.updatedAt,
  });
}
