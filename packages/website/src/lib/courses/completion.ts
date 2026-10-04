import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
import { getCourseConfig } from "@/lib/course/config";
import { DATA_INFRA_LESSON_IDS } from "@/lib/data-infrastructure/types";
import { DEF_CHAPTER_IDS } from "@/lib/data-engineering-fundamentals/types";
import { DS_NUMBERED_CHAPTER_IDS } from "@/lib/data-science/types";
import {
  MODULE_IDS as OPERATOR_MODULE_IDS,
  MODULE_LESSON_COUNTS as OPERATOR_MODULE_LESSON_COUNTS,
  lessonProgressKey,
} from "@/lib/ai-native-operator/types";
import type { UnifiedCourseSlice, UnifiedProgress } from "@/lib/progress/types";
import {
  checkpointKey,
  legacyCompletionEvidenceCheckpointKey,
} from "@/lib/progress/types";
import { engineExerciseStepId } from "@/lib/lesson-engine/types";

/**
 * KI-Führerschein runs on the lesson engine (docs/lesson-engine.md): four
 * modules, eight lessons. The pre-engine `block_N_lesson_M` IDs are retired;
 * stored progress under them is dropped by `normalizeCanonicalProgress` (browser) and
 * `dropRetiredLessonEntries` in server-store.ts (stored rows) instead of failing validation.
 */
const KI_FUEHRERSCHEIN_LESSON_IDS = [
  "daten-1-1",
  "daten-1-2",
  "briefen-2-1",
  "briefen-2-2",
  "pruefen-3-1",
  "pruefen-3-2",
  "regeln-4-1",
  "regeln-4-2",
] as const;
/**
 * KI und Gesellschaft runs on the lesson engine: three modules, eight
 * lessons. The pre-engine arbeit-/deepfake-/ethik- IDs are retired and
 * dropped the same way as the KI-Führerschein ones.
 */
const KI_UND_GESELLSCHAFT_LESSON_IDS = [
  "zahlen-1-1",
  "zahlen-1-2",
  "fakes-2-1",
  "fakes-2-2",
  "fakes-2-3",
  "fair-3-1",
  "fair-3-2",
  "fair-3-3",
] as const;
/**
 * EU AI Act Kurs runs on the lesson engine: five modules, ten lessons. The
 * pre-engine `block_N_lesson_M` IDs are retired and dropped like the
 * KI-Führerschein ones above.
 */
const EU_AI_ACT_LESSON_IDS = [
  "rolle-1-1",
  "zeitplan-1-2",
  "risiko-2-1",
  "risiko-2-2",
  "pflichten-3-1",
  "pflichten-3-2",
  "bussgeld-4-1",
  "aufsicht-4-2",
  "fall-5-1",
  "plan-5-2",
] as const;
/**
 * AI-Native ("Mit KI arbeiten" / "Working with AI") runs on the lesson engine:
 * four modules, nine lessons. The pre-engine `modul_N_lesson_M` IDs are
 * retired and dropped like the KI-Führerschein ones.
 */
const AI_NATIVE_LESSON_IDS = [
  "messen-1-1",
  "messen-1-2",
  "kontext-2-1",
  "kontext-2-2",
  "wissen-3-1",
  "wissen-3-2",
  "workflow-4-1",
  "workflow-4-2",
  "workflow-4-3",
] as const;
const OPERATOR_LESSON_IDS = OPERATOR_MODULE_IDS.flatMap((moduleId) =>
  Array.from({ length: OPERATOR_MODULE_LESSON_COUNTS[moduleId] }, (_, index) =>
    lessonProgressKey(moduleId, index + 1),
  ),
);

export const CANONICAL_LESSON_IDS: Readonly<
  Record<CourseSlug, readonly string[]>
> = {
  "ki-fuehrerschein": KI_FUEHRERSCHEIN_LESSON_IDS,
  "ki-und-gesellschaft": KI_UND_GESELLSCHAFT_LESSON_IDS,
  "eu-ai-act-kurs": EU_AI_ACT_LESSON_IDS,
  "ai-native": AI_NATIVE_LESSON_IDS,
  "data-infrastructure": DATA_INFRA_LESSON_IDS,
  "data-engineering-fundamentals": DEF_CHAPTER_IDS,
  "data-science": DS_NUMBERED_CHAPTER_IDS,
  "ai-native-operator": OPERATOR_LESSON_IDS,
};

const sequentialSectionIds = (
  lessonId: string,
  count: number,
  separator = "_section_",
): readonly string[] =>
  Array.from(
    { length: count },
    (_, index) => `${lessonId}${separator}${index + 1}`,
  );

/** Lesson-engine courses track one step per lesson: the exercise. */
function engineSteps(
  lessonIds: readonly string[],
): Readonly<Record<string, readonly string[]>> {
  return Object.fromEntries(
    lessonIds.map((lessonId) => [
      lessonId,
      [engineExerciseStepId(lessonId)],
    ]),
  );
}

function bareSequentialSectionsByCount(
  lessonIds: readonly string[],
  counts: readonly number[],
): Readonly<Record<string, readonly string[]>> {
  return Object.fromEntries(
    lessonIds.map((lessonId, index) => [
      lessonId,
      sequentialSectionIds("", counts[index] ?? 0, "s"),
    ]),
  );
}

const DATA_INFRA_SECTION_IDS: Readonly<Record<string, readonly string[]>> = {
  "mental-model": sequentialSectionIds("", 6, "s"),
  "cap-pacelc": sequentialSectionIds("", 7, "s"),
  modeling: sequentialSectionIds("", 7, "s"),
  "storage-formats": sequentialSectionIds("", 8, "s"),
  lakehouse: sequentialSectionIds("", 9, "s"),
  partitioning: ["s1", "s1b", "s1c", "s2", "s3", "s4", "s5", "s6", "s7", "s8"],
  "batch-elt": ["s1", "s2", "s3", "s3b", "s4", "s5", "s6", "s7", "s8"],
  streaming: ["s1", "s2", "s3", "s4", "s5", "s5b", "s5c", "s6", "s7", "s8"],
  "cdc-lambda-kappa": sequentialSectionIds("", 7, "s"),
  idempotency: ["s1", "s2", "s3", "s4", "s4b", "s5", "s6", "s7"],
  "sla-quality": sequentialSectionIds("", 8, "s"),
  "interview-playbook": sequentialSectionIds("", 7, "s"),
};

/**
 * Compact canonical section registry used by the browser store and the
 * untrusted sync-payload validator. Keeping IDs here avoids importing the
 * full lesson/content graph into every client route that reads progress.
 *
 * Courses that only track explicit chapter/lesson completion have empty
 * section arrays. A catalog/content contract test keeps this compact registry
 * aligned with every course whose reader tracks section progress.
 */
export const CANONICAL_SECTION_IDS: Readonly<
  Record<CourseSlug, Readonly<Record<string, readonly string[]>>>
> = {
  "ki-fuehrerschein": engineSteps(KI_FUEHRERSCHEIN_LESSON_IDS),
  "ki-und-gesellschaft": engineSteps(KI_UND_GESELLSCHAFT_LESSON_IDS),
  "eu-ai-act-kurs": engineSteps(EU_AI_ACT_LESSON_IDS),
  "ai-native": engineSteps(AI_NATIVE_LESSON_IDS),
  "data-infrastructure": DATA_INFRA_SECTION_IDS,
  "data-engineering-fundamentals": Object.fromEntries(
    DEF_CHAPTER_IDS.map((lessonId) => [lessonId, []]),
  ),
  "data-science": Object.fromEntries(
    DS_NUMBERED_CHAPTER_IDS.map((lessonId) => [lessonId, []]),
  ),
  "ai-native-operator": bareSequentialSectionsByCount(
    OPERATOR_LESSON_IDS,
    [
      3, 4, 3, 3, 0, 3, 3, 3, 3, 0, 3, 3, 3, 3, 0, 3, 2, 3, 0, 3, 3, 3, 0, 3, 2,
      2, 0, 3, 3, 2, 0, 2, 2, 2, 0, 2, 2, 2, 0,
    ],
  ),
};

/**
 * Courses migrated away from click-to-complete lesson state. Their historical
 * `completed` booleans remain in storage for resume compatibility, but every
 * current completion surface must also require the versioned lesson proof.
 */
export const EVIDENCE_GATED_COURSE_SLUGS = [
  "ki-fuehrerschein",
  "eu-ai-act-kurs",
  "ki-und-gesellschaft",
  "ai-native",
  "data-infrastructure",
  "data-engineering-fundamentals",
  "data-science",
  "ai-native-operator",
] as const satisfies readonly CourseSlug[];

/**
 * Courses whose lessons run on the lesson engine (docs/lesson-engine.md).
 * Their lesson proof is "exercise step recorded" + "both checks answered
 * correctly" (a perfect lesson quiz score). Add a slug here in the same change
 * that ports its content and switches its CANONICAL_SECTION_IDS to
 * `engineSteps(...)`.
 */
export const LESSON_ENGINE_COURSE_SLUGS = [
  "ki-fuehrerschein",
  "ki-und-gesellschaft",
  "eu-ai-act-kurs",
  "ai-native",
] as const satisfies readonly CourseSlug[];

export function isLessonEngineCourse(slug: CourseSlug): boolean {
  return (LESSON_ENGINE_COURSE_SLUGS as readonly CourseSlug[]).includes(slug);
}

export type EvidenceGatedCourseSlug =
  (typeof EVIDENCE_GATED_COURSE_SLUGS)[number];

export const LESSON_COMPLETION_EVIDENCE_VERSION = "lesson-proof-v1";

const TRANSFER_ONLY_COURSE_SLUGS = new Set<EvidenceGatedCourseSlug>([
  "data-infrastructure",
  "data-engineering-fundamentals",
  "data-science",
]);

const OPERATOR_QUIZ_QUESTION_COUNTS: Readonly<Record<string, number>> = {
  mindset: 3,
  engineering: 3,
  product: 3,
  operations: 2,
  talent: 2,
  orgmodel: 2,
  data: 2,
  governance: 2,
  measurement: 3,
};
export const OPERATOR_TRANSFER_CHECKPOINT_ID = "exercise";

/**
 * The Operator course stores each correctly answered module quiz question as
 * a checkpoint instead of a single lesson quiz score. Keep the compact proof
 * registry beside the canonical lesson registry so completion reads do not
 * pull the authored content graph into every client route.
 */
const OPERATOR_QUIZ_CHECKPOINT_IDS: Readonly<
  Record<string, readonly string[]>
> = Object.fromEntries(
  OPERATOR_MODULE_IDS.map((moduleId) => [
    lessonProgressKey(moduleId, OPERATOR_MODULE_LESSON_COUNTS[moduleId]),
    Array.from(
      { length: OPERATOR_QUIZ_QUESTION_COUNTS[moduleId] ?? 0 },
      (_, index) => `ano-${moduleId}-q${index + 1}`,
    ),
  ]),
);

/** Canonical applied-proof checkpoints required before Operator navigation proof counts. */
export function operatorLessonEvidenceCheckpointIds(
  lessonId: string,
): readonly string[] {
  return (
    OPERATOR_QUIZ_CHECKPOINT_IDS[lessonId] ?? [OPERATOR_TRANSFER_CHECKPOINT_ID]
  );
}

export function isEvidenceGatedCourseSlug(
  slug: CourseSlug,
): slug is EvidenceGatedCourseSlug {
  return (EVIDENCE_GATED_COURSE_SLUGS as readonly CourseSlug[]).includes(slug);
}

export function lessonCompletionEvidenceCheckpointId(slug: CourseSlug): string {
  return `${LESSON_COMPLETION_EVIDENCE_VERSION}:${slug}`;
}

/**
 * True when a canonical completion bit is grandfathered by the one-time
 * migration marker or backed by current navigation and lesson evidence. The
 * quizless AI-Native transfer lesson uses the versioned checkpoint itself as
 * its applied-proof marker.
 */
export function isLessonCompletionEvidenceBacked(
  progress: UnifiedProgress | null | undefined,
  slug: CourseSlug,
  lessonId: string,
): boolean {
  const slice = progress?.courses[slug];
  const lesson = slice?.lessons[lessonId];
  if (!lesson?.completed || !isCanonicalLessonId(slug, lessonId)) return false;
  if (!isEvidenceGatedCourseSlug(slug)) return true;

  // Compatibility is explicit and one-way. A reset epoch becomes part of the
  // marker identity, so an older grow-only marker cannot satisfy a completion
  // restored or recorded under a later reset.
  if (
    progress?.checkpoints[
      legacyCompletionEvidenceCheckpointKey(slug, lessonId, slice?.resetAt)
    ] === true
  ) {
    return true;
  }

  const evidenceCheckpoint = lessonCompletionEvidenceCheckpointId(slug);
  const checkpointComplete =
    progress?.checkpoints[checkpointKey(lessonId, evidenceCheckpoint)] === true;
  if (!checkpointComplete) return false;

  if (slug === "ai-native-operator") {
    const requiredCheckpointIds = operatorLessonEvidenceCheckpointIds(lessonId);
    return (
      requiredCheckpointIds.length > 0 &&
      requiredCheckpointIds.every(
        (checkpointId) =>
          progress?.checkpoints[checkpointKey(lessonId, checkpointId)] === true,
      )
    );
  }

  const canonicalSectionIds = CANONICAL_SECTION_IDS[slug][lessonId] ?? [];
  if (
    (canonicalSectionIds.length === 0 &&
      !TRANSFER_ONLY_COURSE_SLUGS.has(slug)) ||
    !canonicalSectionIds.every((sectionId) =>
      lesson.sectionsRead.includes(sectionId),
    )
  ) {
    return false;
  }

  if (TRANSFER_ONLY_COURSE_SLUGS.has(slug)) {
    return true;
  }
  if (isLessonEngineCourse(slug)) {
    return lesson.quizScore === 1 && lesson.quizTotal !== null;
  }
  return lesson.quizScore !== null && lesson.quizTotal !== null;
}

/** Evidence-backed lesson IDs for UI, assessment, and record surfaces. */
export function evidenceBackedCompletedLessonIds(
  progress: UnifiedProgress | null | undefined,
  slug: CourseSlug,
): ReadonlySet<string> {
  return new Set(
    CANONICAL_LESSON_IDS[slug].filter((lessonId) =>
      isLessonCompletionEvidenceBacked(progress, slug, lessonId),
    ),
  );
}

export function evidenceBackedCompletedCanonicalLessonCount(
  progress: UnifiedProgress | null | undefined,
  slug: CourseSlug,
): number {
  return evidenceBackedCompletedLessonIds(progress, slug).size;
}

export function isEvidenceBackedCourseFullyCompleted(
  progress: UnifiedProgress | null | undefined,
  slug: CourseSlug,
): boolean {
  const lessonIds = CANONICAL_LESSON_IDS[slug];
  return (
    lessonIds.length > 0 &&
    evidenceBackedCompletedCanonicalLessonCount(progress, slug) ===
      lessonIds.length
  );
}

export function isEvidenceBackedCourseCompletionEarned(
  progress: UnifiedProgress | null | undefined,
  slug: CourseSlug,
): boolean {
  const slice = progress?.courses[slug];
  if (!slice || !isEvidenceBackedCourseFullyCompleted(progress, slug)) {
    return false;
  }

  const requiresAssessment =
    getCourseConfig(slug).workshopQuizQuestionCount > 0;
  if (!requiresAssessment) return true;

  return (
    slice.workshopQuiz.passed ||
    (slug === "ai-native" && slice.capstoneSubmitted)
  );
}

const CANONICAL_LESSON_ID_SETS: Readonly<
  Record<CourseSlug, ReadonlySet<string>>
> = Object.fromEntries(
  COURSE_SLUGS.map((slug) => [slug, new Set(CANONICAL_LESSON_IDS[slug])]),
) as unknown as Record<CourseSlug, ReadonlySet<string>>;

const CANONICAL_SECTION_ID_SETS: Readonly<
  Record<CourseSlug, Readonly<Record<string, ReadonlySet<string>>>>
> = Object.fromEntries(
  COURSE_SLUGS.map((slug) => [
    slug,
    Object.fromEntries(
      Object.entries(CANONICAL_SECTION_IDS[slug]).map(
        ([lessonId, sectionIds]) => [lessonId, new Set(sectionIds)],
      ),
    ),
  ]),
) as unknown as Record<
  CourseSlug,
  Readonly<Record<string, ReadonlySet<string>>>
>;

export function isCanonicalLessonId(
  slug: CourseSlug,
  lessonId: string,
): boolean {
  return CANONICAL_LESSON_ID_SETS[slug].has(lessonId);
}

export function getCanonicalSectionIds(
  slug: CourseSlug,
  lessonId: string,
): readonly string[] {
  return CANONICAL_SECTION_IDS[slug][lessonId] ?? [];
}

export function isCanonicalSectionId(
  slug: CourseSlug,
  lessonId: string,
  sectionId: string,
): boolean {
  return CANONICAL_SECTION_ID_SETS[slug][lessonId]?.has(sectionId) ?? false;
}

/**
 * Normalize legacy/browser state at the trust boundary.
 *
 * Canonical lesson data, quiz/exercise results, and course timestamps are
 * preserved. Fabricated or retired lesson keys are removed. Section IDs are
 * deduplicated and filtered to the current authored lesson contract. The
 * historical cross-course XP/badge/checkpoint ledger is intentionally not
 * rewritten here because course resets explicitly preserve that history.
 */
export function normalizeCanonicalProgress(
  progress: UnifiedProgress,
): UnifiedProgress {
  let changed = false;
  const courses: UnifiedProgress["courses"] = {};

  for (const slug of COURSE_SLUGS) {
    const slice = progress.courses[slug];
    if (!slice) continue;
    const lessons: Record<string, UnifiedCourseSlice["lessons"][string]> = {};

    for (const [lessonId, lesson] of Object.entries(slice.lessons)) {
      if (!isCanonicalLessonId(slug, lessonId)) {
        changed = true;
        continue;
      }
      const sectionsRead = Array.from(
        new Set(
          lesson.sectionsRead.filter((sectionId) =>
            isCanonicalSectionId(slug, lessonId, sectionId),
          ),
        ),
      );
      if (
        sectionsRead.length !== lesson.sectionsRead.length ||
        sectionsRead.some(
          (sectionId, index) => sectionId !== lesson.sectionsRead[index],
        )
      ) {
        changed = true;
        lessons[lessonId] = { ...lesson, sectionsRead };
      } else {
        lessons[lessonId] = lesson;
      }
    }

    const normalizedSlice =
      Object.keys(lessons).length === Object.keys(slice.lessons).length &&
      Object.entries(lessons).every(
        ([lessonId, lesson]) => lesson === slice.lessons[lessonId],
      )
        ? slice
        : { ...slice, lessons };
    if (normalizedSlice !== slice) changed = true;
    courses[slug] = normalizedSlice;
  }

  if (Object.keys(courses).length !== Object.keys(progress.courses).length) {
    changed = true;
  }
  return changed ? { ...progress, courses } : progress;
}

export function completedCanonicalLessonCount(
  progress: UnifiedProgress | null,
  slug: CourseSlug,
): number {
  return evidenceBackedCompletedCanonicalLessonCount(progress, slug);
}

export function isCourseFullyCompleted(
  progress: UnifiedProgress | null,
  slug: CourseSlug,
): boolean {
  return isEvidenceBackedCourseFullyCompleted(progress, slug);
}

export function isCourseCompletionEarned(
  progress: UnifiedProgress | null,
  slug: CourseSlug,
): boolean {
  return isEvidenceBackedCourseCompletionEarned(progress, slug);
}
