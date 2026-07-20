import { NextResponse } from "next/server";
import { z } from "zod";
import {
  consumeRateLimit,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import { readBoundedJson } from "@/lib/http/read-json-body";
import { tryCreateServiceClient } from "@/lib/supabase/server";

// Rate limit: 5 submissions per client per 24h. Uses the durable, cross-region
// limiter (Supabase RPC with in-memory fallback) keyed on a SHA-256 digest of
// the Vercel-trusted client IP — not the forgeable raw x-forwarded-for header.
const RATE_LIMIT_WINDOW_SECONDS = 24 * 60 * 60;
const RATE_LIMIT_MAX = 5;
const MAX_FEEDBACK_PAYLOAD_BYTES = 16 * 1024;

const contextPathSchema = z.string().max(500).refine((value) => {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return false;
  }
  if (
    Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127;
    })
  ) {
    return false;
  }
  try {
    const parsed = new URL(value, "https://feedback.invalid");
    return (
      parsed.origin === "https://feedback.invalid" &&
      parsed.search === "" &&
      parsed.hash === "" &&
      parsed.pathname === value
    );
  } catch {
    return false;
  }
}, "contextUrl must be a local path without query or fragment");

const feedbackSchema = z.object({
  category: z.enum(["inhalt", "technik", "lernweg", "sonstiges"]),
  message: z.string().min(10).max(2000),
  contextUrl: contextPathSchema.optional(),
});

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (
    process.env.FEEDBACK_ENABLED !== "true" ||
    !process.env.FEEDBACK_RETENTION_CRON_CONFIRMED_AT
  ) {
    return NextResponse.json(
      { ok: false, error: "feedback_disabled" },
      {
        status: 503,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
        },
      },
    );
  }

  // Stored feedback is optional. Fail explicitly before rate limiting when its
  // service-role backend is disabled; the public page hides the form in the
  // same state.
  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "feedback_storage_unavailable" },
      {
        status: 503,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
        },
      },
    );
  }

  // Durable, forgery-resistant rate limit keyed on the hashed trusted client IP.
  const allowed = await consumeRateLimit({
    key: await hashedClientRateLimitKey("feedback", request),
    windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    max: RATE_LIMIT_MAX,
  });
  if (!allowed) {
    return jsonError("rate_limit_exceeded", 429);
  }

  // Bound the actual streamed bytes. Content-Length alone is not authoritative:
  // a client can omit it or use a chunked transfer.
  const body = await readBoundedJson(request, MAX_FEEDBACK_PAYLOAD_BYTES);
  if (!body.ok && body.error === "body_too_large") {
    return jsonError("payload_too_large", 413);
  }
  if (!body.ok) {
    return jsonError("invalid_json", 400);
  }

  const parsed = feedbackSchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonError("invalid_input", 400);
  }

  const { category, message, contextUrl } = parsed.data;

  // Fail closed until the fixed-retention migration is present. The live Cron
  // job remains the hard maximum-retention mechanism; this call also prunes
  // opportunistically before every accepted write.
  const { error: retentionError } = await supabase.rpc("prune_beta_feedback");
  if (retentionError) {
    console.error(
      "[api/feedback] retention policy unavailable:",
      retentionError.message,
    );
    return jsonError("retention_policy_unavailable", 503);
  }

  // The browser-facing Supabase key has no table access. All writes pass
  // through this route and its validation/rate-limit boundary.
  const { error } = await supabase.from("beta_feedback").insert({
    category,
    message,
    context_url: contextUrl ?? null,
  });

  if (error) {
    console.error("[api/feedback] insert error:", error.message);
    return jsonError("db_error", 500);
  }

  return NextResponse.json(
    { ok: true, persisted: true },
    {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );
}
