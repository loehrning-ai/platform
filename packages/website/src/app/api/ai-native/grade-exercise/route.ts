import { NextResponse } from "next/server";

import { tryGetAnthropicClient } from "@/lib/anthropic";
import { reportApiError } from "@/lib/observability/api-error";
import {
  hasJsonContentType,
  readBoundedJson,
} from "@/lib/http/read-json-body";
import {
  consumeRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import {
  buildFallbackGrade,
  callHaiku,
  hashRequest,
  isGradeEnabled,
  readCache,
  writeCache,
} from "./engine";
import { resolveCanonicalExercise } from "./canonical-exercise";
import type { GradeError, GradeResponse } from "./types";
import { gradeRequestSchema } from "./validation";

export const runtime = "edge";

const MAX_BODY_BYTES = 32 * 1024;
const PRIVATE_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
} as const;

function jsonResponse(body: GradeResponse | GradeError, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: PRIVATE_RESPONSE_HEADERS,
  });
}

export async function POST(req: Request): Promise<Response> {
  const start = Date.now();

  if (!hasJsonContentType(req)) {
    return jsonResponse(
      { error: "Nicht unterstützter Medientyp." } satisfies GradeError,
      415,
    );
  }

  // The shared validated Anthropic feature flag is off by default. Return a
  // rule-based fallback without sending learner text to a provider.
  if (!isGradeEnabled()) {
    return jsonResponse({
      ...buildFallbackGrade(),
      cached: false,
    } satisfies GradeResponse);
  }

  // Auth check: authenticated callers get 20/hr; anonymous callers get 5/hr.
  // This keeps the educational open-access intent while closing unmetered burn.
  // Grading does not require auth, so a Supabase Auth outage must not block
  // anonymous learners: report it and fall back to the stricter tier.
  let auth;
  try {
    auth = await getAuthenticatedUser();
  } catch (error) {
    auth = { configured: true, user: null, error };
  }
  const { user, error: authError } = auth;
  if (authError) {
    reportApiError({ request: req, step: "auth-get-user", error: authError });
  }
  const isAuthenticated = Boolean(user) && !authError;

  let trustedIpScope: string;
  let withinUserLimit: boolean;
  let withinIpLimit: boolean;
  try {
    trustedIpScope = await hashedClientRateLimitKey(
      "ai-native-grade",
      req,
    );
    withinUserLimit =
      isAuthenticated && user
        ? await consumeRateLimit({
            key: await hashedAuthenticatedRateLimitKey(
              "ai-native-grade",
              req,
              user.id,
            ),
            windowSeconds: 3600,
            max: 20,
          })
        : true;
    withinIpLimit = withinUserLimit
      ? await consumeRateLimit({
          key: trustedIpScope,
          windowSeconds: 3600,
          max: isAuthenticated ? 100 : 5,
        })
      : false;
  } catch (rateLimitError) {
    reportApiError({
      request: req,
      step: "rate-limit",
      error: rateLimitError,
    });
    return jsonResponse(
      { error: "Anfragelimit ist vorübergehend nicht verfügbar." } satisfies GradeError,
      503,
    );
  }
  if (!withinUserLimit || !withinIpLimit) {
    return jsonResponse(
      {
        error: "Zu viele Anfragen. Versuch's in einer Stunde erneut.",
      } satisfies GradeError,
      429,
    );
  }

  let body;
  try {
    body = await readBoundedJson(req, MAX_BODY_BYTES);
  } catch (error) {
    reportApiError({
      request: req,
      step: "unhandled",
      error,
    });
    return jsonResponse(
      { error: "AI-Bewertung fehlgeschlagen." } satisfies GradeError,
      500,
    );
  }
  if (!body.ok && body.error === "body_too_large") {
    return jsonResponse(
      { error: "Anfrage zu groß." } satisfies GradeError,
      413,
    );
  }
  if (!body.ok) {
    return jsonResponse(
      { error: "Ungültiger JSON-Body." } satisfies GradeError,
      400,
    );
  }

  const parsed = gradeRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonResponse(
      { error: "Validierung fehlgeschlagen." } satisfies GradeError,
      400,
    );
  }
  const { kind, lessonId, exerciseId, userInput } = parsed.data;

  let canonical;
  try {
    canonical = await resolveCanonicalExercise(
      kind as "exercise-fix-prompt" | "exercise-rctfc-checklist" | "exercise-free-response",
      lessonId,
      exerciseId,
    );
  } catch (error) {
    reportApiError({
      request: req,
      step: "unhandled",
      error,
      extra: { kind },
    });
    return jsonResponse(
      { error: "AI-Bewertung fehlgeschlagen." } satisfies GradeError,
      500,
    );
  }
  if (!canonical) {
    return jsonResponse(
      { error: "Unbekannte Aufgabe." } satisfies GradeError,
      400,
    );
  }
  const { scenario, rubric, rubricIds } = canonical;

  let cacheKey: string;
  try {
    cacheKey = await hashRequest(
      isAuthenticated && user ? `user:${user.id}` : trustedIpScope,
      kind,
      lessonId,
      exerciseId,
      scenario,
      rubric,
      userInput,
    );
  } catch (error) {
    reportApiError({
      request: req,
      step: "unhandled",
      error,
      extra: { kind },
    });
    return jsonResponse(
      { error: "AI-Bewertung fehlgeschlagen." } satisfies GradeError,
      500,
    );
  }
  const cached = readCache(cacheKey);
  if (cached) {
    return jsonResponse({ ...cached, cached: true });
  }

  const anthropic = tryGetAnthropicClient();
  if (!anthropic) {
    return jsonResponse(
      { error: "AI-Bewertung ist nicht konfiguriert." } satisfies GradeError,
      503,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {

    const { grade, usage } = await callHaiku({
      anthropic,
      kind: kind as "exercise-fix-prompt" | "exercise-rctfc-checklist" | "exercise-free-response",
      scenario,
      rubric,
      rubricIds,
      userInput,
      signal: controller.signal,
    });

    const result: GradeResponse = { ...grade, cached: false };
    writeCache(cacheKey, result);

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        route: "ai-native/grade-exercise",
        status: "success",
        kind,
        lessonId,
        exerciseId,
        score: result.score,
        durationMs: Date.now() - start,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheReadInputTokens: usage.cacheReadInputTokens,
        cacheCreationInputTokens: usage.cacheCreationInputTokens,
      }),
    );

    return jsonResponse(result);
  } catch (err) {
    reportApiError({
      request: req,
      step: "llm-call",
      error: err,
      extra: { kind, lessonId, exerciseId, durationMs: Date.now() - start },
    });
    return jsonResponse(
      { error: "AI-Bewertung fehlgeschlagen." } satisfies GradeError,
      500,
    );
  } finally {
    clearTimeout(timeout);
  }
}
