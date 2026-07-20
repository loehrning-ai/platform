import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { renderHook, act } from "@testing-library/react";

function installLocalStoragePolyfill() {
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

import { useCheckpoint } from "./use-checkpoint";
import { getXp, isCheckpointDone, __resetCacheForTests } from "./store";
import { XP } from "./types";

describe("useCheckpoint", () => {
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

  it("starts not-done and flips to done on complete()", () => {
    const { result } = renderHook(() => useCheckpoint("l1", "cp1"));
    expect(result.current.done).toBe(false);
    act(() => {
      result.current.complete();
    });
    expect(result.current.done).toBe(true);
    expect(isCheckpointDone("l1", "cp1")).toBe(true);
  });

  it("awards checkpoint XP exactly once", () => {
    const { result } = renderHook(() => useCheckpoint("l1", "cp1"));
    act(() => {
      result.current.complete();
    });
    expect(getXp()).toBe(XP.CHECKPOINT);
    act(() => {
      result.current.complete();
    });
    expect(getXp()).toBe(XP.CHECKPOINT);
  });

  it("keeps distinct checkpoints independent within a lesson", () => {
    const a = renderHook(() => useCheckpoint("l1", "cpA"));
    const b = renderHook(() => useCheckpoint("l1", "cpB"));
    act(() => {
      a.result.current.complete();
    });
    expect(a.result.current.done).toBe(true);
    b.rerender();
    expect(b.result.current.done).toBe(false);
  });
});
