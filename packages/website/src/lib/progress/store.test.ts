import { describe, it, expect, beforeEach, beforeAll } from "vitest";

/** In-memory localStorage polyfill (some jsdom combos expose a no-op). */
function installLocalStoragePolyfill() {
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

import {
  UNIFIED_STORAGE_KEY,
  XP,
} from "./types";
import {
  LEGACY_AI_NATIVE_KEY,
  LEGACY_COURSE_KEY_PREFIX,
  LEGACY_KI_F_FLAT_KEY,
} from "./migrate";
import {
  markSectionRead,
  isSectionRead,
  markLessonCompleted,
  isLessonCompleted,
  getCompletedLessonsCount,
  saveLessonQuizScore,
  getLessonQuizScore,
  saveExerciseResult,
  getExerciseResult,
  saveWorkshopQuizResult,
  isWorkshopQuizPassed,
  markCapstoneSubmitted,
  isCapstoneSubmitted,
  isCertificateEligible,
  completeCheckpoint,
  isCheckpointDone,
  getXp,
  getStreak,
  getEarnedBadgeIds,
  getTotalCompletedLessons,
  getUnifiedState,
  getCourseSlice,
  rollStreak,
  resetCourse,
  resetAll,
  subscribe,
  __resetCacheForTests,
} from "./store";

describe("unified progress store", () => {
  beforeAll(() => {
    if (
      typeof window.localStorage === "undefined" ||
      typeof window.localStorage.setItem !== "function"
    ) {
      installLocalStoragePolyfill();
    }
  });

  beforeEach(() => {
    window.localStorage.clear();
    __resetCacheForTests();
  });

  describe("core read/write across courses", () => {
    it("tracks sections + lessons per course slug independently", () => {
      markSectionRead("ki-fuehrerschein", "l1", "s1");
      markLessonCompleted("eu-ai-act-kurs", "l1");
      expect(isSectionRead("ki-fuehrerschein", "l1", "s1")).toBe(true);
      expect(isSectionRead("eu-ai-act-kurs", "l1", "s1")).toBe(false);
      expect(isLessonCompleted("eu-ai-act-kurs", "l1")).toBe(true);
      expect(isLessonCompleted("ki-fuehrerschein", "l1")).toBe(false);
    });

    it("keeps lesson-quiz score monotonic (higher wins)", () => {
      saveLessonQuizScore("ai-native", "l1", 2, 4); // 0.5
      saveLessonQuizScore("ai-native", "l1", 1, 4); // 0.25 — ignored
      expect(getLessonQuizScore("ai-native", "l1")).toEqual({
        score: 2,
        total: 4,
      });
      saveLessonQuizScore("ai-native", "l1", 4, 4); // 1.0 — wins
      expect(getLessonQuizScore("ai-native", "l1")).toEqual({
        score: 4,
        total: 4,
      });
    });

    it("merges exercise results: higher score, sticky completion, attempts++", () => {
      saveExerciseResult("ai-native", "l1", {
        exerciseId: "ex1",
        kind: "exercise-fix-prompt",
        completed: true,
        score: 0.5,
        attempts: 1,
        completedAt: null,
        skipped: false,
      });
      saveExerciseResult("ai-native", "l1", {
        exerciseId: "ex1",
        kind: "exercise-fix-prompt",
        completed: false,
        score: 0.3,
        attempts: 1,
        completedAt: null,
        skipped: false,
      });
      const r = getExerciseResult("ai-native", "l1", "ex1");
      expect(r?.score).toBe(0.5);
      expect(r?.completed).toBe(true);
      expect(r?.attempts).toBe(2);
    });

    // plan 007 stage 5: summaries are capped in UTF-8 bytes at write time so a
    // single oversized AI summary can never blow the per-course-row DB budget.
    it("truncates an oversized exercise summary at write time (byte-based cap)", () => {
      const longSummary = "Über KI-Kompetenz und Verantwortung. ".repeat(50);
      saveExerciseResult("ai-native", "l1", {
        exerciseId: "ex2",
        kind: "exercise-fix-prompt",
        completed: true,
        score: 0.9,
        attempts: 1,
        completedAt: null,
        skipped: false,
        summary: longSummary,
      });
      const r = getExerciseResult("ai-native", "l1", "ex2");
      expect(r?.summary).toBeDefined();
      expect(new TextEncoder().encode(r?.summary ?? "").length).toBeLessThanOrEqual(500);
      expect(r?.summary?.length).toBeLessThan(longSummary.length);
    });

    it("keeps a short exercise summary unchanged", () => {
      saveExerciseResult("ai-native", "l1", {
        exerciseId: "ex3",
        kind: "exercise-fix-prompt",
        completed: true,
        score: 0.7,
        attempts: 1,
        completedAt: null,
        skipped: false,
        summary: "Gute Arbeit, weiter so.",
      });
      const r = getExerciseResult("ai-native", "l1", "ex3");
      expect(r?.summary).toBe("Gute Arbeit, weiter so.");
    });
  });

  describe("xp / badges accrual", () => {
    it("awards XP for sections, lessons, quiz pass and checkpoints", () => {
      markSectionRead("ki-fuehrerschein", "l1", "s1");
      expect(getXp()).toBe(XP.SECTION);
      markLessonCompleted("ki-fuehrerschein", "l1");
      expect(getXp()).toBe(XP.SECTION + XP.LESSON);
      completeCheckpoint("l1", "cp1");
      expect(getXp()).toBe(XP.SECTION + XP.LESSON + XP.CHECKPOINT);
      saveWorkshopQuizResult("ki-fuehrerschein", 90, true);
      expect(getXp()).toBe(
        XP.SECTION + XP.LESSON + XP.CHECKPOINT + XP.QUIZ_PASS,
      );
    });

    it("awards quiz-pass XP only once", () => {
      saveWorkshopQuizResult("ki-fuehrerschein", 90, true);
      const after = getXp();
      saveWorkshopQuizResult("ki-fuehrerschein", 95, true);
      expect(getXp()).toBe(after);
    });

    it("earns the first-light badge after one lesson, counted cross-course", () => {
      expect(getEarnedBadgeIds()).not.toContain("first-light");
      markLessonCompleted("ki-fuehrerschein", "l1");
      expect(getEarnedBadgeIds()).toContain("first-light");
      markLessonCompleted("eu-ai-act-kurs", "l1");
      markLessonCompleted("ai-native", "l1");
      expect(getTotalCompletedLessons()).toBe(3);
      expect(getEarnedBadgeIds()).toContain("apprentice");
    });

    it("ignores unknown imported-course slices when counting lesson badges", () => {
      const lesson = {
        sectionsRead: [],
        quizScore: null,
        quizTotal: null,
        completed: true,
        exercisesCompleted: {},
      };
      const slice = {
        lessons: {
          one: lesson,
          two: lesson,
          three: lesson,
        },
        workshopQuiz: { passed: false, score: 0, completedAt: null },
        capstoneSubmitted: false,
        startedAt: "2026-06-18T00:00:00.000Z",
        lastActivity: "2026-06-18T00:00:00.000Z",
      };
      window.localStorage.setItem(
        UNIFIED_STORAGE_KEY,
        JSON.stringify({
          schemaVersion: 2,
          courses: {
            claude: slice,
            "data-science": slice,
          },
          xp: 0,
          checkpoints: {},
          badges: {},
          streak: { days: 0, last: null },
          lastActivity: "2026-06-18T00:00:00.000Z",
        }),
      );
      __resetCacheForTests();
      expect(getTotalCompletedLessons()).toBe(0);
      expect(getEarnedBadgeIds()).toEqual([]);

      markLessonCompleted("ki-fuehrerschein", "native-lesson");
      expect(getTotalCompletedLessons()).toBe(1);
      expect(getEarnedBadgeIds()).toContain("first-light");
      expect(getEarnedBadgeIds()).not.toContain("apprentice");
    });
  });

  describe("certificate eligibility (shared course architecture)", () => {
    it("is ineligible by default", () => {
      expect(isCertificateEligible("ai-native")).toBe(false);
      expect(isCertificateEligible("ki-fuehrerschein")).toBe(false);
    });

    it("becomes eligible after passing the workshop quiz", () => {
      saveWorkshopQuizResult("ki-fuehrerschein", 0.8, true);
      expect(isWorkshopQuizPassed("ki-fuehrerschein")).toBe(true);
      expect(isCertificateEligible("ki-fuehrerschein")).toBe(true);
    });

    it("becomes eligible after submitting the capstone, even without passing the quiz", () => {
      expect(isCapstoneSubmitted("ai-native")).toBe(false);
      markCapstoneSubmitted("ai-native");
      expect(isCapstoneSubmitted("ai-native")).toBe(true);
      expect(isWorkshopQuizPassed("ai-native")).toBe(false);
      expect(isCertificateEligible("ai-native")).toBe(true);
    });

    it("keeps eligibility per-course independent", () => {
      markCapstoneSubmitted("ai-native");
      expect(isCertificateEligible("ai-native")).toBe(true);
      expect(isCertificateEligible("eu-ai-act-kurs")).toBe(false);
    });

    it("markCapstoneSubmitted is idempotent", () => {
      markCapstoneSubmitted("ai-native");
      markCapstoneSubmitted("ai-native");
      expect(isCapstoneSubmitted("ai-native")).toBe(true);
    });

    // performance hardening: full course completion is a third path to the cert.
    it("becomes eligible when every catalog lesson is completed (no quiz)", () => {
      for (let i = 1; i <= 19; i += 1) {
        markLessonCompleted("ki-fuehrerschein", `block-lesson-${i}`);
      }
      expect(isWorkshopQuizPassed("ki-fuehrerschein")).toBe(false);
      expect(isCertificateEligible("ki-fuehrerschein")).toBe(true);
    });

    it("stays ineligible below the full catalog lesson count", () => {
      for (let i = 1; i <= 17; i += 1) {
        markLessonCompleted("ki-fuehrerschein", `block-lesson-${i}`);
      }
      expect(isCertificateEligible("ki-fuehrerschein")).toBe(false);
    });

    // plan 007 stage 4: the all-lessons-completed fallback used to resolve
    // totalLessons from COURSE_CATALOG only, so it was silently unreachable
    // for any course outside the 4-course native spine. "codex" (12 lessons,
    // ALL_COURSE_CATALOG) exercises a slug outside that spine.
    it("resolves totalLessons from the unified catalog for a course outside the native spine", () => {
      for (let i = 1; i <= 12; i += 1) {
        markLessonCompleted("codex", `lesson-${i}`);
      }
      expect(isWorkshopQuizPassed("codex")).toBe(false);
      expect(isCertificateEligible("codex")).toBe(true);
    });

    it("stays ineligible below the full lesson count for a non-native-spine course", () => {
      for (let i = 1; i <= 11; i += 1) {
        markLessonCompleted("codex", `lesson-${i}`);
      }
      expect(isCertificateEligible("codex")).toBe(false);
    });

    it("never throws on corrupted storage, reads as not eligible", () => {
      window.localStorage.setItem(
        UNIFIED_STORAGE_KEY,
        '{"schemaVersion":2,"courses":{"ki-fuehrerschein":{"lessons":null,"workshopQuiz":null,"capstoneSubmitted":false}}}',
      );
      expect(() => isCertificateEligible("ki-fuehrerschein")).not.toThrow();
      expect(typeof isCertificateEligible("ki-fuehrerschein")).toBe("boolean");
    });
  });

  describe("checkpoints", () => {
    it("is idempotent and awards XP only on first completion", () => {
      expect(isCheckpointDone("l1", "cp1")).toBe(false);
      expect(completeCheckpoint("l1", "cp1")).toBe(true);
      expect(isCheckpointDone("l1", "cp1")).toBe(true);
      const xpAfter = getXp();
      expect(completeCheckpoint("l1", "cp1")).toBe(false);
      expect(getXp()).toBe(xpAfter);
    });
  });

  describe("streak roll-forward (pure)", () => {
    it("increments on a consecutive day", () => {
      expect(rollStreak({ days: 2, last: "2026-06-02" }, "2026-06-03")).toEqual(
        { days: 3, last: "2026-06-03" },
      );
    });
    it("resets to 1 after a gap", () => {
      expect(rollStreak({ days: 5, last: "2026-05-30" }, "2026-06-03")).toEqual(
        { days: 1, last: "2026-06-03" },
      );
    });
    it("is a no-op on the same day", () => {
      const s = { days: 4, last: "2026-06-03" };
      expect(rollStreak(s, "2026-06-03")).toBe(s);
    });
    it("starts at 1 from a fresh streak", () => {
      const s = getStreak();
      expect(s.days).toBeGreaterThanOrEqual(1);
    });
  });

  describe("cross-tab sync via storage events", () => {
    it("drops the cache and re-reads when the unified key changes in another tab", () => {
      markLessonCompleted("ki-fuehrerschein", "l1");
      // Simulate another tab writing a payload with a different lesson done.
      const foreign = JSON.parse(
        window.localStorage.getItem(UNIFIED_STORAGE_KEY) as string,
      );
      foreign.courses["ki-fuehrerschein"].lessons["l2"] = {
        sectionsRead: [],
        quizScore: null,
        quizTotal: null,
        completed: true,
        exercisesCompleted: {},
      };
      window.localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(foreign));
      window.dispatchEvent(
        new StorageEvent("storage", { key: UNIFIED_STORAGE_KEY }),
      );
      expect(isLessonCompleted("ki-fuehrerschein", "l2")).toBe(true);
    });

    it("notifies subscribers on local writes", () => {
      let calls = 0;
      const unsub = subscribe(() => {
        calls += 1;
      });
      const initial = calls; // immediate emit on subscribe
      markLessonCompleted("ai-native", "l1");
      expect(calls).toBeGreaterThan(initial);
      unsub();
    });
  });

  describe("reset", () => {
    it("resetCourse clears one slice but keeps gamification + other courses", () => {
      markLessonCompleted("ki-fuehrerschein", "l1");
      markLessonCompleted("eu-ai-act-kurs", "l1");
      const xpBefore = getXp();
      resetCourse("ki-fuehrerschein");
      expect(isLessonCompleted("ki-fuehrerschein", "l1")).toBe(false);
      expect(isLessonCompleted("eu-ai-act-kurs", "l1")).toBe(true);
      expect(getXp()).toBe(xpBefore); // xp ledger untouched
    });

    it("resetAll wipes everything", () => {
      markLessonCompleted("ki-fuehrerschein", "l1");
      completeCheckpoint("l1", "cp1");
      resetAll();
      expect(getXp()).toBe(0);
      expect(getEarnedBadgeIds()).toHaveLength(0);
      expect(getCompletedLessonsCount("ki-fuehrerschein")).toBe(0);
    });
  });

  describe("getUnifiedState shape", () => {
    it("exposes a v3 root with courses + gamification ledger", () => {
      markLessonCompleted("ai-native", "l1");
      const s = getUnifiedState();
      expect(s.schemaVersion).toBe(3);
      expect(s.courses["ai-native"]).toBeDefined();
      expect(getCourseSlice("ai-native").lessons["l1"].completed).toBe(true);
    });
  });

  describe("v2->v3 migration step wired into the read path (plan 007 stage 5)", () => {
    it("truncates a pre-existing oversized exercise summary on load", () => {
      const longSummary = "Über KI-Kompetenz und Verantwortung. ".repeat(50);
      window.localStorage.setItem(
        UNIFIED_STORAGE_KEY,
        JSON.stringify({
          schemaVersion: 2,
          courses: {
            "ai-native": {
              lessons: {
                l1: {
                  sectionsRead: [],
                  quizScore: null,
                  quizTotal: null,
                  completed: false,
                  exercisesCompleted: {
                    ex1: {
                      exerciseId: "ex1",
                      kind: "exercise-fix-prompt",
                      completed: true,
                      score: 0.9,
                      attempts: 1,
                      completedAt: null,
                      skipped: false,
                      summary: longSummary,
                    },
                  },
                },
              },
              workshopQuiz: { passed: false, score: 0, completedAt: null },
              capstoneSubmitted: false,
              startedAt: "2026-01-01T00:00:00.000Z",
              lastActivity: "2026-01-01T00:00:00.000Z",
            },
          },
          xp: 0,
          checkpoints: {},
          badges: {},
          streak: { days: 0, last: null },
          lastActivity: "2026-01-01T00:00:00.000Z",
        }),
      );
      __resetCacheForTests();
      const r = getExerciseResult("ai-native", "l1", "ex1");
      expect(r?.summary).toBeDefined();
      expect(new TextEncoder().encode(r?.summary ?? "").length).toBeLessThanOrEqual(500);
      expect(getUnifiedState().schemaVersion).toBe(3);
    });
  });
});

// ─── Golden-file migration tests (real saved payloads, NEVER wipe) ──

describe("forward migration from legacy schemas (golden files)", () => {
  beforeAll(() => {
    if (
      typeof window.localStorage === "undefined" ||
      typeof window.localStorage.setItem !== "function"
    ) {
      installLocalStoragePolyfill();
    }
  });

  beforeEach(() => {
    window.localStorage.clear();
    __resetCacheForTests();
  });

  /** Representative real KI-Führerschein payload (course-progress::<slug>). */
  const GOLDEN_KI_F = {
    lessons: {
      block_1_lesson_1: {
        sectionsRead: ["sec_intro", "sec_main"],
        quizScore: 0.8,
        quizTotal: 5,
        completed: true,
      },
      block_2_lesson_1: {
        sectionsRead: ["sec_intro"],
        quizScore: null,
        quizTotal: null,
        completed: false,
      },
    },
    workshopQuiz: {
      passed: true,
      score: 92,
      completedAt: "2026-03-15T09:30:00.000Z",
    },
    startedAt: "2026-03-10T08:00:00.000Z",
    lastActivity: "2026-03-15T09:30:00.000Z",
  };

  /** Representative real AI-Native payload (ai-native-progress-v1, schema 1). */
  const GOLDEN_AI_NATIVE = {
    schemaVersion: 1,
    lessons: {
      modul_1_lesson_1: {
        sectionsRead: ["sec_1", "sec_2"],
        quizScore: 1,
        quizTotal: 3,
        completed: true,
        exercisesCompleted: {
          ex_fix: {
            exerciseId: "ex_fix",
            kind: "exercise-fix-prompt",
            completed: true,
            score: 0.9,
            attempts: 2,
            completedAt: "2026-04-01T12:00:00.000Z",
            skipped: false,
          },
        },
      },
    },
    capstoneSubmitted: true,
    premiumUnlocked: false,
    startedAt: "2026-04-01T10:00:00.000Z",
    lastActivity: "2026-04-01T12:00:00.000Z",
  };

  it("migrates a KI-Führerschein payload forward, preserving it", () => {
    window.localStorage.setItem(
      `${LEGACY_COURSE_KEY_PREFIX}ki-fuehrerschein`,
      JSON.stringify(GOLDEN_KI_F),
    );
    __resetCacheForTests();
    const slice = getCourseSlice("ki-fuehrerschein");
    expect(slice.lessons["block_1_lesson_1"].completed).toBe(true);
    expect(slice.lessons["block_1_lesson_1"].sectionsRead).toEqual([
      "sec_intro",
      "sec_main",
    ]);
    expect(isWorkshopQuizPassed("ki-fuehrerschein")).toBe(true);
    // startedAt is carried forward, not reset to "now".
    expect(slice.startedAt).toBe("2026-03-10T08:00:00.000Z");
    // Legacy key NOT wiped.
    expect(
      window.localStorage.getItem(`${LEGACY_COURSE_KEY_PREFIX}ki-fuehrerschein`),
    ).not.toBe(null);
  });

  it("migrates an AI-Native payload forward, preserving exercises", () => {
    window.localStorage.setItem(LEGACY_AI_NATIVE_KEY, JSON.stringify(GOLDEN_AI_NATIVE));
    __resetCacheForTests();
    const slice = getCourseSlice("ai-native");
    expect(slice.lessons["modul_1_lesson_1"].completed).toBe(true);
    expect(slice.capstoneSubmitted).toBe(true);
    const ex =
      slice.lessons["modul_1_lesson_1"].exercisesCompleted["ex_fix"];
    expect(ex.score).toBe(0.9);
    expect(ex.attempts).toBe(2);
    expect(window.localStorage.getItem(LEGACY_AI_NATIVE_KEY)).not.toBe(null);
  });

  it("migrates BOTH legacy schemas together into one store", () => {
    window.localStorage.setItem(
      `${LEGACY_COURSE_KEY_PREFIX}ki-fuehrerschein`,
      JSON.stringify(GOLDEN_KI_F),
    );
    window.localStorage.setItem(LEGACY_AI_NATIVE_KEY, JSON.stringify(GOLDEN_AI_NATIVE));
    __resetCacheForTests();
    const s = getUnifiedState();
    expect(Object.keys(s.courses).sort()).toEqual([
      "ai-native",
      "ki-fuehrerschein",
    ]);
    expect(getTotalCompletedLessons()).toBe(2);
    // Unified payload persisted under the v2 key.
    expect(window.localStorage.getItem(UNIFIED_STORAGE_KEY)).not.toBe(null);
  });

  it("migrates the oldest flat ki-fuehrerschein-progress key", () => {
    window.localStorage.setItem(LEGACY_KI_F_FLAT_KEY, JSON.stringify(GOLDEN_KI_F));
    __resetCacheForTests();
    expect(isLessonCompleted("ki-fuehrerschein", "block_1_lesson_1")).toBe(
      true,
    );
  });

  it("prefers an existing unified payload over legacy keys", () => {
    // Both present: unified wins, legacy left alone.
    window.localStorage.setItem(
      `${LEGACY_COURSE_KEY_PREFIX}ki-fuehrerschein`,
      JSON.stringify(GOLDEN_KI_F),
    );
    window.localStorage.setItem(
      UNIFIED_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        courses: {},
        xp: 999,
        checkpoints: {},
        badges: {},
        streak: { days: 1, last: "2026-06-03" },
        lastActivity: "2026-06-03T00:00:00.000Z",
      }),
    );
    __resetCacheForTests();
    expect(getXp()).toBe(999);
    // Legacy NOT re-migrated on top of the unified store.
    expect(isLessonCompleted("ki-fuehrerschein", "block_1_lesson_1")).toBe(
      false,
    );
  });

  it("recovers from a corrupt unified payload via legacy keys (no wipe)", () => {
    window.localStorage.setItem(UNIFIED_STORAGE_KEY, "{not valid json");
    window.localStorage.setItem(
      `${LEGACY_COURSE_KEY_PREFIX}ki-fuehrerschein`,
      JSON.stringify(GOLDEN_KI_F),
    );
    __resetCacheForTests();
    expect(isLessonCompleted("ki-fuehrerschein", "block_1_lesson_1")).toBe(
      true,
    );
  });

  it("skips a corrupt legacy slice without throwing (defensive coercion)", () => {
    window.localStorage.setItem(
      `${LEGACY_COURSE_KEY_PREFIX}ki-fuehrerschein`,
      JSON.stringify({ lessons: "not-an-object" }),
    );
    __resetCacheForTests();
    expect(() => getUnifiedState()).not.toThrow();
    expect(getCompletedLessonsCount("ki-fuehrerschein")).toBe(0);
  });
});
