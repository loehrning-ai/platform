import type { CourseSlug } from "@/lib/course/types";
import type { UnifiedProgress } from "@/lib/progress/types";

import { hasValidCourseProjectArtifact } from "./persistence";
import type { CourseProjectEngineKind } from "./types";

export interface CourseProjectIdentity {
  readonly id: string;
  readonly progressLessonId: string;
  readonly engineKind: CourseProjectEngineKind;
}

/**
 * The stable persistence identity for each course-wide project.
 *
 * Keep this module data-only and free of localized project copy: progress and
 * certificate consumers need the identity without pulling the full project
 * configuration into their client bundles.
 */
export const COURSE_PROJECT_IDENTITIES = {
  "ki-fuehrerschein": {
    id: "project-ki-fuehrerschein-redline",
    progressLessonId: "block_5_lesson_4",
    engineKind: "case",
  },
  "eu-ai-act-kurs": {
    id: "project-eu-ai-act-case-file",
    progressLessonId: "block_6_lesson_4",
    engineKind: "case",
  },
  "ai-native": {
    id: "project-ai-native-workflow-control",
    progressLessonId: "modul_4_lesson_8",
    engineKind: "prompt",
  },
  "ki-und-gesellschaft": {
    id: "project-ki-gesellschaft-newsroom",
    progressLessonId: "ethik-3-3",
    engineKind: "case",
  },
  "data-engineering-fundamentals": {
    id: "project-data-engineering-pipeline",
    progressLessonId: "cap",
    engineKind: "data",
  },
  "data-science": {
    id: "project-data-science-experiment",
    progressLessonId: "cap",
    engineKind: "data",
  },
  "data-infrastructure": {
    id: "project-data-infrastructure-incident",
    progressLessonId: "interview-playbook",
    engineKind: "data",
  },
  codex: {
    id: "project-codex-repository-mission",
    progressLessonId: "L12",
    engineKind: "repo",
  },
  claude: {
    id: "project-claude-evidence-lab",
    progressLessonId: "safety",
    engineKind: "prompt",
  },
  "ai-native-operator": {
    id: "project-ai-native-operator-control-plane",
    progressLessonId: "measurement/4",
    engineKind: "prompt",
  },
} as const satisfies Readonly<Record<CourseSlug, CourseProjectIdentity>>;

export function getCourseProjectIdentity(
  courseSlug: CourseSlug,
): CourseProjectIdentity {
  return COURSE_PROJECT_IDENTITIES[courseSlug];
}

/**
 * A project is complete only when its exact, artifact-bearing exercise result
 * is complete. The historical `capstoneSubmitted` bit is deliberately ignored.
 */
export function hasAppliedProjectCompletion(
  progress: UnifiedProgress | null | undefined,
  courseSlug: CourseSlug,
): boolean {
  const identity = getCourseProjectIdentity(courseSlug);
  const result =
    progress?.courses?.[courseSlug]?.lessons[identity.progressLessonId]
      ?.exercisesCompleted[identity.id];

  return (
    result?.exerciseId === identity.id &&
    result.kind === `course-project-${identity.engineKind}` &&
    result.completed === true &&
    result.skipped === false &&
    hasValidCourseProjectArtifact(
      result.summary,
      identity.engineKind,
      courseSlug,
    )
  );
}
