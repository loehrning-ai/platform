import { describe, expect, it } from "vitest";

import {
  LOCAL_IMPORT_MARKER_ID,
  mergeProgress,
  readLocalImportMarker,
} from "./merge";
import { isUnifiedProgress } from "./server-sync";
import {
  UNIFIED_SCHEMA_VERSION,
  type UnifiedCourseSlice,
  type UnifiedExerciseResult,
  type UnifiedLessonProgress,
  type UnifiedProgress,
} from "./types";
import type { CourseSlug } from "@/lib/course/types";
import {
  CANONICAL_LESSON_IDS,
  getCanonicalSectionIds,
} from "@/lib/courses/completion";

// Fixtures are derived from the canonical lesson and section registry rather
// than hardcoded, so a course edit can never leave this file asserting merge
// behaviour on lesson ids the trust boundary would reject outright.
const FIXTURE_SLUGS = [
  "ki-fuehrerschein",
  "ki-und-gesellschaft",
] as const satisfies readonly CourseSlug[];

const IMPORTED_AT = "2026-09-05T12:00:00.000Z";

function lessonIdsFor(slug: CourseSlug): readonly string[] {
  return CANONICAL_LESSON_IDS[slug].slice(0, 4);
}

function emptyLesson(): UnifiedLessonProgress {
  return {
    sectionsRead: [],
    quizScore: null,
    quizTotal: null,
    completed: false,
    exercisesCompleted: {},
  };
}

function slice(
  overrides: Partial<UnifiedCourseSlice> = {},
): UnifiedCourseSlice {
  return {
    lessons: {},
    workshopQuiz: { passed: false, score: 0, completedAt: null },
    capstoneSubmitted: false,
    startedAt: "2026-01-01T00:00:00.000Z",
    lastActivity: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

function progress(overrides: Partial<UnifiedProgress> = {}): UnifiedProgress {
  return {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses: {},
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  for (const entry of Object.values(value as Record<string, unknown>)) {
    deepFreeze(entry);
  }
  return Object.freeze(value);
}

function mergedOrThrow(
  account: unknown,
  incoming: unknown,
  courseResetAt?: Readonly<Partial<Record<CourseSlug, string>>>,
): UnifiedProgress {
  const result = mergeProgress({
    account: deepFreeze(account),
    incoming: deepFreeze(incoming),
    importedAt: IMPORTED_AT,
    courseResetAt,
  });
  if (!result.ok) {
    throw new Error(`Expected a merge, got ${result.reason} at ${result.path}`);
  }
  return result.merged;
}

// ─── Seeded generators (property-based coverage without a new dependency) ──

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)] as T;
}

function isoAt(rng: () => number): string {
  return new Date(
    Date.UTC(2026, 0, 1 + Math.floor(rng() * 240), Math.floor(rng() * 24)),
  ).toISOString();
}

function randomExercise(
  rng: () => number,
  exerciseId: string,
): UnifiedExerciseResult {
  return {
    exerciseId,
    kind: pick(rng, ["quiz", "reflection"]),
    completed: rng() < 0.6,
    score: rng() < 0.3 ? null : Math.round(rng() * 100) / 100,
    attempts: Math.floor(rng() * 4),
    completedAt: rng() < 0.3 ? null : isoAt(rng),
    skipped: rng() < 0.2,
  };
}

function randomLesson(
  rng: () => number,
  slug: CourseSlug,
  lessonId: string,
): UnifiedLessonProgress {
  const sections = getCanonicalSectionIds(slug, lessonId);
  const sectionsRead = sections.filter(() => rng() < 0.5);
  const hasQuiz = rng() < 0.7;
  const exercisesCompleted: Record<string, UnifiedExerciseResult> = {};
  for (const exerciseId of ["ex-1", "ex-2"]) {
    if (rng() < 0.4) {
      exercisesCompleted[exerciseId] = randomExercise(rng, exerciseId);
    }
  }
  return {
    sectionsRead,
    quizScore: hasQuiz ? Math.round(rng() * 100) / 100 : null,
    quizTotal: hasQuiz ? 1 + Math.floor(rng() * 5) : null,
    completed: rng() < 0.5,
    exercisesCompleted,
  };
}

function randomSlice(rng: () => number, slug: CourseSlug): UnifiedCourseSlice {
  const lessons: Record<string, UnifiedLessonProgress> = {};
  for (const lessonId of lessonIdsFor(slug)) {
    if (rng() < 0.6) lessons[lessonId] = randomLesson(rng, slug, lessonId);
  }
  const startedAt = isoAt(rng);
  return {
    lessons,
    workshopQuiz: {
      passed: rng() < 0.4,
      score: Math.round(rng() * 100) / 100,
      completedAt: rng() < 0.4 ? null : isoAt(rng),
    },
    capstoneSubmitted: rng() < 0.3,
    startedAt,
    lastActivity: isoAt(rng),
  };
}

function randomProgress(rng: () => number): UnifiedProgress {
  const courses: Partial<Record<CourseSlug, UnifiedCourseSlice>> = {};
  for (const slug of FIXTURE_SLUGS) {
    if (rng() < 0.75) courses[slug] = randomSlice(rng, slug);
  }
  const checkpoints: Record<string, boolean> = {};
  if (rng() < 0.5) checkpoints["block_1_lesson_1::cp-1"] = rng() < 0.8;
  const badges: Record<string, string> = {};
  if (rng() < 0.5) badges["first-light"] = isoAt(rng);
  return progress({
    courses,
    xp: Math.floor(rng() * 400),
    checkpoints,
    badges,
    streak: {
      days: Math.floor(rng() * 12),
      last: rng() < 0.3 ? null : isoAt(rng).slice(0, 10),
    },
    lastActivity: isoAt(rng),
  });
}

function quizRatio(lesson: UnifiedLessonProgress | undefined): number {
  if (
    !lesson ||
    lesson.quizScore === null ||
    lesson.quizTotal === null ||
    lesson.quizTotal <= 0
  ) {
    return -1;
  }
  return lesson.quizScore;
}

const SEEDS = Array.from({ length: 48 }, (_, index) => index + 1);

describe("mergeProgress conflict resolution (property based)", () => {
  it("never loses ground on any lesson either side had", () => {
    // Counted and asserted below: a generator that stopped producing
    // two-sided lessons would turn every assertion in this loop vacuous.
    let contestedLessons = 0;
    for (const seed of SEEDS) {
      const rng = makeRng(seed);
      const account = randomProgress(rng);
      const incoming = randomProgress(rng);
      const merged = mergedOrThrow(account, incoming);

      for (const slug of FIXTURE_SLUGS) {
        const accountSlice = account.courses[slug];
        const incomingSlice = incoming.courses[slug];
        if (!accountSlice && !incomingSlice) continue;
        const mergedSlice = merged.courses[slug];
        expect(mergedSlice, `seed ${seed} / ${slug}`).toBeDefined();
        if (!mergedSlice) continue;

        const lessonIds = new Set([
          ...Object.keys(accountSlice?.lessons ?? {}),
          ...Object.keys(incomingSlice?.lessons ?? {}),
        ]);
        for (const lessonId of lessonIds) {
          const left = accountSlice?.lessons[lessonId];
          const right = incomingSlice?.lessons[lessonId];
          const after = mergedSlice.lessons[lessonId];
          expect(after, `seed ${seed} / ${slug} / ${lessonId}`).toBeDefined();
          if (!after) continue;
          if (left && right) contestedLessons += 1;

          // completed wins
          expect(after.completed, `seed ${seed} / ${lessonId} completed`).toBe(
            (left?.completed ?? false) || (right?.completed ?? false),
          );
          // higher quiz score wins
          expect(quizRatio(after), `seed ${seed} / ${lessonId} quiz`).toBe(
            Math.max(quizRatio(left), quizRatio(right)),
          );
          // read sections are a union, never a replacement
          const union = new Set([
            ...(left?.sectionsRead ?? []),
            ...(right?.sectionsRead ?? []),
          ]);
          expect(
            new Set(after.sectionsRead),
            `seed ${seed} / ${lessonId} sections`,
          ).toEqual(union);
          for (const exerciseId of new Set([
            ...Object.keys(left?.exercisesCompleted ?? {}),
            ...Object.keys(right?.exercisesCompleted ?? {}),
          ])) {
            const a = left?.exercisesCompleted[exerciseId];
            const b = right?.exercisesCompleted[exerciseId];
            const after_ = after.exercisesCompleted[exerciseId];
            expect(after_, `seed ${seed} / ${exerciseId}`).toBeDefined();
            expect(
              after_?.completed,
              `seed ${seed} / ${exerciseId} completed`,
            ).toBe((a?.completed ?? false) || (b?.completed ?? false));
            expect(
              after_?.attempts,
              `seed ${seed} / ${exerciseId} attempts`,
            ).toBe(Math.max(a?.attempts ?? 0, b?.attempts ?? 0));
          }
        }

        // latest timestamp wins, earliest start is kept
        const lastActivities = [
          accountSlice?.lastActivity,
          incomingSlice?.lastActivity,
        ].filter((value): value is string => typeof value === "string");
        expect(
          Date.parse(mergedSlice.lastActivity),
          `seed ${seed} / ${slug} lastActivity`,
        ).toBe(Math.max(...lastActivities.map((value) => Date.parse(value))));
        const startedAts = [accountSlice?.startedAt, incomingSlice?.startedAt]
          .filter((value): value is string => typeof value === "string")
          .map((value) => Date.parse(value));
        expect(
          Date.parse(mergedSlice.startedAt),
          `seed ${seed} / ${slug} startedAt`,
        ).toBe(Math.min(...startedAts));
        // the better workshop result wins
        expect(
          mergedSlice.workshopQuiz.score,
          `seed ${seed} / ${slug} workshopQuiz`,
        ).toBe(
          Math.max(
            accountSlice?.workshopQuiz.score ?? 0,
            incomingSlice?.workshopQuiz.score ?? 0,
          ),
        );
      }
    }
    expect(contestedLessons, "generator must produce two-sided lessons").
      toBeGreaterThan(20);
  });

  it("stays pure: frozen inputs, stable output, always a valid store shape", () => {
    for (const seed of SEEDS) {
      const rng = makeRng(seed);
      const account = deepFreeze(randomProgress(rng));
      const incoming = deepFreeze(randomProgress(rng));
      const before = JSON.stringify({ account, incoming });

      const first = mergeProgress({
        account,
        incoming,
        importedAt: IMPORTED_AT,
      });
      const second = mergeProgress({
        account,
        incoming,
        importedAt: IMPORTED_AT,
      });

      expect(first.ok, `seed ${seed}`).toBe(true);
      expect(second, `seed ${seed} determinism`).toEqual(first);
      expect(JSON.stringify({ account, incoming }), `seed ${seed}`).toBe(before);
      if (!first.ok) continue;
      expect(isUnifiedProgress(first.merged), `seed ${seed} shape`).toBe(true);
      expect(readLocalImportMarker(first.merged), `seed ${seed} marker`).toBe(
        IMPORTED_AT,
      );
      expect(first.summary.courses, `seed ${seed} summary`).toBeLessThanOrEqual(
        Object.keys(first.merged.courses).length,
      );
    }
  });

  it("reports nothing to import when the snapshot is the account's own state", () => {
    let lessonsUnderTest = 0;
    for (const seed of SEEDS) {
      const rng = makeRng(seed);
      const account = randomProgress(rng);
      for (const slug of FIXTURE_SLUGS) {
        lessonsUnderTest += Object.keys(
          account.courses[slug]?.lessons ?? {},
        ).length;
      }
      const result = mergeProgress({
        account: deepFreeze(account),
        incoming: deepFreeze(structuredClone(account)),
        importedAt: IMPORTED_AT,
      });
      expect(result.ok, `seed ${seed}`).toBe(true);
      if (!result.ok) continue;
      expect(result.summary, `seed ${seed}`).toEqual({
        courses: 0,
        lessons: 0,
      });
    }
    expect(lessonsUnderTest, "generator must produce lessons").toBeGreaterThan(
      50,
    );
  });

  it("never resurrects snapshot work a course reset already discarded", () => {
    const resetAt = "2026-06-01T00:00:00.000Z";
    for (const seed of SEEDS) {
      const rng = makeRng(seed);
      const slug = FIXTURE_SLUGS[0];
      const snapshot = randomSlice(rng, slug);
      const account = progress({
        courses: {
          [slug]: slice({ startedAt: resetAt, lastActivity: resetAt, resetAt }),
        },
      });
      const incoming = progress({
        courses: {
          [slug]: {
            ...snapshot,
            startedAt: "2026-02-01T00:00:00.000Z",
            lastActivity: "2026-03-01T00:00:00.000Z",
          },
        },
      });

      const merged = mergedOrThrow(account, incoming, { [slug]: resetAt });
      expect(merged.courses[slug]?.lessons, `seed ${seed}`).toEqual({});
      expect(merged.courses[slug]?.resetAt, `seed ${seed}`).toBe(resetAt);
    }
  });
});

describe("mergeProgress edge inputs", () => {
  const validIncoming = progress({ lastActivity: "2026-05-05T00:00:00.000Z" });

  it("treats a missing account as an empty one and imports everything", () => {
    const slug = FIXTURE_SLUGS[0];
    const lessonId = lessonIdsFor(slug)[0] as string;
    const result = mergeProgress({
      account: null,
      incoming: deepFreeze(
        progress({
          courses: {
            [slug]: slice({
              lessons: { [lessonId]: { ...emptyLesson(), completed: true } },
            }),
          },
        }),
      ),
      importedAt: IMPORTED_AT,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary).toEqual({ courses: 1, lessons: 1 });
    expect(result.merged.courses[slug]?.lessons[lessonId]?.completed).toBe(true);
    expect(readLocalImportMarker(result.merged)).toBe(IMPORTED_AT);
  });

  it("accepts an empty snapshot, imports nothing, and still marks the account", () => {
    const result = mergeProgress({
      account: null,
      incoming: validIncoming,
      importedAt: IMPORTED_AT,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary).toEqual({ courses: 0, lessons: 0 });
    expect(result.merged.courses).toEqual({});
    expect(result.merged.badges[LOCAL_IMPORT_MARKER_ID]).toBe(IMPORTED_AT);
  });

  it("counts a course whose only gain is the workshop quiz", () => {
    const slug = FIXTURE_SLUGS[0];
    const lessonId = lessonIdsFor(slug)[0] as string;
    const lessons = { [lessonId]: emptyLesson() };
    const result = mergeProgress({
      account: deepFreeze(progress({ courses: { [slug]: slice({ lessons }) } })),
      incoming: deepFreeze(
        progress({
          courses: {
            [slug]: slice({
              lessons,
              workshopQuiz: {
                passed: true,
                score: 0.9,
                completedAt: "2026-03-01T00:00:00.000Z",
              },
            }),
          },
        }),
      ),
      importedAt: IMPORTED_AT,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary).toEqual({ courses: 1, lessons: 0 });
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an array", []],
    ["a string", "progress"],
  ])("rejects %s as a snapshot and blames the root", (_label, incoming) => {
    const result = mergeProgress({
      account: null,
      incoming,
      importedAt: IMPORTED_AT,
    });
    expect(result).toEqual({
      ok: false,
      reason: "invalid_import",
      path: "progress",
    });
  });

  it("names a schema version it cannot read instead of calling it malformed", () => {
    const result = mergeProgress({
      account: null,
      incoming: { ...validIncoming, schemaVersion: UNIFIED_SCHEMA_VERSION - 1 },
      importedAt: IMPORTED_AT,
    });
    expect(result).toEqual({
      ok: false,
      reason: "unsupported_schema_version",
      path: "progress.schemaVersion",
    });
  });

  it.each([
    ["progress.courses", { courses: { "not-a-course": {} } }],
    [
      `progress.courses.${FIXTURE_SLUGS[0]}`,
      { courses: { [FIXTURE_SLUGS[0]]: { lessons: {} } } },
    ],
    ["progress.xp", { xp: -1 }],
    ["progress.checkpoints", { checkpoints: { a: "yes" } }],
    ["progress.badges", { badges: { a: "not-a-timestamp" } }],
    ["progress.streak", { streak: { days: -1, last: null } }],
    ["progress.lastActivity", { lastActivity: "yesterday" }],
  ])("blames %s on an invalid snapshot", (path, overrides) => {
    const result = mergeProgress({
      account: null,
      incoming: { ...validIncoming, ...overrides },
      importedAt: IMPORTED_AT,
    });
    expect(result).toEqual({ ok: false, reason: "invalid_import", path });
  });

  it("separates a corrupt stored account from a bad request", () => {
    const result = mergeProgress({
      account: { schemaVersion: 3, courses: "broken" },
      incoming: validIncoming,
      importedAt: IMPORTED_AT,
    });
    expect(result).toEqual({
      ok: false,
      reason: "invalid_account",
      path: "account",
    });
  });

  it("refuses an import timestamp that is not an instant", () => {
    const result = mergeProgress({
      account: null,
      incoming: validIncoming,
      importedAt: "now",
    });
    expect(result).toEqual({
      ok: false,
      reason: "invalid_import_timestamp",
      path: "importedAt",
    });
  });
});

describe("mergeProgress import trust boundary", () => {
  const slug = FIXTURE_SLUGS[0];
  const lessonId = lessonIdsFor(slug)[0] as string;

  it("keeps the account's reset epoch when the snapshot claims another one", () => {
    const accountResetAt = "2026-06-01T00:00:00.000Z";
    const account = progress({
      courses: {
        [slug]: slice({
          lessons: { [lessonId]: { ...emptyLesson(), completed: true } },
          startedAt: accountResetAt,
          lastActivity: "2026-07-01T00:00:00.000Z",
          resetAt: accountResetAt,
        }),
      },
    });
    const incoming = progress({
      courses: {
        [slug]: slice({
          lessons: { [lessonId]: emptyLesson() },
          startedAt: "2026-01-01T00:00:00.000Z",
          lastActivity: "2026-08-01T00:00:00.000Z",
          // A hostile or stale snapshot claiming a later epoch would wipe the
          // account's course if the claim were trusted.
          resetAt: "2026-07-15T00:00:00.000Z",
        }),
      },
    });

    const merged = mergedOrThrow(account, incoming, { [slug]: accountResetAt });

    expect(merged.courses[slug]?.resetAt).toBe(accountResetAt);
    expect(merged.courses[slug]?.lessons[lessonId]?.completed).toBe(true);
    expect(merged.courses[slug]?.startedAt).toBe(accountResetAt);
  });

  it("merges snapshot work that happened after the reset", () => {
    const accountResetAt = "2026-06-01T00:00:00.000Z";
    const account = progress({
      courses: {
        [slug]: slice({
          startedAt: accountResetAt,
          lastActivity: accountResetAt,
          resetAt: accountResetAt,
        }),
      },
    });
    const incoming = progress({
      courses: {
        [slug]: slice({
          lessons: { [lessonId]: { ...emptyLesson(), completed: true } },
          startedAt: "2026-06-02T00:00:00.000Z",
          lastActivity: "2026-06-03T00:00:00.000Z",
        }),
      },
    });

    const result = mergeProgress({
      account: deepFreeze(account),
      incoming: deepFreeze(incoming),
      importedAt: IMPORTED_AT,
      courseResetAt: { [slug]: accountResetAt },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.merged.courses[slug]?.lessons[lessonId]?.completed).toBe(true);
    expect(result.merged.courses[slug]?.resetAt).toBe(accountResetAt);
    expect(result.summary).toEqual({ courses: 1, lessons: 1 });
  });

  it("ignores an XP total the snapshot asserts", () => {
    const withLesson = progress({
      courses: {
        [slug]: slice({
          lessons: { [lessonId]: { ...emptyLesson(), completed: true } },
        }),
      },
    });
    const honest = mergedOrThrow(null, { ...withLesson, xp: 0 });
    const inflated = mergedOrThrow(null, { ...withLesson, xp: 999_999 });

    expect(inflated.xp).toBe(honest.xp);
  });

  it("strips the marker and unknown keys the snapshot carries", () => {
    const merged = mergedOrThrow(null, {
      ...progress({
        courses: {
          [slug]: {
            ...slice({
              lessons: {
                [lessonId]: {
                  ...emptyLesson(),
                  smuggled: "lesson",
                } as UnifiedLessonProgress,
              },
            }),
            smuggled: "slice",
          } as UnifiedCourseSlice,
        },
        badges: { [LOCAL_IMPORT_MARKER_ID]: "2020-01-01T00:00:00.000Z" },
      }),
    });

    expect(readLocalImportMarker(merged)).toBe(IMPORTED_AT);
    expect(merged.courses[slug]).not.toHaveProperty("smuggled");
    expect(merged.courses[slug]?.lessons[lessonId]).not.toHaveProperty(
      "smuggled",
    );
  });

  it("keeps the first import timestamp when an account already carries one", () => {
    const firstImport = "2026-02-02T00:00:00.000Z";
    const merged = mergedOrThrow(
      progress({ badges: { [LOCAL_IMPORT_MARKER_ID]: firstImport } }),
      progress(),
    );

    expect(readLocalImportMarker(merged)).toBe(firstImport);
  });

  it("reads no marker from an account that never imported", () => {
    expect(readLocalImportMarker(null)).toBeNull();
    expect(readLocalImportMarker(progress())).toBeNull();
  });

  it("reads no marker from a row that never validated", () => {
    // The route checks the marker on raw stored rows, so this reader has to
    // survive a corrupt one and let the merge report the real fault.
    expect(readLocalImportMarker(undefined)).toBeNull();
    expect(readLocalImportMarker("nonsense")).toBeNull();
    expect(readLocalImportMarker({ badges: "broken" })).toBeNull();
    expect(
      readLocalImportMarker({ badges: { [LOCAL_IMPORT_MARKER_ID]: 7 } }),
    ).toBeNull();
  });
});
