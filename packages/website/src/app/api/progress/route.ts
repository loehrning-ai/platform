import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient, getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { readBoundedJson } from "@/lib/http/read-json-body";
import { reportApiError } from "@/lib/observability/api-error";
import {
  consumeRateLimit,
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
// Uses the durable, cross-region limiter keyed on a SHA-256 digest of the
// Vercel-trusted client IP.
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const RATE_LIMIT_MAX = 120;

const payloadSchema = z.object({
  progress: z.unknown().refine(isUnifiedProgress, "Invalid progress payload"),
});

function privateJson(body: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

async function requireUser() {
  const { configured, user, error: authError } = await getAuthenticatedUser();
  if (!configured) {
    return { error: privateJson({ error: "auth_not_configured" }, { status: 503 }) };
  }
  if (authError) {
    // Supabase Auth unreachable: not the same as "logged out". Report and
    // answer 503 so an outage does not masquerade as an auth failure.
    reportApiError({ route: "/api/progress", step: "auth-get-user", error: authError });
    return { error: privateJson({ error: "auth_unavailable" }, { status: 503 }) };
  }
  if (!user) {
    return { error: privateJson({ error: "unauthorized" }, { status: 401 }) };
  }
  const supabase = await createAuthServerClient();
  if (!supabase) {
    return { error: privateJson({ error: "auth_not_configured" }, { status: 503 }) };
  }
  return { user, supabase };
}

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const fetched = await fetchUnifiedProgressForUser(auth.supabase, auth.user.id);
  if (!fetched.ok) {
    reportApiError({ route: "/api/progress", step: "supabase-read", error: fetched.error });
    return privateJson({ error: "progress_read_failed" }, { status: 500 });
  }

  return privateJson({
    progress: fetched.result.progress,
    updatedAt: fetched.result.updatedAt,
  });
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  // Durable, forgery-resistant rate limit keyed on the hashed trusted client IP.
  const allowed = await consumeRateLimit({
    key: await hashedClientRateLimitKey("progress", request),
    windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    max: RATE_LIMIT_MAX,
  });
  if (!allowed) {
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

  const incoming: UnifiedProgress = parsed.data.progress;

  // Persists one row per touched course plus the cross-course ledger row
  // (plan 007 stage 5) — a checkpoint in one course no longer requires
  // re-serializing every other course's row. The client-facing shape here is
  // unchanged: still the full aggregated UnifiedProgress object.
  const result = await upsertUnifiedProgressForUser(auth.supabase, auth.user.id, incoming);

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
