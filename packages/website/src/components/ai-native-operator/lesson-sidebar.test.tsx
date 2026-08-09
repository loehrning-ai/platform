import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

function installLocalStoragePolyfill(): void {
  const store = new Map<string, string>();
  const polyfill: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: polyfill,
    writable: true,
    configurable: true,
  });
}

import { AiNativeOperatorLessonSidebar } from "./lesson-sidebar";
import { markLessonCompleted, __resetCacheForTests } from "@/lib/progress";

const NAV_ITEMS = [
  { moduleId: "mindset" as const, lessonNumber: 1, title: "Why AI-first" },
  { moduleId: "mindset" as const, lessonNumber: 2, title: "Maturity levels" },
  {
    moduleId: "engineering" as const,
    lessonNumber: 1,
    title: "Keystroke to delegation",
  },
];

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

afterEach(() => cleanup());

describe("AiNativeOperatorLessonSidebar ", () => {
  it("groups lessons by module with real module names", () => {
    render(<AiNativeOperatorLessonSidebar lessons={NAV_ITEMS} />);
    expect(screen.getByText(/M01 · Mindset & Culture/)).toBeInTheDocument();
    expect(screen.getByText(/M02 · Engineering Practices/)).toBeInTheDocument();
    expect(screen.getByText("Why AI-first")).toBeInTheDocument();
    expect(screen.getByText("Keystroke to delegation")).toBeInTheDocument();
  });

  it("marks a completed lesson with a checkmark instead of its number", async () => {
    markLessonCompleted("ai-native-operator", "mindset/1");
    render(<AiNativeOperatorLessonSidebar lessons={NAV_ITEMS} />);
    expect(await screen.findByText("Why AI-first")).toBeInTheDocument();
  });
});
