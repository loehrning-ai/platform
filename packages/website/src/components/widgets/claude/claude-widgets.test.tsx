import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { isCheckpointDone, __resetCacheForTests } from "@/lib/progress";
import { PromptSandboxWidget } from "./prompt-sandbox";
import { PromptCompareWidget } from "./prompt-compare";
import { PromptGraderWidget } from "./prompt-grader";

function installLocalStoragePolyfill(): void {
  const store = new Map<string, string>();
  const polyfill: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: polyfill,
    writable: true,
    configurable: true,
  });
}

/**
 * Claude Course native widget tests (plan 008 stages 4-6). Each widget gets
 * happy-path + checkpoint-award + reduced-motion render, mirroring
 * `tier-a.test.tsx`'s conventions. All widgets here call the deterministic
 * `lib/claude-course/simulated-claude.ts` responder (real `setTimeout`
 * delays under 40ms), never a network call.
 */

function setReducedMotion(reduced: boolean): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = (query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
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
  setReducedMotion(false);
});

afterEach(() => {
  cleanup();
});

// ─── PromptSandbox ───────────────────────────────────────────────

describe("PromptSandboxWidget", () => {
  it("renders the textarea and run button", () => {
    render(<PromptSandboxWidget lessonId="l1" cpId="sb1" title="Try it" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run prompt/i })).toBeInTheDocument();
  });

  it("runs a prompt of at least minChars and awards the checkpoint", async () => {
    render(
      <PromptSandboxWidget lessonId="l1" cpId="sb1" title="Try it" minChars={5} />,
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Ask something about the auth service oncall rotation" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Run prompt/i }));
    await waitFor(() => expect(isCheckpointDone("l1", "sb1")).toBe(true));
    expect(screen.getByText(/guessing/i)).toBeInTheDocument();
  });

  it("does not award the checkpoint below minChars", async () => {
    render(
      <PromptSandboxWidget lessonId="l1" cpId="sb1" title="Try it" minChars={50} />,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "hi" } });
    fireEvent.click(screen.getByRole("button", { name: /Run prompt/i }));
    await waitFor(() => expect(screen.getByText(/useful response/i)).toBeInTheDocument());
    expect(isCheckpointDone("l1", "sb1")).toBe(false);
  });

  it("renders with reduced motion enabled", () => {
    setReducedMotion(true);
    render(<PromptSandboxWidget lessonId="l1" cpId="sb1" title="Try it" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});

// ─── PromptCompare ───────────────────────────────────────────────

describe("PromptCompareWidget", () => {
  const weak = "write a launch email";
  const strong =
    "You are a senior comms writer. Context: rolling out AuthKit v2. Format: subject then body, under 180 words.";

  it("renders both prompt columns", () => {
    render(<PromptCompareWidget lessonId="l1" cpId="cmp1" weak={weak} strong={strong} />);
    expect(screen.getByText(weak)).toBeInTheDocument();
    expect(screen.getByText(strong)).toBeInTheDocument();
  });

  it("runs both prompts and awards the checkpoint once", async () => {
    render(<PromptCompareWidget lessonId="l1" cpId="cmp1" weak={weak} strong={strong} />);
    fireEvent.click(screen.getByRole("button", { name: /Run both/i }));
    await waitFor(() => expect(isCheckpointDone("l1", "cmp1")).toBe(true));
    expect(screen.getByText("weak output")).toBeInTheDocument();
    expect(screen.getByText("strong output")).toBeInTheDocument();
  });

  it("renders with reduced motion enabled", () => {
    setReducedMotion(true);
    render(<PromptCompareWidget lessonId="l1" cpId="cmp1" weak={weak} strong={strong} />);
    expect(screen.getByRole("button", { name: /Run both/i })).toBeInTheDocument();
  });
});

// ─── PromptGrader ────────────────────────────────────────────────

describe("PromptGraderWidget", () => {
  it("keeps the grade button disabled below 20 characters", () => {
    render(
      <PromptGraderWidget
        lessonId="l1"
        cpId="grade1"
        task="Rewrite a status update."
        rubric="Must include all six parts."
      />,
    );
    expect(screen.getByRole("button", { name: /Grade my prompt/i })).toBeDisabled();
  });

  it("grades a prompt, shows the score dial, and awards the checkpoint", async () => {
    render(
      <PromptGraderWidget
        lessonId="l1"
        cpId="grade1"
        task="Rewrite a status update."
        rubric="Must include all six parts."
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: /your prompt/i }), {
      target: {
        value:
          "You are a senior engineer. Context: weekly update for internal team. Format as three bullets.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Grade my prompt/i }));
    await waitFor(() => expect(isCheckpointDone("l1", "grade1")).toBe(true));
    expect(screen.getByRole("img", { name: /Score:/i })).toBeInTheDocument();
  });

  it("renders with reduced motion enabled", () => {
    setReducedMotion(true);
    render(
      <PromptGraderWidget
        lessonId="l1"
        cpId="grade1"
        task="Task"
        rubric="Rubric"
      />,
    );
    expect(screen.getByRole("textbox", { name: /your prompt/i })).toBeInTheDocument();
  });
});
