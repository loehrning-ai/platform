/**
 * Typed helpers for every registered product event. Parameters are the
 * literal unions derived from the registry, so an e-mail address, a user id,
 * a raw lesson id or free text is a compile error at the call site. The
 * dispatcher re-checks every value at runtime regardless.
 */
import { track } from "@/lib/analytics";
import type { AiGradingFallbackProps } from "@/lib/ai-native/analytics";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import type { ProgressSyncFailure } from "@/lib/progress/sync-status";
import { classifyReferrerSource } from "./referrer-source";
import {
  ANALYTICS_LESSON_ORDINALS,
  type AnalyticsAgentTokenStep,
  type AnalyticsAiGradingFailure,
  type AnalyticsBlockCourseSlug,
  type AnalyticsCourseCompletionStep,
  type AnalyticsCourseSlug,
  type AnalyticsEventName,
  type AnalyticsFacet,
  type AnalyticsKiCheckStep,
  type AnalyticsLessonOrdinal,
  type AnalyticsLoginAvailability,
  type AnalyticsLoginFlowStep,
  type AnalyticsLoginGateReason,
  type AnalyticsLoginMethod,
  type AnalyticsMaterialKind,
  type AnalyticsProgressSyncFailure,
  type AnalyticsReferrerSource,
  type AnalyticsSubject,
  type AnalyticsWorkshopSlug,
} from "./registry";

function emit<E extends AnalyticsEventName>(
  event: E,
  subject: AnalyticsSubject<E>,
  facet?: AnalyticsFacet<E> & string,
): void {
  track(event, facet === undefined ? { subject } : { subject, facet });
}

/**
 * Position of a lesson inside its course (l01, l02, ...), or null when the id
 * is not canonical for that course. Null means: do not emit.
 */
export function lessonOrdinal(
  courseSlug: AnalyticsCourseSlug,
  lessonId: string,
): AnalyticsLessonOrdinal | null {
  const lessonIds: readonly string[] = CANONICAL_LESSON_IDS[courseSlug] ?? [];
  const index = lessonIds.indexOf(lessonId);
  if (index < 0) return null;
  return ANALYTICS_LESSON_ORDINALS[index] ?? null;
}

/** First durable progress in a course during this document. */
export function trackCourseStarted(
  course: AnalyticsCourseSlug,
  source: AnalyticsReferrerSource = classifyReferrerSource(),
): void {
  emit("course_started", course, source);
}

/** A block-course lesson was opened (block courses only). */
export function trackLessonReached(
  course: AnalyticsBlockCourseSlug,
  ordinal: AnalyticsLessonOrdinal,
): void {
  emit("lesson_reached", course, ordinal);
}

/** A lesson completion was durably persisted. */
export function trackLessonCompleted(
  course: AnalyticsCourseSlug,
  ordinal: AnalyticsLessonOrdinal,
): void {
  emit("lesson_completed", course, ordinal);
}

/** Final exam and course-record steps; outcome labels only. */
export function trackCourseCompletion(
  course: AnalyticsCourseSlug,
  step: AnalyticsCourseCompletionStep,
): void {
  emit("course_completion", course, step);
}

/** A sign-in attempt step for one method. Never the address. */
export function trackLoginFlow(
  method: AnalyticsLoginMethod,
  step: AnalyticsLoginFlowStep,
): void {
  emit("login_flow", method, step);
}

const LOGIN_GATE_REASON_BY_PARAM: ReadonlyMap<string, AnalyticsLoginGateReason> =
  new Map([
    ["progress-save", "progress_save"],
    ["kurs-login", "kurs_login"],
    ["anderes-geraet", "anderes_geraet"],
    ["abgelaufen", "abgelaufen"],
    ["ungueltig", "ungueltig"],
    ["auth-not-configured", "auth_not_configured"],
    ["auth-unavailable", "auth_unavailable"],
    ["missing-code", "missing_code"],
    ["invalid-link", "invalid_link"],
    ["untrusted-origin", "untrusted_origin"],
    ["invalid-code-format", "invalid_code_format"],
  ]);

/**
 * Maps the login page's `reason` query parameter onto the closed vocabulary.
 * The parameter is attacker-controllable, so it is never passed through.
 */
export function loginGateReasonFromParam(
  reason: unknown,
): AnalyticsLoginGateReason {
  return typeof reason === "string"
    ? (LOGIN_GATE_REASON_BY_PARAM.get(reason) ?? "fallback")
    : "fallback";
}

/** The login page explained why sign-in is needed. */
export function trackLoginGate(
  reason: AnalyticsLoginGateReason,
  availability: AnalyticsLoginAvailability,
): void {
  emit("login_gate", reason, availability);
}

/** A diagnostic step; only the recommended course may accompany a CTA. */
export function trackKiCheck(
  step: AnalyticsKiCheckStep,
  recommendedCourse?: AnalyticsCourseSlug,
): void {
  emit("ki_check", step, recommendedCourse);
}

/** Workshop material opened, by workshop and file kind. */
export function trackMaterialOpened(
  workshop: AnalyticsWorkshopSlug,
  kind: AnalyticsMaterialKind,
): void {
  emit("material_opened", workshop, kind);
}

/** Cross-device progress sync failed and the learner only sees a notice. */
export function trackProgressSyncFailure(failure: ProgressSyncFailure): void {
  const facet: AnalyticsProgressSyncFailure = failure;
  emit("platform_failure", "progress_sync", facet);
}

const AI_GRADING_FAILURE_BY_REASON: Readonly<
  Record<AiGradingFallbackProps["reason"], AnalyticsAiGradingFailure>
> = {
  "provider-not-ready": "provider_not_ready",
  "quota-unavailable": "quota_unavailable",
  "budget-exhausted": "budget_exhausted",
  "rate-limited": "rate_limited",
  network: "network",
  "parse-error": "parse_error",
  timeout: "timeout",
  "bad-request": "bad_request",
};

/** AI grading fell back. Only the reason is sent. */
export function trackAiGradingFailure(
  reason: AiGradingFallbackProps["reason"],
): void {
  const facet = AI_GRADING_FAILURE_BY_REASON[reason];
  if (facet === undefined) return;
  emit("platform_failure", "ai_grading", facet);
}

/** Agent-token surface: offered, minted, revoked or failed. */
export function trackAgentTokenSurface(step: AnalyticsAgentTokenStep): void {
  emit("advanced_surface", "agent_token", step);
}
