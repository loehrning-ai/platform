import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { SLAdash } from "./sla-dash";

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

describe("SLAdash", () => {
  it("renders the canvas and play/incident/pause controls", () => {
    render(<SLAdash lessonId="di-sla-quality" cpId="sla" />);
    expect(screen.getByRole("img", { name: /SLA dashboard showing pipeline freshness/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play 1 hour/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /inject incident/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pause/ })).toBeInTheDocument();
  });

  it("falls back to a static summary, without crashing, when getContext('2d') returns null", () => {
    const original = HTMLCanvasElement.prototype.getContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null) as any;
    try {
      expect(() => render(<SLAdash lessonId="di-sla-quality" cpId="sla" />)).not.toThrow();
      expect(screen.getByRole("img", { name: /4 SLOs tracked/ })).toBeInTheDocument();
    } finally {
      HTMLCanvasElement.prototype.getContext = original;
    }
  });

  it("playing advances the clock, and pause freezes it", () => {
    vi.useFakeTimers();
    render(<SLAdash lessonId="di-sla-quality" cpId="sla" />);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /play 1 hour/ }));
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/t = /)).not.toHaveTextContent("t = 12:00");

    fireEvent.click(screen.getByRole("button", { name: /pause/ }));
    const frozen = screen.getByText(/t = /).textContent;
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText(/t = /).textContent).toBe(frozen);
  });

  it("injecting an incident produces real PAGE alerts and completing the run awards the checkpoint", () => {
    vi.useFakeTimers();
    render(<SLAdash lessonId="di-sla-quality" cpId="sla" />);
    expect(isCheckpointDone("di-sla-quality", "sla")).toBe(false);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /inject incident/ }));
      vi.advanceTimersByTime(200 * 62);
    });
    expect(screen.getAllByText(/PAGE/).length).toBeGreaterThan(0);
    expect(isCheckpointDone("di-sla-quality", "sla")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });
});
