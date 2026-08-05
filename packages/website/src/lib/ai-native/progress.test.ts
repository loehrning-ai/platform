import { describe, it, expect, beforeEach, beforeAll } from "vitest";

/**
 * Minimal localStorage polyfill for the test environment.
 * Some vitest/jsdom combos expose a no-op localStorage; we replace it with
 * an in-memory Storage-compatible object so tests are deterministic.
 */
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
import { AI_NATIVE_SCHEMA_VERSION, AI_NATIVE_STORAGE_KEY } from "./types";
import { UNIFIED_STORAGE_KEY } from "@/lib/progress/types";
import {
  markSectionRead,
  isSectionRead,
  markLessonCompleted,
  isLessonCompleted,
  saveExerciseResult,
  getExerciseResult,
  isExerciseCompleted,
  getCompletedLessonsCount,
  getModuleCompletedLessonCount,
  areAllModuleLessonsCompleted,
  getOverallProgress,
  serializeProgress,
  deserializeProgress,
  importProgress,
  getAllProgress,
  resetProgress,
  buildProgressUrl,
  __resetCacheForTests,
} from "./progress";

const CANONICAL_LESSON_ID = "modul_1_lesson_1";
const CANONICAL_SECTION_ID = "modul_1_lesson_1_section_1";

function encodeImportPayload(payload: unknown): string {
  return btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

describe("ai-native progress", () => {
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

  describe("section progress", () => {
    it("marks and queries section-read state", () => {
      expect(isSectionRead(CANONICAL_LESSON_ID, CANONICAL_SECTION_ID)).toBe(
        false,
      );
      markSectionRead(
        "modul_1",
        CANONICAL_LESSON_ID,
        CANONICAL_SECTION_ID,
        0,
      );
      expect(isSectionRead(CANONICAL_LESSON_ID, CANONICAL_SECTION_ID)).toBe(
        true,
      );
    });

    it("is idempotent on repeated marks", () => {
      markSectionRead(
        "modul_1",
        CANONICAL_LESSON_ID,
        CANONICAL_SECTION_ID,
        0,
      );
      markSectionRead(
        "modul_1",
        CANONICAL_LESSON_ID,
        CANONICAL_SECTION_ID,
        0,
      );
      // Writes now flow into the unified store under the "ai-native" slug.
      const raw = JSON.parse(
        window.localStorage.getItem(UNIFIED_STORAGE_KEY) as string,
      );
      expect(
        raw.courses["ai-native"].lessons[CANONICAL_LESSON_ID].sectionsRead,
      ).toEqual([CANONICAL_SECTION_ID]);
    });
  });

  describe("lesson completion", () => {
    it("marks and queries lesson completion", () => {
      expect(isLessonCompleted("modul_1_lesson_1")).toBe(false);
      markLessonCompleted("modul_1_lesson_1");
      expect(isLessonCompleted("modul_1_lesson_1")).toBe(true);
    });

    it("counts completed lessons across module", () => {
      markLessonCompleted("modul_1_lesson_1");
      markLessonCompleted("modul_1_lesson_2");
      expect(
        getModuleCompletedLessonCount("modul_1", [
          "modul_1_lesson_1",
          "modul_1_lesson_2",
          "modul_1_lesson_3",
        ]),
      ).toBe(2);
    });

    it("areAllModuleLessonsCompleted requires all completed", () => {
      const ids = ["modul_1_lesson_1", "modul_1_lesson_2"];
      expect(areAllModuleLessonsCompleted(ids)).toBe(false);
      markLessonCompleted("modul_1_lesson_1");
      expect(areAllModuleLessonsCompleted(ids)).toBe(false);
      markLessonCompleted("modul_1_lesson_2");
      expect(areAllModuleLessonsCompleted(ids)).toBe(true);
    });

    it("areAllModuleLessonsCompleted returns false for empty list", () => {
      expect(areAllModuleLessonsCompleted([])).toBe(false);
    });

    it("getOverallProgress returns 0 when total is 0", () => {
      expect(getOverallProgress(0)).toBe(0);
    });

    it("getOverallProgress returns rounded percentage", () => {
      markLessonCompleted("modul_1_lesson_1");
      markLessonCompleted("modul_1_lesson_2");
      markLessonCompleted("modul_1_lesson_3");
      expect(getOverallProgress(10)).toBe(30);
    });
  });

  describe("exercise results", () => {
    it("saves and retrieves", () => {
      saveExerciseResult("modul_1", "modul_1_lesson_1", {
        exerciseId: "ex_1",
        kind: "exercise-fix-prompt",
        completed: true,
        score: 0.75,
        attempts: 1,
        completedAt: new Date().toISOString(),
        skipped: false,
      });
      const r = getExerciseResult("modul_1_lesson_1", "ex_1");
      expect(r?.completed).toBe(true);
      expect(r?.score).toBe(0.75);
      expect(isExerciseCompleted("modul_1_lesson_1", "ex_1")).toBe(true);
    });

    it("keeps higher score on repeat submit", () => {
      saveExerciseResult("modul_1", "modul_1_lesson_1", {
        exerciseId: "ex_1",
        kind: "exercise-fix-prompt",
        completed: true,
        score: 0.5,
        attempts: 1,
        completedAt: null,
        skipped: false,
      });
      saveExerciseResult("modul_1", "modul_1_lesson_1", {
        exerciseId: "ex_1",
        kind: "exercise-fix-prompt",
        completed: true,
        score: 0.3, // lower — should be ignored
        attempts: 1,
        completedAt: null,
        skipped: false,
      });
      const r = getExerciseResult("modul_1_lesson_1", "ex_1");
      expect(r?.score).toBe(0.5);
      expect(r?.attempts).toBe(2);
    });

    it("sticks to completed once completed (even if later submit isn't)", () => {
      saveExerciseResult("modul_1", "modul_1_lesson_1", {
        exerciseId: "ex_1",
        kind: "exercise-fix-prompt",
        completed: true,
        score: 0.5,
        attempts: 1,
        completedAt: null,
        skipped: false,
      });
      saveExerciseResult("modul_1", "modul_1_lesson_1", {
        exerciseId: "ex_1",
        kind: "exercise-fix-prompt",
        completed: false,
        score: null,
        attempts: 1,
        completedAt: null,
        skipped: false,
      });
      expect(isExerciseCompleted("modul_1_lesson_1", "ex_1")).toBe(true);
    });
  });

  describe("URL-hash serialize/import", () => {
    it("round-trips progress", () => {
      markLessonCompleted("modul_1_lesson_1");
      saveExerciseResult("modul_1", "modul_1_lesson_1", {
        exerciseId: "ex_1",
        kind: "exercise-fix-prompt",
        completed: true,
        score: 1,
        attempts: 1,
        completedAt: null,
        skipped: false,
      });
      const encoded = serializeProgress();
      expect(encoded).toBeTruthy();
      if (!encoded) return;
      // Decode and re-import into a fresh state
      resetProgress();
      const ok = importProgress(encoded);
      expect(ok).toBe(true);
      expect(isLessonCompleted("modul_1_lesson_1")).toBe(true);
      expect(isExerciseCompleted("modul_1_lesson_1", "ex_1")).toBe(true);
    });

    it("rejects malformed base64", () => {
      expect(deserializeProgress("!!!not-base64!!!")).toBe(null);
      expect(importProgress("!!!not-base64!!!")).toBe(false);
    });

    it("rejects unknown schemaVersion", () => {
      const futureVersion = btoa(JSON.stringify({ schemaVersion: 999 }));
      const clean = futureVersion
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      expect(deserializeProgress(clean)).toBe(null);
    });

    it("rejects unknown exercise kinds", () => {
      const encoded = encodeImportPayload({
        schemaVersion: AI_NATIVE_SCHEMA_VERSION,
        lessons: {
          [CANONICAL_LESSON_ID]: {
            sectionsRead: [],
            quizScore: null,
            quizTotal: null,
            completed: false,
            exercisesCompleted: {
              ex1: {
                kind: "exercise-nuclear-launch",
                completed: true,
                score: 1,
                attempts: 1,
                skipped: false,
              },
            },
          },
        },
        capstoneSubmitted: false,
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      });
      expect(deserializeProgress(encoded)).toBe(null);
    });

    it("rejects fabricated lesson IDs instead of reporting a no-op import", () => {
      const encoded = encodeImportPayload({
        schemaVersion: AI_NATIVE_SCHEMA_VERSION,
        lessons: {
          "fabricated-lesson": {
            sectionsRead: [],
            quizScore: null,
            quizTotal: null,
            completed: true,
            exercisesCompleted: {},
          },
        },
        capstoneSubmitted: false,
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      });

      expect(deserializeProgress(encoded)).toBe(null);
      expect(importProgress(encoded)).toBe(false);
      expect(isLessonCompleted("fabricated-lesson")).toBe(false);
    });

    it.each([
      ["fabricated", ["fabricated-section"]],
      ["duplicate", [CANONICAL_SECTION_ID, CANONICAL_SECTION_ID]],
    ])(
      "rejects %s section IDs instead of silently dropping them",
      (_, sectionsRead) => {
        const encoded = encodeImportPayload({
          schemaVersion: AI_NATIVE_SCHEMA_VERSION,
          lessons: {
            [CANONICAL_LESSON_ID]: {
              sectionsRead,
              quizScore: null,
              quizTotal: null,
              completed: false,
              exercisesCompleted: {},
            },
          },
          capstoneSubmitted: false,
          startedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        });

        expect(deserializeProgress(encoded)).toBe(null);
        expect(importProgress(encoded)).toBe(false);
        expect(
          isSectionRead(CANONICAL_LESSON_ID, CANONICAL_SECTION_ID),
        ).toBe(false);
      },
    );

    it.each([
      [
        "non-boolean lesson completion",
        {
          sectionsRead: [CANONICAL_SECTION_ID],
          quizScore: null,
          quizTotal: null,
          completed: "yes",
          exercisesCompleted: {},
        },
      ],
      [
        "out-of-range quiz score",
        {
          sectionsRead: [CANONICAL_SECTION_ID],
          quizScore: 2,
          quizTotal: 2,
          completed: false,
          exercisesCompleted: {},
        },
      ],
      [
        "wrong-typed exercise score",
        {
          sectionsRead: [],
          quizScore: null,
          quizTotal: null,
          completed: false,
          exercisesCompleted: {
            ex_1: {
              kind: "exercise-fix-prompt",
              completed: true,
              score: "1",
              attempts: 1,
              skipped: false,
            },
          },
        },
      ],
      [
        "unexpected lesson field",
        {
          sectionsRead: [CANONICAL_SECTION_ID],
          quizScore: null,
          quizTotal: null,
          completed: false,
          exercisesCompleted: {},
          privateText: "must not be accepted",
        },
      ],
    ])("rejects %s in an imported lesson", (_, lesson) => {
      const encoded = encodeImportPayload({
        schemaVersion: AI_NATIVE_SCHEMA_VERSION,
        lessons: { [CANONICAL_LESSON_ID]: lesson },
        capstoneSubmitted: false,
        startedAt: "2026-07-29T08:00:00.000Z",
        lastActivity: "2026-07-29T08:00:00.000Z",
      });

      expect(deserializeProgress(encoded)).toBe(null);
      expect(importProgress(encoded)).toBe(false);
    });

    it("rejects empty no-op progress and invalid timestamps", () => {
      const base = {
        schemaVersion: AI_NATIVE_SCHEMA_VERSION,
        lessons: {},
        capstoneSubmitted: false,
        startedAt: "2026-07-29T08:00:00.000Z",
        lastActivity: "2026-07-29T08:00:00.000Z",
      };
      expect(deserializeProgress(encodeImportPayload(base))).toBe(null);
      expect(
        deserializeProgress(
          encodeImportPayload({
            ...base,
            capstoneSubmitted: true,
            startedAt: "not-a-timestamp",
          }),
        ),
      ).toBe(null);
    });

    it("imports validated quiz, exercise-attempt, and capstone progress", () => {
      const encoded = encodeImportPayload({
        schemaVersion: AI_NATIVE_SCHEMA_VERSION,
        lessons: {
          [CANONICAL_LESSON_ID]: {
            sectionsRead: [CANONICAL_SECTION_ID],
            quizScore: 0.5,
            quizTotal: 4,
            completed: false,
            exercisesCompleted: {
              ex_1: {
                kind: "exercise-fix-prompt",
                completed: true,
                score: 0.75,
                attempts: 5,
                skipped: false,
              },
            },
          },
        },
        capstoneSubmitted: true,
        startedAt: "2026-07-29T08:00:00.000Z",
        lastActivity: "2026-07-29T08:30:00.000Z",
      });

      expect(importProgress(encoded)).toBe(true);
      const progress = getAllProgress();
      expect(progress.lessons[CANONICAL_LESSON_ID]).toMatchObject({
        quizScore: 0.5,
        quizTotal: 4,
      });
      expect(
        progress.lessons[CANONICAL_LESSON_ID].exercisesCompleted.ex_1
          .attempts,
      ).toBe(5);
      expect(progress.capstoneSubmitted).toBe(true);
    });

    it("returns null when no progress exists", () => {
      expect(serializeProgress()).toBe(null);
      expect(buildProgressUrl("https://example.com")).toBe(null);
    });

    it("buildProgressUrl returns hash-fragment URL with encoded progress", () => {
      markLessonCompleted("modul_1_lesson_1");
      const url = buildProgressUrl("https://example.com/ai-native");
      expect(url).toMatch(/^https:\/\/example\.com\/ai-native#ai-native-progress=/);
    });

    it("sanitizeForExport excludes completedAt (privacy constraint)", () => {
      saveExerciseResult("modul_1", "modul_1_lesson_1", {
        exerciseId: "ex_1",
        kind: "exercise-fix-prompt",
        completed: true,
        score: 1,
        attempts: 1,
        completedAt: "2026-04-21T10:00:00.000Z",
        skipped: false,
      });
      const encoded = serializeProgress();
      expect(encoded).toBeTruthy();
      if (!encoded) return;
      // Decode and inspect the shape
      let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) base64 += "=";
      const json = JSON.parse(
        decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        ),
      );
      const result = json.lessons.modul_1_lesson_1.exercisesCompleted.ex_1;
      expect(result).not.toHaveProperty("completedAt");
    });
  });

  describe("legacy migration (NEVER wipe — shared course architecture R1)", () => {
    it("migrates a legacy ai-native-progress-v1 payload forward, preserving it", () => {
      // Plant a legacy payload under the old key (no unified store yet).
      window.localStorage.setItem(
        AI_NATIVE_STORAGE_KEY,
        JSON.stringify({
          schemaVersion: AI_NATIVE_SCHEMA_VERSION,
          lessons: {
            modul_1_lesson_1: {
              sectionsRead: [CANONICAL_SECTION_ID],
              quizScore: null,
              quizTotal: null,
              completed: true,
              exercisesCompleted: {},
            },
          },
          capstoneSubmitted: false,
          premiumUnlocked: false,
          startedAt: "2026-01-01T00:00:00.000Z",
          lastActivity: "2026-01-01T00:00:00.000Z",
        }),
      );
      __resetCacheForTests();
      // First read migrates the legacy payload forward.
      expect(isLessonCompleted("modul_1_lesson_1")).toBe(true);
      expect(
        isSectionRead(CANONICAL_LESSON_ID, CANONICAL_SECTION_ID),
      ).toBe(true);
      // The legacy key is NOT wiped (recoverable).
      expect(window.localStorage.getItem(AI_NATIVE_STORAGE_KEY)).not.toBe(null);
    });

    it("migrates an UNKNOWN schemaVersion forward instead of wiping", () => {
      window.localStorage.setItem(
        AI_NATIVE_STORAGE_KEY,
        JSON.stringify({
          schemaVersion: 999,
          lessons: {
            modul_1_lesson_1: {
              sectionsRead: [],
              quizScore: null,
              quizTotal: null,
              completed: true,
              exercisesCompleted: {},
            },
          },
          capstoneSubmitted: false,
          startedAt: "2026-01-01T00:00:00.000Z",
          lastActivity: "2026-01-01T00:00:00.000Z",
        }),
      );
      __resetCacheForTests();
      // Forward-migrated, NOT wiped: progress survives.
      expect(isLessonCompleted("modul_1_lesson_1")).toBe(true);
      expect(window.localStorage.getItem(AI_NATIVE_STORAGE_KEY)).not.toBe(null);
    });
  });

  describe("reset", () => {
    it("clears the ai-native slice in the unified store", () => {
      markLessonCompleted("modul_1_lesson_1");
      resetProgress();
      expect(isLessonCompleted("modul_1_lesson_1")).toBe(false);
    });
  });
});
