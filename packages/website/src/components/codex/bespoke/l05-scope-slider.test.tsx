import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { L05ScopeSlider } from "./l05-scope-slider";

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
  __resetCacheForTests();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("L05ScopeSlider", () => {
  it("renders the starting success percentage for the default value", () => {
    render(<L05ScopeSlider lessonId="L05" cpId="bespoke" />);
    // value=0.6 -> 0.92*(1-0.6)**2.5+0.08 -> ~19% -> rounds to 19
    expect(screen.getByText(/success: \d+%/)).toBeInTheDocument();
  });

  it("dwelling in the sweet spot for 800ms awards the checkpoint", () => {
    vi.useFakeTimers();
    render(<L05ScopeSlider lessonId="L05" cpId="bespoke" />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "10" } });
    expect(isCheckpointDone("L05", "bespoke")).toBe(false);
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(isCheckpointDone("L05", "bespoke")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
    expect(screen.getByText(/sweet spot locked/)).toBeInTheDocument();
  });

  it("leaving the sweet spot before the dwell completes cancels the lock", () => {
    vi.useFakeTimers();
    render(<L05ScopeSlider lessonId="L05" cpId="bespoke" />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "10" } });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.change(screen.getByRole("slider"), { target: { value: "80" } });
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(isCheckpointDone("L05", "bespoke")).toBe(false);
  });

  it("unmounting mid-dwell clears the pending timer instead of leaking it", () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(global, "clearTimeout");
    const { unmount } = render(<L05ScopeSlider lessonId="L05" cpId="bespoke" />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "10" } });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(isCheckpointDone("L05", "bespoke")).toBe(false);
    clearSpy.mockRestore();
  });
});
