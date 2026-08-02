import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { isCheckpointDone, __resetCacheForTests } from "@/lib/progress";
import { PromptSandboxWidget } from "./prompt-sandbox";
import { PromptCompareWidget } from "./prompt-compare";
import { PromptGraderWidget } from "./prompt-grader";
import { RewriteArenaWidget } from "./rewrite-arena";
import { FillBlankWidget } from "./fill-blank";
import { PromptDiffWidget } from "./prompt-diff";
import { SocraticTutorWidget } from "./socratic-tutor";
import { AgentLoopWidget } from "./agent-loop";
import { TokenizerWidget } from "./tokenizer";
import { ClaudeMdBuilderWidget } from "./claude-md-builder";
import { PromptLibraryShaperWidget } from "./prompt-library-shaper";

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
 * Claude Course native widget tests. Each widget gets
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
  vi.restoreAllMocks();
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

// ─── RewriteArena ────────────────────────────────────────────────

describe("RewriteArenaWidget", () => {
  it("keeps the enter-arena button disabled below 20 characters", () => {
    render(
      <RewriteArenaWidget
        lessonId="l1"
        cpId="arena1"
        original="make it sound better and shorter"
        task="Correct a first draft."
        criteria="specificity"
      />,
    );
    expect(screen.getByRole("button", { name: /Enter the arena/i })).toBeDisabled();
  });

  it("judges a strong rewrite as the winner and awards the checkpoint", async () => {
    render(
      <RewriteArenaWidget
        lessonId="l1"
        cpId="arena1"
        original="make it sound better and shorter"
        task="Correct a first draft."
        criteria="specificity, testability"
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: /your rewrite/i }), {
      target: {
        value:
          "You are a senior editor. Context: internal status update. Format as three bullets. For example: shipped X.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enter the arena/i }));
    await waitFor(() => expect(isCheckpointDone("l1", "arena1")).toBe(true));
    expect(screen.getAllByText("Your rewrite wins").length).toBeGreaterThan(0);
  });

  it("renders with reduced motion enabled", () => {
    setReducedMotion(true);
    render(
      <RewriteArenaWidget
        lessonId="l1"
        cpId="arena1"
        original="original"
        task="task"
        criteria="criteria"
      />,
    );
    expect(screen.getByRole("textbox", { name: /your rewrite/i })).toBeInTheDocument();
  });
});

// ─── FillBlank ───────────────────────────────────────────────────

describe("FillBlankWidget", () => {
  const template = "You are {{0}}.\n\nTASK\n{{1}}";
  const blanks = [{ label: "Role", hint: "e.g. a PM" }, { label: "Task", hint: "one verb" }];

  it("renders the goal, template preview, and one input per blank", () => {
    render(
      <FillBlankWidget lessonId="l1" cpId="fb1" goal="Summarize a PRD." template={template} blanks={blanks} />,
    );
    expect(screen.getByText(/Summarize a PRD\./)).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
  });

  it("keeps the check button disabled until every blank is filled, then awards the checkpoint", async () => {
    render(
      <FillBlankWidget lessonId="l1" cpId="fb1" goal="Summarize a PRD." template={template} blanks={blanks} />,
    );
    const check = screen.getByRole("button", { name: /Have Claude check it/i });
    expect(check).toBeDisabled();
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "a senior PM" } });
    expect(check).toBeDisabled();
    fireEvent.change(inputs[1], { target: { value: "summarize the PRD" } });
    expect(check).not.toBeDisabled();
    fireEvent.click(check);
    await waitFor(() => expect(isCheckpointDone("l1", "fb1")).toBe(true));
  });

  it("renders with reduced motion enabled", () => {
    setReducedMotion(true);
    render(
      <FillBlankWidget lessonId="l1" cpId="fb1" goal="Goal" template={template} blanks={blanks} />,
    );
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
  });
});

// ─── PromptDiff ──────────────────────────────────────────────────

describe("PromptDiffWidget", () => {
  it("renders both prompts and a takeaway with no checkpoint chrome", () => {
    render(
      <PromptDiffWidget
        weak="make it better and shorter please"
        strong="Cut the opening paragraph. Start with the status in one sentence."
        takeaway="The strong correction is actionable."
      />,
    );
    expect(screen.getByText("What changed, word by word")).toBeInTheDocument();
    expect(screen.getByText(/The strong correction is actionable\./)).toBeInTheDocument();
    expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
  });

  it("marks a word only present in the strong prompt as changed", () => {
    const { container } = render(
      <PromptDiffWidget weak="hello world" strong="hello there world" />,
    );
    const added = container.querySelector(".bg-risk-green\\/20");
    expect(added?.textContent).toBe("there");
  });
});

// ─── SocraticTutor ───────────────────────────────────────────────

describe("SocraticTutorWidget", () => {
  it("shows the topic-scoped empty state before any message", () => {
    render(<SocraticTutorWidget lessonId="l1" cpId="tutor1" topic="prompt anatomy" />);
    expect(screen.getByText(/prompt anatomy/)).toBeInTheDocument();
  });

  it("replies with a probing question and awards the checkpoint after 3 user turns", async () => {
    render(<SocraticTutorWidget lessonId="l1" cpId="tutor1" topic="grounding" />);
    const input = screen.getByRole("textbox", { name: /your question/i });
    const ask = screen.getByRole("button", { name: /Ask/i });

    for (let turn = 1; turn <= 3; turn += 1) {
      fireEvent.change(input, { target: { value: `question ${turn}` } });
      fireEvent.click(ask);
      // eslint-disable-next-line no-await-in-loop
      await waitFor(() => expect(screen.getAllByText("tutor").length).toBe(turn));
    }
    expect(isCheckpointDone("l1", "tutor1")).toBe(true);
  });

  it("renders with reduced motion enabled", () => {
    setReducedMotion(true);
    render(<SocraticTutorWidget lessonId="l1" cpId="tutor1" topic="topic" />);
    expect(screen.getByRole("textbox", { name: /your question/i })).toBeInTheDocument();
  });
});

// ─── AgentLoop ───────────────────────────────────────────────────

describe("AgentLoopWidget", () => {
  it("shows the empty state before running", () => {
    render(<AgentLoopWidget lessonId="l1" cpId="loop1" />);
    expect(screen.getByText(/Click "Start loop"/i)).toBeInTheDocument();
  });

  it("runs the canned script and awards the checkpoint", async () => {
    render(<AgentLoopWidget lessonId="l1" cpId="loop1" />);
    fireEvent.click(screen.getByRole("button", { name: /Start loop/i }));
    await waitFor(() => expect(isCheckpointDone("l1", "loop1")).toBe(true));
    expect(screen.getAllByText(/answer/i).length).toBeGreaterThan(0);
  });

  it("renders with reduced motion enabled", () => {
    setReducedMotion(true);
    render(<AgentLoopWidget lessonId="l1" cpId="loop1" />);
    expect(screen.getByRole("button", { name: /Start loop/i })).toBeInTheDocument();
  });
});

// ─── Tokenizer ───────────────────────────────────────────────────

describe("TokenizerWidget", () => {
  it("renders the default text tokenized into colored spans", () => {
    render(<TokenizerWidget lessonId="l1" cpId="tok1" />);
    expect(screen.getByRole("textbox", { name: /text to tokenize/i })).toHaveValue(
      "The quick brown fox jumps over the lazy dog.",
    );
  });

  it("awards the checkpoint once the text exceeds 80 characters", () => {
    render(<TokenizerWidget lessonId="l1" cpId="tok1" />);
    const textarea = screen.getByRole("textbox", { name: /text to tokenize/i });
    fireEvent.change(textarea, {
      target: { value: "x".repeat(90) },
    });
    expect(isCheckpointDone("l1", "tok1")).toBe(true);
  });

  it("does not award the checkpoint under 80 characters", () => {
    render(<TokenizerWidget lessonId="l1" cpId="tok1" />);
    const textarea = screen.getByRole("textbox", { name: /text to tokenize/i });
    fireEvent.change(textarea, { target: { value: "short" } });
    expect(isCheckpointDone("l1", "tok1")).toBe(false);
  });
});

// ─── ClaudeMdBuilder ─────────────────────────────────────────────

describe("ClaudeMdBuilderWidget", () => {
  async function renderGeneratedBuilder(): Promise<void> {
    render(<ClaudeMdBuilderWidget lessonId="l1" cpId="builder1" />);
    fireEvent.change(screen.getByPlaceholderText(/Reporting dashboard/i), {
      target: { value: "Private reporting project" },
    });
    fireEvent.change(screen.getByPlaceholderText(/TypeScript, React 18/i), {
      target: { value: "TypeScript" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Generate CLAUDE.md/i }));
    await screen.findByRole("button", { name: "Copy" });
  }

  it("keeps generate disabled until project and stack are filled", () => {
    render(<ClaudeMdBuilderWidget lessonId="l1" cpId="builder1" />);
    expect(screen.getByRole("button", { name: /Generate CLAUDE.md/i })).toBeDisabled();
  });

  it("generates a CLAUDE.md from the form and awards the checkpoint", async () => {
    render(<ClaudeMdBuilderWidget lessonId="l1" cpId="builder1" />);
    fireEvent.change(screen.getByPlaceholderText(/Reporting dashboard/i), {
      target: { value: "My project" },
    });
    fireEvent.change(screen.getByPlaceholderText(/TypeScript, React 18/i), {
      target: { value: "TypeScript" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Generate CLAUDE.md/i }));
    await waitFor(() => expect(isCheckpointDone("l1", "builder1")).toBe(true));
    expect(screen.getAllByText(/My project/).length).toBeGreaterThan(0);
  });

  it("renders with reduced motion enabled", () => {
    setReducedMotion(true);
    render(<ClaudeMdBuilderWidget lessonId="l1" cpId="builder1" />);
    expect(screen.getByRole("button", { name: /Generate CLAUDE.md/i })).toBeInTheDocument();
  });

  it("shows copied only after the generated document reaches the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    await renderGeneratedBuilder();

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(
      await screen.findByRole("button", { name: "Copied" }),
    ).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("Private reporting project"),
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps generated content out of console when clipboard access fails", async () => {
    const writeText = vi
      .fn()
      .mockRejectedValue(
        new Error("Private reporting project clipboard-provider-secret"),
      );
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    await renderGeneratedBuilder();

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(
      await screen.findByText(
        "Copy failed. Check clipboard permission and try again.",
      ),
    ).toHaveAttribute("role", "alert");
    expect(screen.getByRole("button", { name: "Copy" })).toBeVisible();
    expect(consoleError).not.toHaveBeenCalled();
  });
});

// ─── PromptLibraryShaper ─────────────────────────────────────────

describe("PromptLibraryShaperWidget", () => {
  it("starts with the sample prompt and a sub-100 shareability score", () => {
    render(<PromptLibraryShaperWidget lessonId="l1" cpId="shaper1" />);
    expect(screen.getByText(/shareability · /)).toBeInTheDocument();
  });

  it("loading the ideal version raises the score to 80+ and reviewing awards the checkpoint", async () => {
    render(<PromptLibraryShaperWidget lessonId="l1" cpId="shaper1" />);
    fireEvent.click(screen.getByRole("button", { name: /Load an ideal version/i }));
    // Matches the source's own `loadIdeal()` text exactly, which itself
    // scores 80 (not 100) against these checks: "EXAMPLE OUTPUT" has no
    // colon and no code fence, so the "sample output" check stays unmet.
    expect(screen.getByText("shareability · 80")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Let Claude review/i }));
    await waitFor(() => expect(isCheckpointDone("l1", "shaper1")).toBe(true));
  });

  it("renders with reduced motion enabled", () => {
    setReducedMotion(true);
    render(<PromptLibraryShaperWidget lessonId="l1" cpId="shaper1" />);
    expect(screen.getByRole("button", { name: /Let Claude review/i })).toBeInTheDocument();
  });
});
