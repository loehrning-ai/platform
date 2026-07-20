import { describe, it, expect, beforeAll, beforeEach } from "vitest";

// progress.ts is a thin facade over the unified store (src/lib/progress/store).
// It adds its OWN logic on top of pure delegation: legacy-shape projection
// (getAllProgress), base64url share encode/decode (serialize/deserialize),
// URL building, and a store-merging import. These tests drive the facade end to
// end against the real store, backed by an in-memory window.localStorage.

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

import { __resetCacheForTests } from "@/lib/progress/store";
import {
  markSectionRead,
  isSectionRead,
  getReadSectionIds,
  markLessonCompleted,
  isLessonCompleted,
  getCompletedLessonIds,
  getCompletedLessonsCount,
  saveLessonQuizScore,
  getLessonQuizScore,
  saveWorkshopQuizResult,
  getWorkshopQuizResult,
  isWorkshopQuizPassed,
  isCertificateEligible,
  getBlockCompletedLessons,
  areAllBlockLessonsCompleted,
  getOverallProgress,
  getAllProgress,
  resetProgress,
  serializeProgress,
  deserializeProgress,
  importProgress,
  buildProgressUrl,
} from "./progress";

const COURSE = "ki-fuehrerschein" as const;

describe("course progress facade", () => {
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

  // ─── Delegation: writes and reads flow through with the right args ───

  describe("delegation to the unified store", () => {
    it("marks and reads a section, exposing read ids as a Set", () => {
      markSectionRead(COURSE, "l1", "s1");
      expect(isSectionRead(COURSE, "l1", "s1")).toBe(true);
      expect(isSectionRead(COURSE, "l1", "s2")).toBe(false);
      const ids = getReadSectionIds(COURSE, "l1");
      expect(ids).toBeInstanceOf(Set);
      expect(ids.has("s1")).toBe(true);
    });

    it("keeps section/lesson state isolated per course slug", () => {
      markLessonCompleted(COURSE, "l1");
      expect(isLessonCompleted(COURSE, "l1")).toBe(true);
      expect(isLessonCompleted("eu-ai-act-kurs", "l1")).toBe(false);
      expect([...getCompletedLessonIds(COURSE)]).toEqual(["l1"]);
      expect(getCompletedLessonsCount(COURSE)).toBe(1);
    });

    it("stores and reads back a lesson quiz score", () => {
      saveLessonQuizScore(COURSE, "l1", 3, 4);
      expect(getLessonQuizScore(COURSE, "l1")).toEqual({ score: 3, total: 4 });
    });

    it("computes block + overall progress from completed lessons", () => {
      markLessonCompleted(COURSE, "l1");
      expect(getBlockCompletedLessons(COURSE, ["l1", "l2"])).toBe(1);
      expect(areAllBlockLessonsCompleted(COURSE, ["l1"])).toBe(true);
      expect(areAllBlockLessonsCompleted(COURSE, ["l1", "l2"])).toBe(false);
      // 1 of 4 lessons completed -> 25%
      expect(getOverallProgress(COURSE, 4)).toBe(25);
    });

    it("records a passed workshop quiz and grants certificate eligibility", () => {
      expect(isWorkshopQuizPassed(COURSE)).toBe(false);
      expect(isCertificateEligible(COURSE)).toBe(false);
      saveWorkshopQuizResult(COURSE, 90, true);
      expect(isWorkshopQuizPassed(COURSE)).toBe(true);
      expect(isCertificateEligible(COURSE)).toBe(true);
      const result = getWorkshopQuizResult(COURSE);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(90);
      expect(typeof result.completedAt).toBe("string");
    });
  });

  // ─── getAllProgress: projection to the legacy CourseProgress shape ───

  describe("getAllProgress", () => {
    it("projects the store slice down to the legacy lesson shape", () => {
      markSectionRead(COURSE, "l1", "s1");
      markLessonCompleted(COURSE, "l1");
      const all = getAllProgress(COURSE);
      expect(all.lessons.l1).toEqual({
        sectionsRead: ["s1"],
        quizScore: null,
        quizTotal: null,
        completed: true,
      });
      expect(all.workshopQuiz).toEqual({
        passed: false,
        score: 0,
        completedAt: null,
      });
      expect(typeof all.startedAt).toBe("string");
      expect(typeof all.lastActivity).toBe("string");
    });

    it("returns an empty lessons map for a fresh course", () => {
      expect(getAllProgress("eu-ai-act-kurs").lessons).toEqual({});
    });
  });

  // ─── resetProgress ─────────────────────────────────────────────────

  describe("resetProgress", () => {
    it("clears a single course's progress", () => {
      markLessonCompleted(COURSE, "l1");
      markLessonCompleted("eu-ai-act-kurs", "l9");
      resetProgress(COURSE);
      expect(isLessonCompleted(COURSE, "l1")).toBe(false);
      expect(getAllProgress(COURSE).lessons).toEqual({});
      // other courses are untouched
      expect(isLessonCompleted("eu-ai-act-kurs", "l9")).toBe(true);
    });
  });

  // ─── serialize / deserialize (base64url share codec) ───────────────

  describe("serializeProgress + deserializeProgress", () => {
    it("returns null when there is no progress to share", () => {
      expect(serializeProgress(COURSE)).toBeNull();
    });

    it("emits a URL-safe base64 string (no +, /, or = padding)", () => {
      markSectionRead(COURSE, "l1", "s1");
      const encoded = serializeProgress(COURSE);
      expect(encoded).not.toBeNull();
      expect(encoded).not.toMatch(/[+/=]/);
    });

    it("round-trips a full progress snapshot faithfully", () => {
      markSectionRead(COURSE, "l1", "s1");
      markLessonCompleted(COURSE, "l1");
      saveLessonQuizScore(COURSE, "l1", 3, 4);
      saveWorkshopQuizResult(COURSE, 88, true);

      const snapshot = getAllProgress(COURSE);
      const encoded = serializeProgress(COURSE);
      expect(encoded).not.toBeNull();
      expect(deserializeProgress(encoded as string)).toEqual(snapshot);
    });

    it("returns null for a non-decodable string", () => {
      expect(deserializeProgress("!!! not base64 !!!")).toBeNull();
    });

    it("returns null for an empty string", () => {
      expect(deserializeProgress("")).toBeNull();
    });

    it("returns null for valid base64 whose JSON lacks the required shape", () => {
      // Same base64url scheme the codec uses, but the payload is missing the
      // `lessons`/`workshopQuiz` fields, so deserialize must reject it.
      const bad = btoa('{"foo":1}')
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      expect(deserializeProgress(bad)).toBeNull();
    });
  });

  // ─── importProgress: merge a serialized snapshot into the store ─────

  describe("importProgress", () => {
    it("returns false for an un-decodable payload and changes nothing", () => {
      expect(importProgress(COURSE, "@@not-decodable@@")).toBe(false);
      expect(getAllProgress(COURSE).lessons).toEqual({});
    });

    it("merges a shared snapshot into a different course", () => {
      markSectionRead(COURSE, "l1", "s1");
      markLessonCompleted(COURSE, "l1");
      saveLessonQuizScore(COURSE, "l1", 3, 4);
      saveWorkshopQuizResult(COURSE, 88, true);
      const encoded = serializeProgress(COURSE) as string;

      const target = "eu-ai-act-kurs" as const;
      expect(importProgress(target, encoded)).toBe(true);

      expect(isSectionRead(target, "l1", "s1")).toBe(true);
      expect(isLessonCompleted(target, "l1")).toBe(true);
      expect(getLessonQuizScore(target, "l1")).toEqual({ score: 3, total: 4 });
      expect(isWorkshopQuizPassed(target)).toBe(true);
      expect(getWorkshopQuizResult(target).score).toBe(88);
    });
  });

  // ─── buildProgressUrl ──────────────────────────────────────────────

  describe("buildProgressUrl", () => {
    it("returns null when there is nothing to encode", () => {
      expect(buildProgressUrl(COURSE, "https://x.test/kurs")).toBeNull();
    });

    it("appends the encoded progress to the base URL hash", () => {
      markSectionRead(COURSE, "l1", "s1");
      const encoded = serializeProgress(COURSE);
      const url = buildProgressUrl(COURSE, "https://x.test/kurs");
      expect(url).toBe(`https://x.test/kurs#progress=${encoded}`);
    });
  });
});
