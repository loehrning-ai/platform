import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { L01ThreeBodyContract } from "./l01-three-body-contract";

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

describe("L01ThreeBodyContract", () => {
  it("starts at full quality with no lever weakened", () => {
    render(<L01ThreeBodyContract lessonId="L01" cpId="bespoke" />);
    expect(screen.getByText("95")).toBeInTheDocument();
  });

  it("weakening a lever lowers the quality score", () => {
    render(<L01ThreeBodyContract lessonId="L01" cpId="bespoke" />);
    fireEvent.click(screen.getByText("Vague the task"));
    expect(screen.queryByText("95")).not.toBeInTheDocument();
  });

  it("awards the checkpoint once all three levers are weakened", () => {
    render(<L01ThreeBodyContract lessonId="L01" cpId="bespoke" />);
    fireEvent.click(screen.getByText("Vague the task"));
    expect(isCheckpointDone("L01", "bespoke")).toBe(false);
    fireEvent.click(screen.getByText("Drop AGENTS.md"));
    expect(isCheckpointDone("L01", "bespoke")).toBe(false);
    fireEvent.click(screen.getByText("Cut sandbox tests"));
    expect(isCheckpointDone("L01", "bespoke")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });

  it("Reset restores full quality and clears weakened levers", () => {
    render(<L01ThreeBodyContract lessonId="L01" cpId="bespoke" />);
    fireEvent.click(screen.getByText("Vague the task"));
    fireEvent.click(screen.getByText("Reset"));
    expect(screen.getByText("95")).toBeInTheDocument();
  });

  it("re-clicking the same lever does not double count toward the checkpoint", () => {
    render(<L01ThreeBodyContract lessonId="L01" cpId="bespoke" />);
    fireEvent.click(screen.getByText("Vague the task"));
    fireEvent.click(screen.getByText("Vague the task"));
    expect(isCheckpointDone("L01", "bespoke")).toBe(false);
  });
});
