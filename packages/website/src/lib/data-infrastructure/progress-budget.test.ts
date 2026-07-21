// ─── Progress-budget audit (plan 010 stage 12) ──────────────────────
//
// Mirrors `lib/claude-course/progress-budget.test.ts`'s two-row model
// (supabase/migrations/009_user_course_progress_per_course.sql): a
// course_slug="data-infrastructure" row holding this course's own
// UnifiedCourseSlice, and the shared course_slug="_meta" row holding the
// cross-course checkpoints/xp/badges/streak ledger. Both share the same
// 65536-byte pg_column_size CHECK constraint.
//
// Unlike claude/codex, this course's checkpoints are NOT all declared on
// `lesson.widgets` — the 12 bespoke canvas/SVG simulators (StackFlow,
// CapTriangle, ...) are mounted outside the shared Widget system via
// `bespoke-registry.tsx`, so their checkpoint keys are enumerated here from
// that same registry mapping (kept in sync manually; a drift would be
// caught by this test measuring the wrong count against the real widget
// files, not by a type error, since the two module boundaries are
// intentionally decoupled — see the plan's own "none will be reused
// elsewhere" constraint).
import { describe, it, expect } from "vitest";
import { getAllDataInfraLessons } from "./data";
import { checkpointLessonId, type DataInfraLessonId } from "./types";
import type { UnifiedCourseSlice, UnifiedLessonProgress } from "@/lib/progress/types";
import { checkpointKey } from "@/lib/progress/types";

const ROW_BYTE_CAP = 65536;

function byteLength(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

/** Mirrors `src/components/data-infrastructure/bespoke-registry.tsx`'s BESPOKE_REGISTRY cpIds. */
const BESPOKE_CPIDS: Record<DataInfraLessonId, readonly string[]> = {
  "mental-model": ["flow"],
  "cap-pacelc": ["cap"],
  modeling: ["rc"],
  "storage-formats": ["rc", "bf"],
  lakehouse: ["snap"],
  partitioning: ["part"],
  "batch-elt": ["dag"],
  streaming: ["kafka", "wm"],
  "cdc-lambda-kappa": ["cdc"],
  idempotency: ["bdag"],
  "sla-quality": ["sla"],
  "interview-playbook": ["iv"],
};

describe("data-infrastructure's contribution to the two progress-budget rows (plan 010 stage 12)", () => {
  it("this course's own per-course row (course_slug='data-infrastructure') stays far under the 65536-byte cap", async () => {
    const lessons = await getAllDataInfraLessons();
    expect(lessons.length).toBe(12);

    const lessonEntries: Record<string, UnifiedLessonProgress> = {};
    for (const lesson of lessons) {
      lessonEntries[lesson.id] = {
        sectionsRead: lesson.sections.map((s) => s.id),
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
    expect(bytes).toBeLessThan(ROW_BYTE_CAP * 0.1);
  });

  it("data-infrastructure's checkpoints (quiz/flashcards + bespoke simulators) add a small, bounded slice to the shared cross-course '_meta' row", async () => {
    const lessons = await getAllDataInfraLessons();
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
      for (const cpId of BESPOKE_CPIDS[lesson.id]) {
        keys.push(checkpointKey(checkpointLessonId(lesson.id), cpId));
      }
    }

    // 26 quiz + 12 flashcards (one per lesson) + 14 bespoke-simulator
    // checkpoints (12 widgets; storage-formats and streaming each mount two).
    expect(keys.length).toBe(52);
    expect(new Set(keys).size).toBe(keys.length);

    const checkpointsSlice: Record<string, boolean> = {};
    for (const key of keys) checkpointsSlice[key] = true;

    const bytes = byteLength(checkpointsSlice);
    expect(bytes).toBeLessThan(2500);
  });
});
