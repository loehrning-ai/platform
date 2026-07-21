// ─── Progress-budget audit (plan 008 stage 12) ──────────────────────
//
// Two DB rows can grow from a learner working through this course
// (plan 007 stage 5's per-course-row redesign, supabase/migrations/
// 009_user_course_progress_per_course.sql):
//   1. course_slug = "claude"  -> holds only this course's UnifiedCourseSlice
//      (lessons/workshopQuiz/capstoneSubmitted/startedAt/lastActivity). It
//      does NOT hold checkpoints: `checkpoints` lives on UnifiedProgress
//      itself, one level up, not on UnifiedCourseSlice (src/lib/progress/
//      types.ts).
//   2. course_slug = "_meta"  -> the cross-course ledger (xp/checkpoints/
//      badges/streak), shared by every course a learner has touched
//      (src/lib/progress/server-sync.ts's META_ROW_COURSE_SLUG).
// Both rows share the same 65536-byte `pg_column_size` CHECK constraint.
// This suite pins worst-case serialized sizes for both, computed from the
// real lesson content (not hand counted), so a future content edit that
// blows the budget fails loudly here instead of at a learner's INSERT.
import { describe, it, expect } from "vitest";
import { getAllClaudeLessons } from "./data";
import type { UnifiedCourseSlice, UnifiedLessonProgress } from "@/lib/progress/types";
import { checkpointKey } from "@/lib/progress/types";

const ROW_BYTE_CAP = 65536;

function byteLength(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

describe("claude course's contribution to the two progress-budget rows (plan 008 stage 12)", () => {
  it("this course's own per-course row (course_slug='claude') stays far under the 65536-byte cap", async () => {
    const lessons = await getAllClaudeLessons();
    expect(lessons.length).toBe(12);

    const lessonEntries: Record<string, UnifiedLessonProgress> = {};
    for (const lesson of lessons) {
      lessonEntries[lesson.id] = {
        // Worst case: every section marked read.
        sectionsRead: lesson.sections.map((s) => s.id),
        quizScore: 100,
        quizTotal: 100,
        completed: true,
        // Always empty for claude: its checkpoints are Tier-A/claude-widget
        // driven, awarded through the top-level UnifiedProgress.checkpoints
        // ledger, not through exercisesCompleted (that field is only
        // populated by AI-Native's graded exercises).
        exercisesCompleted: {},
      };
    }

    const slice: UnifiedCourseSlice = {
      lessons: lessonEntries,
      workshopQuiz: { passed: true, score: 100, completedAt: "2026-07-21T00:00:00.000Z" },
      capstoneSubmitted: false,
      startedAt: "2026-07-21T00:00:00.000Z",
      lastActivity: "2026-07-21T00:00:00.000Z",
    };

    const bytes = byteLength(slice);
    // Real worst case lands around 2-3 KB; assert well under 10% of the cap
    // so the test still fails loudly long before the row ever gets close.
    expect(bytes).toBeLessThan(ROW_BYTE_CAP * 0.1);
  });

  it("claude's checkpoints add a small, bounded slice to the shared cross-course '_meta' row", async () => {
    const lessons = await getAllClaudeLessons();
    const keys: string[] = [];
    for (const lesson of lessons) {
      for (const widget of lesson.widgets ?? []) {
        const props = widget.props ?? {};
        const lessonId = props.lessonId;
        const cpId = props.cpId;
        if (typeof lessonId === "string" && typeof cpId === "string") {
          keys.push(checkpointKey(lessonId, cpId));
        }
      }
    }

    // Documents the real count (46), which exceeds the plan's original
    // "~34-40" estimate, see plans/008-claude.md Stage 12 note. Every
    // lesson widget that awards a checkpoint declares both lessonId + cpId,
    // so this reflects the actual awarding surface, not a hand-maintained list.
    expect(keys.length).toBe(46);
    expect(new Set(keys).size).toBe(keys.length); // no two widgets share a key

    const checkpointsSlice: Record<string, boolean> = {};
    for (const key of keys) checkpointsSlice[key] = true;

    const bytes = byteLength(checkpointsSlice);
    // ~970 bytes for all 46 entries. The "_meta" row also carries xp,
    // badges, streak, and every OTHER course's checkpoints, so this is
    // claude's marginal contribution, not the row's total size, but at
    // <1.5 KB it leaves generous room even summed across every course in
    // the catalog (10 courses x ~1.5 KB << 65536 bytes).
    expect(bytes).toBeLessThan(1500);
  });
});
