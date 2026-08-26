// ─── server-store.ts I/O-layer tests ──
//
// server-store.ts is the per-course-row persistence layer on top of the pure
// merge primitives in server-sync.ts. It is the ONLY place that talks to the
// `user_course_progress` table, used by /api/progress, /api/account/export,
// /api/account/reset-progress, and /konto/page.tsx.
//
// A real Supabase client isn't available in unit tests, so this file drives
// a small in-memory fake that implements exactly the chained query surface
// server-store.ts calls (select/eq/maybeSingle, insert/select/maybeSingle,
// update/eq/eq/eq/select/maybeSingle, delete/eq/eq) and enforces the same
// invariants the real table does: composite (user_id, course_slug) PK
// uniqueness and updated_at-based optimistic concurrency.

import { describe, it, expect, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PROGRESS_TABLE,
  resetCourseProgressRow,
  fetchUnifiedProgressForUser,
  upsertUnifiedProgressForUser,
} from "./server-store";
import { META_ROW_COURSE_SLUG } from "./server-sync";
import {
  COMPLETION_EVIDENCE_CUTOVER_CHECKPOINT_KEY,
  legacyCompletionEvidenceCheckpointKey,
  type UnifiedCourseSlice,
  type UnifiedProgress,
} from "./types";
import { isLessonCompletionEvidenceBacked } from "@/lib/courses/completion";

// ── In-memory fake table (composite PK, optimistic concurrency) ───────────

interface FakeRow {
  user_id: string;
  course_slug: string;
  progress: unknown;
  created_at: string;
  updated_at: string;
}

function key(userId: string, courseSlug: string): string {
  return `${userId}::${courseSlug}`;
}

class FakeTable {
  rows = new Map<string, FakeRow>();

  selectAll(userId: string): FakeRow[] {
    return [...this.rows.values()].filter((r) => r.user_id === userId);
  }

  selectOne(userId: string, courseSlug: string): FakeRow | null {
    return this.rows.get(key(userId, courseSlug)) ?? null;
  }

  insert(row: FakeRow): { progress: unknown; updated_at: string } | null {
    if (this.rows.has(key(row.user_id, row.course_slug))) {
      // Real Postgres: duplicate PK -> unique_violation, no row returned.
      return null;
    }
    this.rows.set(key(row.user_id, row.course_slug), {
      ...row,
      created_at: row.created_at ?? row.updated_at,
    });
    return { progress: row.progress, updated_at: row.updated_at };
  }

  update(
    userId: string,
    courseSlug: string,
    expectedUpdatedAt: string,
    patch: { progress: unknown; updated_at: string },
  ): { progress: unknown; updated_at: string } | null {
    const existing = this.rows.get(key(userId, courseSlug));
    if (!existing || existing.updated_at !== expectedUpdatedAt) {
      // Real Postgres: WHERE ... AND updated_at = ? matches zero rows.
      return null;
    }
    const next: FakeRow = { ...existing, ...patch };
    this.rows.set(key(userId, courseSlug), next);
    return { progress: next.progress, updated_at: next.updated_at };
  }

  delete(userId: string, courseSlug: string): void {
    this.rows.delete(key(userId, courseSlug));
  }
}

interface FakeSupabaseOptions {
  readonly insertError?: unknown;
  readonly throwAfterCommittedInsertOnce?: unknown;
}

function fakeSupabase(
  table: FakeTable,
  options: FakeSupabaseOptions = {},
): SupabaseClient {
  let committedInsertThrown = false;
  const client = {
    from: (name: string) => {
      if (name !== PROGRESS_TABLE) throw new Error(`unexpected table ${name}`);
      return {
        select: (_cols: string) => ({
          eq: (col1: string, userId: string) => {
            if (col1 !== "user_id")
              throw new Error("expected user_id filter first");
            return {
              // Ordered and awaited: "all rows for this user" (fetch path).
              order: async (
                column: string,
                options: { ascending: boolean },
              ) => {
                if (column !== "course_slug" || options.ascending !== true) {
                  throw new Error("expected ascending course_slug order");
                }
                return {
                  data: table
                    .selectAll(userId)
                    .toSorted((a, b) =>
                      a.course_slug.localeCompare(b.course_slug),
                    ),
                  error: null,
                };
              },
              // Chained further: "one row for this user+course" (row read).
              eq: (col2: string, courseSlug: string) => {
                if (col2 !== "course_slug")
                  throw new Error("expected course_slug filter");
                return {
                  maybeSingle: async () => ({
                    data: table.selectOne(userId, courseSlug),
                    error: null,
                  }),
                };
              },
            };
          },
        }),
        insert: (row: FakeRow) => ({
          select: (_cols: string) => ({
            maybeSingle: async () => {
              if (options.insertError !== undefined) {
                return { data: null, error: options.insertError };
              }
              const data = table.insert(row);
              if (
                data &&
                options.throwAfterCommittedInsertOnce !== undefined &&
                !committedInsertThrown
              ) {
                committedInsertThrown = true;
                throw options.throwAfterCommittedInsertOnce;
              }
              return data
                ? { data, error: null }
                : {
                    data: null,
                    error: { code: "23505", message: "duplicate key" },
                  };
            },
          }),
        }),
        update: (patch: { progress: unknown; updated_at: string }) => ({
          eq: (col1: string, userId: string) => {
            if (col1 !== "user_id")
              throw new Error("expected user_id filter first");
            return {
              eq: (col2: string, courseSlug: string) => {
                if (col2 !== "course_slug")
                  throw new Error("expected course_slug filter");
                return {
                  eq: (col3: string, expectedUpdatedAt: string) => {
                    if (col3 !== "updated_at")
                      throw new Error("expected updated_at filter");
                    return {
                      select: (_cols: string) => ({
                        maybeSingle: async () => ({
                          data: table.update(
                            userId,
                            courseSlug,
                            expectedUpdatedAt,
                            patch,
                          ),
                          error: null,
                        }),
                      }),
                    };
                  },
                };
              },
            };
          },
        }),
        delete: () => ({
          eq: (col1: string, userId: string) => {
            if (col1 !== "user_id")
              throw new Error("expected user_id filter first");
            return {
              eq: (col2: string, courseSlug: string) => {
                if (col2 !== "course_slug")
                  throw new Error("expected course_slug filter");
                table.delete(userId, courseSlug);
                return { error: null };
              },
            };
          },
        }),
      };
    },
  };
  return client as unknown as SupabaseClient;
}

function rejectingFetchSupabase(error: unknown): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.reject(error),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

function rejectingRowReadSupabase(error: unknown): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.reject(error),
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

// ── Fixtures ────────────────────────────────────────────────────────────

function slice(over: Partial<UnifiedCourseSlice> = {}): UnifiedCourseSlice {
  return {
    lessons: {},
    workshopQuiz: { passed: false, score: 0, completedAt: null },
    capstoneSubmitted: false,
    startedAt: "2026-01-01T00:00:00.000Z",
    lastActivity: "2026-01-01T00:00:00.000Z",
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
    lastActivity: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

const USER = "user-1";

let table: FakeTable;
beforeEach(() => {
  table = new FakeTable();
});

// ── fetchUnifiedProgressForUser ────────────────────────────────────────────

describe("fetchUnifiedProgressForUser", () => {
  it("returns null progress + null updatedAt for a user with no rows", async () => {
    const result = await fetchUnifiedProgressForUser(fakeSupabase(table), USER);
    expect(result).toEqual({
      ok: true,
      result: {
        progress: null,
        updatedAt: null,
        courseResetAt: {},
        rawRows: [],
      },
    });
  });

  it("assembles multiple course rows + the meta row into one aggregated UnifiedProgress", async () => {
    const p = progress({
      xp: 50,
      courses: {
        "ki-fuehrerschein": slice({ capstoneSubmitted: false }),
        "ai-native": slice({ capstoneSubmitted: true }),
      },
    });
    const result = await upsertUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
      p,
    );
    expect(result.ok).toBe(true);

    const fetched = await fetchUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
    );
    expect(fetched.ok).toBe(true);
    if (!fetched.ok) throw new Error("unreachable");
    expect(fetched.result.progress?.xp).toBe(50);
    expect(Object.keys(fetched.result.progress?.courses ?? {}).sort()).toEqual([
      "ai-native",
      "ki-fuehrerschein",
    ]);
    expect(
      fetched.result.progress?.courses["ai-native"]?.capstoneSubmitted,
    ).toBe(true);
    expect(fetched.result.updatedAt).not.toBeNull();
  });

  it("upgrades pre-cutover server rows without changing schema v3 or awarding marker XP", async () => {
    const lessonId = "modul_1_lesson_1";
    table.rows.set(key(USER, "ai-native"), {
      user_id: USER,
      course_slug: "ai-native",
      progress: {
        schemaVersion: 3,
        slice: slice({
          lessons: {
            [lessonId]: {
              sectionsRead: [],
              quizScore: null,
              quizTotal: null,
              completed: true,
              exercisesCompleted: {},
            },
          },
        }),
      },
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    const fetched = await fetchUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
    );
    expect(fetched.ok).toBe(true);
    if (!fetched.ok || !fetched.result.progress) throw new Error("unreachable");

    const restored = fetched.result.progress;
    expect(restored.schemaVersion).toBe(3);
    expect(restored.checkpoints).toMatchObject({
      [COMPLETION_EVIDENCE_CUTOVER_CHECKPOINT_KEY]: true,
      [legacyCompletionEvidenceCheckpointKey("ai-native", lessonId)]: true,
    });
    expect(
      isLessonCompletionEvidenceBacked(restored, "ai-native", lessonId),
    ).toBe(true);
    expect(restored.xp).toBe(25);
  });

  it("does not grandfather a raw completion on a post-cutover server row", async () => {
    const lessonId = "modul_1_lesson_1";
    table.rows.set(key(USER, "ai-native"), {
      user_id: USER,
      course_slug: "ai-native",
      progress: {
        schemaVersion: 3,
        slice: slice({
          lessons: {
            [lessonId]: {
              sectionsRead: [],
              quizScore: null,
              quizTotal: null,
              completed: true,
              exercisesCompleted: {},
            },
          },
        }),
      },
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    table.rows.set(key(USER, META_ROW_COURSE_SLUG), {
      user_id: USER,
      course_slug: META_ROW_COURSE_SLUG,
      progress: {
        schemaVersion: 3,
        xp: 0,
        checkpoints: {
          [COMPLETION_EVIDENCE_CUTOVER_CHECKPOINT_KEY]: true,
        },
        badges: {},
        streak: { days: 0, last: null },
        lastActivity: "2026-01-01T00:00:00.000Z",
      },
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    const fetched = await fetchUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
    );
    expect(fetched.ok).toBe(true);
    if (!fetched.ok || !fetched.result.progress) throw new Error("unreachable");

    expect(
      fetched.result.progress.checkpoints[
        legacyCompletionEvidenceCheckpointKey("ai-native", lessonId)
      ],
    ).toBeUndefined();
    expect(
      isLessonCompletionEvidenceBacked(
        fetched.result.progress,
        "ai-native",
        lessonId,
      ),
    ).toBe(false);
    expect(fetched.result.progress.xp).toBe(0);
  });

  it.each([
    { stored: 90, expected: 0.9 },
    { stored: 101, expected: 0 },
    { stored: -1, expected: 0 },
  ])(
    "repairs stored workshop score $stored to $expected while assembling",
    async ({ stored, expected }) => {
      table.rows.set(key(USER, "ai-native"), {
        user_id: USER,
        course_slug: "ai-native",
        progress: {
          schemaVersion: 3,
          slice: slice({
            workshopQuiz: {
              passed: true,
              score: stored,
              completedAt: "2026-01-02T00:00:00.000Z",
            },
          }),
        },
        created_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      });

      const fetched = await fetchUnifiedProgressForUser(
        fakeSupabase(table),
        USER,
      );
      expect(fetched.ok).toBe(true);
      if (!fetched.ok) throw new Error("unreachable");
      expect(
        fetched.result.progress?.courses["ai-native"]?.workshopQuiz.score,
      ).toBe(expected);
      expect(
        (
          fetched.result.rawRows[0]?.progress as {
            slice: UnifiedCourseSlice;
          }
        ).slice.workshopQuiz.score,
      ).toBe(stored);
    },
  );

  it("ignores a row shaped for a course that isn't a registered slug (defensive)", async () => {
    table.rows.set(key(USER, META_ROW_COURSE_SLUG), {
      user_id: USER,
      course_slug: META_ROW_COURSE_SLUG,
      progress: {
        schemaVersion: 3,
        xp: 50,
        checkpoints: {},
        badges: {},
        streak: { days: 0, last: null },
        lastActivity: "2026-01-01T00:00:00.000Z",
      },
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    table.rows.set(key(USER, "not-a-real-course"), {
      user_id: USER,
      course_slug: "not-a-real-course",
      progress: { schemaVersion: 3, slice: slice() },
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    const fetched = await fetchUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
    );
    expect(fetched.ok).toBe(true);
    if (!fetched.ok) throw new Error("unreachable");
    expect(fetched.result.progress).toMatchObject({
      xp: 50,
      courses: {},
    });
    expect(fetched.result.courseResetAt).toEqual({});
    expect(fetched.result.rawRows.map((row) => row.course_slug)).toEqual([
      META_ROW_COURSE_SLUG,
      "not-a-real-course",
    ]);
    expect(fetched.result.rawRows[1]?.progress).toEqual({
      schemaVersion: 3,
      slice: slice(),
    });
  });

  it("ignores a canonical course row containing fabricated lesson IDs without poisoning valid rows", async () => {
    table.rows.set(key(USER, "ai-native"), {
      user_id: USER,
      course_slug: "ai-native",
      progress: {
        schemaVersion: 3,
        slice: slice({
          lessons: {
            "fabricated-lesson": {
              sectionsRead: [],
              quizScore: null,
              quizTotal: null,
              completed: true,
              exercisesCompleted: {},
            },
          },
        }),
      },
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    table.rows.set(key(USER, "ki-fuehrerschein"), {
      user_id: USER,
      course_slug: "ki-fuehrerschein",
      progress: {
        schemaVersion: 3,
        slice: slice(),
      },
      created_at: "2026-01-02T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    });

    const fetched = await fetchUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
    );
    expect(fetched.ok).toBe(true);
    if (!fetched.ok) throw new Error("unreachable");
    expect(fetched.result.progress?.courses["ai-native"]).toBeUndefined();
    expect(fetched.result.progress?.courses["ki-fuehrerschein"]).toBeDefined();
  });

  it("returns a typed failure when the provider query rejects", async () => {
    const error = new Error("fetch transport rejected");

    const result = await fetchUnifiedProgressForUser(
      rejectingFetchSupabase(error),
      USER,
    );

    expect(result).toEqual({ ok: false, error });
  });
});

// ── upsertUnifiedProgressForUser ────────────────────────────────────────────

describe("upsertUnifiedProgressForUser", () => {
  it("creates one row per touched course plus the meta row (not one blob)", async () => {
    const p = progress({
      xp: 10,
      courses: { "ki-fuehrerschein": slice() },
    });
    await upsertUnifiedProgressForUser(fakeSupabase(table), USER, p);
    const slugs = [...table.rows.values()].map((r) => r.course_slug).sort();
    expect(slugs).toEqual([META_ROW_COURSE_SLUG, "ki-fuehrerschein"]);
  });

  it("only touches the row for a course present in the incoming payload (no write amplification)", async () => {
    // Seed two existing course rows + meta.
    await upsertUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
      progress({
        courses: {
          "ki-fuehrerschein": slice({
            lastActivity: "2026-01-01T00:00:00.000Z",
          }),
          "ai-native": slice({ lastActivity: "2026-01-01T00:00:00.000Z" }),
        },
      }),
    );
    const aiNativeBefore = table.rows.get(key(USER, "ai-native"))!.updated_at;

    // Second write only touches ki-fuehrerschein.
    await upsertUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
      progress({
        courses: {
          "ki-fuehrerschein": slice({
            lastActivity: "2026-02-01T00:00:00.000Z",
          }),
        },
      }),
    );

    const aiNativeAfter = table.rows.get(key(USER, "ai-native"))!.updated_at;
    expect(aiNativeAfter).toBe(aiNativeBefore); // untouched row
  });

  it("merges with an existing row instead of clobbering it", async () => {
    await upsertUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
      progress({
        courses: {
          "ai-native": slice({
            lessons: {
              modul_1_lesson_1: {
                sectionsRead: [],
                quizScore: null,
                quizTotal: null,
                completed: true,
                exercisesCompleted: {},
              },
            },
          }),
        },
      }),
    );
    await upsertUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
      progress({
        courses: {
          "ai-native": slice({
            lessons: {
              modul_1_lesson_2: {
                sectionsRead: [],
                quizScore: null,
                quizTotal: null,
                completed: true,
                exercisesCompleted: {},
              },
            },
          }),
        },
      }),
    );

    const fetched = await fetchUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
    );
    if (!fetched.ok) throw new Error("unreachable");
    const lessons =
      fetched.result.progress?.courses["ai-native"]?.lessons ?? {};
    expect(Object.keys(lessons).sort()).toEqual([
      "modul_1_lesson_1",
      "modul_1_lesson_2",
    ]);
  });

  it("repairs a stored whole percent before max-merging a better retake", async () => {
    table.rows.set(key(USER, "ai-native"), {
      user_id: USER,
      course_slug: "ai-native",
      progress: {
        schemaVersion: 3,
        slice: slice({
          workshopQuiz: {
            passed: true,
            score: 90,
            completedAt: "2026-01-02T00:00:00.000Z",
          },
        }),
      },
      created_at: "2026-01-02T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    });

    const result = await upsertUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
      progress({
        courses: {
          "ai-native": slice({
            workshopQuiz: {
              passed: true,
              score: 0.95,
              completedAt: "2026-01-03T00:00:00.000Z",
            },
          }),
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(
      result.result.progress?.courses["ai-native"]?.workshopQuiz.score,
    ).toBe(0.95);
    expect(
      (
        table.selectOne(USER, "ai-native")?.progress as {
          slice: UnifiedCourseSlice;
        }
      ).slice.workshopQuiz.score,
    ).toBe(0.95);
  });

  it("returns the full assembled state (client contract unchanged) even though persistence is per-row", async () => {
    const p = progress({
      xp: 5,
      courses: { "eu-ai-act-kurs": slice() },
    });
    const result = await upsertUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
      p,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.result.progress?.xp).toBe(5);
    expect(result.result.progress?.schemaVersion).toBe(3);
    expect(result.result.progress?.courses["eu-ai-act-kurs"]).toBeDefined();
  });

  it.each([
    {
      code: "42501",
      message: "permission denied for table user_course_progress",
    },
    {
      code: "23514",
      message: "violates user_course_progress_size_check",
    },
  ])(
    "propagates insert error $code instead of misclassifying it as a conflict",
    async (insertError) => {
      const result = await upsertUnifiedProgressForUser(
        fakeSupabase(table, { insertError }),
        USER,
        progress({ courses: { codex: slice() } }),
      );

      expect(result).toEqual({ ok: false, error: insertError });
      expect(table.rows.size).toBe(0);
    },
  );

  it("retries only a 23505 insert race and merges against the winning row", async () => {
    const originalInsert = table.insert.bind(table);
    let raced = false;
    table.insert = (row) => {
      if (!raced && row.course_slug === "codex") {
        raced = true;
        table.rows.set(key(row.user_id, row.course_slug), {
          ...row,
          progress: {
            schemaVersion: 3,
            slice: slice({ capstoneSubmitted: false }),
          },
          updated_at: "2026-01-02T00:00:00.000Z",
        });
        return null;
      }
      return originalInsert(row);
    };

    const result = await upsertUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
      progress({
        courses: {
          codex: slice({ capstoneSubmitted: true }),
        },
      }),
    );

    expect(raced).toBe(true);
    expect(result.ok).toBe(true);
    expect(table.selectOne(USER, "codex")?.progress).toMatchObject({
      slice: { capstoneSubmitted: true },
    });
  });

  it("reconciles a committed insert whose transport response is lost", async () => {
    const transportError = new Error("socket closed after commit");

    const result = await upsertUnifiedProgressForUser(
      fakeSupabase(table, {
        throwAfterCommittedInsertOnce: transportError,
      }),
      USER,
      progress({ courses: { codex: slice({ capstoneSubmitted: true }) } }),
    );

    expect(result.ok).toBe(true);
    expect(table.selectOne(USER, "codex")?.progress).toMatchObject({
      slice: { capstoneSubmitted: true },
    });
  });

  it("surfaces a conflict after exhausting retries on one row without failing the whole write", async () => {
    // Seed a course row, then force its next read to fail so the retry loop
    // in upsertRow exhausts its 2 attempts.
    await upsertUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
      progress({ courses: { codex: slice() } }),
    );

    // Simulate a genuine optimistic-concurrency race: the "codex" row's
    // updated_at moves between this test's read and write, every attempt,
    // via a monotonic counter (Date.now() can repeat within one tick, which
    // would coincidentally "resolve" the race instead of sustaining it).
    const rowKey = key(USER, "codex");
    const original = table.rows.get(rowKey)!;
    let raceCounter = 0;
    const staleUpdate = table.update.bind(table);
    table.update = (userId, courseSlug, expectedUpdatedAt, patch) => {
      if (courseSlug === "codex") {
        raceCounter += 1;
        table.rows.set(rowKey, {
          ...original,
          updated_at: `2027-01-01T00:00:00.${String(raceCounter).padStart(3, "0")}Z`,
        });
      }
      return staleUpdate(userId, courseSlug, expectedUpdatedAt, patch);
    };

    const result = await upsertUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
      progress({ courses: { codex: slice({ capstoneSubmitted: true }) } }),
    );
    expect(result.ok).toBe(false);
    if (result.ok || !result.conflict) {
      throw new Error("expected a typed optimistic-concurrency conflict");
    }
    expect(result.conflict).toBe(true);
    // Even on conflict, the latest assembled state is still returned.
    expect(result.result.progress).not.toBeNull();
  });

  it("returns a typed failure when a provider row read rejects", async () => {
    const error = new Error("upsert transport rejected");

    const result = await upsertUnifiedProgressForUser(
      rejectingRowReadSupabase(error),
      USER,
      progress({ courses: { codex: slice() } }),
    );

    expect(result).toEqual({ ok: false, error });
  });
});

// ── resetCourseProgressRow ─────────────────────────────────────────────

describe("resetCourseProgressRow", () => {
  it("hides exactly one course behind a tombstone, leaving other courses + meta intact", async () => {
    await upsertUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
      progress({
        xp: 20,
        courses: {
          "ki-fuehrerschein": slice(),
          "ai-native": slice(),
        },
      }),
    );

    const del = await resetCourseProgressRow(
      fakeSupabase(table),
      USER,
      "ai-native",
    );
    expect(del.ok).toBe(true);

    const fetched = await fetchUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
    );
    if (!fetched.ok) throw new Error("unreachable");
    expect(fetched.result.progress?.courses["ai-native"]).toMatchObject({
      lessons: {},
      resetAt: fetched.result.courseResetAt["ai-native"],
    });
    expect(fetched.result.progress?.courses["ki-fuehrerschein"]).toBeDefined();
    expect(fetched.result.progress?.xp).toBe(20); // meta row untouched
    expect(fetched.result.courseResetAt["ai-native"]).toMatch(
      /^\d{4}-\d{2}-\d{2}T/,
    );
  });

  it("creates a tombstone when no row exists for that course", async () => {
    const del = await resetCourseProgressRow(
      fakeSupabase(table),
      USER,
      "codex",
    );
    expect(del.ok).toBe(true);
    expect(table.selectOne(USER, "codex")?.progress).toMatchObject({
      schemaVersion: 3,
      reset: true,
    });
  });

  it("suppresses stale writes but accepts genuinely new post-reset learning", async () => {
    await upsertUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
      progress({
        courses: {
          "ai-native": slice({
            lessons: {
              modul_1_lesson_1: {
                sectionsRead: [],
                quizScore: null,
                quizTotal: null,
                completed: true,
                exercisesCompleted: {},
              },
            },
            lastActivity: "2026-01-01T00:00:00.000Z",
          }),
        },
      }),
    );
    const reset = await resetCourseProgressRow(
      fakeSupabase(table),
      USER,
      "ai-native",
    );
    if (!reset.ok) throw new Error("unreachable");

    await upsertUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
      progress({
        courses: {
          "ai-native": slice({
            lessons: {
              modul_1_lesson_2: {
                sectionsRead: [],
                quizScore: null,
                quizTotal: null,
                completed: true,
                exercisesCompleted: {},
              },
            },
            lastActivity: "2026-01-02T00:00:00.000Z",
          }),
        },
      }),
    );
    let fetched = await fetchUnifiedProgressForUser(fakeSupabase(table), USER);
    if (!fetched.ok) throw new Error("unreachable");
    expect(fetched.result.progress?.courses["ai-native"]?.lessons).toEqual({});

    await upsertUnifiedProgressForUser(
      fakeSupabase(table),
      USER,
      progress({
        courses: {
          "ai-native": slice({
            lessons: {
              modul_1_lesson_3: {
                sectionsRead: [],
                quizScore: null,
                quizTotal: null,
                completed: true,
                exercisesCompleted: {},
              },
            },
            lastActivity: "2999-01-01T00:00:00.000Z",
            resetAt: reset.resetAt,
          }),
        },
      }),
    );
    fetched = await fetchUnifiedProgressForUser(fakeSupabase(table), USER);
    if (!fetched.ok) throw new Error("unreachable");
    expect(
      fetched.result.progress?.courses["ai-native"]?.lessons.modul_1_lesson_3,
    ).toBeDefined();
  });

  it("returns a typed failure when the tombstone provider read rejects", async () => {
    const error = new Error("reset transport rejected");

    const result = await resetCourseProgressRow(
      rejectingRowReadSupabase(error),
      USER,
      "codex",
    );

    expect(result).toEqual({ ok: false, error });
  });
});
