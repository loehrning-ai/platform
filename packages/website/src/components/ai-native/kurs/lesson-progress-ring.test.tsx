import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetCacheForTests,
  completeCheckpoint,
  markLessonCompleted,
  markSectionRead,
  saveLessonQuizScore,
} from "@/lib/progress";
import { lessonCompletionEvidenceCheckpointId } from "@/lib/courses/completion";
import { LessonProgressRing } from "./lesson-progress-ring";

beforeEach(() => {
  window.localStorage.clear();
  __resetCacheForTests();
});

afterEach(cleanup);

describe("AI-Native LessonProgressRing", () => {
  it("shows reviewed sections without converting a legacy bit into completion", async () => {
    const lessonId = "modul_1_lesson_1";
    markLessonCompleted("ai-native", lessonId);
    render(<LessonProgressRing lessonId={lessonId} totalSections={4} />);

    expect(await screen.findByText("0/4")).toBeInTheDocument();
    expect(screen.queryByText("✓")).toBeNull();

    act(() => {
      for (const sectionId of [
        `${lessonId}_section_1`,
        `${lessonId}_section_2`,
        `${lessonId}_section_3`,
        `${lessonId}_section_4`,
      ]) {
        markSectionRead("ai-native", lessonId, sectionId);
      }
    });

    expect(await screen.findByText("4/4")).toBeInTheDocument();
    expect(screen.queryByText("✓")).toBeNull();
  });

  it("shows completion only after knowledge-check and versioned proof evidence", async () => {
    const lessonId = "modul_1_lesson_1";
    markLessonCompleted("ai-native", lessonId);
    for (const sectionId of [
      `${lessonId}_section_1`,
      `${lessonId}_section_2`,
      `${lessonId}_section_3`,
      `${lessonId}_section_4`,
    ]) {
      markSectionRead("ai-native", lessonId, sectionId);
    }
    saveLessonQuizScore("ai-native", lessonId, 1, 1);
    completeCheckpoint(
      lessonId,
      lessonCompletionEvidenceCheckpointId("ai-native"),
    );

    render(<LessonProgressRing lessonId={lessonId} totalSections={4} />);

    expect(await screen.findByText("✓")).toBeInTheDocument();
  });
});
