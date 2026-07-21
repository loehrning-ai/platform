import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

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

import { __resetCacheForTests, isCheckpointDone } from "@/lib/progress";
import { ReflectBoxWidget } from "./reflect-box";

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
});

describe("ReflectBoxWidget (plan 013 stage 5)", () => {
  it("renders a labeled textarea", () => {
    render(<ReflectBoxWidget lessonId="mindset/1" cpId="reflect" title="Reflect" />);
    expect(screen.getByRole("textbox", { name: "Reflect" })).toBeInTheDocument();
  });

  it("does not award the checkpoint while empty", () => {
    render(<ReflectBoxWidget lessonId="mindset/1" cpId="reflect" />);
    expect(isCheckpointDone("mindset/1", "reflect")).toBe(false);
  });

  it("awards the checkpoint once the trimmed text is non-empty", () => {
    render(<ReflectBoxWidget lessonId="mindset/1" cpId="reflect" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "A real reflection." } });
    expect(isCheckpointDone("mindset/1", "reflect")).toBe(true);
  });

  it("does not award the checkpoint for whitespace-only text", () => {
    render(<ReflectBoxWidget lessonId="mindset/1" cpId="reflect" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "   " } });
    expect(isCheckpointDone("mindset/1", "reflect")).toBe(false);
  });

  it("persists the draft to localStorage, keyed by lessonId/cpId", () => {
    render(<ReflectBoxWidget lessonId="mindset/1" cpId="reflect" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Saved locally." } });
    expect(window.localStorage.getItem("reflect::mindset/1::reflect")).toBe(
      JSON.stringify("Saved locally."),
    );
  });

  it("respects a custom rows count", () => {
    render(<ReflectBoxWidget lessonId="mindset/1" cpId="reflect" rows={6} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "6");
  });
});
