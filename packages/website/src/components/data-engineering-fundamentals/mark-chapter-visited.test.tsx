import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { isLessonCompleted, resetProgress } from "@/lib/course/progress";
import { MarkChapterVisited } from "./mark-chapter-visited";

function installLocalStoragePolyfill(): void {
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
    },
    writable: true,
    configurable: true,
  });
}

beforeAll(() => {
  if (typeof window.localStorage === "undefined" || typeof window.localStorage.setItem !== "function") {
    installLocalStoragePolyfill();
  }
});

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("MarkChapterVisited (plan 011 stage 11)", () => {
  it("marks the chapter completed on mount", () => {
    resetProgress("data-engineering-fundamentals");
    expect(isLessonCompleted("data-engineering-fundamentals", "fund")).toBe(false);
    render(<MarkChapterVisited chapterId="fund" />);
    expect(isLessonCompleted("data-engineering-fundamentals", "fund")).toBe(true);
  });

  it("does not mark a different chapter completed", () => {
    resetProgress("data-engineering-fundamentals");
    render(<MarkChapterVisited chapterId="ingest" />);
    expect(isLessonCompleted("data-engineering-fundamentals", "ingest")).toBe(true);
    expect(isLessonCompleted("data-engineering-fundamentals", "stream")).toBe(false);
  });

  it("renders no visible output", () => {
    const { container } = render(<MarkChapterVisited chapterId="home" />);
    expect(container).toBeEmptyDOMElement();
  });
});
