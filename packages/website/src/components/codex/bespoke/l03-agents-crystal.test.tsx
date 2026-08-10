import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { L03AgentsCrystal } from "./l03-agents-crystal";

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

describe("L03AgentsCrystal", () => {
  it("renders the default (generic) PR preview", () => {
    const { container } = render(
      <L03AgentsCrystal lessonId="L03" cpId="bespoke" />,
    );
    expect(screen.getByText("Refactor auth")).toBeInTheDocument();
    expect(container.textContent).toContain("test_underscore.js");
  });

  it("absorbing a convention updates the preview and disables the chip", () => {
    const { container } = render(
      <L03AgentsCrystal lessonId="L03" cpId="bespoke" />,
    );
    fireEvent.click(screen.getByText("test layout"));
    expect(container.textContent).toContain("tests/spec.js");
    expect(screen.getByRole("button", { name: "test layout" })).toBeDisabled();
  });

  it("absorbing 'review voice' rewrites the PR title", () => {
    render(<L03AgentsCrystal lessonId="L03" cpId="bespoke" />);
    fireEvent.click(screen.getByText("review voice"));
    expect(
      screen.getByText("feat: auth, tighten rate-limit and error boundaries"),
    ).toBeInTheDocument();
  });

  it("awards the checkpoint once all five conventions are absorbed", () => {
    render(<L03AgentsCrystal lessonId="L03" cpId="bespoke" />);
    for (const label of [
      "test layout",
      "error handling",
      "lint command",
      "branch naming",
    ]) {
      fireEvent.click(screen.getByText(label));
    }
    expect(isCheckpointDone("L03", "bespoke")).toBe(false);
    fireEvent.click(screen.getByText("review voice"));
    expect(isCheckpointDone("L03", "bespoke")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
    expect(screen.getByText(/STYLE CONFORMANT/)).toBeInTheDocument();
  });
});
