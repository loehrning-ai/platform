import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { L12DailyLoop } from "./l12-daily-loop";

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
});

describe("L12DailyLoop", () => {
  it("renders all 6 phases as schedulable", () => {
    render(<L12DailyLoop lessonId="L12" cpId="bespoke" />);
    expect(screen.getByText("triage (15m)")).toBeInTheDocument();
    expect(screen.getByText("merge (10m)")).toBeInTheDocument();
  });

  it("scheduling a phase moves it into the day's timeline in order", () => {
    render(<L12DailyLoop lessonId="L12" cpId="bespoke" />);
    fireEvent.click(screen.getByText("triage (15m)"));
    fireEvent.click(screen.getByText("spec (30m)"));
    expect(screen.getByText("1. triage (15m)")).toBeInTheDocument();
    expect(screen.getByText("2. spec (30m)")).toBeInTheDocument();
  });

  it("awards the checkpoint once all 6 phases are scheduled", () => {
    render(<L12DailyLoop lessonId="L12" cpId="bespoke" />);
    for (const label of ["triage (15m)", "spec (30m)", "launch (5m)", "async review (20m)", "iterate (15m)"]) {
      fireEvent.click(screen.getByText(label));
    }
    expect(isCheckpointDone("L12", "bespoke")).toBe(false);
    fireEvent.click(screen.getByText("merge (10m)"));
    expect(isCheckpointDone("L12", "bespoke")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
    expect(screen.getByText(/You are Codex-fluent/)).toBeInTheDocument();
  });
});
