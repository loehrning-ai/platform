import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { tryCreateServiceClient } from "@/lib/supabase/server";
import { resetCourseProgressRow } from "@/lib/progress/server-store";
import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
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

const MAX_RESET_PAYLOAD_BYTES = 4 * 1024;

// Resetting course progress discards learner state: 10 resets per client per
// hour is ample for legitimate use. Uses the durable, cross-region limiter
// keyed on a secret-keyed HMAC of the Vercel-trusted client IP.
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const USER_RATE_LIMIT_MAX = 10;
const CLIENT_RATE_LIMIT_MAX = 100;

const ownerBindingSchema = z.object({
  expectedOwnerId: z.string().trim().min(1).max(256),
}).passthrough();

const bodySchema = z.object({
  expectedOwnerId: z.string().trim().min(1).max(256),
  courseSlug: z.string().refine((v): v is CourseSlug => (COURSE_SLUGS as readonly string[]).includes(v), {
    message: "Invalid course slug",
  }),
}).strict();

function privateJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

export async function POST(request: Request) {
  if (!hasJsonContentType(request)) {
    return privateJson(
      { error: "unsupported_media_type" },
      { status: 415 },
    );
  }
  let auth;
  try {
    auth = await getAuthenticatedUser();
  } catch (error) {
    reportApiError({
      route: "/api/account/reset-progress",
      step: "auth-get-user",
      error,
      request,
    });
    return privateJson({ error: "auth_unavailable" }, { status: 503 });
  }
  const { configured, user, error: authError } = auth;
  if (!configured) return privateJson({ error: "auth_not_configured" }, { status: 503 });
  if (authError) {
    // Supabase Auth unreachable: not the same as "logged out". Report and
    // answer 503 so an outage does not masquerade as an auth failure.
    reportApiError({ route: "/api/account/reset-progress", step: "auth-get-user", error: authError });
    return privateJson({ error: "auth_unavailable" }, { status: 503 });
  }
  if (!user) return privateJson({ error: "unauthorized" }, { status: 401 });

  const body = await readBoundedJson(request, MAX_RESET_PAYLOAD_BYTES);
  if (!body.ok && body.error === "body_too_large") {
    return privateJson({ error: "payload_too_large" }, { status: 413 });
  }
  const ownerBinding = ownerBindingSchema.safeParse(
    body.ok ? body.value : null,
  );
  if (!ownerBinding.success) {
    return privateJson(
      { error: "invalid_owner_binding" },
      { status: 400 },
    );
  }
  if (ownerBinding.data.expectedOwnerId !== user.id) {
    return privateJson(
      { error: "account_owner_mismatch" },
      { status: 409 },
    );
  }

  // Pair an account budget with an IP ceiling so neither IP rotation nor
  // inexpensive account creation resets the complete mutation budget.
  let clientAllowed: boolean;
  try {
    const userAllowed = await consumeRateLimit({
      key: await hashedAuthenticatedRateLimitKey(
        "account-reset-progress",
        request,
        user.id,
      ),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      max: USER_RATE_LIMIT_MAX,
    });
    if (!userAllowed) {
      return privateJson({ error: "rate_limit_exceeded" }, { status: 429 });
    }
    clientAllowed = await consumeRateLimit({
      key: await hashedClientRateLimitKey("account-reset-progress-ip", request),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      max: CLIENT_RATE_LIMIT_MAX,
    });
  } catch (rateLimitError) {
    reportApiError({
      route: "/api/account/reset-progress",
      step: "rate-limit",
      error: rateLimitError,
      request,
    });
    return privateJson({ error: "rate_limit_unavailable" }, { status: 503 });
  }
  if (!clientAllowed) {
    return privateJson({ error: "rate_limit_exceeded" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(body.ok ? body.value : null);
  if (!parsed.success) {
    return privateJson({ error: "invalid_course_slug" }, { status: 400 });
  }

  const { courseSlug } = parsed.data;

  // Direct authenticated writes are revoked in the database. Only this
  // validated, rate-limited server path may mutate progress, and the target
  // user ID comes from the verified session rather than the request body.
  const serviceClient = tryCreateServiceClient();
  if (!serviceClient) {
    return privateJson({ error: "progress_store_unavailable" }, { status: 503 });
  }

  // A server-timestamped tombstone makes the reset authoritative against
  // stale in-flight, cross-tab, and offline sync snapshots. Other courses'
  // rows and the cross-course ledger row are never touched.
  let reset;
  try {
    reset = await resetCourseProgressRow(
      serviceClient,
      user.id,
      courseSlug,
    );
  } catch (error) {
    reportApiError({
      route: "/api/account/reset-progress",
      step: "supabase-write",
      error,
      request,
    });
    return privateJson({ error: "reset_failed" }, { status: 500 });
  }

  if (!reset.ok) {
    reportApiError({
      route: "/api/account/reset-progress",
      step: "supabase-write",
      error: reset.error,
    });
    return privateJson({ error: "reset_failed" }, { status: 500 });
  }

  return privateJson({
    ok: true,
    ownerId: user.id,
    resetCourse: courseSlug,
    resetAt: reset.resetAt,
  });
}
