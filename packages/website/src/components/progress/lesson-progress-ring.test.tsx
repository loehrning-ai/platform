// ─── Shared LessonProgressRing tests (shared course architecture) ──

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { LessonProgressRing } from "./lesson-progress-ring";
import {
  __resetCacheForTests,
  markSectionRead,
  markLessonCompleted,
} from "@/lib/progress/store";

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
        lessonId="l1"
        totalSections={4}
      />,
    );

    // After mount the subscribe callback runs with current (empty) state.
    expect(await screen.findByText("0/4")).toBeInTheDocument();

    act(() => {
      markSectionRead("eu-ai-act-kurs", "l1", "s1");
      markSectionRead("eu-ai-act-kurs", "l1", "s2");
    });

    expect(await screen.findByText("2/4")).toBeInTheDocument();
  });

  it("shows the done checkmark when the lesson is completed", async () => {
    markLessonCompleted("eu-ai-act-kurs", "done-lesson");

    render(
      <LessonProgressRing
        courseSlug="eu-ai-act-kurs"
        lessonId="done-lesson"
        totalSections={3}
      />,
    );

    expect(await screen.findByText("✓")).toBeInTheDocument();
  });
});
