import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
import { getCourseConfig } from "@/lib/course/config";
import { CLAUDE_LESSON_IDS } from "@/lib/claude-course/types";
import { CODEX_LESSON_IDS } from "@/lib/codex/types";
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

const numbered = (prefix: string, count: number): readonly string[] =>
  Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`);

const KI_FUEHRERSCHEIN_LESSON_IDS = [3, 3, 4, 4, 4].flatMap((count, index) =>
  numbered(`block_${index + 1}_lesson_`, count),
);
const EU_AI_ACT_LESSON_IDS = Array.from({ length: 6 }, (_, index) =>
  numbered(`block_${index + 1}_lesson_`, 4),
).flat();
const AI_NATIVE_LESSON_IDS = [
  ...numbered("modul_1_lesson_", 5),
  ...numbered("modul_2_lesson_", 7),
  "modul_3_lesson_1",
  "modul_3_lesson_0",
  ...numbered("modul_3_lesson_", 6).slice(1),
  ...numbered("modul_4_lesson_", 8),
];
const OPERATOR_LESSON_IDS = OPERATOR_MODULE_IDS.flatMap((moduleId) =>
  Array.from({ length: OPERATOR_MODULE_LESSON_COUNTS[moduleId] }, (_, index) =>
    lessonProgressKey(moduleId, index + 1),
  ),
);

export const CANONICAL_LESSON_IDS: Readonly<
  Record<CourseSlug, readonly string[]>
> = {
  "ki-fuehrerschein": KI_FUEHRERSCHEIN_LESSON_IDS,
  "ki-und-gesellschaft": [
    "arbeit-1-1",
    "arbeit-1-2",
    "arbeit-1-3",
    "deepfake-2-1",
    "deepfake-2-2",
    "deepfake-2-3",
    "ethik-3-1",
    "ethik-3-2",
    "ethik-3-3",
  ],
  "eu-ai-act-kurs": EU_AI_ACT_LESSON_IDS,
  "ai-native": AI_NATIVE_LESSON_IDS,
  claude: CLAUDE_LESSON_IDS,
  codex: CODEX_LESSON_IDS,
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

function sectionsByCount(
  lessonIds: readonly string[],
  counts: readonly number[],
  separator?: string,
): Readonly<Record<string, readonly string[]>> {
  return Object.fromEntries(
    lessonIds.map((lessonId, index) => [
      lessonId,
      sequentialSectionIds(lessonId, counts[index] ?? 0, separator),
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

const CLAUDE_SECTION_IDS: Readonly<Record<string, readonly string[]>> = {
  "mental-model": [
    "what-it-is",
    "three-things",
    "constitutional-ai",
    "feel-it",
    "failure-modes",
  ],
  anatomy: ["contracts-not-incantations", "six-parts", "xml-tags", "pro-moves"],
  context: [
    "context-is-the-product",
    "meaning-in-space",
    "window-as-budget",
    "long-context-template",
    "tokens-briefly",
    "too-big-docs",
  ],
  "claude-md": [
    "what-it-is",
    "hierarchy",
    "keep-in-leave-out",
    "template",
    "auto-memory",
  ],
  iteration: [
    "the-loop",
    "three-turn-loop",
    "show-dont-tell",
    "turn-2-vocabulary",
  ],
  gdocs: ["why-gdocs", "move-1-skeleton", "move-2-voice", "move-3-critique"],
  agents: [
    "agents-vs-chat",
    "the-loop-explicit",
    "four-guardrails",
    "when-to-use",
  ],
  reviews: ["why-it-works", "review-template", "when-it-earns-its-keep"],
  grounding: ["not-a-bug", "three-grounding-moves", "smell-test"],
  team: ["why-share", "three-artifacts", "sharing-well", "rituals"],
  evals: ["why-evals", "mvp-eval", "debugging", "llm-as-judge"],
  safety: ["the-rule", "never-paste", "usually-fine", "prompt-injection"],
};

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
  "ki-fuehrerschein": sectionsByCount(
    KI_FUEHRERSCHEIN_LESSON_IDS,
    KI_FUEHRERSCHEIN_LESSON_IDS.map(() => 2),
  ),
  "ki-und-gesellschaft": sectionsByCount(
    CANONICAL_LESSON_IDS["ki-und-gesellschaft"],
    CANONICAL_LESSON_IDS["ki-und-gesellschaft"].map(() => 3),
    "-s",
  ),
  "eu-ai-act-kurs": sectionsByCount(
    EU_AI_ACT_LESSON_IDS,
    EU_AI_ACT_LESSON_IDS.map((lessonId) =>
      lessonId === "block_2_lesson_3" ? 4 : 3,
    ),
  ),
  "ai-native": sectionsByCount(
    AI_NATIVE_LESSON_IDS,
    [
      4, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 2, 3, 4, 3, 3, 3, 4, 4, 4, 3, 4, 4, 4,
      3, 4,
    ],
  ),
  claude: CLAUDE_SECTION_IDS,
  codex: bareSequentialSectionsByCount(
    CODEX_LESSON_IDS,
    [6, 7, 6, 5, 6, 6, 6, 7, 6, 7, 8, 8],
  ),
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
  "claude",
  "codex",
  "data-infrastructure",
  "data-engineering-fundamentals",
  "data-science",
  "ai-native-operator",
] as const satisfies readonly CourseSlug[];

export type EvidenceGatedCourseSlug =
  (typeof EVIDENCE_GATED_COURSE_SLUGS)[number];

export const LESSON_COMPLETION_EVIDENCE_VERSION = "lesson-proof-v1";

const AI_NATIVE_TRANSFER_PROOF_LESSON_IDS = new Set(["modul_3_lesson_0"]);
const TRANSFER_ONLY_COURSE_SLUGS = new Set<EvidenceGatedCourseSlug>([
  "claude",
  "codex",
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

  if (
    TRANSFER_ONLY_COURSE_SLUGS.has(slug) ||
    (slug === "ai-native" && AI_NATIVE_TRANSFER_PROOF_LESSON_IDS.has(lessonId))
  ) {
    return true;
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
