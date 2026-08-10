import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { fireEvent, render, cleanup, screen } from "@testing-library/react";
import { isLessonCompleted, resetProgress } from "@/lib/course/progress";
import { __resetCacheForTests } from "@/lib/progress/store";
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
  if (
    typeof window.localStorage === "undefined" ||
    typeof window.localStorage.setItem !== "function"
  ) {
    installLocalStoragePolyfill();
  }
});

beforeEach(() => {
  window.localStorage.clear();
  __resetCacheForTests();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("MarkChapterVisited", () => {
  it("marks the chapter only after explicit confirmation", () => {
    resetProgress("data-engineering-fundamentals");
    expect(isLessonCompleted("data-engineering-fundamentals", "fund")).toBe(
      false,
    );
    render(<MarkChapterVisited chapterId="fund" locale="en" />);
    expect(isLessonCompleted("data-engineering-fundamentals", "fund")).toBe(
      false,
    );
    fireEvent.click(screen.getByRole("button", { name: "Complete chapter" }));
    expect(isLessonCompleted("data-engineering-fundamentals", "fund")).toBe(
      true,
    );
  });

  it("does not mark a different chapter completed", () => {
    resetProgress("data-engineering-fundamentals");
    render(<MarkChapterVisited chapterId="ingest" locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Complete chapter" }));
    expect(isLessonCompleted("data-engineering-fundamentals", "ingest")).toBe(
      true,
    );
    expect(isLessonCompleted("data-engineering-fundamentals", "stream")).toBe(
      false,
    );
  });

  it("renders an explicit completion control", () => {
    render(<MarkChapterVisited chapterId="home" locale="en" />);
    expect(
      screen.getByRole("button", { name: "Complete chapter" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("uses German control copy without changing the progress key", () => {
    resetProgress("data-engineering-fundamentals");
    render(<MarkChapterVisited chapterId="qual" locale="de" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Kapitel abschließen" }),
    );
    expect(isLessonCompleted("data-engineering-fundamentals", "qual")).toBe(
      true,
    );
  });
});
