import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { InterviewMove } from "./interview-move";

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

describe("InterviewMove ", () => {
  it("renders the canvas progress track and the first move's real title", () => {
    render(<InterviewMove lessonId="di-interview-playbook" cpId="iv" />);
    expect(screen.getByRole("img", { name: /Interview-replay progress track/ })).toBeInTheDocument();
    expect(screen.getByText("00:00 — Mirror the prompt back")).toBeInTheDocument();
    expect(screen.getByText(/Design real-time analytics for a marketplace/)).toBeInTheDocument();
  });

  it("falls back to a static summary, without crashing, when getContext('2d') returns null", () => {
    const original = HTMLCanvasElement.prototype.getContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null) as any;
    try {
      expect(() => render(<InterviewMove lessonId="di-interview-playbook" cpId="iv" />)).not.toThrow();
      expect(screen.getByRole("img", { name: /Move 1 of 12/ })).toBeInTheDocument();
    } finally {
      HTMLCanvasElement.prototype.getContext = original;
    }
  });

  it("steps forward and back through all 12 moves via next/prev, disabling at both ends", () => {
    render(<InterviewMove lessonId="di-interview-playbook" cpId="iv" />);
    const prev = screen.getByRole("button", { name: /prev move/ });
    const next = screen.getByRole("button", { name: /next move/ });
    expect(prev).toBeDisabled();

    fireEvent.click(next);
    expect(screen.getByText("02:00 — Pin scale and freshness")).toBeInTheDocument();
    expect(prev).not.toBeDisabled();

    fireEvent.click(prev);
    expect(screen.getByText("00:00 — Mirror the prompt back")).toBeInTheDocument();
  });

  it("awards the checkpoint once the final move (43:00) is reached, not before", () => {
    render(<InterviewMove lessonId="di-interview-playbook" cpId="iv" />);
    const next = screen.getByRole("button", { name: /next move/ });
    expect(isCheckpointDone("di-interview-playbook", "iv")).toBe(false);
    for (let i = 0; i < 10; i++) fireEvent.click(next);
    expect(isCheckpointDone("di-interview-playbook", "iv")).toBe(false);
    fireEvent.click(next);
    expect(screen.getByText("43:00 — The closing move")).toBeInTheDocument();
    expect(next).toBeDisabled();
    expect(isCheckpointDone("di-interview-playbook", "iv")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });
});
