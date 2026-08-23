import type { CourseSlug } from "@/lib/course/types";
import {
  parseCourseProjectProgress,
  serializeCourseProjectProgress,
} from "./persistence";
import {
  getCourseLessonMissions,
  normalizeCompletedLessonMissionIds,
  type LessonMissionId,
} from "./lesson-mission-catalog";
import {
  COURSE_PROJECT_STAGE_IDS,
  type CourseProjectArtifactState,
  type CourseProjectEngineKind,
  type CourseProjectStageId,
} from "./types";
export { getCourseProjectDraftStorageKey } from "./storage-keys";

// Owner-scoped local state only. This must fit the largest current course
// (39 stable lesson receipts) plus the maximally bounded artifact envelope.
const MAX_DRAFT_BYTES = 4_096;
const LESSON_MISSION_CATALOG_REVISION = 1;

export interface CourseProjectDraft {
  readonly version: 4;
  readonly resetAt: string | null;
  readonly completedMissionIds: readonly LessonMissionId[];
  readonly artifact: CourseProjectArtifactState | null;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function isResetBoundary(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === "string" && value.length > 0 && value.length <= 64)
  );
}

function parseArtifact(
  value: unknown,
  expectedEngineKind: CourseProjectEngineKind,
): CourseProjectArtifactState | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return (
    parseCourseProjectProgress(value, expectedEngineKind).artifact ?? undefined
  );
}

function normalizeLegacyStagePrefix(
  value: unknown,
): readonly CourseProjectStageId[] | null {
  if (!Array.isArray(value) || value.length > COURSE_PROJECT_STAGE_IDS.length) {
    return null;
  }
  if (
    value.some(
      (entry, index) =>
        typeof entry !== "string" || entry !== COURSE_PROJECT_STAGE_IDS[index],
    )
  ) {
    return null;
  }
  return value as readonly CourseProjectStageId[];
}

function encodeMissionLessonIds(
  courseSlug: CourseSlug,
  completedMissionIds: readonly LessonMissionId[],
): readonly string[] {
  const normalized = normalizeCompletedLessonMissionIds(
    courseSlug,
    completedMissionIds,
  );
  const lessonIdByMissionId = new Map(
    getCourseLessonMissions(courseSlug).map((mission) => [
      mission.id,
      mission.lessonId,
    ]),
  );
  return normalized.map(
    (missionId) => lessonIdByMissionId.get(missionId) as string,
  );
}

function decodeMissionLessonIds(
  courseSlug: CourseSlug,
  value: unknown,
): readonly LessonMissionId[] | null {
  const missions = getCourseLessonMissions(courseSlug);
  if (!Array.isArray(value) || value.length > missions.length) return null;
  const lessonIds = value.filter(
    (entry): entry is string => typeof entry === "string" && entry.length <= 80,
  );
  if (
    lessonIds.length !== value.length ||
    new Set(lessonIds).size !== lessonIds.length
  ) {
    return null;
  }
  const missionByLessonId = new Map(
    missions.map((mission) => [mission.lessonId, mission]),
  );
  const missionIds = lessonIds.map(
    (lessonId) => missionByLessonId.get(lessonId)?.id,
  );
  if (missionIds.some((missionId) => missionId === undefined)) return null;
  const normalized = normalizeCompletedLessonMissionIds(courseSlug, missionIds);
  return normalized.length === missionIds.length ? normalized : null;
}

/**
 * Parses an owner-scoped local draft. Version 3 stores canonical per-lesson
 * mission receipts as stable canonical lesson IDs under an explicit catalog
 * revision. Version 2 stage flags and the pre-release positional v3 envelope
 * are accepted only as migration sources for the bounded artifact; their stage
 * progress is reset because neither can prove stable per-lesson evidence.
 */
export function parseCourseProjectDraft(
  raw: string | null,
  courseSlug: CourseSlug,
  expectedEngineKind: CourseProjectEngineKind,
  expectedResetAt: string | null,
): CourseProjectDraft | null {
  if (!raw || byteLength(raw) > MAX_DRAFT_BYTES) return null;
  try {
    const candidate = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof candidate !== "object" ||
      candidate === null ||
      Array.isArray(candidate) ||
      !isResetBoundary(candidate.r) ||
      candidate.r !== expectedResetAt
    ) {
      return null;
    }

    const artifact = parseArtifact(candidate.a, expectedEngineKind);
    if (artifact === undefined) return null;

    if (candidate.v === 2 || candidate.v === 3) {
      if (
        Object.keys(candidate).some(
          (key) =>
            key !== "v" &&
            key !== "r" &&
            key !== "s" &&
            key !== "m" &&
            key !== "a",
        ) ||
        (candidate.v === 2 &&
          normalizeLegacyStagePrefix(candidate.s) === null) ||
        (candidate.v === 3 && !Array.isArray(candidate.m))
      ) {
        return null;
      }
      return {
        version: 4,
        resetAt: candidate.r,
        completedMissionIds: [],
        artifact,
      };
    }

    if (
      candidate.v !== 4 ||
      candidate.c !== LESSON_MISSION_CATALOG_REVISION ||
      Object.keys(candidate).some(
        (key) =>
          key !== "v" &&
          key !== "c" &&
          key !== "r" &&
          key !== "m" &&
          key !== "a",
      )
    ) {
      return null;
    }
    const completedMissionIds = decodeMissionLessonIds(courseSlug, candidate.m);
    if (completedMissionIds === null) return null;
    return {
      version: 4,
      resetAt: candidate.r,
      completedMissionIds,
      artifact,
    };
  } catch {
    return null;
  }
}

export function serializeCourseProjectDraft(
  courseSlug: CourseSlug,
  completedMissionIds: readonly LessonMissionId[],
  artifact: CourseProjectArtifactState | null,
  resetAt: string | null,
): string {
  const missionLessonIds = encodeMissionLessonIds(
    courseSlug,
    completedMissionIds,
  );
  const encoded = JSON.stringify({
    v: 4,
    c: LESSON_MISSION_CATALOG_REVISION,
    r: resetAt,
    m: missionLessonIds,
    a: artifact ? serializeCourseProjectProgress(null, artifact) : null,
  });
  if (byteLength(encoded) > MAX_DRAFT_BYTES) {
    throw new RangeError(
      "Course project draft exceeds its bounded local envelope.",
    );
  }
  return encoded;
}
