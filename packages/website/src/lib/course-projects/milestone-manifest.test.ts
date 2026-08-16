import { describe, expect, it } from "vitest";
import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import {
  COURSE_PROJECT_MILESTONE_MANIFEST,
  resolveCourseProjectMilestone,
} from "./milestone-manifest";
import { COURSE_PROJECT_STAGE_IDS } from "./types";

const EXPECTED_STAGE_STARTS = {
  "ki-fuehrerschein": [
    "block_1_lesson_1",
    "block_2_lesson_1",
    "block_3_lesson_1",
    "block_4_lesson_1",
    "block_5_lesson_1",
  ],
  "eu-ai-act-kurs": [
    "block_1_lesson_1",
    "block_2_lesson_1",
    "block_3_lesson_1",
    "block_4_lesson_1",
    "block_6_lesson_1",
  ],
  "ai-native": [
    "modul_1_lesson_1",
    "modul_2_lesson_1",
    "modul_3_lesson_1",
    "modul_4_lesson_1",
    "modul_4_lesson_7",
  ],
  "ki-und-gesellschaft": [
    "arbeit-1-1",
    "deepfake-2-1",
    "deepfake-2-3",
    "ethik-3-1",
    "ethik-3-3",
  ],
  "data-engineering-fundamentals": ["home", "ingest", "orch", "disc", "cap"],
  "data-science": ["fund", "feature", "eval", "causal", "deploy"],
  "data-infrastructure": [
    "mental-model",
    "storage-formats",
    "batch-elt",
    "idempotency",
    "interview-playbook",
  ],
  codex: ["L01", "L04", "L07", "L10", "L12"],
  claude: ["mental-model", "claude-md", "agents", "team", "safety"],
  "ai-native-operator": [
    "mindset/1",
    "engineering/1",
    "operations/1",
    "talent/1",
    "measurement/1",
  ],
} as const satisfies Readonly<Record<CourseSlug, readonly string[]>>;

const EXPECTED_STAGE_COUNTS = {
  "ki-fuehrerschein": [3, 3, 4, 4, 4],
  "eu-ai-act-kurs": [4, 4, 4, 8, 4],
  "ai-native": [5, 7, 7, 6, 2],
  "ki-und-gesellschaft": [3, 2, 1, 2, 1],
  "data-engineering-fundamentals": [2, 4, 2, 3, 1],
  "data-science": [3, 2, 3, 2, 2],
  "data-infrastructure": [3, 3, 3, 2, 1],
  codex: [3, 3, 3, 2, 1],
  claude: [3, 3, 3, 2, 1],
  "ai-native-operator": [5, 10, 4, 16, 4],
} as const satisfies Readonly<Record<CourseSlug, readonly number[]>>;

describe("course project milestone manifest", () => {
  it("covers all 177 canonical lessons exactly once in monotone stage order", () => {
    let totalAssigned = 0;

    for (const courseSlug of COURSE_SLUGS) {
      const manifest = COURSE_PROJECT_MILESTONE_MANIFEST[courseSlug];
      const assigned = COURSE_PROJECT_STAGE_IDS.flatMap(
        (stageId) => manifest[stageId],
      );
      const stageCounts = COURSE_PROJECT_STAGE_IDS.map(
        (stageId) => manifest[stageId].length,
      );

      expect(assigned, courseSlug).toEqual(CANONICAL_LESSON_IDS[courseSlug]);
      expect(new Set(assigned).size, courseSlug).toBe(assigned.length);
      expect(stageCounts, courseSlug).toEqual(
        EXPECTED_STAGE_COUNTS[courseSlug],
      );
      expect(
        COURSE_PROJECT_STAGE_IDS.map((stageId) => manifest[stageId][0]),
        courseSlug,
      ).toEqual(EXPECTED_STAGE_STARTS[courseSlug]);
      totalAssigned += assigned.length;
    }

    expect(totalAssigned).toBe(177);
  });

  it("resolves every lesson from explicit membership independent of iteration order", () => {
    for (const courseSlug of COURSE_SLUGS) {
      const expected = new Map(
        COURSE_PROJECT_STAGE_IDS.flatMap((stageId, stageIndex) =>
          COURSE_PROJECT_MILESTONE_MANIFEST[courseSlug][stageId].map(
            (lessonId) => [lessonId, { stageId, stageIndex }] as const,
          ),
        ),
      );

      for (const lessonId of [...CANONICAL_LESSON_IDS[courseSlug]].reverse()) {
        expect(resolveCourseProjectMilestone(courseSlug, lessonId)).toEqual(
          expected.get(lessonId),
        );
      }
    }
  });

  it("fails closed for an unassigned insertion instead of shifting later lessons", () => {
    const before = resolveCourseProjectMilestone("codex", "L12");
    expect(
      resolveCourseProjectMilestone("codex", "future-inserted-lesson"),
    ).toBeNull();
    expect(resolveCourseProjectMilestone("codex", "L12")).toEqual(before);
  });
});
