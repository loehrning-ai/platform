// ─── Forward-migrator unit tests ──
//
// `store.test.ts` covers golden-file migrations through the full store.
// This file pins the migrator itself: malformed/partial legacy payloads,
// the never-wipe R1 contract (migrate only READS legacy keys), idempotency,
// and the quota-exceeded write path in the store's persist().

import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

import {
  LEGACY_AI_NATIVE_KEY,
  LEGACY_COURSE_KEY_PREFIX,
  LEGACY_KI_F_FLAT_KEY,
  freshUnified,
  migrateLegacyToUnified,
  truncateExerciseSummaries,
  upgradeHistoricalCompletionEvidence,
} from "./migrate";
import {
  COMPLETION_EVIDENCE_CUTOVER_CHECKPOINT_KEY,
  MAX_EXERCISE_SUMMARY_BYTES,
  UNIFIED_SCHEMA_VERSION,
  UNIFIED_STORAGE_KEY,
  legacyCompletionEvidenceCheckpointKey,
  type UnifiedProgress,
} from "./types";
import {
  CANONICAL_LESSON_IDS,
  isLessonCompletionEvidenceBacked,
} from "@/lib/courses/completion";
import {
  __resetCacheForTests,
  isLessonCompleted,
  markLessonCompleted,
} from "./store";

const KI_F_KEY = `${LEGACY_COURSE_KEY_PREFIX}ki-fuehrerschein`;
const EU_KEY = `${LEGACY_COURSE_KEY_PREFIX}eu-ai-act-kurs`;

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

/** Minimal valid legacy course payload with one completed lesson. */
function validLegacySlice() {
  return {
    lessons: {
      l1: {
        sectionsRead: ["s1"],
        quizScore: 0.8,
        quizTotal: 5,
        completed: true,
      },
    },
    workshopQuiz: {
      passed: true,
      score: 90,
      completedAt: "2026-03-15T09:30:00.000Z",
    },
    startedAt: "2026-03-10T08:00:00.000Z",
    lastActivity: "2026-03-15T09:30:00.000Z",
  };
}

beforeAll(() => {
  if (
    typeof localStorage === "undefined" ||
    typeof localStorage.setItem !== "function"
  ) {
    installLocalStoragePolyfill();
  }
});

beforeEach(() => {
  localStorage.clear();
  __resetCacheForTests();
});

describe("freshUnified", () => {
  it("returns an empty post-cutover v3 store with zeroed gamification", () => {
    const s = freshUnified();
    expect(s.schemaVersion).toBe(UNIFIED_SCHEMA_VERSION);
    expect(s.courses).toEqual({});
    expect(s.xp).toBe(0);
    expect(s.checkpoints).toEqual({
      [COMPLETION_EVIDENCE_CUTOVER_CHECKPOINT_KEY]: true,
    });
    expect(s.badges).toEqual({});
    expect(s.streak).toEqual({ days: 0, last: null });
    expect(typeof s.lastActivity).toBe("string");
  });
});

describe("historical completion evidence cutover", () => {
  const slug = "ki-fuehrerschein" as const;
  const lessonId = CANONICAL_LESSON_IDS[slug][0];
  const timestamp = "2026-03-15T09:30:00.000Z";

  function persistedBeforeCutover(resetAt?: string): UnifiedProgress {
    return {
      ...freshUnified(),
      checkpoints: {},
      courses: {
        [slug]: {
          lessons: {
            [lessonId]: {
              sectionsRead: [],
              quizScore: null,
              quizTotal: null,
              completed: true,
              exercisesCompleted: {},
            },
          },
          workshopQuiz: { passed: false, score: 0, completedAt: null },
          capstoneSubmitted: false,
          startedAt: timestamp,
          lastActivity: timestamp,
          ...(resetAt ? { resetAt } : {}),
        },
      },
    };
  }

  it("marks existing canonical completions once and is reference-idempotent", () => {
    const upgraded = upgradeHistoricalCompletionEvidence(
      persistedBeforeCutover(),
    );

    expect(upgraded.checkpoints).toMatchObject({
      [COMPLETION_EVIDENCE_CUTOVER_CHECKPOINT_KEY]: true,
      [legacyCompletionEvidenceCheckpointKey(slug, lessonId)]: true,
    });
    expect(upgradeHistoricalCompletionEvidence(upgraded)).toBe(upgraded);
  });

  it("never grandfathers a raw completion written into a post-cutover store", () => {
    const postCutover: UnifiedProgress = {
      ...persistedBeforeCutover(),
      checkpoints: {
        [COMPLETION_EVIDENCE_CUTOVER_CHECKPOINT_KEY]: true,
      },
    };

    expect(upgradeHistoricalCompletionEvidence(postCutover)).toBe(postCutover);
    expect(
      postCutover.checkpoints[
        legacyCompletionEvidenceCheckpointKey(slug, lessonId)
      ],
    ).toBeUndefined();
  });

  it("grandfathers a genuine reset-then-recomplete slice with an epoch-scoped marker", () => {
    const resetAt = timestamp;
    const recompleted = persistedBeforeCutover(resetAt);
    recompleted.courses[slug] = {
      ...recompleted.courses[slug]!,
      lastActivity: "2026-03-15T09:31:00.000Z",
    };
    const upgraded = upgradeHistoricalCompletionEvidence(recompleted);
    const marker = legacyCompletionEvidenceCheckpointKey(
      slug,
      lessonId,
      resetAt,
    );

    expect(upgraded.checkpoints).toMatchObject({
      [COMPLETION_EVIDENCE_CUTOVER_CHECKPOINT_KEY]: true,
      [marker]: true,
    });
    expect(isLessonCompletionEvidenceBacked(upgraded, slug, lessonId)).toBe(
      true,
    );
    expect(upgradeHistoricalCompletionEvidence(upgraded)).toBe(upgraded);
  });

  it("does not grandfather stale completion that predates the reset epoch", () => {
    const stale = persistedBeforeCutover("2026-03-16T09:30:00.000Z");
    const upgraded = upgradeHistoricalCompletionEvidence(stale);

    expect(upgraded.checkpoints).toEqual({
      [COMPLETION_EVIDENCE_CUTOVER_CHECKPOINT_KEY]: true,
    });
  });
});

describe("migrateLegacyToUnified — malformed legacy payloads", () => {
  it("returns a fresh store when nothing legacy exists", () => {
    const s = migrateLegacyToUnified();
    expect(s.courses).toEqual({});
    expect(s.xp).toBe(0);
  });

  it("never throws on malformed JSON in every legacy key, and never wipes them", () => {
    localStorage.setItem(KI_F_KEY, "{not valid json");
    localStorage.setItem(EU_KEY, "[[[");
    localStorage.setItem(LEGACY_AI_NATIVE_KEY, "\u0000garbage");
    localStorage.setItem(LEGACY_KI_F_FLAT_KEY, "{");

    let result: ReturnType<typeof migrateLegacyToUnified> | null = null;
    expect(() => {
      result = migrateLegacyToUnified();
    }).not.toThrow();
    expect(result!.courses).toEqual({});

    // R1: corrupt payloads are skipped, NOT deleted.
    expect(localStorage.getItem(KI_F_KEY)).toBe("{not valid json");
    expect(localStorage.getItem(EU_KEY)).toBe("[[[");
    expect(localStorage.getItem(LEGACY_AI_NATIVE_KEY)).toBe("\u0000garbage");
    expect(localStorage.getItem(LEGACY_KI_F_FLAT_KEY)).toBe("{");
  });

  it("migrates the valid key and skips the corrupt sibling", () => {
    localStorage.setItem(KI_F_KEY, JSON.stringify(validLegacySlice()));
    localStorage.setItem(LEGACY_AI_NATIVE_KEY, "{corrupt");
    const s = migrateLegacyToUnified();
    expect(Object.keys(s.courses)).toEqual(["ki-fuehrerschein"]);
    expect(s.courses["ki-fuehrerschein"]?.lessons.l1.completed).toBe(true);
    expect(s.courses["ki-fuehrerschein"]?.workshopQuiz.score).toBe(0.9);
    expect(localStorage.getItem(LEGACY_AI_NATIVE_KEY)).toBe("{corrupt");
  });
});

describe("migrateLegacyToUnified — partial / wrong-typed shapes", () => {
  it.each([
    { stored: 0.875, expected: 0.875 },
    { stored: 92, expected: 0.92 },
    { stored: 100, expected: 1 },
    { stored: -1, expected: 0 },
    { stored: 101, expected: 0 },
  ])(
    "normalizes legacy workshop score $stored to $expected",
    ({ stored, expected }) => {
      localStorage.setItem(
        KI_F_KEY,
        JSON.stringify({
          ...validLegacySlice(),
          workshopQuiz: {
            ...validLegacySlice().workshopQuiz,
            score: stored,
          },
        }),
      );

      expect(
        migrateLegacyToUnified().courses["ki-fuehrerschein"]?.workshopQuiz
          .score,
      ).toBe(expected);
    },
  );

  it("coerces wrong-typed lesson fields to safe defaults", () => {
    localStorage.setItem(
      KI_F_KEY,
      JSON.stringify({
        lessons: {
          l1: {
            sectionsRead: "not-an-array",
            quizScore: "0.9",
            quizTotal: null,
            completed: "yes",
            exercisesCompleted: null,
          },
        },
        workshopQuiz: null,
        startedAt: 12345,
      }),
    );
    const s = migrateLegacyToUnified();
    const lesson = s.courses["ki-fuehrerschein"]!.lessons.l1;
    expect(lesson.sectionsRead).toEqual([]);
    expect(lesson.quizScore).toBeNull(); // string score is NOT parsed
    expect(lesson.quizTotal).toBeNull();
    expect(lesson.completed).toBe(false); // only === true counts
    expect(lesson.exercisesCompleted).toEqual({});
    // null workshopQuiz + numeric startedAt get defaults
    expect(s.courses["ki-fuehrerschein"]!.workshopQuiz).toEqual({
      passed: false,
      score: 0,
      completedAt: null,
    });
    expect(typeof s.courses["ki-fuehrerschein"]!.startedAt).toBe("string");
  });

  it("filters non-string sectionsRead members and drops null lesson entries", () => {
    localStorage.setItem(
      KI_F_KEY,
      JSON.stringify({
        lessons: {
          l1: { sectionsRead: ["s1", 2, null, {}, "s2"], completed: true },
          l2: null,
          l3: "nope",
        },
      }),
    );
    const s = migrateLegacyToUnified();
    const lessons = s.courses["ki-fuehrerschein"]!.lessons;
    expect(Object.keys(lessons)).toEqual(["l1"]);
    expect(lessons.l1.sectionsRead).toEqual(["s1", "s2"]);
  });

  it("coerces wrong-typed exercise fields and skips non-object exercises", () => {
    localStorage.setItem(
      LEGACY_AI_NATIVE_KEY,
      JSON.stringify({
        lessons: {
          l1: {
            exercisesCompleted: {
              exA: { score: "9", attempts: "x", completedAt: 42, skipped: 1 },
              exB: null,
            },
          },
        },
      }),
    );
    const s = migrateLegacyToUnified();
    const ex = s.courses["ai-native"]!.lessons.l1.exercisesCompleted;
    expect(Object.keys(ex)).toEqual(["exA"]);
    expect(ex.exA).toEqual({
      exerciseId: "exA", // falls back to the record key
      kind: "unknown",
      completed: false,
      score: null,
      attempts: 0,
      completedAt: null,
      skipped: false,
    });
  });

  it("skips a slice whose lessons field is missing or null", () => {
    localStorage.setItem(KI_F_KEY, JSON.stringify({ lessons: null }));
    localStorage.setItem(
      EU_KEY,
      JSON.stringify({ workshopQuiz: { passed: true } }),
    );
    const s = migrateLegacyToUnified();
    expect(s.courses).toEqual({});
  });
});

describe("migrateLegacyToUnified — R1 never-wipe contract", () => {
  it("a corrupted unified payload does not wipe legacy keys, and their data is recovered", () => {
    localStorage.setItem(UNIFIED_STORAGE_KEY, "{corrupt unified blob");
    localStorage.setItem(KI_F_KEY, JSON.stringify(validLegacySlice()));

    const s = migrateLegacyToUnified();
    expect(s.courses["ki-fuehrerschein"]?.lessons.l1.completed).toBe(true);
    // Migration only READS — both keys are still there afterwards.
    expect(localStorage.getItem(UNIFIED_STORAGE_KEY)).toBe(
      "{corrupt unified blob",
    );
    expect(localStorage.getItem(KI_F_KEY)).not.toBeNull();
  });

  it("an unrecognized ai-native schemaVersion migrates forward with a warning, not a wipe", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      localStorage.setItem(
        LEGACY_AI_NATIVE_KEY,
        JSON.stringify({ ...validLegacySlice(), schemaVersion: 99 }),
      );
      const s = migrateLegacyToUnified();
      expect(s.courses["ai-native"]?.lessons.l1.completed).toBe(true);
      expect(localStorage.getItem(LEGACY_AI_NATIVE_KEY)).not.toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("migrated forward (not wiped)"),
      );
    } finally {
      warnSpy.mockRestore();
    }
  });
});

describe("migrateLegacyToUnified — idempotency + key precedence", () => {
  it("running the migration twice yields the same course data", () => {
    localStorage.setItem(KI_F_KEY, JSON.stringify(validLegacySlice()));
    localStorage.setItem(
      LEGACY_AI_NATIVE_KEY,
      JSON.stringify({ ...validLegacySlice(), capstoneSubmitted: true }),
    );
    const first = migrateLegacyToUnified();
    const second = migrateLegacyToUnified();
    // Read-only migration: identical course payloads on every run.
    expect(second.courses).toEqual(first.courses);
    expect(second.xp).toBe(first.xp);
    expect(second.badges).toEqual(first.badges);
    expect(second.checkpoints).toEqual(first.checkpoints);
  });

  it("the namespaced ki-fuehrerschein key wins over the oldest flat key", () => {
    const namespaced = validLegacySlice();
    const flat = {
      ...validLegacySlice(),
      lessons: { flatLesson: { sectionsRead: [], completed: true } },
    };
    localStorage.setItem(KI_F_KEY, JSON.stringify(namespaced));
    localStorage.setItem(LEGACY_KI_F_FLAT_KEY, JSON.stringify(flat));
    const s = migrateLegacyToUnified();
    const lessons = s.courses["ki-fuehrerschein"]!.lessons;
    expect(lessons.l1).toBeDefined();
    expect(lessons.flatLesson).toBeUndefined();
  });

  it("the flat ki-fuehrerschein key never feeds other course slugs", () => {
    localStorage.setItem(
      LEGACY_KI_F_FLAT_KEY,
      JSON.stringify(validLegacySlice()),
    );
    const s = migrateLegacyToUnified();
    expect(Object.keys(s.courses)).toEqual(["ki-fuehrerschein"]);
    expect(s.courses["eu-ai-act-kurs"]).toBeUndefined();
  });
});

describe("store persist — quota exceeded", () => {
  it("a QuotaExceededError on setItem fails closed without caching the rejected write", () => {
    // vi.spyOn against jsdom's Storage instance proved realm-fragile on the
    // CI runner (spy attached, store wrote through an un-spied resolution).
    // Use the same mechanism as this file's polyfill instead: define an OWN
    // localStorage property on globalThis with a throwing setItem - bare
    // `localStorage` in the store resolves to it in every environment.
    const original = Object.getOwnPropertyDescriptor(
      globalThis,
      "localStorage",
    );
    let throwCount = 0;
    const backing = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        get length() {
          return backing.size;
        },
        clear: () => backing.clear(),
        getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
        key: () => null,
        removeItem: (k: string) => void backing.delete(k),
        setItem: () => {
          throwCount += 1;
          throw new DOMException("quota exceeded", "QuotaExceededError");
        },
      } satisfies Storage,
    });
    try {
      // Force a fresh load through the throwing store.
      __resetCacheForTests();
      expect(() =>
        markLessonCompleted("ki-fuehrerschein", "block_1_lesson_1"),
      ).not.toThrow();
      // A rejected browser write must not create transient completion that
      // disappears on reload or unlocks evidence-dependent UI.
      expect(isLessonCompleted("ki-fuehrerschein", "block_1_lesson_1")).toBe(
        false,
      );
      expect(throwCount).toBeGreaterThan(0);
      // Nothing was persisted or cached, but the failure stayed bounded.
      expect(localStorage.getItem(UNIFIED_STORAGE_KEY)).toBeNull();
    } finally {
      if (original) {
        Object.defineProperty(globalThis, "localStorage", original);
      }
      __resetCacheForTests();
    }
  });
});

//: the v2->v3 migration step re-normalizes any exercise
// summary that predates the byte cap, wired into store.ts's parseUnified().
describe("truncateExerciseSummaries (v2->v3 migration step)", () => {
  it("truncates an oversized summary to the byte cap", () => {
    const longSummary = "Über KI-Kompetenz und Verantwortung. ".repeat(50);
    const input: UnifiedProgress = {
      ...freshUnified(),
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
    };
    const result = truncateExerciseSummaries(input);
    const summary =
      result.courses["ai-native"]?.lessons.l1.exercisesCompleted.ex1.summary;
    expect(summary).toBeDefined();
    expect(new TextEncoder().encode(summary ?? "").length).toBeLessThanOrEqual(
      MAX_EXERCISE_SUMMARY_BYTES,
    );
  });

  it("returns the exact same reference when nothing needs truncation (structural sharing)", () => {
    const input = freshUnified();
    expect(truncateExerciseSummaries(input)).toBe(input);
  });

  it("leaves an already-short summary and every other field untouched", () => {
    const input: UnifiedProgress = {
      ...freshUnified(),
      xp: 42,
      courses: {
        "ki-fuehrerschein": {
          lessons: {
            l1: {
              sectionsRead: ["s1"],
              quizScore: 0.5,
              quizTotal: 1,
              completed: true,
              exercisesCompleted: {
                ex1: {
                  exerciseId: "ex1",
                  kind: "quiz",
                  completed: true,
                  score: 1,
                  attempts: 1,
                  completedAt: "2026-01-01T00:00:00.000Z",
                  skipped: false,
                  summary: "kurz und gut",
                },
              },
            },
          },
          workshopQuiz: {
            passed: true,
            score: 1,
            completedAt: "2026-01-01T00:00:00.000Z",
          },
          capstoneSubmitted: false,
          startedAt: "2026-01-01T00:00:00.000Z",
          lastActivity: "2026-01-01T00:00:00.000Z",
        },
      },
    };
    const result = truncateExerciseSummaries(input);
    expect(result).toEqual(input);
    expect(result.xp).toBe(42);
  });
});
