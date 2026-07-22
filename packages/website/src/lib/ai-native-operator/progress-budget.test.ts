// ─── Progress-budget audit ──────────────────────
//
// Two DB rows can grow from a learner working through this course
// ('s per-course-row redesign, supabase/migrations/
// 009_user_course_progress_per_course.sql):
//   1. course_slug = "ai-native-operator" -> holds only this course's
//      UnifiedCourseSlice (lessons/workshopQuiz/capstoneSubmitted/
//      startedAt/lastActivity). It does NOT hold checkpoints:
//      `checkpoints` lives on UnifiedProgress itself, one level up, not on
//      UnifiedCourseSlice (src/lib/progress/types.ts).
//   2. course_slug = "_meta" -> the cross-course ledger (xp/checkpoints/
//      badges/streak), shared by every course a learner has touched
//      (src/lib/progress/server-sync.ts's META_ROW_COURSE_SLUG).
// Both rows share the same 65536-byte `pg_column_size` CHECK constraint.
// This course's Stage 6 decision (checkpoint-boolean completion only, no
// AI-feedback text, no exercisesCompleted usage at all) is exactly why
// this course's own row is small: no sectionsRead tracking either (this
// course's reader has no per-section "mark as read" affordance, unlike the
// native courses/claude/codex — the source itself had none).
import { describe, it, expect, beforeEach } from "vitest";
import { getAllLessons } from "./data";
import { lessonProgressKey } from "./types";
import type { UnifiedCourseSlice, UnifiedLessonProgress, UnifiedProgress } from "@/lib/progress/types";
import { checkpointKey, UNIFIED_SCHEMA_VERSION } from "@/lib/progress/types";
import { truncateExerciseSummaries } from "@/lib/progress/migrate";
import {
  __resetCacheForTests,
  completeCheckpoint,
  getCourseSlice,
  isCheckpointDone,
  markLessonCompleted,
  replaceUnifiedState,
} from "@/lib/progress/store";

function installLocalStoragePolyfill(): void {
  const store = new Map<string, string>();
  const polyfill: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: polyfill,
    writable: true,
    configurable: true,
  });
}

const ROW_BYTE_CAP = 65536;

function byteLength(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

describe("ai-native-operator's contribution to the two progress-budget rows ", () => {
  beforeEach(() => {
    if (
      typeof window.localStorage === "undefined" ||
      typeof window.localStorage.setItem !== "function"
    ) {
      installLocalStoragePolyfill();
    }
    window.localStorage.clear();
    __resetCacheForTests();
  });

  it("this course's own per-course row (course_slug='ai-native-operator') stays far under the 65536-byte cap", async () => {
    const lessons = await getAllLessons();
    expect(lessons.length).toBe(39);

    const lessonEntries: Record<string, UnifiedLessonProgress> = {};
    for (const lesson of lessons) {
      lessonEntries[lesson.id] = {
        // This course's reader has no per-section "mark as read" UI (the
        // source itself has none), so sectionsRead is always empty.
        sectionsRead: [],
        // saveLessonQuizScore is never called for this course: the 9
        // knowledge-check lessons' questions are checkpoint-driven TIER_A
        // quiz widgets, not the lesson.quiz scoring path.
        quizScore: null,
        quizTotal: null,
        completed: true,
        // Always empty: every exercise is TIER_A-checkpoint-driven
        // (useCheckpoint), never saveExerciseResult.
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
    // Proposed budget: comfortably under 5KB ( Done Criteria),
    // itself comfortably inside the 65536-byte per-course cap.
    expect(bytes).toBeLessThan(5 * 1024);
  });

  it("this course's checkpoints (30 exercises + 22 quiz questions = 52) add a small, bounded slice to the shared cross-course '_meta' row", async () => {
    const lessons = await getAllLessons();
    const keys: string[] = [];

    for (const lesson of lessons) {
      // Reading lessons: one exercise widget each, keyed by its own
      // props.lessonId/cpId (see lib/ai-native-operator/widget-wiring.test.ts).
      for (const widget of lesson.widgets ?? []) {
        const props = widget.props ?? {};
        const lessonId = props.lessonId;
        const cpId = props.cpId;
        if (typeof lessonId === "string" && typeof cpId === "string") {
          keys.push(checkpointKey(lessonId, cpId));
        }
      }
      // Quiz-kind lessons: one "quiz" widget per pooled question, keyed by
      // lessonProgressKey(moduleId, lessonNumber) + the question's own id
      // (see components/ai-native-operator/lesson-reader.tsx).
      if (lesson.kind === "quiz") {
        for (const question of lesson.quiz) {
          keys.push(checkpointKey(lessonProgressKey(lesson.moduleId, lesson.lessonNumber), question.id));
        }
      }
    }

    expect(keys.length).toBe(52);
    expect(new Set(keys).size).toBe(keys.length); // no two widgets share a key

    const checkpointsSlice: Record<string, boolean> = {};
    for (const key of keys) checkpointsSlice[key] = true;

    const bytes = byteLength(checkpointsSlice);
    // The "_meta" row also carries xp, badges, streak, and every OTHER
    // course's checkpoints, so this is this course's marginal contribution,
    // not the row's total size — comfortable headroom even summed across
    // every course in the catalog.
    expect(bytes).toBeLessThan(2500);
  });

  it("the v2->v3 migrator round-trips a progress blob including this course's slice without data loss", async () => {
    const lessons = await getAllLessons();
    const lessonEntries: Record<string, UnifiedLessonProgress> = {};
    for (const lesson of lessons) {
      lessonEntries[lesson.id] = {
        sectionsRead: [],
        quizScore: null,
        quizTotal: null,
        completed: true,
        exercisesCompleted: {},
      };
    }
    const slice: UnifiedCourseSlice = {
      lessons: lessonEntries,
      workshopQuiz: { passed: true, score: 0.95, completedAt: "2026-07-21T00:00:00.000Z" },
      capstoneSubmitted: false,
      startedAt: "2026-07-21T00:00:00.000Z",
      lastActivity: "2026-07-21T00:00:00.000Z",
    };
    const progress: UnifiedProgress = {
      schemaVersion: UNIFIED_SCHEMA_VERSION,
      courses: { "ai-native-operator": slice },
      xp: 520,
      checkpoints: { "mindset/1::exercise": true },
      badges: {},
      streak: { days: 1, last: "2026-07-21" },
      lastActivity: "2026-07-21T00:00:00.000Z",
    };

    // Exercises the real v2->v3 migration step (store.ts's parseUnified
    // calls this on every read), not a hand-rolled JSON round-trip.
    const migrated = truncateExerciseSummaries(progress);
    expect(migrated.courses["ai-native-operator"]).toEqual(slice);
    expect(Object.keys(migrated.courses["ai-native-operator"]!.lessons)).toHaveLength(39);

    // Round-trip through the real store API (replaceUnifiedState mirrors a
    // trusted server-sync payload landing in the local cache).
    replaceUnifiedState(migrated);
    const readBack = getCourseSlice("ai-native-operator");
    expect(readBack.lessons["mindset/1"].completed).toBe(true);
    expect(Object.keys(readBack.lessons)).toHaveLength(39);
    expect(readBack.workshopQuiz.passed).toBe(true);
    expect(readBack.workshopQuiz.score).toBe(0.95);

    // A subsequent checkpoint write still resolves against the restored state.
    expect(isCheckpointDone("mindset/1", "exercise")).toBe(true);
    completeCheckpoint("engineering/3", "exercise");
    expect(isCheckpointDone("engineering/3", "exercise")).toBe(true);
    markLessonCompleted("ai-native-operator", "governance/4");
    expect(getCourseSlice("ai-native-operator").lessons["governance/4"]?.completed).toBe(true);
  });
});
