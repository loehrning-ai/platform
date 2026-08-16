import { describe, expect, it } from "vitest";
import { COURSE_SLUGS } from "@/lib/course/types";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import { COURSE_PROJECT_STAGE_IDS } from "./types";
import { resolveCourseProjectMilestone } from "./milestone-manifest";
import {
  deriveCompletedCourseProjectStages,
  getCourseLessonMissions,
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

  it("derives stages only from complete per-lesson mission sets", () => {
    const courseSlug = "data-science" as const;
    const missions = getCourseLessonMissions(courseSlug);
    const ground = missions.filter((mission) => mission.stageId === "ground");
    const build = missions.filter((mission) => mission.stageId === "build");

    expect(deriveCompletedCourseProjectStages(courseSlug, [])).toEqual([]);
    expect(
      deriveCompletedCourseProjectStages(
        courseSlug,
        ground.slice(0, -1).map((mission) => mission.id),
      ),
    ).toEqual([]);
    expect(
      deriveCompletedCourseProjectStages(
        courseSlug,
        ground.map((mission) => mission.id),
      ),
    ).toEqual(["ground"]);
    expect(
      deriveCompletedCourseProjectStages(
        courseSlug,
        [...ground, ...build].map((mission) => mission.id),
      ),
    ).toEqual(["ground", "build"]);
    expect(
      hasCompletedAllCourseProjectStages(
        courseSlug,
        missions.map((mission) => mission.id),
      ),
    ).toBe(true);
    expect(COURSE_PROJECT_STAGE_IDS).toHaveLength(5);
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
});
