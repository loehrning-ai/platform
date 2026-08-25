import { describe, expect, it } from "vitest";
import { COURSE_SLUGS } from "@/lib/course/types";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import { COURSE_PROJECT_STAGE_IDS } from "./types";
import { resolveCourseProjectMilestone } from "./milestone-manifest";
import {
  deriveCompletedCourseProjectStages,
  getCourseLessonMissions,
  getCourseProjectCheckpointMissions,
  getLessonMissionDefinition,
  hasCompletedAllCourseProjectStages,
  LESSON_MISSION_CATALOG,
  normalizeCompletedLessonMissionIds,
} from "./lesson-mission-catalog";

describe("lesson mission catalog", () => {
  it("defines one fail-closed mission identity for every canonical lesson", () => {
    const expectedCount = COURSE_SLUGS.reduce(
      (total, courseSlug) => total + CANONICAL_LESSON_IDS[courseSlug].length,
      0,
    );
    expect(Object.keys(LESSON_MISSION_CATALOG)).toHaveLength(expectedCount);

    for (const courseSlug of COURSE_SLUGS) {
      const missions = getCourseLessonMissions(courseSlug);
      expect(missions.map((mission) => mission.lessonId)).toEqual(
        CANONICAL_LESSON_IDS[courseSlug],
      );
      expect(new Set(missions.map((mission) => mission.id)).size).toBe(
        missions.length,
      );
      expect(missions.map((mission) => mission.scenarioSeed)).toEqual(
        missions.map((_, index) => index + 1),
      );
      for (const mission of missions) {
        expect(mission.stageId).toBe(
          resolveCourseProjectMilestone(courseSlug, mission.lessonId)?.stageId,
        );
        expect(getLessonMissionDefinition(courseSlug, mission.lessonId)).toBe(
          mission,
        );
      }
    }

    expect(() =>
      getLessonMissionDefinition("data-science", "not-canonical"),
    ).toThrow(/Unknown canonical lesson mission/);
  });

  it("derives all five stages from ordered checkpoint missions for every course", () => {
    for (const courseSlug of COURSE_SLUGS) {
      const checkpoints = getCourseProjectCheckpointMissions(courseSlug);
      const completed: (typeof checkpoints)[number]["id"][] = [];

      expect(checkpoints, courseSlug).toHaveLength(5);
      expect(
        checkpoints.map((mission) => mission.stageId),
        courseSlug,
      ).toEqual(COURSE_PROJECT_STAGE_IDS);
      expect(
        checkpoints.map((mission) => mission.id),
        courseSlug,
      ).toEqual(
        checkpoints.map(
          (mission) => `${courseSlug}:${mission.lessonId}:v1`,
        ),
      );
      expect(deriveCompletedCourseProjectStages(courseSlug, [])).toEqual([]);

      for (const [index, checkpoint] of checkpoints.entries()) {
        completed.push(checkpoint.id);
        expect(
          deriveCompletedCourseProjectStages(courseSlug, completed),
          `${courseSlug}/${checkpoint.stageId}`,
        ).toEqual(COURSE_PROJECT_STAGE_IDS.slice(0, index + 1));
      }

      expect(hasCompletedAllCourseProjectStages(courseSlug, completed)).toBe(
        true,
      );
    }
  });

  it("accepts legacy all-lesson mission arrays while requiring only checkpoints", () => {
    for (const courseSlug of COURSE_SLUGS) {
      const missions = getCourseLessonMissions(courseSlug);
      const legacyIds = missions.map((mission) => mission.id);
      const checkpoints = getCourseProjectCheckpointMissions(courseSlug);
      const nonCheckpointIds = legacyIds.filter(
        (id) => !checkpoints.some((checkpoint) => checkpoint.id === id),
      );

      expect(
        normalizeCompletedLessonMissionIds(courseSlug, [...legacyIds].reverse()),
        courseSlug,
      ).toEqual(legacyIds);
      expect(
        deriveCompletedCourseProjectStages(courseSlug, legacyIds),
        courseSlug,
      ).toEqual(COURSE_PROJECT_STAGE_IDS);
      expect(
        deriveCompletedCourseProjectStages(courseSlug, nonCheckpointIds),
        courseSlug,
      ).toEqual([]);
      expect(
        deriveCompletedCourseProjectStages(
          courseSlug,
          checkpoints.map((checkpoint) => checkpoint.id),
        ),
        courseSlug,
      ).toEqual(COURSE_PROJECT_STAGE_IDS);
    }
  });

  it("rejects duplicates and cross-course mission IDs", () => {
    const dataMission = getCourseLessonMissions("data-science")[0]!.id;
    const codexMission = getCourseLessonMissions("codex")[0]!.id;
    expect(
      normalizeCompletedLessonMissionIds("data-science", [
        dataMission,
        dataMission,
      ]),
    ).toEqual([]);
    expect(
      normalizeCompletedLessonMissionIds("data-science", [codexMission]),
    ).toEqual([]);
  });

  it("rejects sparse arrays instead of granting checkpoint credit", () => {
    const groundCheckpoint =
      getCourseProjectCheckpointMissions("data-science")[0]!.id;
    const sparse: unknown[] = new Array(2);
    sparse[1] = groundCheckpoint;

    expect(
      normalizeCompletedLessonMissionIds("data-science", sparse),
    ).toEqual([]);
    expect(
      deriveCompletedCourseProjectStages(
        "data-science",
        sparse as readonly (typeof groundCheckpoint)[],
      ),
    ).toEqual([]);
  });
});
