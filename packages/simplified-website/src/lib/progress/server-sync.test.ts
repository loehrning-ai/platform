// ─── Cross-device progress sync tests (regression coverage) ──
//
// server-sync.ts is the pure logic behind the account/progress API routes
// (/api/progress, /api/account/export). It is NOT covered by the migrate/store
// suites, and the only other reference (account/route.test.ts) mocks it away.
// Two exported functions, both pure:
//   • isUnifiedProgress(value)         runtime type-guard that gates untrusted
//                                      payloads read back from the server/DB.
//   • mergeUnifiedProgress(a, b)       last-writer-wins-ish CRDT merge used to
//                                      reconcile local + remote progress.
// Every assertion below is derived by reading the source and pins real
// input -> real output (no mock return values are asserted).

import { describe, it, expect } from "vitest";
import { isUnifiedProgress, mergeUnifiedProgress } from "./server-sync";
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
    sectionsRead: ["s1"],
    quizScore: 4,
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
    schemaVersion: 2,
    courses: {},
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: "2026-06-03T00:00:00.000Z",
    ...over,
  };
}

/** JSON round-trip clone (fixtures are JSON-safe: only primitives + null). */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ── isUnifiedProgress ──────────────────────────────────────────────────────

describe("isUnifiedProgress", () => {
  it("accepts a minimal empty v2 store", () => {
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
            l1: lesson({ exercisesCompleted: { exA: exercise() } }),
          },
          workshopQuiz: { passed: true, score: 90, completedAt: "2026-05-02T00:00:00.000Z" },
          capstoneSubmitted: true,
        }),
      },
    });
    expect(isUnifiedProgress(state)).toBe(true);
  });

  it("rejects non-record roots", () => {
    expect(isUnifiedProgress(null)).toBe(false);
    expect(isUnifiedProgress(undefined)).toBe(false);
    expect(isUnifiedProgress("v2")).toBe(false);
    expect(isUnifiedProgress(42)).toBe(false);
    expect(isUnifiedProgress([])).toBe(false);
  });

  it("rejects the wrong schemaVersion (strict === 2, number not string)", () => {
    expect(isUnifiedProgress({ ...progress(), schemaVersion: 1 })).toBe(false);
    expect(isUnifiedProgress({ ...progress(), schemaVersion: 3 })).toBe(false);
    // A stringified "2" must not slip through the strict identity check.
    expect(isUnifiedProgress({ ...progress(), schemaVersion: "2" })).toBe(false);
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
    expect(isUnifiedProgress({ ...progress(), badges: { b: "2026-01-01" } })).toBe(true);
    expect(isUnifiedProgress({ ...progress(), badges: { b: 1 } })).toBe(false);
  });

  it("validates the streak shape (integer days >= 0, last string|null)", () => {
    expect(isUnifiedProgress({ ...progress(), streak: { days: 0, last: null } })).toBe(true);
    expect(isUnifiedProgress({ ...progress(), streak: { days: 3, last: "2026-01-03" } })).toBe(true);
    expect(isUnifiedProgress({ ...progress(), streak: { days: -1, last: null } })).toBe(false);
    expect(isUnifiedProgress({ ...progress(), streak: { days: 1.5, last: null } })).toBe(false);
    expect(isUnifiedProgress({ ...progress(), streak: { days: 2, last: 42 } })).toBe(false);
  });

  it("requires lastActivity to be a string", () => {
    expect(isUnifiedProgress({ ...progress(), lastActivity: 1717372800000 })).toBe(false);
    expect(isUnifiedProgress({ ...progress(), lastActivity: null })).toBe(false);
  });

  it("rejects a course keyed by an unknown course slug", () => {
    expect(isUnifiedProgress({ ...progress(), courses: { "not-a-course": slice() } })).toBe(false);
  });

  it("rejects a course slice with an invalid workshop quiz (null score)", () => {
    const bad = slice({ workshopQuiz: { passed: false, score: null as unknown as number, completedAt: null } });
    expect(isUnifiedProgress({ ...progress(), courses: { "ai-native": bad } })).toBe(false);
  });

  it("rejects a lesson with a negative quiz score", () => {
    const bad = slice({ lessons: { l1: lesson({ quizScore: -3 }) } });
    expect(isUnifiedProgress({ ...progress(), courses: { "ki-fuehrerschein": bad } })).toBe(false);
  });

  it("rejects an exercise with a non-integer attempts count", () => {
    const bad = slice({
      lessons: { l1: lesson({ exercisesCompleted: { exA: exercise({ attempts: 1.5 }) } }) },
    });
    expect(isUnifiedProgress({ ...progress(), courses: { "eu-ai-act-kurs": bad } })).toBe(false);
  });
});

// ── mergeUnifiedProgress ─────────────────────────────────────────────────────

describe("mergeUnifiedProgress - top-level ledger", () => {
  it("pins schemaVersion to 2 and takes the max xp", () => {
    const merged = mergeUnifiedProgress(progress({ xp: 100 }), progress({ xp: 250 }));
    expect(merged.schemaVersion).toBe(2);
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

  it("unions checkpoints with local winning on key conflict", () => {
    const local = progress({ checkpoints: { "l1::c1": true, "l1::c2": false } });
    const remote = progress({ checkpoints: { "l1::c2": true, "l3::c1": true } });
    // { ...remote, ...local } => local's "l1::c2": false wins over remote's true.
    expect(mergeUnifiedProgress(local, remote).checkpoints).toEqual({
      "l1::c1": true,
      "l1::c2": false,
      "l3::c1": true,
    });
  });

  it("unions badges with local's award timestamp winning on conflict", () => {
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
  });
});

describe("mergeUnifiedProgress - streak", () => {
  it("keeps the whole streak object from the side with more days", () => {
    const local = progress({ streak: { days: 3, last: "2026-01-03" } });
    const remote = progress({ streak: { days: 7, last: "2026-01-07" } });
    expect(mergeUnifiedProgress(local, remote).streak).toEqual({ days: 7, last: "2026-01-07" });
    // reverse: local wins when it is the longer streak
    const local2 = progress({ streak: { days: 9, last: "2026-01-09" } });
    const remote2 = progress({ streak: { days: 2, last: "2026-01-02" } });
    expect(mergeUnifiedProgress(local2, remote2).streak).toEqual({ days: 9, last: "2026-01-09" });
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

  it("merges the workshop quiz: passed OR, score max, completedAt latest", () => {
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
    expect(wq).toEqual({ passed: true, score: 85, completedAt: "2026-03-01T00:00:00.000Z" });
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
    // remote 8/10 = 0.8 beats local 2/5 = 0.4
    const local = progress({
      courses: { "ai-native": slice({ lessons: { l1: lesson({ quizScore: 2, quizTotal: 5 }) } }) },
    });
    const remote = progress({
      courses: { "ai-native": slice({ lessons: { l1: lesson({ quizScore: 8, quizTotal: 10 }) } }) },
    });
    const l1 = mergeUnifiedProgress(local, remote).courses["ai-native"]!.lessons.l1;
    expect(l1.quizScore).toBe(8);
    expect(l1.quizTotal).toBe(10);
  });

  it("keeps the local quiz when local ratio is higher", () => {
    const local = progress({
      courses: { "ai-native": slice({ lessons: { l1: lesson({ quizScore: 9, quizTotal: 10 }) } }) },
    });
    const remote = progress({
      courses: { "ai-native": slice({ lessons: { l1: lesson({ quizScore: 1, quizTotal: 5 }) } }) },
    });
    const l1 = mergeUnifiedProgress(local, remote).courses["ai-native"]!.lessons.l1;
    expect(l1.quizScore).toBe(9);
    expect(l1.quizTotal).toBe(10);
  });

  it("keeps a real local quiz over a remote lesson that has no quiz yet", () => {
    // local 3/5 = 0.6, remote null/null = -1 -> local kept
    const local = progress({
      courses: { "ai-native": slice({ lessons: { l1: lesson({ quizScore: 3, quizTotal: 5 }) } }) },
    });
    const remote = progress({
      courses: { "ai-native": slice({ lessons: { l1: lesson({ quizScore: null, quizTotal: null }) } }) },
    });
    const l1 = mergeUnifiedProgress(local, remote).courses["ai-native"]!.lessons.l1;
    expect(l1.quizScore).toBe(3);
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
