// ─── AI-Native Arbeitskurs Types ─────────────────────────────────────
//
// Extension of the KI-Führerschein course schema with optional media metadata
// and bundle references. Some legacy JSON still carries old access flags;
// runtime treats the course as fully open.

// Internal references to the shared widget types (used by AiNativeLesson +
// AiNativeLessonProgress below). These are also re-exported further down for
// backward-compatible AI-Native importers.
import type { Widget, ExerciseResult } from "@/lib/widgets/types";
import type {
  BaseLesson,
  LessonSection,
  LessonQuizQuestion,
} from "@/lib/course/types";

export const MODULE_IDS = [
  "modul_1",
  "modul_2",
  "modul_3",
  "modul_4",
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

// Section + quiz schemas are identical to the shared course engine
// Aliased here so existing AI-Native importers keep working while the types
// unify.
export type AiNativeLessonSection = LessonSection;
export type AiNativeQuizQuestion = LessonQuizQuestion;

/**
 * AI-Native lesson: folds into the shared `BaseLesson` and adds
 * AI-Native-specific fields: a module container + interactive widgets. The
 * legacy access flag is optional and ignored by the public site.
 */
export interface AiNativeLesson extends BaseLesson {
  readonly moduleId: ModuleId;
  /** Interactive widgets embedded in the lesson (demos + exercises). */
  readonly widgets?: readonly Widget[];
  // Extensions beyond the shared schema:
  /** @deprecated Legacy import field. Public AI-Native content is fully open. */
  readonly premiumGated?: boolean;
  readonly videoUrl?: string;
  readonly discordChannel?: string;
  readonly osBundleRef?: readonly string[];
  readonly voiceAnchor?: string;
  readonly refreshCadence?: "EVERGREEN" | "QUARTERLY" | "ON-TOOL-RELEASE";
}

export interface AiNativeModule {
  readonly id: ModuleId;
  readonly number: number;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly durationMinutes: number;
  readonly lessonCount: number;
  readonly premiumGated: boolean;
  readonly voiceAnchor?: string;
  readonly topics: readonly string[];
}

export interface AiNativeCourseMeta {
  readonly courseId: string;
  readonly title: string;
  readonly tagline: string;
  readonly language: string;
  readonly createdAt: string;
  readonly version: string;
  readonly pricing: {
    readonly free: boolean;
    readonly includes: readonly string[];
  };
  readonly prerequisites: {
    readonly recommended: string;
    readonly note: string;
  };
  readonly totalLessons: number;
  readonly totalModules: number;
  readonly targetDurationHours: number;
  readonly supportedLanguages: readonly string[];
}

// ─── Widget schema (re-exported from the shared widget system) ─────
//
// The widget vocabulary now lives in `@/lib/widgets/types` (promoted in
// so all three courses share one registry and type set).
// Re-exported here for backward compatibility with AI-Native importers.

export {
  DEMO_KINDS,
  EXERCISE_KINDS,
  ALL_WIDGET_KINDS,
  WIDGET_PLACEMENTS,
  WIDGET_COURSE_SLUGS,
} from "@/lib/widgets/types";

export type {
  DemoKind,
  ExerciseKind,
  WidgetKind,
  WidgetPlacement,
  WidgetCourseSlug,
  Widget,
  ExerciseSpec,
  AiRubricEntry,
  GradingSource,
  ExerciseResult,
} from "@/lib/widgets/types";

// ─── Progress Types (localStorage, mirrors KI-F pattern) ────────

/** Storage key. Bump suffix on any breaking schema change. */
export const AI_NATIVE_STORAGE_KEY = "ai-native-progress-v1";

/** Schema version. Increment on any shape change + ship a migration. */
export const AI_NATIVE_SCHEMA_VERSION = 1 as const;

export interface AiNativeLessonProgress {
  readonly sectionsRead: readonly string[];
  readonly quizScore: number | null;
  readonly quizTotal: number | null;
  readonly completed: boolean;
  /** Keyed by ExerciseSpec.id. */
  readonly exercisesCompleted: Readonly<Record<string, ExerciseResult>>;
}

export interface AiNativeCourseProgress {
  readonly schemaVersion: typeof AI_NATIVE_SCHEMA_VERSION;
  readonly lessons: Record<string, AiNativeLessonProgress>;
  /** Historical capstone self-review; not proof of the new applied project. */
  readonly capstoneSubmitted: boolean;
  readonly premiumUnlocked: boolean;
  readonly startedAt: string;
  readonly lastActivity: string;
}

// ─── Type guards (re-exported from the shared widget system) ───

export {
  isWidgetKind,
  isExerciseKind,
  isDemoKind,
  isWidgetPlacement,
} from "@/lib/widgets/types";
