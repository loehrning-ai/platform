import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { CapTriangle } from "./cap-triangle";

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

describe("CapTriangle", () => {
  it("renders the canvas and all three pick buttons plus the split toggle", () => {
    render(<CapTriangle lessonId="di-cap-pacelc" cpId="cap" />);
    expect(screen.getByRole("img", { name: /Interactive CAP theorem triangle/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CP,/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /AP,/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CA,/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /inject network split/ })).toBeInTheDocument();
  });

  it("falls back to a static summary, without crashing, when getContext('2d') returns null", () => {
    const original = HTMLCanvasElement.prototype.getContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null) as any;
    try {
      expect(() => render(<CapTriangle lessonId="di-cap-pacelc" cpId="cap" />)).not.toThrow();
      expect(screen.getByRole("img", { name: /Pick two of Consistency/ })).toBeInTheDocument();
    } finally {
      HTMLCanvasElement.prototype.getContext = original;
    }
  });

  it("toggling network split flips its own label", () => {
    render(<CapTriangle lessonId="di-cap-pacelc" cpId="cap" />);
    const splitBtn = screen.getByRole("button", { name: /inject network split/ });
    fireEvent.click(splitBtn);
    expect(screen.getByRole("button", { name: /heal partition/ })).toBeInTheDocument();
  });

  it("awards the checkpoint after two distinct picks", () => {
    vi.useFakeTimers();
    render(<CapTriangle lessonId="di-cap-pacelc" cpId="cap" />);
    expect(isCheckpointDone("di-cap-pacelc", "cap")).toBe(false);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /CP,/ }));
    });
    expect(isCheckpointDone("di-cap-pacelc", "cap")).toBe(false);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /AP,/ }));
    });
    expect(isCheckpointDone("di-cap-pacelc", "cap")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
    expect(screen.getByText(/AP, both sides keep serving/)).toBeInTheDocument();
  });
});
