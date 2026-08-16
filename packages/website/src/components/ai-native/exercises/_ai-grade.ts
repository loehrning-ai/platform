import type { AiRubricEntry, ExerciseKind } from "@/lib/ai-native/types";
import { trackEvent } from "@/lib/ai-native/analytics";
import {
  GRADE_ERROR_CODES,
  type GradeErrorCode,
} from "@/app/api/ai-native/grade-exercise/types";

/**
 * Shared helper for the 3 AI-graded exercises (fix-prompt, rctfc-checklist,
 * free-response). POSTs to /api/ai-native/grade-exercise; on any failure
 * returns the fallback rubric the caller computed via its rule-based grader.
 *
 * Keeps fetch/error/analytics logic in ONE place so all three exercises
 * agree on what "AI unavailable" means.
 */

export interface GradeWithAIArgs<UserInput> {
  readonly kind: Extract<
    ExerciseKind,
    | "exercise-fix-prompt"
    | "exercise-rctfc-checklist"
    | "exercise-free-response"
  >;
  readonly lessonId: string;
  readonly exerciseId: string;
  readonly userInput: UserInput;
  readonly fallbackScore: number;
  readonly fallbackRubric: readonly AiRubricEntry[];
  readonly fallbackSummary: string;
  readonly timeoutMs?: number;
}

export interface GradeWithAIResult {
  readonly score: number;
  readonly rubric: readonly AiRubricEntry[];
  readonly summary: string;
  readonly source: "ai" | "fallback";
  readonly cached: boolean;
}

type FallbackReason =
  | "provider-not-ready"
  | "quota-unavailable"
  | "budget-exhausted"
  | "rate-limited"
  | "network"
  | "parse-error"
  | "timeout"
  | "bad-request";

function isGradeErrorCode(value: unknown): value is GradeErrorCode {
  return (
    typeof value === "string" &&
    (GRADE_ERROR_CODES as readonly string[]).includes(value)
  );
}

function fallbackReasonForCode(
  code: GradeErrorCode | null,
  status: number,
): FallbackReason {
  if (code === "rate_limited") return "rate-limited";
  if (code === "budget_exhausted") return "budget-exhausted";
  if (
    code === "rate_limit_unavailable" ||
    code === "budget_unavailable" ||
    code === "budget_not_configured"
  ) {
    return "quota-unavailable";
  }
  if (code === "provider_not_configured") return "provider-not-ready";
  if (
    code === "unsupported_media_type" ||
    code === "request_too_large" ||
    code === "invalid_json" ||
    code === "validation_failed" ||
    code === "unknown_exercise"
  ) {
    return "bad-request";
  }
  if (code === "provider_failed") return "network";
  if (status === 429) return "rate-limited";
  if (status >= 400 && status < 500) return "bad-request";
  return "network";
}

export async function gradeWithAI<UserInput>(
  args: GradeWithAIArgs<UserInput>,
): Promise<GradeWithAIResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutMs = args.timeoutMs ?? 18_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("/api/ai-native/grade-exercise", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: args.kind,
        lessonId: args.lessonId,
        exerciseId: args.exerciseId,
        userInput: args.userInput,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errorPayload = (await res.json().catch(() => null)) as {
        code?: unknown;
      } | null;
      const reason = fallbackReasonForCode(
        isGradeErrorCode(errorPayload?.code) ? errorPayload.code : null,
        res.status,
      );
      trackEvent({
        name: "ai_native_ai_grading_fallback",
        props: {
          kind: args.kind,
          lessonId: args.lessonId,
          exerciseId: args.exerciseId,
          reason,
        },
      });
      return toFallback(args);
    }

    const data = (await res.json()) as {
      score?: unknown;
      rubric?: unknown;
      summary?: unknown;
      cached?: unknown;
    };

    if (
      typeof data.score !== "number" ||
      !Array.isArray(data.rubric) ||
      typeof data.summary !== "string"
    ) {
      trackEvent({
        name: "ai_native_ai_grading_fallback",
        props: {
          kind: args.kind,
          lessonId: args.lessonId,
          exerciseId: args.exerciseId,
          reason: "parse-error",
        },
      });
      return toFallback(args);
    }

    const rubric: AiRubricEntry[] = data.rubric.map((entry, idx) => {
      const obj = (entry ?? {}) as Record<string, unknown>;
      return {
        id: typeof obj.id === "string" ? obj.id : `criterion-${idx + 1}`,
        passed: Boolean(obj.passed),
        rationale: typeof obj.rationale === "string" ? obj.rationale : "",
      };
    });

    trackEvent({
      name: "ai_native_ai_grading_success",
      props: {
        kind: args.kind,
        lessonId: args.lessonId,
        exerciseId: args.exerciseId,
        score: data.score,
        elapsedMs: Date.now() - start,
        cached: Boolean(data.cached),
      },
    });

    return {
      score: Math.max(0, Math.min(1, data.score)),
      rubric,
      summary: data.summary,
      source: "ai",
      cached: Boolean(data.cached),
    };
  } catch (err) {
    clearTimeout(timer);
    const reason: FallbackReason =
      err instanceof Error && err.name === "AbortError" ? "timeout" : "network";
    trackEvent({
      name: "ai_native_ai_grading_fallback",
      props: {
        kind: args.kind,
        lessonId: args.lessonId,
        exerciseId: args.exerciseId,
        reason,
      },
    });
    return toFallback(args);
  }
}

function toFallback<UserInput>(
  args: GradeWithAIArgs<UserInput>,
): GradeWithAIResult {
  return {
    score: args.fallbackScore,
    rubric: args.fallbackRubric,
    summary: args.fallbackSummary,
    source: "fallback",
    cached: false,
  };
}
