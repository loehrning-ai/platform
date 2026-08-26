// ─── Progress-budget audit ───────────────────────
//
// The learner records one versioned transfer checkpoint per chapter. The
// response stays ephemeral, so `exercisesCompleted` remains empty. This audit
// covers both the per-course row and the compact cross-course checkpoint map.

import { describe, it, expect } from "vitest";
import { DEF_CHAPTER_IDS } from "./types";
import { lessonCompletionEvidenceCheckpointId } from "@/lib/courses/completion";
import {
  checkpointKey,
  type UnifiedCourseSlice,
  type UnifiedLessonProgress,
} from "@/lib/progress/types";

const ROW_BYTE_CAP = 65536;

function byteLength(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

describe("data-engineering-fundamentals's contribution to the per-course progress-budget row ", () => {
  it("a fully-completed run (all 12 chapters) stays far under the 65536-byte cap", () => {
    const lessonEntries: Record<string, UnifiedLessonProgress> = {};
    for (const chapterId of DEF_CHAPTER_IDS) {
      lessonEntries[chapterId] = {
        sectionsRead: [],
        quizScore: null,
        quizTotal: null,
        completed: true,
        exercisesCompleted: {},
      };
    }

    const slice: UnifiedCourseSlice = {
      lessons: lessonEntries,
      workshopQuiz: { passed: false, score: 0, completedAt: null },
      capstoneSubmitted: false,
      startedAt: "2026-07-21T00:00:00.000Z",
      lastActivity: "2026-07-21T00:00:00.000Z",
    };

    const bytes = byteLength(slice);
    expect(bytes).toBeLessThan(ROW_BYTE_CAP * 0.05);

    const checkpointId = lessonCompletionEvidenceCheckpointId(
      "data-engineering-fundamentals",
    );
    const checkpoints = Object.fromEntries(
      DEF_CHAPTER_IDS.map((chapterId) => [
        checkpointKey(chapterId, checkpointId),
        true,
      ]),
    );
    expect(byteLength(checkpoints)).toBeLessThan(ROW_BYTE_CAP * 0.05);
  });

  it("has exactly 12 chapter entries, matching the real CHAPTERS array — no phantom or missing chapters", () => {
    expect(DEF_CHAPTER_IDS.length).toBe(12);
    expect(new Set(DEF_CHAPTER_IDS).size).toBe(12);
  });
});
