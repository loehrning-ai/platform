import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { L11PatternCardsLab } from "./l11-pattern-cards-lab";

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

afterEach(() => {
  cleanup();
});

describe("L11PatternCardsLab", () => {
  it("starts with all 8 cards unflipped", () => {
    render(<L11PatternCardsLab lessonId="L11" cpId="bespoke" />);
    expect(screen.getByText("sorted: 0/8 · mistakes: 0")).toBeInTheDocument();
    expect(screen.getByLabelText("Flip card 1")).toBeInTheDocument();
  });

  it("flipping a card reveals its title and sort buttons", () => {
    render(<L11PatternCardsLab lessonId="L11" cpId="bespoke" />);
    fireEvent.click(screen.getByLabelText("Flip card 1"));
    expect(screen.getByText("the AGENTS.md handshake")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Use with review" }),
    ).toBeInTheDocument();
  });

  it("sorting into the wrong pile counts a mistake and keeps the card", () => {
    render(<L11PatternCardsLab lessonId="L11" cpId="bespoke" />);
    fireEvent.click(screen.getByLabelText("Flip card 1"));
    fireEvent.click(screen.getByRole("button", { name: "High risk" }));
    expect(screen.getByText("sorted: 0/8 · mistakes: 1")).toBeInTheDocument();
    expect(screen.getByText("the AGENTS.md handshake")).toBeInTheDocument();
  });

  it("sorting into the right pile removes the card and increments sorted", () => {
    render(<L11PatternCardsLab lessonId="L11" cpId="bespoke" />);
    fireEvent.click(screen.getByLabelText("Flip card 1"));
    fireEvent.click(screen.getByRole("button", { name: "Use with review" }));
    expect(screen.getByText("sorted: 1/8 · mistakes: 0")).toBeInTheDocument();
    expect(
      screen.queryByText("the AGENTS.md handshake"),
    ).not.toBeInTheDocument();
  });

  it("awards the checkpoint once all 8 cards are correctly sorted", () => {
    render(<L11PatternCardsLab lessonId="L11" cpId="bespoke" />);
    for (let id = 1; id <= 5; id++) {
      fireEvent.click(screen.getByLabelText(`Flip card ${id}`));
      fireEvent.click(screen.getByRole("button", { name: "Use with review" }));
    }
    for (let id = 6; id <= 8; id++) {
      fireEvent.click(screen.getByLabelText(`Flip card ${id}`));
      fireEvent.click(screen.getByRole("button", { name: "High risk" }));
    }
    expect(screen.getByText("sorted: 8/8 · mistakes: 0")).toBeInTheDocument();
    expect(isCheckpointDone("L11", "bespoke")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
    expect(screen.getByText(/All patterns classified/)).toBeInTheDocument();
  });
});
