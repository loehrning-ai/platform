import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { Watermark } from "./watermark";

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

describe("Watermark", () => {
  it("renders the canvas and run/chaos/reset controls", () => {
    render(<Watermark lessonId="di-streaming" cpId="wm" />);
    expect(screen.getByRole("img", { name: /Stream-processing watermark/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run stream/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /chaos/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "reset" })).toBeInTheDocument();
    expect(screen.getByLabelText(/allow late/)).toBeChecked();
  });

  it("falls back to a static summary, without crashing, when getContext('2d') returns null", () => {
    const original = HTMLCanvasElement.prototype.getContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null) as any;
    try {
      expect(() => render(<Watermark lessonId="di-streaming" cpId="wm" />)).not.toThrow();
      expect(screen.getByRole("img", { name: /on-time events land near the diagonal/ })).toBeInTheDocument();
    } finally {
      HTMLCanvasElement.prototype.getContext = original;
    }
  });

  it("running the stream to completion awards the checkpoint", () => {
    vi.useFakeTimers();
    render(<Watermark lessonId="di-streaming" cpId="wm" />);
    expect(isCheckpointDone("di-streaming", "wm")).toBe(false);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /run stream/ }));
      vi.advanceTimersByTime(15000);
    });
    expect(isCheckpointDone("di-streaming", "wm")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });

  it("reset clears the on-time/late/dropped counters", () => {
    vi.useFakeTimers();
    render(<Watermark lessonId="di-streaming" cpId="wm" />);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /run stream/ }));
      vi.advanceTimersByTime(2000);
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "reset" }));
    });
    expect(screen.getByText("t=0.0")).toBeInTheDocument();
  });
});
