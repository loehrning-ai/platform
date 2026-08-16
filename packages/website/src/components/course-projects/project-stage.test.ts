import { describe, expect, it } from "vitest";

import { COURSE_SLUGS } from "@/lib/course/types";
import { resolveCourseProjectMilestone } from "@/lib/course-projects/milestone-manifest";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";

import {
  COURSE_PROJECT_STAGE_COUNT,
  getCourseProjectStageIndex,
} from "./project-stage";

describe("getCourseProjectStageIndex", () => {
  it.each(COURSE_SLUGS)(
    "delegates every %s lesson to the shared resolver",
    (slug) => {
      for (const lessonId of CANONICAL_LESSON_IDS[slug]) {
        expect(getCourseProjectStageIndex(slug, lessonId)).toBe(
          resolveCourseProjectMilestone(slug, lessonId)?.stageIndex,
        );
      }
      expect(COURSE_PROJECT_STAGE_COUNT).toBe(5);
    },
  );

  it("fails closed to Ground for a non-canonical entry point", () => {
    expect(getCourseProjectStageIndex("data-science", "home")).toBe(0);
  });
});
