import { describe, expect, it } from "vitest";
import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import {
  isCourseProjectCheckpointLesson,
  resolveCourseProjectCheckpoint,
  selectCourseProjectCheckpoints,
} from "./checkpoint-selector";
import { COURSE_PROJECT_STAGE_IDS } from "./types";

const EXPECTED_CHECKPOINT_LESSONS = {
  "ki-fuehrerschein": [
    "block_1_lesson_1",
    "block_2_lesson_1",
    "block_3_lesson_1",
    "block_4_lesson_1",
    "block_5_lesson_1",
  ],
  "ki-und-gesellschaft": [
    "arbeit-1-1",
    "deepfake-2-1",
    "deepfake-2-3",
    "ethik-3-1",
    "ethik-3-3",
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
  claude: ["mental-model", "claude-md", "agents", "team", "safety"],
  codex: ["L01", "L04", "L07", "L10", "L12"],
  "data-infrastructure": [
    "mental-model",
    "storage-formats",
    "batch-elt",
    "idempotency",
    "interview-playbook",
  ],
  "data-engineering-fundamentals": ["home", "ingest", "orch", "disc", "cap"],
  "data-science": ["fund", "feature", "eval", "causal", "deploy"],
  "ai-native-operator": [
    "mindset/1",
    "engineering/1",
    "operations/1",
    "talent/1",
    "measurement/1",
  ],
} as const satisfies Readonly<Record<CourseSlug, readonly string[]>>;

describe("course project checkpoint selector", () => {
  it("selects exactly five ordered stage-start checkpoints for all ten courses", () => {
    expect(COURSE_SLUGS).toHaveLength(10);

    for (const courseSlug of COURSE_SLUGS) {
      const checkpoints = selectCourseProjectCheckpoints(courseSlug);

      expect(checkpoints, courseSlug).toHaveLength(5);
      expect(
        checkpoints.map((checkpoint) => checkpoint.stageId),
        courseSlug,
      ).toEqual(COURSE_PROJECT_STAGE_IDS);
      expect(
        checkpoints.map((checkpoint) => checkpoint.stageIndex),
        courseSlug,
      ).toEqual([0, 1, 2, 3, 4]);
      expect(
        checkpoints.map((checkpoint) => checkpoint.lessonId),
        courseSlug,
      ).toEqual(EXPECTED_CHECKPOINT_LESSONS[courseSlug]);
      expect(
        checkpoints.map((checkpoint) =>
          CANONICAL_LESSON_IDS[courseSlug].indexOf(checkpoint.lessonId),
        ),
        courseSlug,
      ).toEqual(
        checkpoints
          .map((checkpoint) =>
            CANONICAL_LESSON_IDS[courseSlug].indexOf(checkpoint.lessonId),
          )
          .toSorted((left, right) => left - right),
      );
    }
  });

  it("resolves only the fifty selected checkpoints and fails closed otherwise", () => {
    let selectedCount = 0;

    for (const courseSlug of COURSE_SLUGS) {
      const checkpoints = selectCourseProjectCheckpoints(courseSlug);
      const checkpointByLesson = new Map(
        checkpoints.map((checkpoint) => [checkpoint.lessonId, checkpoint]),
      );

      for (const lessonId of CANONICAL_LESSON_IDS[courseSlug]) {
        const expected = checkpointByLesson.get(lessonId) ?? null;
        expect(
          resolveCourseProjectCheckpoint(courseSlug, lessonId),
          `${courseSlug}/${lessonId}`,
        ).toBe(expected);
        expect(
          isCourseProjectCheckpointLesson(courseSlug, lessonId),
          `${courseSlug}/${lessonId}`,
        ).toBe(expected !== null);
        if (expected) selectedCount += 1;
      }

      expect(resolveCourseProjectCheckpoint(courseSlug, "not-canonical")).toBeNull();
      expect(isCourseProjectCheckpointLesson(courseSlug, "not-canonical")).toBe(false);
    }

    expect(selectedCount).toBe(50);
  });
});
