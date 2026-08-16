import { describe, expect, it } from "vitest";
import { getCourseLessonMissions } from "./lesson-mission-catalog";
import { verifiedCourseProjectArtifact } from "./test-artifact";
import {
  getCourseProjectDraftStorageKey,
  parseCourseProjectDraft,
  serializeCourseProjectDraft,
} from "./project-draft";

describe("course project draft", () => {
  it("round-trips canonical per-lesson receipts without free-form progress", () => {
    const missions = getCourseLessonMissions("ki-fuehrerschein")
      .slice(0, 3)
      .map((mission) => mission.id);
    const encoded = serializeCourseProjectDraft(
      "ki-fuehrerschein",
      missions,
      {
        version: 1,
        engineKind: "case",
        fields: {
          responses: ["claim:claim"],
        },
      },
      "2026-08-13T12:00:00.000Z",
    );
    expect(encoded).not.toContain("learner note");
    expect(
      parseCourseProjectDraft(
        encoded,
        "ki-fuehrerschein",
        "case",
        "2026-08-13T12:00:00.000Z",
      ),
    ).toEqual({
      version: 4,
      resetAt: "2026-08-13T12:00:00.000Z",
      completedMissionIds: missions,
      artifact: {
        version: 1,
        engineKind: "case",
        fields: {
          responses: ["claim:claim"],
        },
      },
    });
    expect(
      parseCourseProjectDraft(
        encoded,
        "ki-fuehrerschein",
        "repo",
        "2026-08-13T12:00:00.000Z",
      ),
    ).toBeNull();
    expect(
      parseCourseProjectDraft(encoded, "ki-fuehrerschein", "case", null),
    ).toBeNull();
  });

  it("never stores or rehydrates an unknown free-form artifact field", () => {
    const sentinel = "private-free-form-learner-text";
    const encoded = serializeCourseProjectDraft(
      "codex",
      [],
      {
        version: 1,
        engineKind: "repo",
        fields: { context: sentinel, specReady: true },
      },
      null,
    );
    expect(encoded).not.toContain(sentinel);
    expect(
      parseCourseProjectDraft(encoded, "codex", "repo", null)?.artifact,
    ).toMatchObject({ fields: { specReady: true } });
  });

  it("migrates version 2 artifacts but discards unprovable stage flags", () => {
    const legacy = JSON.stringify({
      v: 2,
      r: null,
      s: ["ground", "build"],
      a: null,
    });
    expect(parseCourseProjectDraft(legacy, "codex", "repo", null)).toEqual({
      version: 4,
      resetAt: null,
      completedMissionIds: [],
      artifact: null,
    });
    expect(
      parseCourseProjectDraft(
        JSON.stringify({ v: 2, r: null, s: ["ground", "run"], a: null }),
        "codex",
        "repo",
        null,
      ),
    ).toBeNull();
  });

  it("rejects duplicate, out-of-range, and cross-course mission indexes", () => {
    expect(
      parseCourseProjectDraft(
        JSON.stringify({
          v: 4,
          c: 1,
          r: null,
          m: ["fund", "fund"],
          a: null,
        }),
        "data-science",
        "data",
        null,
      ),
    ).toBeNull();
    expect(
      parseCourseProjectDraft(
        JSON.stringify({
          v: 4,
          c: 1,
          r: null,
          m: ["not-a-canonical-lesson"],
          a: null,
        }),
        "data-science",
        "data",
        null,
      ),
    ).toBeNull();
    expect(getCourseProjectDraftStorageKey("codex")).toContain(":codex");
  });

  it("stores stable lesson IDs and invalidates positional or unknown revisions", () => {
    const first = getCourseLessonMissions("codex")[0]!;
    const encoded = serializeCourseProjectDraft(
      "codex",
      [first.id],
      null,
      null,
    );
    expect(JSON.parse(encoded)).toMatchObject({ c: 1, m: [first.lessonId] });
    expect(
      parseCourseProjectDraft(
        JSON.stringify({ v: 4, c: 2, r: null, m: [first.lessonId], a: null }),
        "codex",
        "repo",
        null,
      ),
    ).toBeNull();
    expect(
      parseCourseProjectDraft(
        JSON.stringify({ v: 3, r: null, m: [0], a: null }),
        "codex",
        "repo",
        null,
      ),
    ).toEqual({
      version: 4,
      resetAt: null,
      completedMissionIds: [],
      artifact: null,
    });
  });

  it("round-trips every course's full receipt set with its maximal verified artifact", () => {
    for (const courseSlug of [
      "ki-fuehrerschein",
      "eu-ai-act-kurs",
      "ai-native",
      "ki-und-gesellschaft",
      "claude",
      "codex",
      "data-infrastructure",
      "data-engineering-fundamentals",
      "data-science",
      "ai-native-operator",
    ] as const) {
      const missions = getCourseLessonMissions(courseSlug).map(
        (mission) => mission.id,
      );
      const artifact = verifiedCourseProjectArtifact(courseSlug);
      const encoded = serializeCourseProjectDraft(
        courseSlug,
        missions,
        artifact,
        null,
      );
      const parsed = parseCourseProjectDraft(
        encoded,
        courseSlug,
        artifact.engineKind,
        null,
      );
      expect(parsed?.completedMissionIds).toEqual(missions);
      expect(parsed?.artifact).not.toBeNull();
    }
  });
});
