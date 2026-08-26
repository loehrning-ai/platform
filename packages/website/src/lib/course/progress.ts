// ─── KI-Führerschein / EU-AI-Act course progress (FACADE) ────────
//
// As of shared course architecture there is ONE progress store. This module is a
// thin, backward-compatible facade over `src/lib/progress/store.ts`: the same
// function signatures the two free-course pages + course components already
// import, now reading/writing the unified store (which migrated the legacy
// `course-progress::<slug>` payloads forward — never wiped, R1).

import type { CourseProgress, CourseSlug } from "./types";
import { getWorkshopPassThreshold } from "./config";
import {
  CANONICAL_LESSON_IDS,
  CANONICAL_SECTION_IDS,
  LESSON_COMPLETION_EVIDENCE_VERSION,
  isLessonCompletionEvidenceBacked,
} from "@/lib/courses/completion";
import {
  getCourseSlice,
  getUnifiedState,
  markSectionRead as uMarkSectionRead,
  isSectionRead as uIsSectionRead,
  getReadSectionIds as uGetReadSectionIds,
  markLessonCompleted as uMarkLessonCompleted,
  isLessonCompleted as uIsLessonCompleted,
  getCompletedLessonIds as uGetCompletedLessonIds,
  getCompletedLessonsCount as uGetCompletedLessonsCount,
  saveLessonQuizScore as uSaveLessonQuizScore,
  getLessonQuizScore as uGetLessonQuizScore,
  saveWorkshopQuizResult as uSaveWorkshopQuizResult,
  getWorkshopQuizResult as uGetWorkshopQuizResult,
  isWorkshopQuizPassed as uIsWorkshopQuizPassed,
  isCapstoneSubmitted as uIsCapstoneSubmitted,
  isCertificateEligible as uIsCertificateEligible,
  getOverallProgress as uGetOverallProgress,
  mergeCourseProgressShareDurably,
  resetCourse,
} from "@/lib/progress/store";
import { getEvidenceBackedBlockCompletedLessons } from "@/lib/progress/completion-evidence";

// ─── Section Progress ───────────────────────────────────────────

export function markSectionRead(
  courseSlug: CourseSlug,
  lessonId: string,
  sectionId: string,
): void {
  uMarkSectionRead(courseSlug, lessonId, sectionId);
}

export function isSectionRead(
  courseSlug: CourseSlug,
  lessonId: string,
  sectionId: string,
): boolean {
  return uIsSectionRead(courseSlug, lessonId, sectionId);
}

export function getReadSectionIds(
  courseSlug: CourseSlug,
  lessonId: string,
): ReadonlySet<string> {
  return uGetReadSectionIds(courseSlug, lessonId);
}

// ─── Lesson Progress ────────────────────────────────────────────

export function markLessonCompleted(
  courseSlug: CourseSlug,
  lessonId: string,
): void {
  uMarkLessonCompleted(courseSlug, lessonId);
}

export function isLessonCompleted(
  courseSlug: CourseSlug,
  lessonId: string,
): boolean {
  return uIsLessonCompleted(courseSlug, lessonId);
}

export function getCompletedLessonIds(
  courseSlug: CourseSlug,
): ReadonlySet<string> {
  return uGetCompletedLessonIds(courseSlug);
}

// ─── Quiz Scores ────────────────────────────────────────────────

export function saveLessonQuizScore(
  courseSlug: CourseSlug,
  lessonId: string,
  score: number,
  total: number,
): void {
  uSaveLessonQuizScore(courseSlug, lessonId, score, total);
}

export function getLessonQuizScore(
  courseSlug: CourseSlug,
  lessonId: string,
): { score: number; total: number } | null {
  return uGetLessonQuizScore(courseSlug, lessonId);
}

// ─── Workshop Quiz ──────────────────────────────────────────────

export function saveWorkshopQuizResult(
  courseSlug: CourseSlug,
  score: number,
  passed: boolean,
): void {
  uSaveWorkshopQuizResult(courseSlug, score, passed);
}

export function getWorkshopQuizResult(courseSlug: CourseSlug): {
  passed: boolean;
  score: number;
  completedAt: string | null;
} {
  return uGetWorkshopQuizResult(courseSlug);
}

export function isWorkshopQuizPassed(courseSlug: CourseSlug): boolean {
  return uIsWorkshopQuizPassed(courseSlug);
}

/** True once the capstone rubric was submitted (AI-Native's second eligibility path). */
export function isCapstoneSubmitted(courseSlug: CourseSlug): boolean {
  return uIsCapstoneSubmitted(courseSlug);
}

/**
 * Certificate gate (shared course architecture): all canonical lessons plus
 * the configured final assessment. AI-Native accepts either its quiz or its
 * submitted capstone; courses without an assessment require lessons only.
 */
export function isCertificateEligible(courseSlug: CourseSlug): boolean {
  return uIsCertificateEligible(courseSlug);
}

// ─── Aggregate Stats ────────────────────────────────────────────

export function getCompletedLessonsCount(courseSlug: CourseSlug): number {
  return uGetCompletedLessonsCount(courseSlug);
}

export function getBlockCompletedLessons(
  courseSlug: CourseSlug,
  lessonIds: readonly string[],
): number {
  return getEvidenceBackedBlockCompletedLessons(courseSlug, lessonIds);
}

export function areAllBlockLessonsCompleted(
  courseSlug: CourseSlug,
  lessonIds: readonly string[],
): boolean {
  return (
    lessonIds.length > 0 &&
    getEvidenceBackedBlockCompletedLessons(courseSlug, lessonIds) ===
      lessonIds.length
  );
}

export function getOverallProgress(
  courseSlug: CourseSlug,
  totalLessons: number,
): number {
  return uGetOverallProgress(courseSlug, totalLessons);
}

/** Project the unified course slice down to the legacy `CourseProgress` shape. */
export function getAllProgress(courseSlug: CourseSlug): CourseProgress {
  const slice = getCourseSlice(courseSlug);
  return {
    lessons: Object.fromEntries(
      Object.entries(slice.lessons).map(([id, l]) => [
        id,
        {
          sectionsRead: l.sectionsRead,
          quizScore: l.quizScore,
          quizTotal: l.quizTotal,
          completed: l.completed,
        },
      ]),
    ),
    workshopQuiz: slice.workshopQuiz,
    startedAt: slice.startedAt,
    lastActivity: slice.lastActivity,
  };
}

export function resetProgress(courseSlug: CourseSlug): void {
  resetCourse(courseSlug);
}

// ─── Cross-Device Progress Sharing (URL-based) ─────────────────

const LEGACY_SHARE_FORMAT_VERSION = 1 as const;
const SHARE_FORMAT_VERSION = 2 as const;
const MAX_SHARE_ENCODED_CHARS = 16_384;
const MAX_SHARE_DECODED_BYTES = 8_192;
const MAX_LESSON_QUIZ_TOTAL = 100;
const MIN_PROGRESS_TIMESTAMP = Date.UTC(2020, 0, 1);
const MAX_PROGRESS_TIMESTAMP = Date.UTC(2100, 0, 1);

const HASH_SHARING_COURSE_SLUGS = [
  "ki-fuehrerschein",
  "eu-ai-act-kurs",
  "ki-und-gesellschaft",
] as const satisfies readonly CourseSlug[];

type HashSharingCourseSlug = (typeof HASH_SHARING_COURSE_SLUGS)[number];

interface LegacyProgressShareEnvelope {
  readonly version: typeof LEGACY_SHARE_FORMAT_VERSION;
  readonly courseSlug: HashSharingCourseSlug;
  readonly progress: CourseProgress;
}

interface CompletionEvidenceShare {
  readonly version: typeof LESSON_COMPLETION_EVIDENCE_VERSION;
  readonly lessonIds: readonly string[];
}

interface ProgressShareEnvelope {
  readonly version: typeof SHARE_FORMAT_VERSION;
  readonly courseSlug: HashSharingCourseSlug;
  readonly progress: CourseProgress;
  readonly completionEvidence: CompletionEvidenceShare;
}

type DecodedProgressShareEnvelope =
  LegacyProgressShareEnvelope | ProgressShareEnvelope;

const CANONICAL_LESSON_ID_SETS: Readonly<
  Record<HashSharingCourseSlug, ReadonlySet<string>>
> = {
  "ki-fuehrerschein": new Set(CANONICAL_LESSON_IDS["ki-fuehrerschein"]),
  "eu-ai-act-kurs": new Set(CANONICAL_LESSON_IDS["eu-ai-act-kurs"]),
  "ki-und-gesellschaft": new Set(CANONICAL_LESSON_IDS["ki-und-gesellschaft"]),
};

function isHashSharingCourseSlug(
  value: unknown,
): value is HashSharingCourseSlug {
  return (
    typeof value === "string" &&
    (HASH_SHARING_COURSE_SLUGS as readonly string[]).includes(value)
  );
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * JSON objects are enumerable data records. Reject accessors, symbols, and
 * non-enumerable properties as well as exotic prototypes so serialization
 * cannot smuggle values past the exact-key checks.
 */
function safeOwnKeys(value: Record<string, unknown>): readonly string[] | null {
  const keys = Reflect.ownKeys(value);
  const safeKeys: string[] = [];
  for (const key of keys) {
    if (typeof key !== "string") return null;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !("value" in descriptor)) return null;
    safeKeys.push(key);
  }
  return safeKeys;
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const keys = safeOwnKeys(value);
  if (!keys || keys.length !== expected.length) return false;
  const expectedKeys = new Set(expected);
  return keys.every((key) => expectedKeys.has(key));
}

function isCanonicalIsoTimestamp(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length !== 24 ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  ) {
    return false;
  }
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) &&
    timestamp >= MIN_PROGRESS_TIMESTAMP &&
    timestamp < MAX_PROGRESS_TIMESTAMP &&
    new Date(timestamp).toISOString() === value
  );
}

/** Validate the compact lesson payload against the canonical content IDs. */
function validateLessonProgress(
  raw: unknown,
  courseSlug: HashSharingCourseSlug,
  lessonId: string,
): CourseProgress["lessons"][string] | null {
  if (
    !isPlainRecord(raw) ||
    !hasExactKeys(raw, [
      "sectionsRead",
      "quizScore",
      "quizTotal",
      "completed",
    ]) ||
    !Array.isArray(raw.sectionsRead) ||
    typeof raw.completed !== "boolean"
  ) {
    return null;
  }

  const allowedSectionIds = new Set(
    CANONICAL_SECTION_IDS[courseSlug][lessonId] ?? [],
  );
  if (raw.sectionsRead.length > allowedSectionIds.size) return null;

  const sectionIds: string[] = [];
  const seenSectionIds = new Set<string>();
  for (const sectionId of raw.sectionsRead) {
    if (
      typeof sectionId !== "string" ||
      !allowedSectionIds.has(sectionId) ||
      seenSectionIds.has(sectionId)
    ) {
      return null;
    }
    seenSectionIds.add(sectionId);
    sectionIds.push(sectionId);
  }

  const bothQuizValuesAreNull =
    raw.quizScore === null && raw.quizTotal === null;
  const bothQuizValuesAreValid =
    typeof raw.quizScore === "number" &&
    Number.isFinite(raw.quizScore) &&
    raw.quizScore >= 0 &&
    raw.quizScore <= 1 &&
    typeof raw.quizTotal === "number" &&
    Number.isInteger(raw.quizTotal) &&
    raw.quizTotal >= 1 &&
    raw.quizTotal <= MAX_LESSON_QUIZ_TOTAL &&
    Math.abs(
      raw.quizScore * raw.quizTotal - Math.round(raw.quizScore * raw.quizTotal),
    ) <= 1e-9;

  if (!bothQuizValuesAreNull && !bothQuizValuesAreValid) return null;

  return {
    sectionsRead: sectionIds,
    quizScore: raw.quizScore as number | null,
    quizTotal: raw.quizTotal as number | null,
    completed: raw.completed,
  };
}

function validateCompletionEvidence(
  raw: unknown,
  courseSlug: HashSharingCourseSlug,
  progress: CourseProgress,
): CompletionEvidenceShare | null {
  if (
    !isPlainRecord(raw) ||
    !hasExactKeys(raw, ["version", "lessonIds"]) ||
    raw.version !== LESSON_COMPLETION_EVIDENCE_VERSION ||
    !Array.isArray(raw.lessonIds)
  ) {
    return null;
  }

  const canonicalLessonIds = CANONICAL_LESSON_ID_SETS[courseSlug];
  if (raw.lessonIds.length > canonicalLessonIds.size) return null;

  const lessonIds: string[] = [];
  const seenLessonIds = new Set<string>();
  for (const lessonId of raw.lessonIds) {
    if (
      typeof lessonId !== "string" ||
      !canonicalLessonIds.has(lessonId) ||
      seenLessonIds.has(lessonId)
    ) {
      return null;
    }

    const lesson = progress.lessons[lessonId];
    const requiredSections = CANONICAL_SECTION_IDS[courseSlug][lessonId] ?? [];
    if (
      !lesson?.completed ||
      lesson.quizScore === null ||
      lesson.quizTotal === null ||
      !requiredSections.every((sectionId) =>
        lesson.sectionsRead.includes(sectionId),
      )
    ) {
      return null;
    }

    seenLessonIds.add(lessonId);
    lessonIds.push(lessonId);
  }

  return {
    version: LESSON_COMPLETION_EVIDENCE_VERSION,
    lessonIds,
  };
}

function validateCourseProgress(
  raw: unknown,
  courseSlug: HashSharingCourseSlug,
): CourseProgress | null {
  if (
    !isPlainRecord(raw) ||
    !hasExactKeys(raw, [
      "lessons",
      "workshopQuiz",
      "startedAt",
      "lastActivity",
    ]) ||
    !isPlainRecord(raw.lessons) ||
    !isPlainRecord(raw.workshopQuiz) ||
    !isCanonicalIsoTimestamp(raw.startedAt) ||
    !isCanonicalIsoTimestamp(raw.lastActivity)
  ) {
    return null;
  }

  const lessonIds = safeOwnKeys(raw.lessons);
  const canonicalLessonIds = CANONICAL_LESSON_ID_SETS[courseSlug];
  if (!lessonIds || lessonIds.length > canonicalLessonIds.size) return null;

  const lessons: Record<string, CourseProgress["lessons"][string]> = {};
  let hasMeaningfulLessonProgress = false;
  for (const lessonId of lessonIds) {
    if (!canonicalLessonIds.has(lessonId)) return null;
    const lesson = validateLessonProgress(
      raw.lessons[lessonId],
      courseSlug,
      lessonId,
    );
    if (!lesson) return null;
    lessons[lessonId] = lesson;
    hasMeaningfulLessonProgress ||= Boolean(
      lesson.completed ||
      lesson.sectionsRead.length > 0 ||
      lesson.quizScore !== null,
    );
  }

  if (
    !hasExactKeys(raw.workshopQuiz, ["passed", "score", "completedAt"]) ||
    typeof raw.workshopQuiz.passed !== "boolean" ||
    typeof raw.workshopQuiz.score !== "number" ||
    !Number.isFinite(raw.workshopQuiz.score) ||
    raw.workshopQuiz.score < 0 ||
    raw.workshopQuiz.score > 1 ||
    (raw.workshopQuiz.completedAt !== null &&
      !isCanonicalIsoTimestamp(raw.workshopQuiz.completedAt))
  ) {
    return null;
  }

  const workshopWasAttempted = raw.workshopQuiz.completedAt !== null;
  const passThreshold = getWorkshopPassThreshold(courseSlug);
  if (
    (!workshopWasAttempted &&
      (raw.workshopQuiz.passed || raw.workshopQuiz.score !== 0)) ||
    raw.workshopQuiz.passed !==
      (workshopWasAttempted && raw.workshopQuiz.score >= passThreshold)
  ) {
    return null;
  }

  if (!hasMeaningfulLessonProgress && !workshopWasAttempted) return null;

  return {
    lessons,
    workshopQuiz: {
      passed: raw.workshopQuiz.passed,
      score: raw.workshopQuiz.score,
      completedAt: raw.workshopQuiz.completedAt,
    },
    startedAt: raw.startedAt,
    lastActivity: raw.lastActivity,
  };
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function encodeEnvelope(envelope: ProgressShareEnvelope): string | null {
  const bytes = new TextEncoder().encode(JSON.stringify(envelope));
  if (bytes.length > MAX_SHARE_DECODED_BYTES) return null;
  const encoded = bytesToBase64Url(bytes);
  return encoded.length <= MAX_SHARE_ENCODED_CHARS ? encoded : null;
}

function decodeEnvelope(encoded: string): DecodedProgressShareEnvelope | null {
  try {
    if (
      typeof encoded !== "string" ||
      encoded.length === 0 ||
      encoded.length > MAX_SHARE_ENCODED_CHARS ||
      encoded.length % 4 === 1 ||
      !/^[A-Za-z0-9_-]+$/.test(encoded)
    ) {
      return null;
    }

    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const binary = atob(base64);
    if (binary.length > MAX_SHARE_DECODED_BYTES) return null;

    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    // Reject alternate/non-canonical base64 representations before parsing.
    if (bytesToBase64Url(bytes) !== encoded) return null;

    const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const parsed: unknown = JSON.parse(json);
    if (!isPlainRecord(parsed) || !isHashSharingCourseSlug(parsed.courseSlug)) {
      return null;
    }

    const progress = validateCourseProgress(parsed.progress, parsed.courseSlug);
    if (!progress) return null;

    if (parsed.version === LEGACY_SHARE_FORMAT_VERSION) {
      if (!hasExactKeys(parsed, ["version", "courseSlug", "progress"])) {
        return null;
      }
      return {
        version: LEGACY_SHARE_FORMAT_VERSION,
        courseSlug: parsed.courseSlug,
        progress,
      };
    }

    if (
      parsed.version !== SHARE_FORMAT_VERSION ||
      !hasExactKeys(parsed, [
        "version",
        "courseSlug",
        "progress",
        "completionEvidence",
      ])
    ) {
      return null;
    }
    const completionEvidence = validateCompletionEvidence(
      parsed.completionEvidence,
      parsed.courseSlug,
      progress,
    );
    if (!completionEvidence) return null;
    return {
      version: SHARE_FORMAT_VERSION,
      courseSlug: parsed.courseSlug,
      progress,
      completionEvidence,
    };
  } catch {
    return null;
  }
}

/**
 * Serialize current progress in a versioned, course-bound base64url envelope.
 * Returns null for unsupported courses, empty progress, corrupt local state,
 * or a payload beyond the URL-sharing byte budget.
 */
export function serializeProgress(courseSlug: CourseSlug): string | null {
  try {
    if (!isHashSharingCourseSlug(courseSlug)) return null;
    const progress = validateCourseProgress(
      getAllProgress(courseSlug),
      courseSlug,
    );
    if (!progress) return null;
    const state = getUnifiedState();
    const lessonIds = CANONICAL_LESSON_IDS[courseSlug].filter((lessonId) =>
      isLessonCompletionEvidenceBacked(state, courseSlug, lessonId),
    );
    return encodeEnvelope({
      version: SHARE_FORMAT_VERSION,
      courseSlug,
      progress,
      completionEvidence: {
        version: LESSON_COMPLETION_EVIDENCE_VERSION,
        lessonIds,
      },
    });
  } catch {
    return null;
  }
}

/**
 * Deserialize a course-bound base64url envelope back to CourseProgress.
 */
export function deserializeProgress(encoded: string): CourseProgress | null {
  return decodeEnvelope(encoded)?.progress ?? null;
}

/**
 * Import progress from a serialized string in one durable owner-fenced store
 * write. Higher lesson/workshop scores win, sections union, and completion is
 * sticky. Legacy v1 links remain importable but carry no completion evidence.
 */
export function importProgress(
  courseSlug: CourseSlug,
  encoded: string,
): boolean {
  try {
    if (!isHashSharingCourseSlug(courseSlug)) return false;
    const envelope = decodeEnvelope(encoded);
    if (!envelope || envelope.courseSlug !== courseSlug) return false;
    const evidenceLessonIds =
      envelope.version === SHARE_FORMAT_VERSION
        ? envelope.completionEvidence.lessonIds
        : [];

    // Every attacker-controlled value is validated before this single store
    // mutation. Storage rejection or an owner-generation race returns false
    // without updating the cache or notifying subscribers.
    return mergeCourseProgressShareDurably(
      courseSlug,
      envelope.progress,
      evidenceLessonIds,
    );
  } catch {
    return false;
  }
}

/**
 * Build a full shareable URL with progress encoded in the hash.
 */
export function buildProgressUrl(
  courseSlug: CourseSlug,
  baseUrl: string,
): string | null {
  const encoded = serializeProgress(courseSlug);
  if (!encoded) return null;
  return `${baseUrl}#progress=${encoded}`;
}
