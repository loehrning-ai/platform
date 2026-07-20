import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient, getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { isUnifiedProgress } from "@/lib/progress/server-sync";
import type { UnifiedProgress } from "@/lib/progress/types";
import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
import { readBoundedJson } from "@/lib/http/read-json-body";
import { reportApiError } from "@/lib/observability/api-error";
import {
  consumeRateLimit,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";

const MAX_RESET_PAYLOAD_BYTES = 4 * 1024;

// Resetting course progress discards learner state: 10 resets per client per
// hour is ample for legitimate use. Uses the durable, cross-region limiter
// keyed on a SHA-256 digest of the Vercel-trusted client IP.
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const RATE_LIMIT_MAX = 10;

const bodySchema = z.object({
  courseSlug: z.string().refine((v): v is CourseSlug => (COURSE_SLUGS as readonly string[]).includes(v), {
    message: "Invalid course slug",
  }),
});

function privateJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

export async function POST(request: Request) {
  const { configured, user, error: authError } = await getAuthenticatedUser();
  if (!configured) return privateJson({ error: "auth_not_configured" }, { status: 503 });
  if (authError) {
    // Supabase Auth unreachable: not the same as "logged out". Report and
    // answer 503 so an outage does not masquerade as an auth failure.
    reportApiError({ route: "/api/account/reset-progress", step: "auth-get-user", error: authError });
    return privateJson({ error: "auth_unavailable" }, { status: 503 });
  }
  if (!user) return privateJson({ error: "unauthorized" }, { status: 401 });

  const supabase = await createAuthServerClient();
  if (!supabase) return privateJson({ error: "auth_not_configured" }, { status: 503 });

  // Durable, forgery-resistant rate limit keyed on the hashed trusted client IP.
  const allowed = await consumeRateLimit({
    key: await hashedClientRateLimitKey("account-reset-progress", request),
    windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    max: RATE_LIMIT_MAX,
  });
  if (!allowed) {
    return privateJson({ error: "rate_limit_exceeded" }, { status: 429 });
  }

  const body = await readBoundedJson(request, MAX_RESET_PAYLOAD_BYTES);
  if (!body.ok && body.error === "body_too_large") {
    return privateJson({ error: "payload_too_large" }, { status: 413 });
  }
  const parsed = bodySchema.safeParse(body.ok ? body.value : null);
  if (!parsed.success) {
    return privateJson({ error: "invalid_course_slug" }, { status: 400 });
  }

  const { courseSlug } = parsed.data;

  const { data: existing } = await supabase
    .from("user_course_progress")
    .select("progress")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return privateJson({ ok: true, message: "no_progress_to_reset" });
  }

  if (!isUnifiedProgress(existing.progress)) {
    return privateJson({ error: "invalid_progress_format" }, { status: 500 });
  }

  const current = existing.progress as UnifiedProgress;
  const updatedCourses = { ...current.courses };
  delete updatedCourses[courseSlug];

  const updated: UnifiedProgress = {
    ...current,
    courses: updatedCourses,
  };

  const { error } = await supabase
    .from("user_course_progress")
    .update({ progress: updated, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (error) {
    reportApiError({ route: "/api/account/reset-progress", step: "supabase-write", error });
    return privateJson({ error: "reset_failed" }, { status: 500 });
  }

  return privateJson({ ok: true, resetCourse: courseSlug });
}
