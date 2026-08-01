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
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import { getAllLessons } from "./data";
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
const FIXED_TIMESTAMP = "2026-07-29T12:34:56.789Z";
const SHARE_COURSES = [
  {
    courseSlug: "ki-fuehrerschein",
    lessonId: "block_1_lesson_1",
    sectionId: "block_1_lesson_1_section_1",
  },
  {
    courseSlug: "eu-ai-act-kurs",
    lessonId: "block_2_lesson_3",
    sectionId: "block_2_lesson_3_section_4",
  },
  {
    courseSlug: "ki-und-gesellschaft",
    lessonId: "arbeit-1-1",
    sectionId: "arbeit-1-1-s1",
  },
] as const;

function encodeTextAsBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function encodePayload(value: unknown): string {
  return encodeTextAsBase64Url(JSON.stringify(value));
}

function decodePayload(encoded: string): unknown {
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  );
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

function validSharePayload(
  course = SHARE_COURSES[0],
): {
  version: number;
  courseSlug: (typeof SHARE_COURSES)[number]["courseSlug"];
  progress: {
    lessons: Record<
      string,
      {
        sectionsRead: string[];
        quizScore: number | null;
        quizTotal: number | null;
        completed: boolean;
      }
    >;
    workshopQuiz: {
      passed: boolean;
      score: number;
      completedAt: string | null;
    };
    startedAt: string;
    lastActivity: string;
  };
} {
  return {
    version: 1,
    courseSlug: course.courseSlug,
    progress: {
      lessons: {
        [course.lessonId]: {
          sectionsRead: [course.sectionId],
          quizScore: 2 / 3,
          quizTotal: 3,
          completed: true,
        },
      },
      workshopQuiz: {
        passed: true,
        score: 0.8,
        completedAt: FIXED_TIMESTAMP,
      },
      startedAt: FIXED_TIMESTAMP,
      lastActivity: FIXED_TIMESTAMP,
    },
  };
}

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
      markSectionRead(
        COURSE,
        "block_1_lesson_1",
        "block_1_lesson_1_section_1",
      );
      expect(
        isSectionRead(
          COURSE,
          "block_1_lesson_1",
          "block_1_lesson_1_section_1",
        ),
      ).toBe(true);
      expect(
        isSectionRead(
          COURSE,
          "block_1_lesson_1",
          "block_1_lesson_1_section_2",
        ),
      ).toBe(false);
      const ids = getReadSectionIds(COURSE, "block_1_lesson_1");
      expect(ids).toBeInstanceOf(Set);
      expect(ids.has("block_1_lesson_1_section_1")).toBe(true);
    });

    it("keeps section/lesson state isolated per course slug", () => {
      markLessonCompleted(COURSE, "block_1_lesson_1");
      expect(isLessonCompleted(COURSE, "block_1_lesson_1")).toBe(true);
      expect(
        isLessonCompleted("eu-ai-act-kurs", "block_1_lesson_1"),
      ).toBe(false);
      expect([...getCompletedLessonIds(COURSE)]).toEqual([
        "block_1_lesson_1",
      ]);
      expect(getCompletedLessonsCount(COURSE)).toBe(1);
    });

    it("stores and reads back a lesson quiz score", () => {
      saveLessonQuizScore(COURSE, "block_1_lesson_1", 3, 4);
      expect(getLessonQuizScore(COURSE, "block_1_lesson_1")).toEqual({
        score: 3,
        total: 4,
      });
    });

    it("computes block + overall progress from completed lessons", () => {
      markLessonCompleted(COURSE, "block_1_lesson_1");
      expect(
        getBlockCompletedLessons(COURSE, [
          "block_1_lesson_1",
          "block_1_lesson_2",
        ]),
      ).toBe(1);
      expect(
        areAllBlockLessonsCompleted(COURSE, ["block_1_lesson_1"]),
      ).toBe(true);
      expect(
        areAllBlockLessonsCompleted(COURSE, [
          "block_1_lesson_1",
          "block_1_lesson_2",
        ]),
      ).toBe(false);
      // 1 of 4 lessons completed -> 25%
      expect(getOverallProgress(COURSE, 4)).toBe(25);
    });

    it("requires canonical lessons in addition to a passed workshop quiz", () => {
      expect(isWorkshopQuizPassed(COURSE)).toBe(false);
      expect(isCertificateEligible(COURSE)).toBe(false);
      // Legacy whole-percent input is accepted at this boundary, then stored
      // and returned in the canonical 0..1 score domain.
      saveWorkshopQuizResult(COURSE, 90, true);
      expect(isWorkshopQuizPassed(COURSE)).toBe(true);
      expect(isCertificateEligible(COURSE)).toBe(false);
      for (const lessonId of CANONICAL_LESSON_IDS[COURSE]) {
        markLessonCompleted(COURSE, lessonId);
      }
      expect(isCertificateEligible(COURSE)).toBe(true);
      const result = getWorkshopQuizResult(COURSE);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(0.9);
      expect(typeof result.completedAt).toBe("string");
    });
  });

  // ─── getAllProgress: projection to the legacy CourseProgress shape ───

  describe("getAllProgress", () => {
    it("projects the store slice down to the legacy lesson shape", () => {
      markSectionRead(
        COURSE,
        "block_1_lesson_1",
        "block_1_lesson_1_section_1",
      );
      markLessonCompleted(COURSE, "block_1_lesson_1");
      const all = getAllProgress(COURSE);
      expect(all.lessons.block_1_lesson_1).toEqual({
        sectionsRead: ["block_1_lesson_1_section_1"],
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
      markLessonCompleted(COURSE, "block_1_lesson_1");
      markLessonCompleted("eu-ai-act-kurs", "block_1_lesson_2");
      resetProgress(COURSE);
      expect(isLessonCompleted(COURSE, "block_1_lesson_1")).toBe(false);
      expect(getAllProgress(COURSE).lessons).toEqual({});
      // other courses are untouched
      expect(
        isLessonCompleted("eu-ai-act-kurs", "block_1_lesson_2"),
      ).toBe(true);
    });
  });

  // ─── serialize / deserialize (base64url share codec) ───────────────

  describe("serializeProgress + deserializeProgress", () => {
    it("returns null when there is no progress to share", () => {
      expect(serializeProgress(COURSE)).toBeNull();
    });

    it("emits a URL-safe base64 string (no +, /, or = padding)", () => {
      markSectionRead(
        COURSE,
        "block_1_lesson_1",
        "block_1_lesson_1_section_1",
      );
      const encoded = serializeProgress(COURSE);
      expect(encoded).not.toBeNull();
      expect(encoded).not.toMatch(/[+/=]/);
    });

    it.each(SHARE_COURSES)(
      "round-trips a versioned $courseSlug snapshot with canonical IDs",
      ({ courseSlug, lessonId, sectionId }) => {
        markSectionRead(courseSlug, lessonId, sectionId);
        markLessonCompleted(courseSlug, lessonId);
        saveLessonQuizScore(courseSlug, lessonId, 2, 3);
        saveWorkshopQuizResult(courseSlug, 0.8, true);

        const snapshot = getAllProgress(courseSlug);
        const encoded = serializeProgress(courseSlug);
        expect(encoded).not.toBeNull();
        expect(decodePayload(encoded as string)).toEqual({
          version: 1,
          courseSlug,
          progress: snapshot,
        });
        expect(deserializeProgress(encoded as string)).toEqual(snapshot);
      },
    );

    it.each(SHARE_COURSES)(
      "keeps the compact $courseSlug ID contract aligned with every authored section",
      ({ courseSlug }) => {
        const authoredLessons = getAllLessons(courseSlug);
        expect(authoredLessons.map((lesson) => lesson.id)).toEqual(
          CANONICAL_LESSON_IDS[courseSlug],
        );
        for (const lesson of authoredLessons) {
          for (const section of lesson.sections) {
            markSectionRead(courseSlug, lesson.id, section.id);
          }
        }

        const snapshot = getAllProgress(courseSlug);
        const encoded = serializeProgress(courseSlug);
        expect(encoded).not.toBeNull();
        expect(deserializeProgress(encoded as string)).toEqual(snapshot);
      },
    );

    it("round-trips a legitimate failed workshop attempt", () => {
      saveWorkshopQuizResult(COURSE, 0.5, false);
      const snapshot = getAllProgress(COURSE);
      const encoded = serializeProgress(COURSE);

      expect(encoded).not.toBeNull();
      expect(snapshot.workshopQuiz).toMatchObject({
        passed: false,
        score: 0.5,
      });
      expect(snapshot.workshopQuiz.completedAt).not.toBeNull();
      expect(deserializeProgress(encoded as string)).toEqual(snapshot);
    });

    it("returns null for a non-decodable string", () => {
      expect(deserializeProgress("!!! not base64 !!!")).toBeNull();
    });

    it("returns null for an empty string", () => {
      expect(deserializeProgress("")).toBeNull();
    });

    it("rejects the former unversioned raw-progress format", () => {
      const payload = validSharePayload();
      expect(
        deserializeProgress(encodePayload(payload.progress)),
      ).toBeNull();
      expect(importProgress(COURSE, encodePayload(payload.progress))).toBe(
        false,
      );
    });

    it.each([
      {
        label: "unsupported envelope version",
        payload: () => ({ ...validSharePayload(), version: 2 }),
      },
      {
        label: "extra envelope key",
        payload: () => ({ ...validSharePayload(), extra: true }),
      },
      {
        label: "extra progress key",
        payload: () => {
          const payload = validSharePayload();
          return {
            ...payload,
            progress: { ...payload.progress, extra: true },
          };
        },
      },
      {
        label: "extra lesson key",
        payload: () => {
          const payload = validSharePayload();
          const lessonId = SHARE_COURSES[0].lessonId;
          return {
            ...payload,
            progress: {
              ...payload.progress,
              lessons: {
                [lessonId]: {
                  ...payload.progress.lessons[lessonId],
                  extra: true,
                },
              },
            },
          };
        },
      },
      {
        label: "extra workshop key",
        payload: () => {
          const payload = validSharePayload();
          return {
            ...payload,
            progress: {
              ...payload.progress,
              workshopQuiz: {
                ...payload.progress.workshopQuiz,
                extra: true,
              },
            },
          };
        },
      },
    ])("rejects $label", ({ payload }) => {
      expect(deserializeProgress(encodePayload(payload()))).toBeNull();
    });

    it("rejects non-plain and prototype-pollution lesson records", () => {
      const payload = validSharePayload();
      const pollutedLessons = {
        ["__proto__"]: payload.progress.lessons[
          SHARE_COURSES[0].lessonId
        ],
      };
      expect(
        deserializeProgress(
          encodePayload({
            ...payload,
            progress: { ...payload.progress, lessons: pollutedLessons },
          }),
        ),
      ).toBeNull();
    });

    it("rejects non-canonical lesson and section IDs", () => {
      const payload = validSharePayload();
      const lesson = payload.progress.lessons[SHARE_COURSES[0].lessonId];
      const badLessonPayload = {
        ...payload,
        progress: {
          ...payload.progress,
          lessons: { not_a_real_lesson: lesson },
        },
      };
      const badSectionPayload = {
        ...payload,
        progress: {
          ...payload.progress,
          lessons: {
            [SHARE_COURSES[0].lessonId]: {
              ...lesson,
              // Canonical for the overlapping EU lesson, not for this course.
              sectionsRead: ["block_1_lesson_1_section_3"],
            },
          },
        },
      };

      expect(
        deserializeProgress(encodePayload(badLessonPayload)),
      ).toBeNull();
      expect(
        deserializeProgress(encodePayload(badSectionPayload)),
      ).toBeNull();
    });

    it("rejects duplicate canonical section IDs and excessive counts", () => {
      const payload = validSharePayload();
      const lessonId = SHARE_COURSES[0].lessonId;
      const lesson = payload.progress.lessons[lessonId];
      const duplicateSections = {
        ...payload,
        progress: {
          ...payload.progress,
          lessons: {
            [lessonId]: {
              ...lesson,
              sectionsRead: [
                SHARE_COURSES[0].sectionId,
                SHARE_COURSES[0].sectionId,
              ],
            },
          },
        },
      };
      const excessiveSections = {
        ...payload,
        progress: {
          ...payload.progress,
          lessons: {
            [lessonId]: {
              ...lesson,
              sectionsRead: [
                "block_1_lesson_1_section_1",
                "block_1_lesson_1_section_2",
                "block_1_lesson_1_section_1",
              ],
            },
          },
        },
      };
      expect(
        deserializeProgress(encodePayload(duplicateSections)),
      ).toBeNull();
      expect(
        deserializeProgress(encodePayload(excessiveSections)),
      ).toBeNull();
    });

    it.each([
      { label: "score above one", quizScore: 1.01, quizTotal: 3 },
      { label: "negative score", quizScore: -0.1, quizTotal: 3 },
      { label: "fractional total", quizScore: 0.5, quizTotal: 2.5 },
      { label: "excessive total", quizScore: 1, quizTotal: 101 },
      { label: "non-integral result", quizScore: 0.5, quizTotal: 3 },
      { label: "unpaired null", quizScore: null, quizTotal: 3 },
    ])("rejects invalid lesson quiz numbers: $label", (quiz) => {
      const payload = validSharePayload();
      const lessonId = SHARE_COURSES[0].lessonId;
      expect(
        deserializeProgress(
          encodePayload({
            ...payload,
            progress: {
              ...payload.progress,
              lessons: {
                [lessonId]: {
                  ...payload.progress.lessons[lessonId],
                  quizScore: quiz.quizScore,
                  quizTotal: quiz.quizTotal,
                },
              },
            },
          }),
        ),
      ).toBeNull();
    });

    it.each([
      {
        label: "out-of-range workshop score",
        workshopQuiz: {
          passed: true,
          score: 1.01,
          completedAt: FIXED_TIMESTAMP,
        },
      },
      {
        label: "pass below threshold",
        workshopQuiz: {
          passed: true,
          score: 0.1,
          completedAt: FIXED_TIMESTAMP,
        },
      },
      {
        label: "score without an attempt timestamp",
        workshopQuiz: { passed: false, score: 0.5, completedAt: null },
      },
    ])("rejects invalid workshop state: $label", ({ workshopQuiz }) => {
      const payload = validSharePayload();
      expect(
        deserializeProgress(
          encodePayload({
            ...payload,
            progress: { ...payload.progress, workshopQuiz },
          }),
        ),
      ).toBeNull();
    });

    it("rejects a finite-overflow JSON number", () => {
      const json = JSON.stringify(validSharePayload()).replace(
        '"score":0.8',
        '"score":1e999',
      );
      expect(deserializeProgress(encodeTextAsBase64Url(json))).toBeNull();
    });

    it.each([
      "2019-12-31T23:59:59.999Z",
      "2100-01-01T00:00:00.000Z",
      "2026-07-29",
      "not-a-date",
    ])("rejects out-of-bounds or non-canonical dates: %s", (startedAt) => {
      const payload = validSharePayload();
      expect(
        deserializeProgress(
          encodePayload({
            ...payload,
            progress: { ...payload.progress, startedAt },
          }),
        ),
      ).toBeNull();
    });

    it("rejects encoded and decoded payloads beyond their independent caps", () => {
      expect(deserializeProgress("A".repeat(16_385))).toBeNull();

      const payload = validSharePayload();
      const oversizedDecoded = encodePayload({
        ...payload,
        padding: "x".repeat(9_000),
      });
      expect(oversizedDecoded.length).toBeLessThan(16_385);
      expect(deserializeProgress(oversizedDecoded)).toBeNull();
    });

    it("rejects invalid UTF-8 and non-canonical base64url", () => {
      expect(deserializeProgress("_w")).toBeNull();
      expect(deserializeProgress("Zh")).toBeNull();
    });
  });

  // ─── importProgress: merge a serialized snapshot into the store ─────

  describe("importProgress", () => {
    it("returns false for an un-decodable payload and changes nothing", () => {
      expect(() => importProgress(COURSE, "@@not-decodable@@")).not.toThrow();
      expect(importProgress(COURSE, "@@not-decodable@@")).toBe(false);
      expect(getAllProgress(COURSE).lessons).toEqual({});
    });

    it("merges a valid snapshot only into its bound course", () => {
      const { lessonId, sectionId } = SHARE_COURSES[0];
      markSectionRead(COURSE, lessonId, sectionId);
      markLessonCompleted(COURSE, lessonId);
      saveLessonQuizScore(COURSE, lessonId, 2, 3);
      saveWorkshopQuizResult(COURSE, 0.8, true);
      const encoded = serializeProgress(COURSE) as string;

      resetProgress(COURSE);
      expect(importProgress(COURSE, encoded)).toBe(true);
      expect(isSectionRead(COURSE, lessonId, sectionId)).toBe(true);
      expect(isLessonCompleted(COURSE, lessonId)).toBe(true);
      expect(getLessonQuizScore(COURSE, lessonId)).toEqual({
        score: 2,
        total: 3,
      });
      expect(isWorkshopQuizPassed(COURSE)).toBe(true);
      expect(getWorkshopQuizResult(COURSE).score).toBe(0.8);
    });

    it("merges a failed workshop attempt into a fresh course", () => {
      saveWorkshopQuizResult(COURSE, 0.5, false);
      const encoded = serializeProgress(COURSE) as string;

      resetProgress(COURSE);
      expect(importProgress(COURSE, encoded)).toBe(true);
      expect(getWorkshopQuizResult(COURSE)).toMatchObject({
        passed: false,
        score: 0.5,
      });
      expect(getWorkshopQuizResult(COURSE).completedAt).not.toBeNull();
    });

    it("merges a higher workshop score after the local course already passed", () => {
      saveWorkshopQuizResult(COURSE, 0.9, true);
      const encoded = serializeProgress(COURSE) as string;

      resetProgress(COURSE);
      saveWorkshopQuizResult(COURSE, 0.75, true);
      expect(importProgress(COURSE, encoded)).toBe(true);
      expect(getWorkshopQuizResult(COURSE)).toMatchObject({
        passed: true,
        score: 0.9,
      });
    });

    it("rejects source/target course mismatch without cross-course writes", () => {
      const { lessonId, sectionId } = SHARE_COURSES[0];
      markSectionRead(COURSE, lessonId, sectionId);
      markLessonCompleted(COURSE, lessonId);
      const encoded = serializeProgress(COURSE) as string;
      const target = "eu-ai-act-kurs" as const;
      expect(() => importProgress(target, encoded)).not.toThrow();
      expect(importProgress(target, encoded)).toBe(false);
      expect(getAllProgress(target).lessons).toEqual({});
      expect(isWorkshopQuizPassed(target)).toBe(false);
    });

    it("rejects a non-canonical payload without throwing or partial writes", () => {
      const payload = validSharePayload();
      const lessonId = SHARE_COURSES[0].lessonId;
      const invalid = encodePayload({
        ...payload,
        progress: {
          ...payload.progress,
          lessons: {
            [lessonId]: {
              ...payload.progress.lessons[lessonId],
              sectionsRead: ["not-a-real-section"],
            },
          },
        },
      });

      expect(() => importProgress(COURSE, invalid)).not.toThrow();
      expect(importProgress(COURSE, invalid)).toBe(false);
      expect(getAllProgress(COURSE).lessons).toEqual({});
    });
  });

  // ─── buildProgressUrl ──────────────────────────────────────────────

  describe("buildProgressUrl", () => {
    it("returns null when there is nothing to encode", () => {
      expect(buildProgressUrl(COURSE, "https://x.test/kurs")).toBeNull();
    });

    it("appends the encoded progress to the base URL hash", () => {
      markSectionRead(
        COURSE,
        "block_1_lesson_1",
        "block_1_lesson_1_section_1",
      );
      const encoded = serializeProgress(COURSE);
      const url = buildProgressUrl(COURSE, "https://x.test/kurs");
      expect(url).toBe(`https://x.test/kurs#progress=${encoded}`);
    });
  });
});
