/**
 * AI-Native arbeitskurs analytics — typed event emission layer.
 *
 * Wired as a lightweight stub that:
 *   - Logs to console in development (visible while debugging).
 *   - No-ops in production unless a real analytics transport is wired.
 *
 * Post-v1, swap `trackEvent()` internals for PostHog (or any other provider)
 * without touching the call sites. Typed event shapes below are the contract.
 *
 * See: AI-native lesson system.
 */

export type AiNativeEvent =
  | { readonly name: "ai_native_section_read"; readonly props: SectionReadProps }
  | { readonly name: "ai_native_exercise_submit"; readonly props: ExerciseSubmitProps }
  | {
      readonly name: "ai_native_exercise_error_boundary";
      readonly props: ExerciseErrorProps;
    }
  | { readonly name: "ai_native_module_complete"; readonly props: ModuleCompleteProps }
  | { readonly name: "ai_native_challenge_reveal"; readonly props: ChallengeRevealProps }
  | {
      readonly name: "ai_native_demo_interaction_start";
      readonly props: DemoInteractionProps;
    }
  | {
      readonly name: "ai_native_urlhash_import_success";
      readonly props: UrlhashImportProps;
    }
  | {
      readonly name: "ai_native_ai_grading_success";
      readonly props: AiGradingSuccessProps;
    }
  | {
      readonly name: "ai_native_ai_grading_fallback";
      readonly props: AiGradingFallbackProps;
    };

export interface SectionReadProps {
  readonly moduleId: string;
  readonly lessonId: string;
  readonly sectionId: string;
  readonly sectionIndex: number;
}

export interface ExerciseSubmitProps {
  readonly moduleId: string;
  readonly lessonId: string;
  readonly exerciseId: string;
  readonly kind: string;
  readonly score: number | null;
  readonly maxScore: number | null;
  readonly attempts: number;
}

export interface ExerciseErrorProps {
  readonly moduleId: string;
  readonly lessonId: string;
  readonly exerciseId: string;
  readonly kind: string;
  readonly errorMessage: string;
}

export interface ModuleCompleteProps {
  readonly moduleId: string;
  readonly completedLessonCount: number;
  readonly totalLessonCount: number;
}

export interface ChallengeRevealProps {
  readonly weekIso: string;
  readonly revealType: "model_solution" | "rubric";
}

export interface DemoInteractionProps {
  readonly demoId: string;
  readonly location: "gallery" | "landing" | "lesson";
  readonly moduleId?: string;
  readonly lessonId?: string;
}

export interface UrlhashImportProps {
  readonly merged: boolean;
  readonly conflictCount: number;
}

export interface AiGradingSuccessProps {
  readonly kind: string;
  readonly lessonId: string;
  readonly exerciseId: string;
  readonly score: number;
  readonly elapsedMs: number;
  readonly cached: boolean;
}

export interface AiGradingFallbackProps {
  readonly kind: string;
  readonly lessonId: string;
  readonly exerciseId: string;
  readonly reason:
    | "no-api-key"
    | "rate-limited"
    | "network"
    | "parse-error"
    | "timeout"
    | "bad-request";
}

/**
 * Public tracking function.
 *
 * Usage:
 *   trackEvent({ name: "ai_native_section_read", props: { moduleId, ... } });
 *
 * Intentionally accepts the discriminated-union shape so TypeScript enforces
 * the correct props for each event name.
 */
export function trackEvent(event: AiNativeEvent): void {
  // Graceful: during SSR there's no window; swallow.
  if (typeof window === "undefined") return;

  // In production, route to PostHog / Plausible / whatever is wired.
  // Today: no-op in prod, dev-console only.
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.info("[ai-native.analytics]", event.name, event.props);
  }
}

/**
 * Debug helper — exposes current emission state for the dev debug panel.
 * Call sites should use `trackEvent()` directly; this is read-only observation.
 */
const _recentEvents: Array<{ at: number; event: AiNativeEvent }> = [];
const _MAX_RECENT = 50;

export function recordForDebug(event: AiNativeEvent): void {
  if (typeof window === "undefined") return;
  _recentEvents.push({ at: Date.now(), event });
  if (_recentEvents.length > _MAX_RECENT) _recentEvents.shift();
}

export function getRecentEvents(): ReadonlyArray<{ at: number; event: AiNativeEvent }> {
  return _recentEvents.slice();
}
