import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";

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

import { UNIFIED_STORAGE_KEY, XP, type UnifiedProgress } from "./types";
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
  saveExerciseResultWithCheckpoint,
  getExerciseResult,
  saveWorkshopQuizResult,
  getWorkshopQuizResult,
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
  getOverallProgress,
  getUnifiedState,
  replaceUnifiedState,
  getCourseSlice,
  localDateKey,
  rollStreak,
  resetCourse,
  resetAll,
  clearAllLocalLearningData,
  subscribe,
  activateAccountProgress,
  activateAnonymousProgress,
  activateUnknownProgress,
  __resetCacheForTests,
} from "./store";
import { isAppliedProjectCompleted } from "@/lib/course-projects/applied-completion";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import { getCourseProjectIdentity } from "@/lib/course-projects/identity";
import { serializeCourseProjectProgress } from "@/lib/course-projects/persistence";
import { verifiedCourseProjectArtifact } from "@/lib/course-projects/test-artifact";
import {
  getCourseProjectDraftStorageKey,
  getLessonMissionStorageKey,
} from "@/lib/course-projects/storage-keys";
import {
  getOwnedLocalLearningItem,
  prepareAccountLearningStorage,
  setOwnedLocalLearningItem,
  subscribeLearningOwner,
} from "./browser-learning-storage";

const KF_LESSON_1 = "block_1_lesson_1";
const KF_LESSON_2 = "block_1_lesson_2";
const KF_SECTION_1 = "block_1_lesson_1_section_1";
const EU_LESSON_1 = "block_1_lesson_1";
const AI_NATIVE_LESSON_1 = "modul_1_lesson_1";

describe("unified progress store", () => {
  beforeAll(() => {
    if (
      typeof window.localStorage === "undefined" ||
      typeof window.localStorage.setItem !== "function"
    ) {
      installLocalStoragePolyfill();
    }
  });

  beforeEach(async () => {
    window.localStorage.clear();
    Object.defineProperty(window.navigator, "locks", {
      configurable: true,
      value: {
        request: vi.fn(
          async (
            name: string,
            _options: LockOptions,
            callback: (lock: Lock | null) => unknown,
          ) =>
            callback({
              name,
              mode: "exclusive",
            } as Lock),
        ),
      },
    });
    __resetCacheForTests();
    expect(await prepareAccountLearningStorage()).toBe(true);
  });

  describe("core read/write across courses", () => {
    it("discards progress interactions while identity is unknown", () => {
      activateUnknownProgress();
      markLessonCompleted("ki-fuehrerschein", KF_LESSON_1);

      expect(isLessonCompleted("ki-fuehrerschein", KF_LESSON_1)).toBe(false);
      expect(window.localStorage.getItem(UNIFIED_STORAGE_KEY)).toBeNull();

      activateAccountProgress("account-b");
      expect(isLessonCompleted("ki-fuehrerschein", KF_LESSON_1)).toBe(false);

      activateAnonymousProgress();
      expect(isLessonCompleted("ki-fuehrerschein", KF_LESSON_1)).toBe(false);
    });

    it("never replays transition-time interactions into B or mutates A", () => {
      activateAccountProgress("account-a");
      markLessonCompleted("eu-ai-act-kurs", EU_LESSON_1);

      activateUnknownProgress();
      markLessonCompleted("ki-fuehrerschein", KF_LESSON_1);
      activateAccountProgress("account-b");

      expect(isLessonCompleted("ki-fuehrerschein", KF_LESSON_1)).toBe(false);
      expect(isLessonCompleted("eu-ai-act-kurs", EU_LESSON_1)).toBe(false);

      activateAccountProgress("account-a");
      expect(isLessonCompleted("eu-ai-act-kurs", EU_LESSON_1)).toBe(true);
      expect(isLessonCompleted("ki-fuehrerschein", KF_LESSON_1)).toBe(false);
    });

    it("invalidates the old cache before synchronous owner subscribers can write", () => {
      activateAnonymousProgress();
      markLessonCompleted("ki-fuehrerschein", KF_LESSON_1);
      const unsubscribe = subscribeLearningOwner((owner) => {
        if (owner.kind !== "account" || owner.accountId !== "account-b") return;
        expect(isLessonCompleted("ki-fuehrerschein", KF_LESSON_1)).toBe(false);
        markLessonCompleted("eu-ai-act-kurs", EU_LESSON_1);
      });

      activateAccountProgress("account-b");
      unsubscribe();

      expect(isLessonCompleted("ki-fuehrerschein", KF_LESSON_1)).toBe(false);
      expect(isLessonCompleted("eu-ai-act-kurs", EU_LESSON_1)).toBe(true);
      activateAnonymousProgress();
      expect(isLessonCompleted("ki-fuehrerschein", KF_LESSON_1)).toBe(true);
      expect(isLessonCompleted("eu-ai-act-kurs", EU_LESSON_1)).toBe(false);
    });

    it("keeps the cached anonymous state intact when the same owner is activated", () => {
      const exactState = {
        ...getUnifiedState(),
        streak: { days: 0, last: null },
      };
      replaceUnifiedState(exactState);

      expect(activateAnonymousProgress()).toEqual(exactState);
      expect(getUnifiedState()).toEqual(exactState);
    });

    it("tracks sections + lessons per course slug independently", () => {
      markSectionRead("ki-fuehrerschein", KF_LESSON_1, KF_SECTION_1);
      markLessonCompleted("eu-ai-act-kurs", EU_LESSON_1);
      expect(isSectionRead("ki-fuehrerschein", KF_LESSON_1, KF_SECTION_1)).toBe(
        true,
      );
      expect(isSectionRead("eu-ai-act-kurs", EU_LESSON_1, KF_SECTION_1)).toBe(
        false,
      );
      expect(isLessonCompleted("eu-ai-act-kurs", EU_LESSON_1)).toBe(true);
      expect(isLessonCompleted("ki-fuehrerschein", KF_LESSON_1)).toBe(false);
    });

    it("keeps lesson-quiz score monotonic (higher wins)", () => {
      saveLessonQuizScore("ai-native", AI_NATIVE_LESSON_1, 2, 4); // 0.5
      saveLessonQuizScore("ai-native", AI_NATIVE_LESSON_1, 1, 4); // 0.25 — ignored
      expect(getLessonQuizScore("ai-native", AI_NATIVE_LESSON_1)).toEqual({
        score: 2,
        total: 4,
      });
      saveLessonQuizScore("ai-native", AI_NATIVE_LESSON_1, 4, 4); // 1.0 — wins
      expect(getLessonQuizScore("ai-native", AI_NATIVE_LESSON_1)).toEqual({
        score: 4,
        total: 4,
      });
    });

    it("merges exercise results: higher score, sticky completion, attempts++", () => {
      saveExerciseResult("ai-native", AI_NATIVE_LESSON_1, {
        exerciseId: "ex1",
        kind: "exercise-fix-prompt",
        completed: true,
        score: 0.5,
        attempts: 1,
        completedAt: null,
        skipped: false,
      });
      saveExerciseResult("ai-native", AI_NATIVE_LESSON_1, {
        exerciseId: "ex1",
        kind: "exercise-fix-prompt",
        completed: false,
        score: 0.3,
        attempts: 1,
        completedAt: null,
        skipped: false,
      });
      const r = getExerciseResult("ai-native", AI_NATIVE_LESSON_1, "ex1");
      expect(r?.score).toBe(0.5);
      expect(r?.completed).toBe(true);
      expect(r?.attempts).toBe(2);
    });

    it("preserves a higher validated cross-device attempt count", () => {
      saveExerciseResult("ai-native", AI_NATIVE_LESSON_1, {
        exerciseId: "imported-exercise",
        kind: "exercise-fix-prompt",
        completed: true,
        score: 0.8,
        attempts: 5,
        completedAt: null,
        skipped: false,
      });
      expect(
        getExerciseResult("ai-native", AI_NATIVE_LESSON_1, "imported-exercise")
          ?.attempts,
      ).toBe(5);

      saveExerciseResult("ai-native", AI_NATIVE_LESSON_1, {
        exerciseId: "imported-exercise",
        kind: "exercise-fix-prompt",
        completed: true,
        score: 0.8,
        attempts: 1,
        completedAt: null,
        skipped: false,
      });
      expect(
        getExerciseResult("ai-native", AI_NATIVE_LESSON_1, "imported-exercise")
          ?.attempts,
      ).toBe(6);
    });

    //: summaries are capped in UTF-8 bytes at write time so a
    // single oversized AI summary can never blow the per-course-row DB budget.
    it("truncates an oversized exercise summary at write time (byte-based cap)", () => {
      const longSummary = "Über KI-Kompetenz und Verantwortung. ".repeat(50);
      saveExerciseResult("ai-native", AI_NATIVE_LESSON_1, {
        exerciseId: "ex2",
        kind: "exercise-fix-prompt",
        completed: true,
        score: 0.9,
        attempts: 1,
        completedAt: null,
        skipped: false,
        summary: longSummary,
      });
      const r = getExerciseResult("ai-native", AI_NATIVE_LESSON_1, "ex2");
      expect(r?.summary).toBeDefined();
      expect(
        new TextEncoder().encode(r?.summary ?? "").length,
      ).toBeLessThanOrEqual(500);
      expect(r?.summary?.length).toBeLessThan(longSummary.length);
    });

    it("keeps a short exercise summary unchanged", () => {
      saveExerciseResult("ai-native", AI_NATIVE_LESSON_1, {
        exerciseId: "ex3",
        kind: "exercise-fix-prompt",
        completed: true,
        score: 0.7,
        attempts: 1,
        completedAt: null,
        skipped: false,
        summary: "Gute Arbeit, weiter so.",
      });
      const r = getExerciseResult("ai-native", AI_NATIVE_LESSON_1, "ex3");
      expect(r?.summary).toBe("Gute Arbeit, weiter so.");
    });
  });

  describe("xp / badges accrual", () => {
    it("awards XP for sections, lessons, quiz pass and checkpoints", () => {
      markSectionRead("ki-fuehrerschein", KF_LESSON_1, KF_SECTION_1);
      expect(getXp()).toBe(XP.SECTION);
      markLessonCompleted("ki-fuehrerschein", KF_LESSON_1);
      expect(getXp()).toBe(XP.SECTION + XP.LESSON);
      completeCheckpoint(KF_LESSON_1, "cp1");
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

    it("preserves a passed quiz, its best score, and completion time after a worse retake", () => {
      saveWorkshopQuizResult("ki-fuehrerschein", 90, true);
      const earned = getWorkshopQuizResult("ki-fuehrerschein");
      expect(earned.score).toBe(0.9);

      saveWorkshopQuizResult("ki-fuehrerschein", 40, false);

      expect(getWorkshopQuizResult("ki-fuehrerschein")).toEqual(earned);
      expect(isWorkshopQuizPassed("ki-fuehrerschein")).toBe(true);
    });

    it("rejects impossible workshop scores without mutating valid progress", () => {
      saveWorkshopQuizResult("ki-fuehrerschein", 0.8, false);
      const before = getWorkshopQuizResult("ki-fuehrerschein");

      for (const invalid of [-1, 101, Number.NaN, Number.POSITIVE_INFINITY]) {
        saveWorkshopQuizResult("ki-fuehrerschein", invalid, true);
      }

      expect(getWorkshopQuizResult("ki-fuehrerschein")).toEqual(before);
      expect(isWorkshopQuizPassed("ki-fuehrerschein")).toBe(false);
    });

    it("earns the first-light badge after one lesson, counted cross-course", () => {
      expect(getEarnedBadgeIds()).not.toContain("first-light");
      markLessonCompleted("ki-fuehrerschein", KF_LESSON_1);
      expect(getEarnedBadgeIds()).toContain("first-light");
      markLessonCompleted("eu-ai-act-kurs", EU_LESSON_1);
      markLessonCompleted("ai-native", AI_NATIVE_LESSON_1);
      expect(getTotalCompletedLessons()).toBe(3);
      expect(getEarnedBadgeIds()).toContain("apprentice");
    });

    it("does not award XP or badges for fabricated lesson and section IDs", () => {
      markSectionRead("ki-fuehrerschein", KF_LESSON_1, "fabricated-section");
      markSectionRead(
        "ki-fuehrerschein",
        "fabricated-lesson",
        "fabricated-section",
      );
      markLessonCompleted("ki-fuehrerschein", "fabricated-lesson");

      expect(getXp()).toBe(0);
      expect(getTotalCompletedLessons()).toBe(0);
      expect(getEarnedBadgeIds()).toEqual([]);

      markLessonCompleted("ki-fuehrerschein", KF_LESSON_1);
      expect(getXp()).toBe(XP.LESSON);
      expect(getTotalCompletedLessons()).toBe(1);
      expect(getEarnedBadgeIds()).toContain("first-light");
    });

    it("ignores unknown imported-course slices when counting lesson badges", () => {
      // "totally-unregistered-course" and "another-unregistered-course"
      // stand in for slugs that were never real catalog members. None of
      // the 6 originally-imported courses ("claude"/"codex"/
      // "data-infrastructure"/"data-engineering-fundamentals"/
      // "data-science"/"ai-native-operator") are used here any more: the
      // migration registered and flipped every one of them to native
      // courses, so their slices ARE now counted — reusing any of them
      // here would break this test's premise. Purely-synthetic placeholder
      // slugs keep the test valid
      // permanently, independent of future catalog flips.
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
            "totally-unregistered-course": slice,
            "another-unregistered-course": slice,
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

      markLessonCompleted("ki-fuehrerschein", KF_LESSON_1);
      expect(getTotalCompletedLessons()).toBe(1);
      expect(getEarnedBadgeIds()).toContain("first-light");
      expect(getEarnedBadgeIds()).not.toContain("apprentice");
    });
  });

  describe("canonical aggregate integrity", () => {
    it("repairs a unified whole-percent score before max-merging a retake", () => {
      window.localStorage.setItem(
        UNIFIED_STORAGE_KEY,
        JSON.stringify({
          schemaVersion: 3,
          courses: {
            "ki-fuehrerschein": {
              lessons: {},
              workshopQuiz: {
                passed: true,
                score: 90,
                completedAt: "2026-07-20T00:00:00.000Z",
              },
              capstoneSubmitted: false,
              startedAt: "2026-07-01T00:00:00.000Z",
              lastActivity: "2026-07-20T00:00:00.000Z",
            },
          },
          xp: 0,
          checkpoints: {},
          badges: {},
          streak: { days: 0, last: null },
          lastActivity: "2026-07-20T00:00:00.000Z",
        }),
      );
      __resetCacheForTests();

      expect(getWorkshopQuizResult("ki-fuehrerschein").score).toBe(0.9);
      saveWorkshopQuizResult("ki-fuehrerschein", 0.95, true);
      expect(getWorkshopQuizResult("ki-fuehrerschein").score).toBe(0.95);

      const persisted = JSON.parse(
        window.localStorage.getItem(UNIFIED_STORAGE_KEY) as string,
      );
      expect(persisted.courses["ki-fuehrerschein"].workshopQuiz.score).toBe(
        0.95,
      );
    });

    it("normalizes stale keys on load and never reports progress above 100%", () => {
      const complete = {
        sectionsRead: [],
        quizScore: null,
        quizTotal: null,
        completed: true,
        exercisesCompleted: {},
      };
      window.localStorage.setItem(
        UNIFIED_STORAGE_KEY,
        JSON.stringify({
          schemaVersion: 3,
          courses: {
            "ki-fuehrerschein": {
              lessons: {
                ...Object.fromEntries(
                  CANONICAL_LESSON_IDS["ki-fuehrerschein"].map((lessonId) => [
                    lessonId,
                    complete,
                  ]),
                ),
                "stale-one": complete,
                "stale-two": complete,
              },
              workshopQuiz: { passed: false, score: 0, completedAt: null },
              capstoneSubmitted: false,
              startedAt: "2026-07-28T00:00:00.000Z",
              lastActivity: "2026-07-28T00:00:00.000Z",
            },
          },
          xp: 0,
          checkpoints: {},
          badges: {},
          streak: { days: 0, last: null },
          lastActivity: "2026-07-28T00:00:00.000Z",
        }),
      );
      __resetCacheForTests();

      expect(getCompletedLessonsCount("ki-fuehrerschein")).toBe(
        CANONICAL_LESSON_IDS["ki-fuehrerschein"].length,
      );
      expect(
        getOverallProgress(
          "ki-fuehrerschein",
          CANONICAL_LESSON_IDS["ki-fuehrerschein"].length,
        ),
      ).toBe(100);
      expect(
        Object.keys(getCourseSlice("ki-fuehrerschein").lessons),
      ).not.toContain("stale-one");

      const persisted = JSON.parse(
        window.localStorage.getItem(UNIFIED_STORAGE_KEY) as string,
      );
      expect(
        persisted.courses["ki-fuehrerschein"].lessons["stale-one"],
      ).toBeUndefined();
    });

    it("clamps defensive aggregate calls with a smaller denominator", () => {
      markLessonCompleted("ki-fuehrerschein", KF_LESSON_1);
      markLessonCompleted("ki-fuehrerschein", KF_LESSON_2);
      expect(getOverallProgress("ki-fuehrerschein", 1)).toBe(100);
      expect(getOverallProgress("ki-fuehrerschein", 0)).toBe(0);
      expect(getOverallProgress("ki-fuehrerschein", Number.NaN)).toBe(0);
    });
  });

  describe("certificate eligibility (shared course architecture)", () => {
    it("is ineligible by default", () => {
      expect(isCertificateEligible("ai-native")).toBe(false);
      expect(isCertificateEligible("ki-fuehrerschein")).toBe(false);
    });

    it("requires every lesson plus the passed workshop quiz", () => {
      saveWorkshopQuizResult("ki-fuehrerschein", 0.8, true);
      expect(isWorkshopQuizPassed("ki-fuehrerschein")).toBe(true);
      expect(isCertificateEligible("ki-fuehrerschein")).toBe(false);
      for (const lessonId of CANONICAL_LESSON_IDS["ki-fuehrerschein"]) {
        markLessonCompleted("ki-fuehrerschein", lessonId);
      }
      expect(isCertificateEligible("ki-fuehrerschein")).toBe(true);
    });

    it("preserves the historical AI-Native capstone certificate path", () => {
      expect(isCapstoneSubmitted("ai-native")).toBe(false);
      markCapstoneSubmitted("ai-native");
      expect(isCapstoneSubmitted("ai-native")).toBe(true);
      expect(isWorkshopQuizPassed("ai-native")).toBe(false);
      expect(isCertificateEligible("ai-native")).toBe(false);
      for (const lessonId of CANONICAL_LESSON_IDS["ai-native"]) {
        markLessonCompleted("ai-native", lessonId);
      }
      expect(isCertificateEligible("ai-native")).toBe(true);
    });

    it("keeps eligibility per-course independent", () => {
      for (const lessonId of CANONICAL_LESSON_IDS["ai-native"]) {
        markLessonCompleted("ai-native", lessonId);
      }
      markCapstoneSubmitted("ai-native");
      expect(isCertificateEligible("ai-native")).toBe(true);
      expect(isCertificateEligible("eu-ai-act-kurs")).toBe(false);
    });

    it("markCapstoneSubmitted is idempotent", () => {
      markCapstoneSubmitted("ai-native");
      markCapstoneSubmitted("ai-native");
      expect(isCapstoneSubmitted("ai-native")).toBe(true);
    });

    it("ignores the historical capstone writer outside AI-Native", () => {
      markCapstoneSubmitted("codex");

      expect(isCapstoneSubmitted("codex")).toBe(false);
      expect(getCourseSlice("codex").capstoneSubmitted).toBe(false);
    });

    it("derives applied-project status without treating local evidence as certificate proof", () => {
      const identity = getCourseProjectIdentity("ai-native");
      saveExerciseResult("ai-native", identity.progressLessonId, {
        exerciseId: identity.id,
        kind: `course-project-${identity.engineKind}`,
        completed: true,
        score: 1,
        attempts: 1,
        completedAt: "2026-08-13T10:00:00.000Z",
        skipped: false,
        summary: serializeCourseProjectProgress(
          "Verified",
          verifiedCourseProjectArtifact("ai-native"),
        ),
      });

      expect(isAppliedProjectCompleted("ai-native")).toBe(true);
      expect(isCapstoneSubmitted("ai-native")).toBe(false);

      for (const lessonId of CANONICAL_LESSON_IDS["ai-native"]) {
        markLessonCompleted("ai-native", lessonId);
      }
      expect(isCertificateEligible("ai-native")).toBe(false);
    });

    it("clears both exact project evidence and the legacy AI-Native bit on reset", () => {
      const identity = getCourseProjectIdentity("ai-native");
      saveExerciseResult("ai-native", identity.progressLessonId, {
        exerciseId: identity.id,
        kind: `course-project-${identity.engineKind}`,
        completed: true,
        score: 1,
        attempts: 1,
        completedAt: "2026-08-13T10:00:00.000Z",
        skipped: false,
        summary: serializeCourseProjectProgress(
          "Verified",
          verifiedCourseProjectArtifact("ai-native"),
        ),
      });
      markCapstoneSubmitted("ai-native");

      resetCourse("ai-native");

      expect(isAppliedProjectCompleted("ai-native")).toBe(false);
      expect(isCapstoneSubmitted("ai-native")).toBe(false);
    });

    it("becomes eligible when every lesson of a no-assessment course is completed", () => {
      for (const lessonId of CANONICAL_LESSON_IDS["data-science"]) {
        markLessonCompleted("data-science", lessonId);
      }
      expect(isWorkshopQuizPassed("data-science")).toBe(false);
      expect(isCertificateEligible("data-science")).toBe(true);
    });

    it("stays ineligible below the full catalog lesson count", () => {
      for (const lessonId of CANONICAL_LESSON_IDS["ki-fuehrerschein"].slice(
        0,
        -1,
      )) {
        markLessonCompleted("ki-fuehrerschein", lessonId);
      }
      expect(isCertificateEligible("ki-fuehrerschein")).toBe(false);
    });

    //: the all-lessons-completed fallback used to resolve
    // totalLessons from COURSE_CATALOG only, so it was silently unreachable
    // for any course outside the 4-course native spine. "codex" (12 lessons,
    // ALL_COURSE_CATALOG) exercises a slug outside that spine.
    it("resolves totalLessons from the unified catalog for a course outside the native spine", () => {
      for (const lessonId of CANONICAL_LESSON_IDS.codex) {
        markLessonCompleted("codex", lessonId);
      }
      expect(isWorkshopQuizPassed("codex")).toBe(false);
      expect(isCertificateEligible("codex")).toBe(true);
    });

    it("stays ineligible below the full lesson count for a non-native-spine course", () => {
      for (const lessonId of CANONICAL_LESSON_IDS.codex.slice(0, -1)) {
        markLessonCompleted("codex", lessonId);
      }
      expect(isCertificateEligible("codex")).toBe(false);
    });

    //: data-infrastructure is still nativeStatus "pending"
    // in catalog.ts (IMPORTED_COURSE_CATALOG) as of this test — it flips to
    // "live" in stage 13 — but its 12-lesson totalLessons is already resolved
    // via ALL_COURSE_CATALOG regardless of which of the two arrays it lives
    // in, so this generic fallback path is exercisable ahead of that flip.
    it("resolves eligibility for data-infrastructure via the all-lessons-completed path", () => {
      for (const lessonId of CANONICAL_LESSON_IDS["data-infrastructure"]) {
        markLessonCompleted("data-infrastructure", lessonId);
      }
      expect(isWorkshopQuizPassed("data-infrastructure")).toBe(false);
      expect(isCertificateEligible("data-infrastructure")).toBe(true);
    });

    it("stays ineligible below the full lesson count for data-infrastructure", () => {
      for (const lessonId of CANONICAL_LESSON_IDS["data-infrastructure"].slice(
        0,
        -1,
      )) {
        markLessonCompleted("data-infrastructure", lessonId);
      }
      expect(isCertificateEligible("data-infrastructure")).toBe(false);
    });

    //: data-engineering-fundamentals is now nativeStatus
    // "live" (COURSE_CATALOG), reconciled to its real 12 chapters — this is
    // the explicit "all 12 chapters completed" criterion.
    it("resolves eligibility for data-engineering-fundamentals via the all-chapters-completed path", () => {
      for (const lessonId of CANONICAL_LESSON_IDS[
        "data-engineering-fundamentals"
      ]) {
        markLessonCompleted("data-engineering-fundamentals", lessonId);
      }
      expect(isWorkshopQuizPassed("data-engineering-fundamentals")).toBe(false);
      expect(isCertificateEligible("data-engineering-fundamentals")).toBe(true);
    });

    it("stays ineligible below the full chapter count for data-engineering-fundamentals", () => {
      for (const lessonId of CANONICAL_LESSON_IDS[
        "data-engineering-fundamentals"
      ].slice(0, -1)) {
        markLessonCompleted("data-engineering-fundamentals", lessonId);
      }
      expect(isCertificateEligible("data-engineering-fundamentals")).toBe(
        false,
      );
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

    it("commits project evidence and its checkpoint atomically before an owner switch", () => {
      activateAccountProgress("account-a");
      let switched = false;
      const unsubscribe = subscribe((snapshot) => {
        const result =
          snapshot.courses["ai-native"]?.lessons[AI_NATIVE_LESSON_1]
            ?.exercisesCompleted["atomic-project"];
        if (!result || switched) return;
        switched = true;
        activateAccountProgress("account-b");
      });

      expect(
        saveExerciseResultWithCheckpoint(
          "ai-native",
          AI_NATIVE_LESSON_1,
          {
            exerciseId: "atomic-project",
            kind: "course-project-prompt",
            completed: true,
            score: 1,
            attempts: 1,
            completedAt: "2026-08-13T12:00:00.000Z",
            skipped: false,
          },
          "atomic-checkpoint",
        ),
      ).toEqual({ checkpointWasNew: true, durable: true });
      unsubscribe();

      expect(switched).toBe(true);
      expect(
        getExerciseResult("ai-native", AI_NATIVE_LESSON_1, "atomic-project"),
      ).toBeUndefined();
      expect(isCheckpointDone(AI_NATIVE_LESSON_1, "atomic-checkpoint")).toBe(
        false,
      );

      activateAccountProgress("account-a");
      expect(
        getExerciseResult("ai-native", AI_NATIVE_LESSON_1, "atomic-project")
          ?.completed,
      ).toBe(true);
      expect(isCheckpointDone(AI_NATIVE_LESSON_1, "atomic-checkpoint")).toBe(
        true,
      );
    });

    it("does not cache, emit, or reload project evidence when durable storage rejects the write", () => {
      activateAnonymousProgress();
      const subscriber = vi.fn();
      const unsubscribe = subscribe(subscriber);
      subscriber.mockClear();
      const setItem = vi
        .spyOn(window.localStorage, "setItem")
        .mockImplementation(() => {
          throw new Error("storage denied");
        });

      const result = saveExerciseResultWithCheckpoint(
        "data-science",
        "cap",
        {
          exerciseId: "project-data-science-experiment",
          kind: "course-project-data",
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: "2026-08-13T12:00:00.000Z",
          skipped: false,
          summary: serializeCourseProjectProgress(
            "Notebook and model card verified",
            verifiedCourseProjectArtifact("data-science"),
          ),
        },
        "project-data-science-experiment:verified",
      );

      expect(result).toEqual({ checkpointWasNew: false, durable: false });
      expect(isAppliedProjectCompleted("data-science")).toBe(false);
      expect(subscriber).not.toHaveBeenCalled();
      setItem.mockRestore();
      __resetCacheForTests();
      expect(isAppliedProjectCompleted("data-science")).toBe(false);
      unsubscribe();
    });
  });

  describe("streak roll-forward (pure)", () => {
    it("formats the learner's local calendar day instead of the UTC day", () => {
      const localMidnightAfterUtcDay = {
        getFullYear: () => 2026,
        getMonth: () => 6,
        getDate: () => 29,
        toISOString: () => "2026-07-28T22:30:00.000Z",
      } as Date;
      expect(localDateKey(localMidnightAfterUtcDay)).toBe("2026-07-29");
    });

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
      markLessonCompleted("ki-fuehrerschein", KF_LESSON_1);
      // Simulate another tab writing a payload with a different lesson done.
      const foreign = JSON.parse(
        window.localStorage.getItem(UNIFIED_STORAGE_KEY) as string,
      );
      foreign.courses["ki-fuehrerschein"].lessons[KF_LESSON_2] = {
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
      expect(isLessonCompleted("ki-fuehrerschein", KF_LESSON_2)).toBe(true);
    });

    it("notifies subscribers on local writes", () => {
      let calls = 0;
      const unsub = subscribe(() => {
        calls += 1;
      });
      const initial = calls; // immediate emit on subscribe
      markLessonCompleted("ai-native", AI_NATIVE_LESSON_1);
      expect(calls).toBeGreaterThan(initial);
      unsub();
    });
  });

  describe("reset", () => {
    it("resetCourse clears one slice but keeps gamification + other courses", () => {
      markLessonCompleted("ki-fuehrerschein", KF_LESSON_1);
      markLessonCompleted("eu-ai-act-kurs", EU_LESSON_1);
      const xpBefore = getXp();
      resetCourse("ki-fuehrerschein");
      expect(isLessonCompleted("ki-fuehrerschein", KF_LESSON_1)).toBe(false);
      expect(isLessonCompleted("eu-ai-act-kurs", EU_LESSON_1)).toBe(true);
      expect(getXp()).toBe(xpBefore); // xp ledger untouched
    });

    it("resetCourse clears only that course's owned project draft and lesson missions", () => {
      const targetDraft = getCourseProjectDraftStorageKey("ki-fuehrerschein");
      const targetMission = getLessonMissionStorageKey(
        "ki-fuehrerschein",
        KF_LESSON_1,
      );
      const otherDraft = getCourseProjectDraftStorageKey("eu-ai-act-kurs");
      window.localStorage.setItem(targetDraft, "target-draft");
      window.localStorage.setItem(targetMission, "target-mission");
      window.localStorage.setItem(otherDraft, "other-draft");

      resetCourse("ki-fuehrerschein");

      expect(window.localStorage.getItem(targetDraft)).toBeNull();
      expect(window.localStorage.getItem(targetMission)).toBeNull();
      expect(window.localStorage.getItem(otherDraft)).toBe("other-draft");
    });

    it("clears the initiating owner's draft before a reset subscriber can switch accounts", () => {
      const draftKey = getCourseProjectDraftStorageKey("ki-fuehrerschein");
      activateAccountProgress("account-b");
      expect(setOwnedLocalLearningItem(draftKey, "account-b-draft")).toBe(true);
      activateAccountProgress("account-a");
      expect(setOwnedLocalLearningItem(draftKey, "account-a-draft")).toBe(true);
      let switched = false;
      const unsubscribe = subscribe((snapshot) => {
        if (switched || !snapshot.courses["ki-fuehrerschein"]?.resetAt) {
          return;
        }
        switched = true;
        activateAccountProgress("account-b");
      });

      resetCourse("ki-fuehrerschein");
      unsubscribe();

      expect(switched).toBe(true);
      expect(getOwnedLocalLearningItem(draftKey)).toBe("account-b-draft");
      activateAccountProgress("account-a");
      expect(getOwnedLocalLearningItem(draftKey)).toBeNull();
    });

    it("resetCourse clears the Data Science overview mission outside certificate lesson IDs", () => {
      const overviewMission = getLessonMissionStorageKey(
        "data-science",
        "home",
      );
      window.localStorage.setItem(overviewMission, "overview-mission");

      resetCourse("data-science");

      expect(window.localStorage.getItem(overviewMission)).toBeNull();
    });

    it("resetAll wipes everything", () => {
      markLessonCompleted("ki-fuehrerschein", KF_LESSON_1);
      completeCheckpoint(KF_LESSON_1, "cp1");
      const draftKey = getCourseProjectDraftStorageKey("ki-fuehrerschein");
      window.localStorage.setItem(draftKey, "draft");
      resetAll();
      expect(getXp()).toBe(0);
      expect(getEarnedBadgeIds()).toHaveLength(0);
      expect(getCompletedLessonsCount("ki-fuehrerschein")).toBe(0);
      expect(window.localStorage.getItem(draftKey)).toBeNull();
    });

    it("persists an empty reset-stamped root while clearing legacy, draft, and session data", () => {
      const ownedLocalKeys = [
        UNIFIED_STORAGE_KEY,
        `${LEGACY_COURSE_KEY_PREFIX}ki-fuehrerschein`,
        LEGACY_AI_NATIVE_KEY,
        LEGACY_KI_F_FLAT_KEY,
        "reader:progress:book:chapter",
        "reflect::mindset/1::reflection",
        "slots::engineering/3::slots",
        "selfrate::mindset/2::rating",
        "matrix::mindset/3::matrix",
        "plays::operations/1::moves",
      ];
      for (const key of ownedLocalKeys)
        window.localStorage.setItem(key, "private");
      window.localStorage.setItem("theme", "dark");
      window.sessionStorage.setItem(
        "ai-native-exercise-draft-l1-e1",
        "private",
      );
      window.sessionStorage.setItem("ai-native-challenge-draft-1", "private");
      window.sessionStorage.setItem("ai-native-continue-dismissed", "1");

      clearAllLocalLearningData();

      for (const key of ownedLocalKeys) {
        if (key === UNIFIED_STORAGE_KEY) {
          expect(window.localStorage.getItem(key), key).not.toBeNull();
        } else {
          expect(window.localStorage.getItem(key), key).toBeNull();
        }
      }
      expect(window.localStorage.getItem("theme")).toBe("dark");
      expect(window.sessionStorage.length).toBe(0);
      expect(getCompletedLessonsCount("ki-fuehrerschein")).toBe(0);
      const persistedReset = JSON.parse(
        window.localStorage.getItem(UNIFIED_STORAGE_KEY) ?? "null",
      ) as UnifiedProgress;
      expect(persistedReset.courses["ki-fuehrerschein"]?.resetAt).toBeTruthy();

      __resetCacheForTests();
      expect(getCourseSlice("ki-fuehrerschein").resetAt).toBe(
        persistedReset.courses["ki-fuehrerschein"]?.resetAt,
      );
    });
  });

  describe("getUnifiedState shape", () => {
    it("exposes a v3 root with courses + gamification ledger", () => {
      markLessonCompleted("ai-native", AI_NATIVE_LESSON_1);
      const s = getUnifiedState();
      expect(s.schemaVersion).toBe(3);
      expect(s.courses["ai-native"]).toBeDefined();
      expect(
        getCourseSlice("ai-native").lessons[AI_NATIVE_LESSON_1].completed,
      ).toBe(true);
    });
  });

  describe("v2->v3 migration step wired into the read path ", () => {
    it("truncates a pre-existing oversized exercise summary on load", () => {
      const longSummary = "Über KI-Kompetenz und Verantwortung. ".repeat(50);
      window.localStorage.setItem(
        UNIFIED_STORAGE_KEY,
        JSON.stringify({
          schemaVersion: 2,
          courses: {
            "ai-native": {
              lessons: {
                [AI_NATIVE_LESSON_1]: {
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
      const r = getExerciseResult("ai-native", AI_NATIVE_LESSON_1, "ex1");
      expect(r?.summary).toBeDefined();
      expect(
        new TextEncoder().encode(r?.summary ?? "").length,
      ).toBeLessThanOrEqual(500);
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
    // Retired section IDs are not current authored progress and are removed at
    // the v3 trust boundary. The canonical lesson completion, score, and course
    // timestamps remain intact.
    expect(slice.lessons["block_1_lesson_1"].sectionsRead).toEqual([]);
    expect(isWorkshopQuizPassed("ki-fuehrerschein")).toBe(true);
    expect(slice.workshopQuiz.score).toBe(0.92);
    // startedAt is carried forward, not reset to "now".
    expect(slice.startedAt).toBe("2026-03-10T08:00:00.000Z");
    // Legacy key NOT wiped.
    expect(
      window.localStorage.getItem(
        `${LEGACY_COURSE_KEY_PREFIX}ki-fuehrerschein`,
      ),
    ).not.toBe(null);
  });

  it("migrates an AI-Native payload forward, preserving exercises", () => {
    window.localStorage.setItem(
      LEGACY_AI_NATIVE_KEY,
      JSON.stringify(GOLDEN_AI_NATIVE),
    );
    __resetCacheForTests();
    const slice = getCourseSlice("ai-native");
    expect(slice.lessons["modul_1_lesson_1"].completed).toBe(true);
    expect(slice.capstoneSubmitted).toBe(true);
    const ex = slice.lessons["modul_1_lesson_1"].exercisesCompleted["ex_fix"];
    expect(ex.score).toBe(0.9);
    expect(ex.attempts).toBe(2);
    expect(window.localStorage.getItem(LEGACY_AI_NATIVE_KEY)).not.toBe(null);
  });

  it("migrates BOTH legacy schemas together into one store", () => {
    window.localStorage.setItem(
      `${LEGACY_COURSE_KEY_PREFIX}ki-fuehrerschein`,
      JSON.stringify(GOLDEN_KI_F),
    );
    window.localStorage.setItem(
      LEGACY_AI_NATIVE_KEY,
      JSON.stringify(GOLDEN_AI_NATIVE),
    );
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
    window.localStorage.setItem(
      LEGACY_KI_F_FLAT_KEY,
      JSON.stringify(GOLDEN_KI_F),
    );
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
