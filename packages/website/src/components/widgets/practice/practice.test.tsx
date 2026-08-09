import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";

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

import { __resetCacheForTests, isCheckpointDone } from "@/lib/progress";

import { PromptOrreryWidget } from "./prompt-orrery";
import { PromptTransformWidget } from "./prompt-transform";
import { SemanticSpaceWidget } from "./semantic-space";

/**
 * Practice Room widget tests. Each widget gets:
 *  - a static-mode happy path (live API absent → fallback works, lesson lands)
 *  - the checkpoint accrual that does NOT depend on the API
 *  - the honest "Live-Modus nicht verfügbar" note when a live call fails
 *  - keyboard reachability of the core controls
 *
 * fetch is mocked per-test: rejecting / non-ok responses model "flag off".
 */

beforeAll(() => {
  installLocalStoragePolyfill();
});

beforeEach(() => {
  window.localStorage.clear();
  __resetCacheForTests();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function mockFetchUnavailable(): void {
  // 503 (flag off) — usePracticeApi treats any non-ok as "unavailable".
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify({ error: "off" }), { status: 503 }),
    ),
  );
}

function mockFetchComplete(text: string): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify({ mode: "complete", text }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
}

describe("PromptOrreryWidget", () => {
  it("shows a live STATIC quality score from the default-active parts", () => {
    render(<PromptOrreryWidget lessonId="L" cpId="orrery" />);
    // role(18)+context(22)+task(28) default-on = 68.
    expect(screen.getByText("68")).toBeInTheDocument();
  });

  it("awards the checkpoint offline once quality reaches >=80", () => {
    render(<PromptOrreryWidget lessonId="L" cpId="orrery" />);
    // Toggle Constraints on (+16 → 84, production-ready).
    fireEvent.click(screen.getByText("Constraints"));
    expect(isCheckpointDone("L", "orrery")).toBe(true);
  });

  it("shows the 'Live-Modus nicht verfügbar' note after a failed live run", async () => {
    mockFetchUnavailable();
    render(<PromptOrreryWidget lessonId="L" cpId="orrery" />);
    fireEvent.click(
      screen.getByRole("button", { name: /Prompt live ausführen/i }),
    );
    await waitFor(() =>
      expect(screen.getByText(/Live-Modus nicht verfügbar/i)).toBeInTheDocument(),
    );
  });

  it("renders the assembled prompt in a details element", () => {
    render(<PromptOrreryWidget lessonId="L" cpId="orrery" />);
    expect(screen.getByText(/Zusammengesetzter Prompt/i)).toBeInTheDocument();
  });
});

describe("PromptTransformWidget", () => {
  it("renders three stages and shows the first stage prompt", () => {
    render(<PromptTransformWidget lessonId="L" cpId="pt" />);
    expect(screen.getByRole("group", { name: /Prompt-Stufe wählen/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /1 · vage/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /3 · strukturiert/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("awards the checkpoint offline once all three stages are viewed", () => {
    render(<PromptTransformWidget lessonId="L" cpId="pt" />);
    fireEvent.click(screen.getByRole("button", { name: /2 · konkret/i }));
    fireEvent.click(screen.getByRole("button", { name: /3 · strukturiert/i }));
    expect(isCheckpointDone("L", "pt")).toBe(true);
  });

  it("shows live output when the API succeeds", async () => {
    mockFetchComplete("Betreff: Neues Tool");
    render(<PromptTransformWidget lessonId="L" cpId="pt" />);
    fireEvent.click(
      screen.getByRole("button", { name: /Stufe 1 live ausführen/i }),
    );
    await waitFor(() =>
      expect(screen.getByText(/Betreff: Neues Tool/)).toBeInTheDocument(),
    );
  });
});

describe("SemanticSpaceWidget", () => {
  it("renders the seeded German word clusters", () => {
    render(<SemanticSpaceWidget lessonId="L" cpId="sem" />);
    expect(screen.getByText("Kunde")).toBeInTheDocument();
    expect(screen.getByText("Fräse")).toBeInTheDocument();
  });

  it("places a word via the offline heuristic + awards the checkpoint", async () => {
    mockFetchUnavailable();
    render(<SemanticSpaceWidget lessonId="L" cpId="sem" />);
    const input = screen.getByLabelText("Neues Wort");
    fireEvent.change(input, { target: { value: "Rechnungseingang" } });
    fireEvent.click(screen.getByRole("button", { name: /Einordnen/i }));
    await waitFor(() => expect(isCheckpointDone("L", "sem")).toBe(true));
    // The placed user word appears both as a pill and in the status line.
    expect(screen.getAllByText("Rechnungseingang").length).toBeGreaterThan(0);
  });

  it("places a word via Enter key", async () => {
    mockFetchUnavailable();
    render(<SemanticSpaceWidget lessonId="L" cpId="sem" />);
    const input = screen.getByLabelText("Neues Wort");
    fireEvent.change(input, { target: { value: "Bohrmaschine" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() =>
      expect(screen.getAllByText("Bohrmaschine").length).toBeGreaterThan(0),
    );
  });
});

describe("SemanticSpaceWidget — claude-course English override ", () => {
  it("renders the overridden English seed words, not the German defaults", async () => {
    const { CLAUDE_SEMANTIC_SPACE_SEED, CLAUDE_SEMANTIC_SPACE_KEYWORDS, CLAUDE_SEMANTIC_SPACE_CLUSTER_LABELS, CLAUDE_SEMANTIC_SPACE_QUADRANT_LABELS, CLAUDE_SEMANTIC_SPACE_COPY } =
      await import("@/lib/claude-course/widget-copy");
    render(
      <SemanticSpaceWidget
        lessonId="L"
        cpId="sem"
        seed={CLAUDE_SEMANTIC_SPACE_SEED}
        clusterKeywords={CLAUDE_SEMANTIC_SPACE_KEYWORDS}
        clusterLabels={CLAUDE_SEMANTIC_SPACE_CLUSTER_LABELS}
        quadrantLabels={CLAUDE_SEMANTIC_SPACE_QUADRANT_LABELS}
        copy={CLAUDE_SEMANTIC_SPACE_COPY}
      />,
    );
    expect(screen.getByText("kubernetes")).toBeInTheDocument();
    expect(screen.getByText("espresso")).toBeInTheDocument();
    expect(screen.queryByText("Kunde")).not.toBeInTheDocument();
    expect(screen.getByLabelText("New word")).toBeInTheDocument();
  });

  it("the offline heuristic matches an English word to the right group (functional, not just cosmetic)", async () => {
    mockFetchUnavailable();
    const { CLAUDE_SEMANTIC_SPACE_SEED, CLAUDE_SEMANTIC_SPACE_KEYWORDS, CLAUDE_SEMANTIC_SPACE_CLUSTER_LABELS, CLAUDE_SEMANTIC_SPACE_QUADRANT_LABELS, CLAUDE_SEMANTIC_SPACE_COPY } =
      await import("@/lib/claude-course/widget-copy");
    render(
      <SemanticSpaceWidget
        lessonId="L"
        cpId="sem"
        seed={CLAUDE_SEMANTIC_SPACE_SEED}
        clusterKeywords={CLAUDE_SEMANTIC_SPACE_KEYWORDS}
        clusterLabels={CLAUDE_SEMANTIC_SPACE_CLUSTER_LABELS}
        quadrantLabels={CLAUDE_SEMANTIC_SPACE_QUADRANT_LABELS}
        copy={CLAUDE_SEMANTIC_SPACE_COPY}
      />,
    );
    const input = screen.getByLabelText("New word");
    // "sprint" only appears in the English "technik" keyword list, not in
    // the component's own default German lists — proves the MATCHING logic
    // itself uses the override, not just the seed display labels.
    fireEvent.change(input, { target: { value: "sprint" } });
    fireEvent.click(screen.getByRole("button", { name: /Place in space/i }));
    await waitFor(() => expect(isCheckpointDone("L", "sem")).toBe(true));
    const placementStatus = screen
      .getAllByRole("status")
      .find((status) =>
        status.textContent?.includes("maps it to the tech group"),
      );
    expect(placementStatus).toBeInTheDocument();
    expect(screen.queryByText(/technik/)).not.toBeInTheDocument();
  });
});
