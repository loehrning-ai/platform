/**
 * AI-Native arbeitskurs analytics — typed event emission layer.
 *
 * Dev-only debug channel; there is no transport here and a third-party
 * provider is foreclosed — product events go through src/lib/analytics.
 *
 *   - Logs to console in development (visible while debugging).
 *   - No-ops everywhere else.
 *
 * Typed event shapes below are the contract for the dev debug panel.
 *
 * See: AI-native lesson system.
 */

export type AiNativeEvent =
  | {
      readonly name: "ai_native_section_read";
      readonly props: SectionReadProps;
    }
  | {
      readonly name: "ai_native_exercise_submit";
      readonly props: ExerciseSubmitProps;
    }
  | {
      readonly name: "ai_native_module_complete";
      readonly props: ModuleCompleteProps;
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

export interface ModuleCompleteProps {
  readonly moduleId: string;
  readonly completedLessonCount: number;
  readonly totalLessonCount: number;
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
    | "provider-not-ready"
    | "quota-unavailable"
    | "budget-exhausted"
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

  // Dev-only debug channel; there is no transport here and a third-party
  // provider is foreclosed — product events go through src/lib/analytics.
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

export function getRecentEvents(): ReadonlyArray<{
  at: number;
  event: AiNativeEvent;
}> {
  return _recentEvents.slice();
}
