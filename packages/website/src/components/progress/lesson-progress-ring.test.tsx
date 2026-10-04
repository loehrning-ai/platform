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
  // eu-ai-act-kurs runs on the lesson engine: each lesson has one canonical
  // step, `<lessonId>_exercise`, plus the two inline checks (quiz score).
  it("reflects the recorded exercise step from the unified store via subscribe", async () => {
    render(
      <LessonProgressRing
        courseSlug="eu-ai-act-kurs"
        lessonId="risiko-2-1"
        totalSections={1}
      />,
    );

    // After mount the subscribe callback runs with current (empty) state.
    expect(await screen.findByText("0/1")).toBeInTheDocument();

    act(() => {
      markSectionRead("eu-ai-act-kurs", "risiko-2-1", "risiko-2-1_exercise");
    });

    expect(await screen.findByText("1/1")).toBeInTheDocument();
  });

  it("does not turn a legacy completion bit into a current completion check", async () => {
    markLessonCompleted("eu-ai-act-kurs", "zeitplan-1-2");

    render(
      <LessonProgressRing
        courseSlug="eu-ai-act-kurs"
        lessonId="zeitplan-1-2"
        totalSections={1}
      />,
    );

    expect(await screen.findByText("0/1")).toBeInTheDocument();
    expect(screen.queryByText("✓")).toBeNull();

    act(() => {
      markSectionRead("eu-ai-act-kurs", "zeitplan-1-2", "zeitplan-1-2_exercise");
      saveLessonQuizScore("eu-ai-act-kurs", "zeitplan-1-2", 1, 1);
      completeCheckpoint(
        "zeitplan-1-2",
        lessonCompletionEvidenceCheckpointId("eu-ai-act-kurs"),
      );
    });

    expect(await screen.findByText("✓")).toBeInTheDocument();
  });
});
