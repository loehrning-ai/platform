import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { L08DecisionBranch } from "./l08-decision-branch";

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

describe("L08DecisionBranch", () => {
  it("renders the first scenario", () => {
    render(<L08DecisionBranch lessonId="L08" cpId="bespoke" />);
    expect(
      screen.getByText(/intermittent failures with different error output/),
    ).toBeInTheDocument();
  });

  it("choosing the wrong decision shows the wrong-explanation and stays on the same scenario", () => {
    render(<L08DecisionBranch lessonId="L08" cpId="bespoke" />);
    fireEvent.click(screen.getByRole("button", { name: "restart" }));
    expect(screen.getByText(/bounded investigation/)).toBeInTheDocument();
    expect(
      screen.getByText(/intermittent failures with different error output/),
    ).toBeInTheDocument();
  });

  it("choosing correctly advances to the next unsolved scenario", () => {
    render(<L08DecisionBranch lessonId="L08" cpId="bespoke" />);
    fireEvent.click(
      screen.getByRole("button", { name: "targeted correction" }),
    );
    expect(screen.getByText("solved: 1 / 3")).toBeInTheDocument();
    expect(screen.getByText(/unrelated refactor/)).toBeInTheDocument();
  });

  it("awards the checkpoint once all three scenarios are solved", () => {
    render(<L08DecisionBranch lessonId="L08" cpId="bespoke" />);
    fireEvent.click(
      screen.getByRole("button", { name: "targeted correction" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "re-spec" }));
    expect(isCheckpointDone("L08", "bespoke")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "restart" }));
    expect(isCheckpointDone("L08", "bespoke")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
    expect(
      screen.getByText(/All revision decisions recorded/),
    ).toBeInTheDocument();
  });
});
