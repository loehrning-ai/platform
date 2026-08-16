import { NextResponse } from "next/server";

import { tryGetAnthropicClient } from "@/lib/anthropic";
import { reportApiError } from "@/lib/observability/api-error";
import { hasJsonContentType, readBoundedJson } from "@/lib/http/read-json-body";
import {
  consumePairedUsageBudget,
  consumeMultiRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import {
  practiceGlobalDailyTokenBudget,
  practiceUserDailyTokenBudget,
} from "@/lib/provider-readiness";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import {
  buildFallbackGrade,
  callHaiku,
  hashRequest,
  isGradeEnabled,
  readCache,
  reservedGradeTokenBudget,
  writeCache,
} from "./engine";
import { resolveCanonicalExercise } from "./canonical-exercise";
import type { GradeError, GradeErrorCode, GradeResponse } from "./types";
import { gradeRequestSchema } from "./validation";

export const runtime = "edge";

const MAX_BODY_BYTES = 32 * 1024;
const PRIVATE_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
} as const;

function jsonResponse(
  body: GradeResponse | GradeError,
  status = 200,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: PRIVATE_RESPONSE_HEADERS,
  });
}

function gradeErrorResponse(
  code: GradeErrorCode,
  error: string,
  status: number,
): NextResponse {
  return jsonResponse({ code, error } satisfies GradeError, status);
}

export async function POST(req: Request): Promise<Response> {
  const start = Date.now();

  if (!hasJsonContentType(req)) {
    return gradeErrorResponse(
      "unsupported_media_type",
      "Nicht unterstützter Medientyp.",
      415,
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
    return gradeErrorResponse(
      "request_read_failed",
      "AI-Bewertung fehlgeschlagen.",
      500,
    );
  }
  if (!body.ok && body.error === "body_too_large") {
    return gradeErrorResponse("request_too_large", "Anfrage zu groß.", 413);
  }
  if (!body.ok) {
    return gradeErrorResponse("invalid_json", "Ungültiger JSON-Body.", 400);
  }

  const parsed = gradeRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    return gradeErrorResponse(
      "validation_failed",
      "Validierung fehlgeschlagen.",
      400,
    );
  }
  const { kind, lessonId, exerciseId, userInput } = parsed.data;

  // The shared provider feature is off by default. Invalid requests are still
  // rejected before the local fallback is returned.
  if (!isGradeEnabled()) {
    return jsonResponse({
      ...buildFallbackGrade(),
      cached: false,
    } satisfies GradeResponse);
  }

  // Grading remains open-access. Authenticated users receive an account-bound
  // quota; auth outages fail into the stricter anonymous IP-bound scope.
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
  try {
    trustedIpScope = await hashedClientRateLimitKey("ai-native-grade", req);
  } catch (rateLimitError) {
    reportApiError({
      request: req,
      step: "rate-limit",
      error: rateLimitError,
    });
    return gradeErrorResponse(
      "rate_limit_unavailable",
      "Anfragelimit ist vorübergehend nicht verfügbar.",
      503,
    );
  }

  let canonical;
  try {
    canonical = await resolveCanonicalExercise(
      kind as
        | "exercise-fix-prompt"
        | "exercise-rctfc-checklist"
        | "exercise-free-response",
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
    return gradeErrorResponse(
      "canonical_load_failed",
      "AI-Bewertung fehlgeschlagen.",
      500,
    );
  }
  if (!canonical) {
    return gradeErrorResponse("unknown_exercise", "Unbekannte Aufgabe.", 400);
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
    return gradeErrorResponse(
      "request_hash_failed",
      "AI-Bewertung fehlgeschlagen.",
      500,
    );
  }
  const cached = readCache(cacheKey);
  if (cached) {
    return jsonResponse({ ...cached, cached: true });
  }

  // Only uncached, canonical requests consume request quota.
  let withinRequestLimits: boolean;
  try {
    withinRequestLimits = await consumeMultiRateLimit({
      windowSeconds: 3600,
      entries: [
        ...(isAuthenticated && user
          ? [
              {
                key: await hashedAuthenticatedRateLimitKey(
                  "ai-native-grade",
                  req,
                  user.id,
                ),
                max: 20,
              },
            ]
          : []),
        { key: trustedIpScope, max: isAuthenticated ? 100 : 5 },
      ],
    });
  } catch (rateLimitError) {
    reportApiError({
      request: req,
      step: "rate-limit",
      error: rateLimitError,
    });
    return gradeErrorResponse(
      "rate_limit_unavailable",
      "Anfragelimit ist vorübergehend nicht verfügbar.",
      503,
    );
  }
  if (!withinRequestLimits) {
    return gradeErrorResponse(
      "rate_limited",
      "Zu viele Anfragen. Versuch's in einer Stunde erneut.",
      429,
    );
  }

  const anthropic = tryGetAnthropicClient();
  if (!anthropic) {
    return gradeErrorResponse(
      "provider_not_configured",
      "AI-Bewertung ist nicht konfiguriert.",
      503,
    );
  }

  const callerTokenBudget = practiceUserDailyTokenBudget();
  const globalTokenBudget = practiceGlobalDailyTokenBudget();
  if (callerTokenBudget === null || globalTokenBudget === null) {
    return gradeErrorResponse(
      "budget_not_configured",
      "Das Nutzungsbudget ist nicht konfiguriert.",
      503,
    );
  }

  const tokenReservation = reservedGradeTokenBudget({
    kind: kind as
      | "exercise-fix-prompt"
      | "exercise-rctfc-checklist"
      | "exercise-free-response",
    scenario,
    rubric,
    userInput,
  });
  let withinTokenBudget: boolean;
  try {
    const callerBudgetKey =
      isAuthenticated && user
        ? await hashedAuthenticatedRateLimitKey(
            "ai-model-token-day",
            req,
            user.id,
          )
        : await hashedClientRateLimitKey("ai-grade-token-day", req);
    withinTokenBudget = await consumePairedUsageBudget({
      callerKey: callerBudgetKey,
      globalKey: "ai-practice-global-token-day-v1",
      windowSeconds: 86_400,
      callerMax: callerTokenBudget,
      globalMax: globalTokenBudget,
      cost: tokenReservation,
    });
  } catch (budgetError) {
    reportApiError({
      request: req,
      step: "rate-limit",
      error: budgetError,
      extra: { kind },
    });
    return gradeErrorResponse(
      "budget_unavailable",
      "Das Nutzungsbudget ist vorübergehend nicht verfügbar.",
      503,
    );
  }
  if (!withinTokenBudget) {
    return gradeErrorResponse(
      "budget_exhausted",
      "Das Tagesbudget für Modell-Tokens ist erreicht.",
      429,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const { grade, usage } = await callHaiku({
      anthropic,
      kind: kind as
        | "exercise-fix-prompt"
        | "exercise-rctfc-checklist"
        | "exercise-free-response",
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
    return gradeErrorResponse(
      "provider_failed",
      "AI-Bewertung fehlgeschlagen.",
      500,
    );
  } finally {
    clearTimeout(timeout);
  }
}
