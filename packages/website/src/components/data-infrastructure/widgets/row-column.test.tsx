import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { RowColumn } from "./row-column";

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

describe("RowColumn", () => {
  it("renders the canvas and run/reset controls", () => {
    render(<RowColumn lessonId="di-modeling" cpId="rc" />);
    expect(screen.getByRole("img", { name: /Diagram comparing row-oriented/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run query/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "reset" })).toBeInTheDocument();
  });

  it("falls back to a static summary, without crashing, when getContext('2d') returns null", () => {
    const original = HTMLCanvasElement.prototype.getContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null) as any;
    try {
      expect(() => render(<RowColumn lessonId="di-modeling" cpId="rc" />)).not.toThrow();
      expect(screen.getByRole("img", { name: /row-store scans all 4 columns/ })).toBeInTheDocument();
    } finally {
      HTMLCanvasElement.prototype.getContext = original;
    }
  });

  it("running the query updates the byte-savings readout and awards the checkpoint", () => {
    vi.useFakeTimers();
    render(<RowColumn lessonId="di-modeling" cpId="rc" />);
    expect(isCheckpointDone("di-modeling", "rc")).toBe(false);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /run query/ }));
      vi.advanceTimersByTime(2500);
    });
    expect(screen.getByText("50% less")).toBeInTheDocument();
    expect(isCheckpointDone("di-modeling", "rc")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });

  it("reset clears the readout back to placeholders", () => {
    vi.useFakeTimers();
    render(<RowColumn lessonId="di-modeling" cpId="rc" />);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /run query/ }));
      vi.advanceTimersByTime(2500);
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "reset" }));
    });
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
