// ─── ProgressToastProvider tests (shared course architecture) ──
//
// Drives the real unified store and asserts that XP gains and badge awards
// surface as toasts, and that pre-existing progress on mount is NOT replayed.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { ProgressToastRuntime } from "./toast-provider-runtime";
import {
  __resetCacheForTests,
  markSectionRead,
  markLessonCompleted,
} from "@/lib/progress/store";

/** In-memory localStorage polyfill (jsdom no-op fallback). */
function installLocalStoragePolyfill() {
  const store = new Map<string, string>();
  const polyfill: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(i) {
      return Array.from(store.keys())[i] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: polyfill,
    writable: true,
    configurable: true,
  });
}

beforeEach(() => {
  installLocalStoragePolyfill();
  // Drop the in-memory cache so each test starts from a fresh store; the
  // localStorage polyfill above already gives every test an empty backing
  // store. (No vi.resetModules() — the provider and the test must share the
  // same store module instance for the subscription to fire.)
  __resetCacheForTests();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("ProgressToastProvider", () => {
  it("does not toast existing progress on first mount (baseline seed)", () => {
    // Pre-existing progress before the provider mounts.
    markLessonCompleted("ki-fuehrerschein", "block_1_lesson_1");

    render(<ProgressToastRuntime />);
    // The provider's first emission seeds the baseline; nothing should show.
    expect(screen.queryByText(/XP/)).toBeNull();
  });

  it("shows an XP toast when xp increases after mount", async () => {
    render(<ProgressToastRuntime />);
    act(() => {
      markSectionRead(
        "ki-fuehrerschein",
        "block_1_lesson_1",
        "block_1_lesson_1_section_1",
      );
    });

    // +2 XP for a section read (XP.SECTION).
    expect(await screen.findByText("+2 XP")).toBeInTheDocument();
  });

  it("shows a badge toast when a new badge is awarded", async () => {
    render(<ProgressToastRuntime />);
    act(() => {
      // First lesson completion → "first-light" badge ("Erster Schritt").
      markLessonCompleted("ki-fuehrerschein", "block_1_lesson_1");
    });

    expect(await screen.findByText("Erster Schritt")).toBeInTheDocument();
  });
});
