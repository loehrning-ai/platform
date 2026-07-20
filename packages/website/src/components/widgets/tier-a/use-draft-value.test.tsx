import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDraftValue } from "./use-draft-value";

/**
 * use-draft-value.test.tsx (regression coverage)
 *
 * Unit coverage for the localStorage-backed draft hook the reflective Tier-A
 * widgets (SelfRate / Plays) use for private, non-gamified notes. Asserts the
 * three documented guarantees: SSR-safe initial value, hydrate-from-storage on
 * mount, and immutable replace-on-update that persists. Structure/behaviour
 * only, so it stays green as widget content changes.
 */

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
});

describe("useDraftValue", () => {
  it("returns the initial value when storage is empty", () => {
    const { result } = renderHook(() => useDraftValue("draft:a", { n: 0 }));
    expect(result.current[0]).toEqual({ n: 0 });
  });

  it("hydrates from an existing stored value on mount", () => {
    window.localStorage.setItem("draft:b", JSON.stringify({ n: 9 }));
    const { result } = renderHook(() => useDraftValue("draft:b", { n: 0 }));
    expect(result.current[0]).toEqual({ n: 9 });
  });

  it("replaces the value and persists it on update", () => {
    const { result } = renderHook(() => useDraftValue("draft:c", { n: 0 }));
    act(() => {
      result.current[1]({ n: 42 });
    });
    expect(result.current[0]).toEqual({ n: 42 });
    expect(window.localStorage.getItem("draft:c")).toBe(JSON.stringify({ n: 42 }));
  });

  it("keeps the initial value when the stored payload is unparseable", () => {
    window.localStorage.setItem("draft:d", "{{{ not json");
    const { result } = renderHook(() => useDraftValue("draft:d", { n: 7 }));
    expect(result.current[0]).toEqual({ n: 7 });
  });

  it("supports primitive draft values", () => {
    const { result } = renderHook(() => useDraftValue<string>("draft:e", ""));
    act(() => {
      result.current[1]("Notiz mit Umlaut: über");
    });
    expect(result.current[0]).toBe("Notiz mit Umlaut: über");
    expect(window.localStorage.getItem("draft:e")).toBe(
      JSON.stringify("Notiz mit Umlaut: über"),
    );
  });
});
