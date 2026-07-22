import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { L06DoneChecklist } from "./l06-done-checklist";

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

describe("L06DoneChecklist", () => {
  it("starts at 0/7, DRAFT", () => {
    render(<L06DoneChecklist lessonId="L06" cpId="bespoke" />);
    expect(screen.getByText("definition of done: 0/7")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
  });

  it("picking the correct rewrite increments the scoreboard", () => {
    render(<L06DoneChecklist lessonId="L06" cpId="bespoke" />);
    fireEvent.change(screen.getByLabelText('Rewrite for "should work well"'), {
      target: { value: "1" },
    });
    expect(screen.getByText("definition of done: 1/7")).toBeInTheDocument();
  });

  it("picking a distractor does not increment the scoreboard", () => {
    render(<L06DoneChecklist lessonId="L06" cpId="bespoke" />);
    fireEvent.change(screen.getByLabelText('Rewrite for "should work well"'), {
      target: { value: "0" },
    });
    expect(screen.getByText("definition of done: 0/7")).toBeInTheDocument();
  });

  it("awards the checkpoint and flips to READY once all 7 rows are correct", () => {
    render(<L06DoneChecklist lessonId="L06" cpId="bespoke" />);
    const items = [
      "should work well",
      "handles edge cases",
      "performant",
      "looks good",
      "well-documented",
      "tested",
      "secure",
    ];
    for (const label of items) {
      fireEvent.change(screen.getByLabelText(`Rewrite for "${label}"`), {
        target: { value: "1" },
      });
    }
    expect(screen.getByText("definition of done: 7/7")).toBeInTheDocument();
    expect(screen.getByText(/READY/)).toBeInTheDocument();
    expect(isCheckpointDone("L06", "bespoke")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });
});
