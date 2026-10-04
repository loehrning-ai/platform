// ─── Lesson engine: shared lesson model ──────────────────────────────
//
// One lesson = one short concept (evidence first, sources inline) → one
// hands-on exercise (a registered widget kind driven by JSON props) → two
// inline checks with instant, explained feedback.
//
// Completion is earned, never clicked: the exercise reports done AND both
// checks are answered correctly. No "mark as read" buttons, no ungraded
// free-text checkpoints.
//
// The model is course-agnostic. Block courses (ki-fuehrerschein,
// ki-und-gesellschaft, eu-ai-act-kurs) author it inside their block JSON;
// AI-Native can author the same fields inside its module JSON because
// `AiNativeLesson` extends the same `BaseLesson`. See
// docs/lesson-engine.md for the authoring contract.

import type { WidgetKind } from "@/lib/widgets/types";

/** Marker a content file sets so loaders and tests know its format. */
export const LESSON_ENGINE_FORMAT = "lesson-engine/v1" as const;

/** Hard authoring limits, enforced by validateEngineLesson + content tests. */
export const LESSON_ENGINE_LIMITS = {
  /** Concept body word cap (markdown, excluding the takeaway). */
  conceptMaxWords: 150,
  /** Exactly this many inline checks per lesson. */
  checkCount: 2,
  /** Options per check. */
  minOptions: 2,
  maxOptions: 4,
} as const;

export interface LessonSourceRef {
  /** Short visible label, e.g. "Art. 4 KI-VO" or "OECD 2023". */
  readonly label: string;
  /** Optional public URL of the primary source. */
  readonly url?: string;
}

export interface LessonConcept {
  /** Markdown, at most 150 words. Lead with the evidence. */
  readonly body: string;
  /** One-sentence rule the learner takes away (rendered as a callout). */
  readonly takeaway?: string;
  /** Sources cited in the body, rendered as chips under the concept. */
  readonly sources?: readonly LessonSourceRef[];
}

export interface LessonExercise {
  /** Registered widget kind (see src/lib/widgets/types.ts). */
  readonly kind: WidgetKind;
  /** Short imperative title, e.g. "Sortiere zwölf Datenschnipsel". */
  readonly title: string;
  /** One or two sentences: what to do and what "done" means. */
  readonly instructions: string;
  /** Kind-specific, JSON-serializable props. */
  readonly props: Readonly<Record<string, unknown>>;
}

export interface LessonCheckOption {
  readonly id: string;
  readonly text: string;
  readonly correct: boolean;
  /** Optional option-specific feedback shown when this option is picked. */
  readonly feedback?: string;
}

export interface LessonCheck {
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly LessonCheckOption[];
  /** Why the correct answer is correct. Always shown after an answer. */
  readonly explanation: string;
}

/** The engine fields a lesson carries. All three are required together. */
export interface EngineLessonFields {
  readonly concept: LessonConcept;
  readonly exercise: LessonExercise;
  readonly checks: readonly LessonCheck[];
}

/**
 * Lesson-scoped progress step that records "exercise done" inside the
 * existing `sectionsRead` array. Engine lessons register exactly this one
 * step in CANONICAL_SECTION_IDS; the checks are recorded as the lesson quiz
 * score. Keeping both inside the existing lesson record means sync, reset
 * and export need no schema change.
 */
export function engineExerciseStepId(lessonId: string): string {
  return `${lessonId}_exercise`;
}

/** Concept section id used for MCP/search projections of an engine lesson. */
export function engineConceptSectionId(lessonId: string): string {
  return `${lessonId}_concept`;
}

/** Checkpoint lesson key the exercise widget receives as `lessonId`. */
export function engineCheckpointLessonKey(
  courseSlug: string,
  lessonId: string,
): string {
  return `${courseSlug}:${lessonId}`;
}

/** Checkpoint id the exercise widget receives as `cpId`. */
export const ENGINE_EXERCISE_CHECKPOINT_ID = "exercise";
