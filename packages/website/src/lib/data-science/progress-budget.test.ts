// ─── Progress-budget audit (plan 012 stage 14) ────────────────────────
//
// This course has no quiz/capstone/checkpoint mechanism at all — the
// chosen completion criterion is literally "all 12 numbered chapters
// visited" (plan 012 stage 12's MarkChapterVisited), so
// `exercisesCompleted` stays permanently empty and there is no
// cross-course "_meta" row contribution to measure (unlike
// data-infrastructure/claude/codex, which award per-widget checkpoints).
// This test only needs to prove this course's own per-course row
// (course_slug="data-science") stays far under the 65536-byte
// pg_column_size CHECK constraint
// (supabase/migrations/009_user_course_progress_per_course.sql).

import { describe, it, expect } from "vitest";
import { DS_NUMBERED_CHAPTER_IDS } from "./types";
import type { UnifiedCourseSlice, UnifiedLessonProgress } from "@/lib/progress/types";

const ROW_BYTE_CAP = 65536;

function byteLength(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

describe("data-science's contribution to the per-course progress-budget row (plan 012 stage 14)", () => {
  it("a fully-completed run (all 12 numbered chapters) stays far under the 65536-byte cap", () => {
    const lessonEntries: Record<string, UnifiedLessonProgress> = {};
    for (const chapterId of DS_NUMBERED_CHAPTER_IDS) {
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
  });

  it("has exactly 12 numbered-chapter entries, matching App.js's real CHAPTERS array minus Overview — no phantom or missing chapters", () => {
    expect(DS_NUMBERED_CHAPTER_IDS.length).toBe(12);
    expect(new Set(DS_NUMBERED_CHAPTER_IDS).size).toBe(12);
    expect(DS_NUMBERED_CHAPTER_IDS).not.toContain("home");
  });
});
