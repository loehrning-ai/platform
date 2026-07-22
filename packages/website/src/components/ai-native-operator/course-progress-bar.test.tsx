import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { CourseProgressBar } from "./course-progress-bar";
import { __resetCacheForTests, markLessonCompleted } from "@/lib/progress/store";

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

describe("CourseProgressBar ", () => {
  it("shows 0 / 39 lessons with no progress", async () => {
    render(<CourseProgressBar />);
    expect(await screen.findByText("0 / 39 lessons")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("reflects completed lessons from the unified store via subscribe", async () => {
    markLessonCompleted("ai-native-operator", "mindset/1");
    render(<CourseProgressBar />);
    expect(await screen.findByText("1 / 39 lessons")).toBeInTheDocument();
  });
});
