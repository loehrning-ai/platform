import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { L04SpecSurgeon } from "./l04-spec-surgeon";

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

describe("L04SpecSurgeon", () => {
  it("starts undefined with 0/5", () => {
    render(<L04SpecSurgeon lessonId="L04" cpId="bespoke" />);
    expect(screen.getByText("0/5 undefined")).toBeInTheDocument();
  });

  it("toggling a section appends it to the assembled spec", () => {
    render(<L04SpecSurgeon lessonId="L04" cpId="bespoke" />);
    fireEvent.click(screen.getByRole("button", { name: "Goal" }));
    expect(screen.getByText(/Add per-IP rate limiting/)).toBeInTheDocument();
    expect(screen.getByText("1/5 undefined")).toBeInTheDocument();
  });

  it("reaches complete and awards the checkpoint at 5/5", () => {
    render(<L04SpecSurgeon lessonId="L04" cpId="bespoke" />);
    for (const label of [
      "Goal",
      "Constraints",
      "Acceptance Criteria",
      "Out of scope",
    ]) {
      fireEvent.click(screen.getByRole("button", { name: label }));
    }
    expect(isCheckpointDone("L04", "bespoke")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Context" }));
    expect(screen.getByText("5/5 complete")).toBeInTheDocument();
    expect(isCheckpointDone("L04", "bespoke")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
    expect(screen.getByText(/required fields present/)).toBeInTheDocument();
  });

  it("disables a toggle once it has been switched on (one-way)", () => {
    render(<L04SpecSurgeon lessonId="L04" cpId="bespoke" />);
    const btn = screen.getByRole("button", { name: "Goal" });
    fireEvent.click(btn);
    expect(btn).toBeDisabled();
  });
});
