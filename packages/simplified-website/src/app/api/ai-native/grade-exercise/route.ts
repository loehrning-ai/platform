import { NextResponse } from "next/server";

import { tryGetAnthropicClient } from "@/lib/anthropic";
import { reportApiError } from "@/lib/observability/api-error";
import { readBoundedJson } from "@/lib/http/read-json-body";
import {
  consumeRateLimit,
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
  const { user } = await getAuthenticatedUser();
  const isAuthenticated = Boolean(user);

  const withinLimit = await consumeRateLimit({
    key: await hashedClientRateLimitKey("ai-native-grade", req),
    windowSeconds: 3600,
    max: isAuthenticated ? 20 : 5,
  });
  if (!withinLimit) {
    return jsonResponse(
      {
        error: "Zu viele Anfragen. Versuch's in einer Stunde erneut.",
      } satisfies GradeError,
      429,
    );
  }

  const body = await readBoundedJson(req, MAX_BODY_BYTES);
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

  const canonical = await resolveCanonicalExercise(
    kind as "exercise-fix-prompt" | "exercise-rctfc-checklist" | "exercise-free-response",
    lessonId,
    exerciseId,
  );
  if (!canonical) {
    return jsonResponse(
      { error: "Unbekannte Aufgabe." } satisfies GradeError,
      400,
    );
  }
  const { scenario, rubric, rubricIds } = canonical;

  const cacheKey = await hashRequest(
    kind,
    lessonId,
    exerciseId,
    scenario,
    rubric,
    userInput,
  );
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

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const { grade, usage } = await callHaiku({
      anthropic,
      kind: kind as "exercise-fix-prompt" | "exercise-rctfc-checklist" | "exercise-free-response",
      scenario,
      rubric,
      rubricIds,
      userInput,
      signal: controller.signal,
    });

    clearTimeout(timeout);

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
  }
}
