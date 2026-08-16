import { describe, expect, it } from "vitest";

import type { CourseSlug } from "@/lib/course/types";
import type {
  UnifiedExerciseResult,
  UnifiedLessonProgress,
  UnifiedProgress,
} from "@/lib/progress/types";

import {
  getCourseProjectIdentity,
  hasAppliedProjectCompletion,
} from "./identity";
import { serializeCourseProjectProgress } from "./persistence";
import { verifiedCourseProjectArtifact } from "./test-artifact";

const NOW = "2026-08-13T10:00:00.000Z";

function projectResult(
  slug: CourseSlug,
  overrides: Partial<UnifiedExerciseResult> = {},
): UnifiedExerciseResult {
  const identity = getCourseProjectIdentity(slug);
  return {
    exerciseId: identity.id,
    kind: `course-project-${identity.engineKind}`,
    completed: true,
    score: 1,
    attempts: 1,
    completedAt: NOW,
    skipped: false,
    summary: serializeCourseProjectProgress(
      "Verified project",
      verifiedCourseProjectArtifact(slug),
    ),
    ...overrides,
  };
}

function progressWithProject(
  slug: CourseSlug,
  result = projectResult(slug),
  lessonId = getCourseProjectIdentity(slug).progressLessonId,
  exerciseKey = getCourseProjectIdentity(slug).id,
): UnifiedProgress {
  const lesson: UnifiedLessonProgress = {
    sectionsRead: [],
    quizScore: null,
    quizTotal: null,
    completed: false,
    exercisesCompleted: { [exerciseKey]: result },
  };
  return {
    schemaVersion: 3,
    courses: {
      [slug]: {
        lessons: { [lessonId]: lesson },
        workshopQuiz: { passed: false, score: 0, completedAt: null },
        capstoneSubmitted: slug === "ai-native",
        startedAt: NOW,
        lastActivity: NOW,
      },
    },
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: NOW,
  };
}

describe("applied-project completion identity", () => {
  it("recognizes the exact completed artifact exercise for every course", () => {
    for (const slug of [
      "ki-fuehrerschein",
      "eu-ai-act-kurs",
      "ai-native",
      "ki-und-gesellschaft",
      "data-engineering-fundamentals",
      "data-science",
      "data-infrastructure",
      "codex",
      "claude",
      "ai-native-operator",
    ] as const) {
      expect(hasAppliedProjectCompletion(progressWithProject(slug), slug)).toBe(
        true,
      );
    }
  });

  it("does not treat the historical AI-Native capstone bit as project evidence", () => {
    const withProject = progressWithProject("ai-native");
    const state: UnifiedProgress = {
      ...withProject,
      courses: {
        ...withProject.courses,
        "ai-native": {
          ...withProject.courses["ai-native"]!,
          lessons: {},
        },
      },
    };

    expect(state.courses["ai-native"]!.capstoneSubmitted).toBe(true);
    expect(hasAppliedProjectCompletion(state, "ai-native")).toBe(false);
  });

  it.each([
    ["incomplete result", { completed: false }, undefined, undefined],
    ["wrong result id", { exerciseId: "other-project" }, undefined, undefined],
    [
      "wrong result kind",
      { kind: "course-project-case" },
      undefined,
      undefined,
    ],
    ["skipped result", { skipped: true }, undefined, undefined],
    ["wrong lesson", {}, "modul_4_lesson_7", undefined],
    ["wrong exercise key", {}, undefined, "other-project"],
  ] as const)("rejects %s", (_label, overrides, lessonId, exerciseKey) => {
    const state = progressWithProject(
      "ai-native",
      projectResult("ai-native", overrides),
      lessonId,
      exerciseKey,
    );

    expect(hasAppliedProjectCompletion(state, "ai-native")).toBe(false);
  });

  it.each([
    ["missing summary", undefined],
    ["historical plain summary", "Legacy completion"],
    ["malformed envelope", '@cp1:{"k":"prompt","f":'],
    [
      "mismatched engine",
      serializeCourseProjectProgress("Verified", {
        version: 1,
        engineKind: "case",
        fields: { verified: true },
      }),
    ],
    ["empty artifact", '@cp1:{"k":"prompt","f":{}}'],
    [
      "oversized artifact field",
      `@cp1:${JSON.stringify({ k: "prompt", f: { value: "x".repeat(161) } })}`,
    ],
  ] as const)("rejects %s as project evidence", (_label, summary) => {
    const state = progressWithProject(
      "ai-native",
      projectResult("ai-native", { summary }),
    );

    expect(hasAppliedProjectCompletion(state, "ai-native")).toBe(false);
  });
});
