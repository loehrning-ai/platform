// ─── Cross-device progress sync tests (regression coverage) ──
//
// server-sync.ts is the pure logic behind the account/progress API routes
// (/api/progress, /api/account/export). It is NOT covered by the migrate/store
// suites, and the only other reference (account/route.test.ts) mocks it away.
// Exported functions, all pure:
//   • isUnifiedProgress(value)         runtime type-guard that gates untrusted
//                                      payloads read back from the server/DB.
//   • mergeUnifiedProgress(a, b)       last-writer-wins-ish CRDT merge used to
//                                      reconcile local + remote progress
//                                      (the full, client-facing blob shape).
// • mergeCourseSlice/mergeMetaFields — the same merge
//     logic, decomposed so the per-course-row persistence layer
//     (server-store.ts) can merge one row at a time instead of one blob.
// • isUnifiedCourseSlice/isUnifiedMetaFields/META_ROW_COURSE_SLUG (
//     stage 5) — row-shape validators for the per-row DB persistence layer.
// Every assertion below is derived by reading the source and pins real
// input -> real output (no mock return values are asserted).

import { describe, it, expect } from "vitest";
import {
  META_ROW_COURSE_SLUG,
  calculateEarnedXp,
  isUnifiedCourseSlice,
  isUnifiedMetaFields,
  isUnifiedProgress,
  mergeCourseSlice,
  mergeMetaFields,
  mergeUnifiedProgress,
} from "./server-sync";
import { COURSE_SLUGS } from "@/lib/course/types";
import { MAX_EXERCISE_SUMMARY_BYTES, XP } from "./types";
import type {
  UnifiedCourseSlice,
  UnifiedExerciseResult,
  UnifiedLessonProgress,
  UnifiedProgress,
} from "./types";

// ── Valid-shape builders (each default is a genuinely valid unit) ──────────

function exercise(over: Partial<UnifiedExerciseResult> = {}): UnifiedExerciseResult {
  return {
    exerciseId: "exA",
    kind: "quiz",
    completed: true,
    score: 8,
    attempts: 2,
    completedAt: "2026-03-01T00:00:00.000Z",
    skipped: false,
    ...over,
  };
}

function lesson(over: Partial<UnifiedLessonProgress> = {}): UnifiedLessonProgress {
  return {
    sectionsRead: [],
    quizScore: 0.8,
    quizTotal: 5,
    completed: true,
    exercisesCompleted: {},
    ...over,
  };
}

function slice(over: Partial<UnifiedCourseSlice> = {}): UnifiedCourseSlice {
  return {
    lessons: {},
    workshopQuiz: { passed: false, score: 0, completedAt: null },
    capstoneSubmitted: false,
    startedAt: "2026-02-01T00:00:00.000Z",
    lastActivity: "2026-02-10T00:00:00.000Z",
    ...over,
  };
}

function progress(over: Partial<UnifiedProgress> = {}): UnifiedProgress {
  return {
    schemaVersion: 3,
    courses: {},
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: "2026-06-03T00:00:00.000Z",
    ...over,
  };
}

const AI_NATIVE_LESSON = "modul_1_lesson_1";
const AI_NATIVE_SECTION = "modul_1_lesson_1_section_1";
const KF_LESSON = "block_1_lesson_1";
const KF_SECTION = "block_1_lesson_1_section_1";
const EU_LESSON = "block_1_lesson_1";
const SOCIETY_LESSON = "arbeit-1-1";
const SOCIETY_SECTION = "arbeit-1-1-s1";

/** JSON round-trip clone (fixtures are JSON-safe: only primitives + null). */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ── isUnifiedProgress ──────────────────────────────────────────────────────

describe("isUnifiedProgress", () => {
  it("accepts a minimal empty v3 store", () => {
    expect(isUnifiedProgress(progress())).toBe(true);
  });

  it("accepts a deeply populated valid store (course + lesson + exercise + workshop quiz)", () => {
    const state = progress({
      xp: 320,
      checkpoints: { "l1::c1": true },
      badges: { "first-light": "2026-05-01T00:00:00.000Z" },
      streak: { days: 4, last: "2026-06-03" },
      courses: {
        "ai-native": slice({
          lessons: {
            [AI_NATIVE_LESSON]: lesson({
              sectionsRead: [AI_NATIVE_SECTION],
              exercisesCompleted: { exA: exercise() },
            }),
          },
          workshopQuiz: { passed: true, score: 0.9, completedAt: "2026-05-02T00:00:00.000Z" },
          capstoneSubmitted: true,
        }),
      },
    });
    expect(isUnifiedProgress(state)).toBe(true);
  });

  it("accepts EVERY canonical course slug (regression: ki-und-gesellschaft was rejected)", () => {
    // The valid-slug set was hardcoded to 3 slugs, missing ki-und-gesellschaft.
    // A store touching that course was rejected on PUT, silently killing the
    // learner's entire cross-device sync. Guard all four here so a new course
    // added to COURSE_SLUGS without wiring is caught.
    for (const slug of COURSE_SLUGS) {
      const state = progress({ courses: { [slug]: slice() } });
      expect(isUnifiedProgress(state), `slug ${slug} must be accepted`).toBe(true);
    }
    // ki-und-gesellschaft specifically, populated like a real learner's slice.
    expect(
      isUnifiedProgress(
        progress({
          courses: {
            "ki-und-gesellschaft": slice({
              lessons: {
                [SOCIETY_LESSON]: lesson({
                  sectionsRead: [SOCIETY_SECTION],
                }),
              },
              workshopQuiz: { passed: true, score: 0.8, completedAt: "2026-06-01T00:00:00.000Z" },
            }),
          },
        }),
      ),
    ).toBe(true);
  });

  it("rejects a store containing an unknown course slug", () => {
    const invalidProgress: unknown = {
      ...progress(),
      courses: { "not-a-real-course": slice() },
    };
    expect(isUnifiedProgress(invalidProgress)).toBe(false);
  });

  it("rejects non-record roots", () => {
    expect(isUnifiedProgress(null)).toBe(false);
    expect(isUnifiedProgress(undefined)).toBe(false);
    expect(isUnifiedProgress("v2")).toBe(false);
    expect(isUnifiedProgress(42)).toBe(false);
    expect(isUnifiedProgress([])).toBe(false);
  });

  it("rejects the wrong schemaVersion (strict === 3, number not string; )", () => {
    expect(isUnifiedProgress({ ...progress(), schemaVersion: 1 })).toBe(false);
    // v2 (pre shared blob) must not be accepted as-is; a v2
    // payload has to go through the migrate.ts v2->v3 step first.
    expect(isUnifiedProgress({ ...progress(), schemaVersion: 2 })).toBe(false);
    // A stringified "3" must not slip through the strict identity check.
    expect(isUnifiedProgress({ ...progress(), schemaVersion: "3" })).toBe(false);
  });

  it("rejects non-finite or negative xp", () => {
    expect(isUnifiedProgress({ ...progress(), xp: -1 })).toBe(false);
    expect(isUnifiedProgress({ ...progress(), xp: Number.NaN })).toBe(false);
    expect(isUnifiedProgress({ ...progress(), xp: Number.POSITIVE_INFINITY })).toBe(false);
    expect(isUnifiedProgress({ ...progress(), xp: "10" })).toBe(false);
  });

  it("requires every checkpoint value to be a boolean", () => {
    expect(isUnifiedProgress({ ...progress(), checkpoints: { "l1::c1": true } })).toBe(true);
    expect(isUnifiedProgress({ ...progress(), checkpoints: { "l1::c1": "yes" } })).toBe(false);
    expect(isUnifiedProgress({ ...progress(), checkpoints: [] })).toBe(false);
  });

  it("requires every badge value to be a string timestamp", () => {
    expect(
      isUnifiedProgress({
        ...progress(),
        badges: { b: "2026-01-01T00:00:00.000Z" },
      }),
    ).toBe(true);
    expect(isUnifiedProgress({ ...progress(), badges: { b: "2026-01-01" } })).toBe(false);
    expect(isUnifiedProgress({ ...progress(), badges: { b: "not-a-date" } })).toBe(false);
    expect(isUnifiedProgress({ ...progress(), badges: { b: 1 } })).toBe(false);
  });

  it("validates the streak shape (integer days >= 0, last string|null)", () => {
    expect(isUnifiedProgress({ ...progress(), streak: { days: 0, last: null } })).toBe(true);
    expect(isUnifiedProgress({ ...progress(), streak: { days: 3, last: "2026-01-03" } })).toBe(true);
    expect(isUnifiedProgress({ ...progress(), streak: { days: -1, last: null } })).toBe(false);
    expect(isUnifiedProgress({ ...progress(), streak: { days: 1.5, last: null } })).toBe(false);
    expect(isUnifiedProgress({ ...progress(), streak: { days: 2, last: 42 } })).toBe(false);
  });

  it("requires lastActivity to be a full ISO timestamp", () => {
    expect(isUnifiedProgress({ ...progress(), lastActivity: 1717372800000 })).toBe(false);
    expect(isUnifiedProgress({ ...progress(), lastActivity: null })).toBe(false);
    expect(isUnifiedProgress({ ...progress(), lastActivity: "2026-06-03" })).toBe(false);
    expect(isUnifiedProgress({ ...progress(), lastActivity: "not-a-date" })).toBe(false);
    expect(
      isUnifiedProgress({
        ...progress(),
        lastActivity: "2026-02-30T00:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("merges equivalent offset timestamps commutatively", () => {
    const left = progress({
      lastActivity: "2026-01-01T00:00:00.000Z",
      badges: { first: "2026-01-01T00:00:00.000Z" },
    });
    const right = progress({
      lastActivity: "2025-12-31T19:00:00.000-05:00",
      badges: { first: "2025-12-31T19:00:00.000-05:00" },
    });

    expect(mergeUnifiedProgress(left, right)).toEqual(
      mergeUnifiedProgress(right, left),
    );
  });

  it("treats a reset epoch as a deletion barrier across stale devices", () => {
    const stale = progress({
      courses: {
        "ai-native": slice({
          lessons: { old: lesson({ completed: true }) },
          lastActivity: "2999-01-01T00:00:00.000Z",
        }),
      },
    });
    const resetAt = "2026-07-28T00:00:00.000Z";
    const reset = progress({
      courses: {
        "ai-native": slice({
          lessons: {},
          startedAt: resetAt,
          lastActivity: resetAt,
          resetAt,
        }),
      },
    });

    const merged = mergeUnifiedProgress(stale, reset);
    expect(merged.courses["ai-native"]?.lessons).toEqual({});
    expect(merged.courses["ai-native"]?.resetAt).toBe(resetAt);
    expect(mergeUnifiedProgress(reset, stale)).toEqual(merged);

    const newLearning = progress({
      courses: {
        "ai-native": slice({
          lessons: { fresh: lesson({ completed: true }) },
          startedAt: resetAt,
          lastActivity: "2026-07-28T00:01:00.000Z",
          resetAt,
        }),
      },
    });
    expect(
      mergeUnifiedProgress(reset, newLearning).courses["ai-native"]?.lessons
        .fresh,
    ).toBeDefined();
  });

  it("rejects a course keyed by an unknown course slug", () => {
    expect(isUnifiedProgress({ ...progress(), courses: { "not-a-course": slice() } })).toBe(false);
  });

  it("rejects fabricated lesson IDs and noncanonical or duplicate section IDs", () => {
    expect(
      isUnifiedProgress(
        progress({
          courses: {
            "ki-fuehrerschein": slice({
              lessons: { "fabricated-lesson": lesson() },
            }),
          },
        }),
      ),
    ).toBe(false);

    for (const sectionsRead of [
      [KF_SECTION, "fabricated-section"],
      [KF_SECTION, KF_SECTION],
    ]) {
      expect(
        isUnifiedProgress(
          progress({
            courses: {
              "ki-fuehrerschein": slice({
                lessons: {
                  [KF_LESSON]: lesson({ sectionsRead }),
                },
              }),
            },
          }),
        ),
      ).toBe(false);
    }
  });

  it("rejects a course slice with an invalid workshop quiz (null score)", () => {
    const bad = slice({ workshopQuiz: { passed: false, score: null as unknown as number, completedAt: null } });
    expect(isUnifiedProgress({ ...progress(), courses: { "ai-native": bad } })).toBe(false);
  });

  it("rejects a workshop score outside the canonical 0..1 contract", () => {
    const bad = slice({
      workshopQuiz: { passed: true, score: 90, completedAt: null },
    });
    expect(
      isUnifiedProgress({
        ...progress(),
        courses: { "ai-native": bad },
      }),
    ).toBe(false);
  });

  it("rejects a lesson with a negative quiz score", () => {
    const bad = slice({
      lessons: { [KF_LESSON]: lesson({ quizScore: -3 }) },
    });
    expect(isUnifiedProgress({ ...progress(), courses: { "ki-fuehrerschein": bad } })).toBe(false);
  });

  it("rejects a lesson quiz score outside the normalized 0..1 contract", () => {
    const bad = slice({
      lessons: { [KF_LESSON]: lesson({ quizScore: 4 }) },
    });
    expect(
      isUnifiedProgress({
        ...progress(),
        courses: { "ki-fuehrerschein": bad },
      }),
    ).toBe(false);
  });

  it("rejects an exercise with a non-integer attempts count", () => {
    const bad = slice({
      lessons: {
        [EU_LESSON]: lesson({
          exercisesCompleted: { exA: exercise({ attempts: 1.5 }) },
        }),
      },
    });
    expect(isUnifiedProgress({ ...progress(), courses: { "eu-ai-act-kurs": bad } })).toBe(false);
  });

  it("rejects malformed nested timestamps and exercise-key mismatches", () => {
    const badCompletedAt = slice({
      lessons: {
        [AI_NATIVE_LESSON]: lesson({
          exercisesCompleted: {
            exA: exercise({ completedAt: "yesterday" }),
          },
        }),
      },
    });
    expect(
      isUnifiedProgress({
        ...progress(),
        courses: { "ai-native": badCompletedAt },
      }),
    ).toBe(false);

    const mismatchedKey = slice({
      lessons: {
        [AI_NATIVE_LESSON]: lesson({
          exercisesCompleted: {
            exA: exercise({ exerciseId: "different-id" }),
          },
        }),
      },
    });
    expect(
      isUnifiedProgress({
        ...progress(),
        courses: { "ai-native": mismatchedKey },
      }),
    ).toBe(false);
  });

  it("rejects exercise summaries above the UTF-8 byte limit", () => {
    const bad = slice({
      lessons: {
        [AI_NATIVE_LESSON]: lesson({
          exercisesCompleted: {
            exA: exercise({
              summary: "ü".repeat(MAX_EXERCISE_SUMMARY_BYTES),
            }),
          },
        }),
      },
    });
    expect(
      isUnifiedProgress({
        ...progress(),
        courses: { "ai-native": bad },
      }),
    ).toBe(false);
  });
});

// ── mergeUnifiedProgress ─────────────────────────────────────────────────────

describe("mergeUnifiedProgress - top-level ledger", () => {
  it("pins schemaVersion to 3 and takes the max xp", () => {
    const merged = mergeUnifiedProgress(progress({ xp: 100 }), progress({ xp: 250 }));
    expect(merged.schemaVersion).toBe(3);
    expect(merged.xp).toBe(250);
    // symmetric on the other ordering
    expect(mergeUnifiedProgress(progress({ xp: 250 }), progress({ xp: 100 })).xp).toBe(250);
  });

  it("takes the later lastActivity", () => {
    const merged = mergeUnifiedProgress(
      progress({ lastActivity: "2026-01-01T00:00:00.000Z" }),
      progress({ lastActivity: "2026-06-01T00:00:00.000Z" }),
    );
    expect(merged.lastActivity).toBe("2026-06-01T00:00:00.000Z");
  });

  it("unions checkpoints with completed state winning on key conflict", () => {
    const local = progress({ checkpoints: { "l1::c1": true, "l1::c2": false } });
    const remote = progress({ checkpoints: { "l1::c2": true, "l3::c1": true } });
    expect(mergeUnifiedProgress(local, remote).checkpoints).toEqual({
      "l1::c1": true,
      "l1::c2": true,
      "l3::c1": true,
    });
    expect(mergeUnifiedProgress(remote, local).checkpoints).toEqual(
      mergeUnifiedProgress(local, remote).checkpoints,
    );
  });

  it("unions badges while retaining the earliest award timestamp", () => {
    const local = progress({ badges: { "first-light": "2026-01-01T00:00:00.000Z" } });
    const remote = progress({
      badges: {
        "first-light": "2026-02-01T00:00:00.000Z",
        apprentice: "2026-02-05T00:00:00.000Z",
      },
    });
    expect(mergeUnifiedProgress(local, remote).badges).toEqual({
      "first-light": "2026-01-01T00:00:00.000Z",
      apprentice: "2026-02-05T00:00:00.000Z",
    });
    expect(mergeUnifiedProgress(remote, local).badges).toEqual(
      mergeUnifiedProgress(local, remote).badges,
    );
  });

  it("reconstructs additive XP from disjoint device achievements", () => {
    const local = progress({
      xp: XP.CHECKPOINT,
      checkpoints: { "course-a::checkpoint": true },
    });
    const remote = progress({
      xp: XP.CHECKPOINT,
      checkpoints: { "course-b::checkpoint": true },
    });
    const merged = mergeUnifiedProgress(local, remote);
    expect(merged.xp).toBe(XP.CHECKPOINT * 2);
    expect(calculateEarnedXp(merged)).toBe(XP.CHECKPOINT * 2);
  });

  it("does not derive XP from fabricated lessons or section IDs", () => {
    const state = progress({
      courses: {
        "ki-fuehrerschein": slice({
          lessons: {
            [KF_LESSON]: lesson({
              completed: true,
              sectionsRead: [KF_SECTION, "fabricated-section", KF_SECTION],
            }),
            "fabricated-lesson": lesson({
              completed: true,
              sectionsRead: ["s1", "s2", "s3"],
            }),
          },
        }),
      },
    });

    expect(calculateEarnedXp(state)).toBe(XP.LESSON + XP.SECTION);
  });
});

describe("mergeUnifiedProgress - streak", () => {
  it("keeps the streak observed on the later calendar date", () => {
    const local = progress({ streak: { days: 3, last: "2026-01-03" } });
    const remote = progress({ streak: { days: 7, last: "2026-01-07" } });
    expect(mergeUnifiedProgress(local, remote).streak).toEqual({ days: 7, last: "2026-01-07" });
    expect(mergeUnifiedProgress(remote, local).streak).toEqual({ days: 7, last: "2026-01-07" });
  });

  it("does not let a long stale streak override current activity", () => {
    const stale = progress({ streak: { days: 100, last: "2024-01-01" } });
    const current = progress({ streak: { days: 1, last: "2026-07-28" } });
    expect(mergeUnifiedProgress(stale, current).streak).toEqual({
      days: 1,
      last: "2026-07-28",
    });
  });

  it("on a tie in days keeps the days and the later last-visit date", () => {
    const local = progress({ streak: { days: 5, last: "2026-01-05" } });
    const remote = progress({ streak: { days: 5, last: "2026-01-08" } });
    expect(mergeUnifiedProgress(local, remote).streak).toEqual({ days: 5, last: "2026-01-08" });
  });
});

describe("mergeUnifiedProgress - courses", () => {
  it("carries over a course that exists on only one side", () => {
    const local = progress({
      courses: { "ki-fuehrerschein": slice({ capstoneSubmitted: true }) },
    });
    const remote = progress({ courses: { "ai-native": slice() } });
    const merged = mergeUnifiedProgress(local, remote);
    expect(Object.keys(merged.courses).sort()).toEqual(["ai-native", "ki-fuehrerschein"]);
    expect(merged.courses["ki-fuehrerschein"]?.capstoneSubmitted).toBe(true);
  });

  it("merges a shared course: lessons union, capstone OR, startedAt earliest, lastActivity latest", () => {
    const local = progress({
      courses: {
        "ai-native": slice({
          lessons: { l1: lesson({ completed: true }) },
          capstoneSubmitted: false,
          startedAt: "2026-02-01T00:00:00.000Z",
          lastActivity: "2026-03-01T00:00:00.000Z",
        }),
      },
    });
    const remote = progress({
      courses: {
        "ai-native": slice({
          lessons: { l2: lesson({ completed: true }) },
          capstoneSubmitted: true,
          startedAt: "2026-01-01T00:00:00.000Z",
          lastActivity: "2026-04-01T00:00:00.000Z",
        }),
      },
    });
    const s = mergeUnifiedProgress(local, remote).courses["ai-native"]!;
    expect(Object.keys(s.lessons).sort()).toEqual(["l1", "l2"]);
    expect(s.capstoneSubmitted).toBe(true);
    expect(s.startedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(s.lastActivity).toBe("2026-04-01T00:00:00.000Z");
  });

  it("normalizes legacy whole percentages before workshop max-merge", () => {
    const local = progress({
      courses: {
        "ai-native": slice({
          workshopQuiz: { passed: false, score: 60, completedAt: "2026-01-01T00:00:00.000Z" },
        }),
      },
    });
    const remote = progress({
      courses: {
        "ai-native": slice({
          workshopQuiz: { passed: true, score: 85, completedAt: "2026-03-01T00:00:00.000Z" },
        }),
      },
    });
    const wq = mergeUnifiedProgress(local, remote).courses["ai-native"]!.workshopQuiz;
    expect(wq).toEqual({ passed: true, score: 0.85, completedAt: "2026-03-01T00:00:00.000Z" });
  });

  it("does not let a legacy 90 preserve itself over a canonical 0.95", () => {
    const local = progress({
      courses: {
        "ai-native": slice({
          workshopQuiz: {
            passed: true,
            score: 90,
            completedAt: "2026-01-01T00:00:00.000Z",
          },
        }),
      },
    });
    const remote = progress({
      courses: {
        "ai-native": slice({
          workshopQuiz: {
            passed: true,
            score: 0.95,
            completedAt: "2026-03-01T00:00:00.000Z",
          },
        }),
      },
    });

    expect(
      mergeUnifiedProgress(local, remote).courses["ai-native"]?.workshopQuiz
        .score,
    ).toBe(0.95);
  });

  it("normalizes a legacy score when its course exists on only one side", () => {
    const merged = mergeUnifiedProgress(
      progress({
        courses: {
          "ai-native": slice({
            workshopQuiz: {
              passed: true,
              score: 90,
              completedAt: "2026-01-01T00:00:00.000Z",
            },
          }),
        },
      }),
      progress(),
    );

    expect(merged.courses["ai-native"]?.workshopQuiz.score).toBe(0.9);
  });
});

describe("mergeUnifiedProgress - lesson merge", () => {
  it("unions sectionsRead (deduped, local-first) and ORs completed", () => {
    const local = progress({
      courses: {
        "ai-native": slice({ lessons: { l1: lesson({ sectionsRead: ["s1", "s2"], completed: false }) } }),
      },
    });
    const remote = progress({
      courses: {
        "ai-native": slice({ lessons: { l1: lesson({ sectionsRead: ["s2", "s3"], completed: true }) } }),
      },
    });
    const l1 = mergeUnifiedProgress(local, remote).courses["ai-native"]!.lessons.l1;
    expect(l1.sectionsRead).toEqual(["s1", "s2", "s3"]);
    expect(l1.completed).toBe(true);
  });

  it("keeps the quiz from the side with the higher score ratio", () => {
    const local = progress({
      courses: { "ai-native": slice({ lessons: { l1: lesson({ quizScore: 0.4, quizTotal: 5 }) } }) },
    });
    const remote = progress({
      courses: { "ai-native": slice({ lessons: { l1: lesson({ quizScore: 0.8, quizTotal: 10 }) } }) },
    });
    const l1 = mergeUnifiedProgress(local, remote).courses["ai-native"]!.lessons.l1;
    expect(l1.quizScore).toBe(0.8);
    expect(l1.quizTotal).toBe(10);
  });

  it("compares the stored normalized scores without dividing twice", () => {
    const local = progress({
      courses: { "ai-native": slice({ lessons: { l1: lesson({ quizScore: 0.9, quizTotal: 20 }) } }) },
    });
    const remote = progress({
      courses: { "ai-native": slice({ lessons: { l1: lesson({ quizScore: 0.8, quizTotal: 5 }) } }) },
    });
    const l1 = mergeUnifiedProgress(local, remote).courses["ai-native"]!.lessons.l1;
    expect(l1.quizScore).toBe(0.9);
    expect(l1.quizTotal).toBe(20);
  });

  it("keeps a real local quiz over a remote lesson that has no quiz yet", () => {
    const local = progress({
      courses: { "ai-native": slice({ lessons: { l1: lesson({ quizScore: 0.6, quizTotal: 5 }) } }) },
    });
    const remote = progress({
      courses: { "ai-native": slice({ lessons: { l1: lesson({ quizScore: null, quizTotal: null }) } }) },
    });
    const l1 = mergeUnifiedProgress(local, remote).courses["ai-native"]!.lessons.l1;
    expect(l1.quizScore).toBe(0.6);
    expect(l1.quizTotal).toBe(5);
  });
});

describe("mergeUnifiedProgress - exercise merge", () => {
  it("merges a shared exercise: completed OR, score max, attempts max, completedAt latest, skipped OR", () => {
    const local = progress({
      courses: {
        "ai-native": slice({
          lessons: {
            l1: lesson({
              exercisesCompleted: {
                exA: exercise({
                  completed: false,
                  score: 3,
                  attempts: 1,
                  completedAt: "2026-01-01T00:00:00.000Z",
                  skipped: false,
                }),
              },
            }),
          },
        }),
      },
    });
    const remote = progress({
      courses: {
        "ai-native": slice({
          lessons: {
            l1: lesson({
              exercisesCompleted: {
                exA: exercise({
                  completed: true,
                  score: 9,
                  attempts: 4,
                  completedAt: "2026-02-01T00:00:00.000Z",
                  skipped: true,
                }),
              },
            }),
          },
        }),
      },
    });
    const exA = mergeUnifiedProgress(local, remote).courses["ai-native"]!.lessons.l1
      .exercisesCompleted.exA;
    expect(exA.completed).toBe(true);
    expect(exA.score).toBe(9);
    expect(exA.attempts).toBe(4);
    expect(exA.completedAt).toBe("2026-02-01T00:00:00.000Z");
    expect(exA.skipped).toBe(true);
  });

  it("collapses two null scores to null rather than -1", () => {
    const local = progress({
      courses: {
        "ai-native": slice({
          lessons: { l1: lesson({ exercisesCompleted: { exA: exercise({ score: null }) } }) },
        }),
      },
    });
    const remote = progress({
      courses: {
        "ai-native": slice({
          lessons: { l1: lesson({ exercisesCompleted: { exA: exercise({ score: null }) } }) },
        }),
      },
    });
    const exA = mergeUnifiedProgress(local, remote).courses["ai-native"]!.lessons.l1
      .exercisesCompleted.exA;
    expect(exA.score).toBeNull();
  });

  it("keeps exercises that exist on only one side of the lesson", () => {
    const local = progress({
      courses: {
        "ai-native": slice({
          lessons: { l1: lesson({ exercisesCompleted: { exA: exercise({ exerciseId: "exA" }) } }) },
        }),
      },
    });
    const remote = progress({
      courses: {
        "ai-native": slice({
          lessons: { l1: lesson({ exercisesCompleted: { exB: exercise({ exerciseId: "exB" }) } }) },
        }),
      },
    });
    const ex = mergeUnifiedProgress(local, remote).courses["ai-native"]!.lessons.l1
      .exercisesCompleted;
    expect(Object.keys(ex).sort()).toEqual(["exA", "exB"]);
  });

  it("resolves conflicting exercise kinds independent of merge order", () => {
    const withKind = (kind: string) =>
      progress({
        courses: {
          "ai-native": slice({
            lessons: {
              l1: lesson({
                exercisesCompleted: {
                  exA: exercise({ kind }),
                },
              }),
            },
          }),
        },
      });
    const quiz = withKind("quiz");
    const reflection = withKind("reflection");

    expect(mergeUnifiedProgress(quiz, reflection)).toEqual(
      mergeUnifiedProgress(reflection, quiz),
    );
    expect(
      mergeUnifiedProgress(quiz, reflection).courses["ai-native"]?.lessons.l1
        .exercisesCompleted.exA.kind,
    ).toBe("quiz");
  });
});

describe("mergeUnifiedProgress - purity", () => {
  it("returns a fresh object and never mutates either input", () => {
    const local = progress({
      xp: 100,
      checkpoints: { "l1::c1": true },
      courses: { "ai-native": slice({ lessons: { l1: lesson() } }) },
    });
    const remote = progress({
      xp: 200,
      courses: { "ai-native": slice({ lessons: { l2: lesson() } }) },
    });
    const localSnap = clone(local);
    const remoteSnap = clone(remote);

    const merged = mergeUnifiedProgress(local, remote);

    expect(merged).not.toBe(local);
    expect(merged).not.toBe(remote);
    // Inputs are untouched (immutable-merge contract).
    expect(local).toEqual(localSnap);
    expect(remote).toEqual(remoteSnap);
  });
});

// ── Per-row merge primitives ─────────────────────────────
// mergeCourseSlice/mergeMetaFields decompose the same merge logic
// mergeUnifiedProgress uses internally, so the per-course-row persistence
// layer (server-store.ts) can merge one DB row at a time — a checkpoint in
// one course no longer requires re-serializing every other course's row.

describe("mergeCourseSlice", () => {
  it("matches mergeUnifiedProgress's per-course result exactly", () => {
    const localSlice = slice({
      lessons: { l1: lesson({ completed: true }) },
      capstoneSubmitted: false,
      startedAt: "2026-02-01T00:00:00.000Z",
      lastActivity: "2026-03-01T00:00:00.000Z",
    });
    const remoteSlice = slice({
      lessons: { l2: lesson({ completed: true }) },
      capstoneSubmitted: true,
      startedAt: "2026-01-01T00:00:00.000Z",
      lastActivity: "2026-04-01T00:00:00.000Z",
    });
    const viaWholeBlob = mergeUnifiedProgress(
      progress({ courses: { "ai-native": localSlice } }),
      progress({ courses: { "ai-native": remoteSlice } }),
    ).courses["ai-native"];
    const viaRow = mergeCourseSlice(localSlice, remoteSlice);
    expect(viaRow).toEqual(viaWholeBlob);
  });

  it("returns the remote slice unchanged when local is undefined (new row)", () => {
    const remoteSlice = slice({ capstoneSubmitted: true });
    expect(mergeCourseSlice(undefined, remoteSlice)).toEqual(remoteSlice);
  });

  it("returns the local slice unchanged when remote is undefined (no existing row)", () => {
    const localSlice = slice({ capstoneSubmitted: true });
    expect(mergeCourseSlice(localSlice, undefined)).toEqual(localSlice);
  });
});

describe("mergeMetaFields", () => {
  function meta(over: Partial<Pick<UnifiedProgress, "xp" | "checkpoints" | "badges" | "streak" | "lastActivity">> = {}) {
    return {
      xp: 0,
      checkpoints: {},
      badges: {},
      streak: { days: 0, last: null },
      lastActivity: "2026-06-03T00:00:00.000Z",
      ...over,
    };
  }

  it("matches mergeUnifiedProgress's top-level ledger result exactly", () => {
    const local = meta({ xp: 100, checkpoints: { "l1::c1": true } });
    const remote = meta({ xp: 250, badges: { "first-light": "2026-02-01T00:00:00.000Z" } });
    const viaWholeBlob = mergeUnifiedProgress(progress(local), progress(remote));
    const viaMeta = mergeMetaFields(local, remote);
    expect(viaMeta).toEqual({
      xp: viaWholeBlob.xp,
      checkpoints: viaWholeBlob.checkpoints,
      badges: viaWholeBlob.badges,
      streak: viaWholeBlob.streak,
      lastActivity: viaWholeBlob.lastActivity,
    });
  });
});

describe("isUnifiedCourseSlice / isUnifiedMetaFields / META_ROW_COURSE_SLUG (row validators)", () => {
  it("META_ROW_COURSE_SLUG never collides with a real CourseSlug", () => {
    expect(META_ROW_COURSE_SLUG).toBe("_meta");
    expect(COURSE_SLUGS).not.toContain(META_ROW_COURSE_SLUG);
  });

  it("isUnifiedCourseSlice accepts a valid slice and rejects a malformed one", () => {
    expect(isUnifiedCourseSlice(slice())).toBe(true);
    expect(isUnifiedCourseSlice({ ...slice(), lessons: null })).toBe(false);
    expect(isUnifiedCourseSlice(null)).toBe(false);
  });

  it("enforces canonical IDs when a course trust context is supplied", () => {
    expect(
      isUnifiedCourseSlice(
        slice({
          lessons: {
            [KF_LESSON]: lesson({ sectionsRead: [KF_SECTION] }),
          },
        }),
        "ki-fuehrerschein",
      ),
    ).toBe(true);
    expect(
      isUnifiedCourseSlice(
        slice({ lessons: { "fabricated-lesson": lesson() } }),
        "ki-fuehrerschein",
      ),
    ).toBe(false);
  });

  it("isUnifiedMetaFields accepts a valid meta payload and rejects a malformed one", () => {
    const valid = {
      xp: 10,
      checkpoints: { "l1::c1": true },
      badges: { "first-light": "2026-01-01T00:00:00.000Z" },
      streak: { days: 1, last: "2026-01-01" },
      lastActivity: "2026-01-01T00:00:00.000Z",
    };
    expect(isUnifiedMetaFields(valid)).toBe(true);
    expect(isUnifiedMetaFields({ ...valid, xp: -1 })).toBe(false);
    expect(isUnifiedMetaFields({ ...valid, lastActivity: 42 })).toBe(false);
    expect(isUnifiedMetaFields(null)).toBe(false);
  });
});

// ── Exercise-summary byte cap enforced on every merge ───

describe("mergeUnifiedProgress - exercise summary byte cap", () => {
  it("truncates a merged-in oversized summary to the byte cap", () => {
    const longSummary = "Über KI-Kompetenz und Verantwortung. ".repeat(50);
    const local = progress({
      courses: {
        "ai-native": slice({
          lessons: {
            l1: lesson({
              exercisesCompleted: {
                exA: exercise({ summary: longSummary }),
              },
            }),
          },
        }),
      },
    });
    const remote = progress();
    const merged = mergeUnifiedProgress(local, remote);
    const summary =
      merged.courses["ai-native"]?.lessons.l1.exercisesCompleted.exA.summary;
    expect(summary).toBeDefined();
    expect(new TextEncoder().encode(summary ?? "").length).toBeLessThanOrEqual(
      MAX_EXERCISE_SUMMARY_BYTES,
    );
  });

  // "Mixed-version merge": an old device (pre-stage-5 client, no byte cap
  // enforced at write time) has already been forward-migrated to schemaVersion
  // 3 by store.ts's parseUnified() before it can reach this merge at all — so
  // by the time two devices' payloads meet here, both are already valid v3
  // UnifiedProgress objects. What can still differ is DATA characteristic of
  // an old, pre-cap client: an oversized exercise summary. This pins that
  // racing an old-data device against a new-data device is deterministic
  // (same result regardless of merge order) and lossless (every field except
  // the oversized summary text survives intact; the summary is trimmed, not
  // dropped).
  it("resolves a race between an old-data device and a new-data device deterministically and losslessly", () => {
    const oldDeviceSummary = "Über KI-Kompetenz und Verantwortung. ".repeat(50);
    const oldDevice = progress({
      xp: 100,
      courses: {
        "ai-native": slice({
          lessons: {
            l1: lesson({
              completed: true,
              exercisesCompleted: {
                exA: exercise({
                  summary: oldDeviceSummary,
                  completed: true,
                  score: 6,
                  attempts: 3,
                }),
              },
            }),
          },
        }),
      },
    });
    const newDevice = progress({
      xp: 250,
      courses: {
        "ai-native": slice({
          lessons: {
            l1: lesson({
              completed: true,
              exercisesCompleted: {
                exA: exercise({
                  summary: "Kurze Zusammenfassung.",
                  completed: true,
                  score: 9,
                  attempts: 1,
                }),
              },
            }),
          },
        }),
      },
    });

    const forward = mergeUnifiedProgress(oldDevice, newDevice);
    const backward = mergeUnifiedProgress(newDevice, oldDevice);

    for (const merged of [forward, backward]) {
      const exA = merged.courses["ai-native"]!.lessons.l1.exercisesCompleted.exA;
      // Lossless: completed/score/attempts merge exactly like every other
      // exercise-merge test (max score, max attempts, OR completed).
      expect(exA.completed).toBe(true);
      expect(exA.score).toBe(9);
      expect(exA.attempts).toBe(3);
      // The oversized summary from the old device is trimmed, not dropped.
      expect(exA.summary).toBeDefined();
      expect(new TextEncoder().encode(exA.summary ?? "").length).toBeLessThanOrEqual(
        MAX_EXERCISE_SUMMARY_BYTES,
      );
      expect(merged.xp).toBe(250);
      expect(merged.schemaVersion).toBe(3);
    }
    // Deterministic: same result regardless of which side is "local".
    expect(forward).toEqual(backward);
  });
});
