// ─── Shared LessonProgressRing tests (shared course architecture) ──

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { LessonProgressRing } from "./lesson-progress-ring";
import {
  __resetCacheForTests,
  completeCheckpoint,
  markSectionRead,
  markLessonCompleted,
  saveLessonQuizScore,
} from "@/lib/progress/store";
import { lessonCompletionEvidenceCheckpointId } from "@/lib/courses/completion";

/** In-memory localStorage polyfill (jsdom no-op fallback). */
function installLocalStoragePolyfill() {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      removeItem: (k: string) => store.delete(k),
      setItem: (k: string, v: string) => store.set(k, String(v)),
    } as Storage,
    writable: true,
    configurable: true,
  });
}

beforeEach(() => {
  installLocalStoragePolyfill();
  __resetCacheForTests();
  window.localStorage.clear();
});
afterEach(() => cleanup());

describe("LessonProgressRing (shared)", () => {
  it("reflects read sections from the unified store via subscribe", async () => {
    render(
      <LessonProgressRing
        courseSlug="eu-ai-act-kurs"
        lessonId="block_2_lesson_3"
        totalSections={4}
      />,
    );

    // After mount the subscribe callback runs with current (empty) state.
    expect(await screen.findByText("0/4")).toBeInTheDocument();

    act(() => {
      markSectionRead(
        "eu-ai-act-kurs",
        "block_2_lesson_3",
        "block_2_lesson_3_section_1",
      );
      markSectionRead(
        "eu-ai-act-kurs",
        "block_2_lesson_3",
        "block_2_lesson_3_section_2",
      );
    });

    expect(await screen.findByText("2/4")).toBeInTheDocument();
  });

  it("does not turn a legacy completion bit into a current completion check", async () => {
    markLessonCompleted("eu-ai-act-kurs", "block_1_lesson_2");

    render(
      <LessonProgressRing
        courseSlug="eu-ai-act-kurs"
        lessonId="block_1_lesson_2"
        totalSections={3}
      />,
    );

    expect(await screen.findByText("0/3")).toBeInTheDocument();
    expect(screen.queryByText("✓")).toBeNull();

    act(() => {
      for (const sectionId of [
        "block_1_lesson_2_section_1",
        "block_1_lesson_2_section_2",
        "block_1_lesson_2_section_3",
      ]) {
        markSectionRead("eu-ai-act-kurs", "block_1_lesson_2", sectionId);
      }
      saveLessonQuizScore("eu-ai-act-kurs", "block_1_lesson_2", 1, 1);
      completeCheckpoint(
        "block_1_lesson_2",
        lessonCompletionEvidenceCheckpointId("eu-ai-act-kurs"),
      );
    });

    expect(await screen.findByText("✓")).toBeInTheDocument();
  });
});
