// ─── Data Infrastructure course types ────────────
//
// Own separate content module, keyed by the source's own flat lesson-id
// scheme ("mental-model".."interview-playbook", matching `js/lessons.js`'s
// `window.LESSONS` ids), NOT the shared BlockId JSON system — mirroring
// `lib/codex`/`lib/claude-course`'s precedent of extending `BaseLesson` with
// a course-specific container id. Content loads per-lesson via dynamic
// `import()` (see ./data), not one eagerly-imported module.
//
// Checkpoint-id collision guard: the unified progress store's `checkpoints`
// ledger (src/lib/progress/store.ts) is keyed globally by `${lessonId}::${cpId}`,
// NOT scoped per course. Claude Course already registered a lesson
// literally named "mental-model" — this course's source lesson-id scheme
// collides with it exactly (both courses' source content independently use
// "mental-model" as lesson 1's id). `DataInfraLessonId` stays the clean
// source slug (used for routing/section-tracking/lesson-completion, all of
// which are already scoped by courseSlug and therefore collision-safe), but
// every checkpoint-bearing prop (Quiz/Flashcards `lessonId`, every bespoke
// widget's `lessonId`) must go through `checkpointLessonId()` below instead
// of the bare id, so this course's checkpoints never collide with claude's.

import type { BaseLesson, LessonSection } from "@/lib/course/types";

export const DATA_INFRA_LESSON_IDS = [
  "mental-model",
  "cap-pacelc",
  "modeling",
  "storage-formats",
  "lakehouse",
  "partitioning",
  "batch-elt",
  "streaming",
  "cdc-lambda-kappa",
  "idempotency",
  "sla-quality",
  "interview-playbook",
] as const;

export type DataInfraLessonId = (typeof DATA_INFRA_LESSON_IDS)[number];

export function isDataInfraLessonId(value: unknown): value is DataInfraLessonId {
  return (
    typeof value === "string" &&
    (DATA_INFRA_LESSON_IDS as readonly string[]).includes(value)
  );
}

/** Namespaced checkpoint-ledger lessonId — see the collision-guard note above. */
export function checkpointLessonId(id: DataInfraLessonId): string {
  return `di-${id}`;
}

export const DATA_INFRA_TRACK_IDS = [
  "foundations",
  "storage",
  "movement",
  "scale",
] as const;

export type DataInfraTrackId = (typeof DATA_INFRA_TRACK_IDS)[number];

export interface DataInfraTrack {
  readonly id: DataInfraTrackId;
  /** Numbered heading, e.g. "01 · foundations". */
  readonly label: string;
  readonly title: string;
  readonly hint: string;
}

/** Four tracks, ported verbatim from `js/lessons.js`'s `window.TRACKS`. */
export const DATA_INFRA_TRACKS: readonly DataInfraTrack[] = [
  {
    id: "foundations",
    label: "01 · foundations",
    title: "How to think about data systems.",
    hint: "The mental model, the constraints (CAP / PACELC), the modeling decision tree. Everything downstream is downstream of these three.",
  },
  {
    id: "storage",
    label: "02 · storage",
    title: "Bytes on disk, queryable at scale.",
    hint: "Row vs columnar, Parquet internals, the lakehouse table-format wars, partitioning that actually prunes.",
  },
  {
    id: "movement",
    label: "03 · movement",
    title: "Bytes in motion, batch and stream.",
    hint: "Airflow & dbt, Kafka & Flink, watermarks, change data capture, and the Lambda-vs-Kappa religious war.",
  },
  {
    id: "scale",
    label: "04 · at scale",
    title: "What separates IC4 from IC5.",
    hint: "Idempotency. Backfills. Effectively-exactly-once. Observability that catches the silent-failure modes. The interview itself.",
  },
];

/**
 * DataInfraLesson: folds into the shared `BaseLesson` (sections/quiz/
 * keyConcepts/widgets) and adds the two course-specific fields: which of the
 * 4 tracks it belongs to, and the one-line hook shown on its lesson card.
 * `quiz` stays `[]` for every lesson: the source course has no separate
 * end-of-lesson quiz block, every `W.Quiz` mount IS the lesson's quiz
 * content, represented as a `"quiz"`-kind `Widget` instead (see ./lessons/*.ts),
 * mirroring claude/codex's own precedent. `sections` use the shared
 * `LessonSection.content` plain-markdown field directly (this course's
 * source HTML is prose + occasional inline code/quotes, not codex's four
 * distinct card/callout/pull-quote presentational patterns, so no parallel
 * block-type system is needed here).
 */
export interface DataInfraLesson extends BaseLesson {
  readonly id: DataInfraLessonId;
  readonly sections: readonly LessonSection[];
  readonly trackId: DataInfraTrackId;
  readonly hook: string;
}
