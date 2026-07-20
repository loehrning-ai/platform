import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";

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

import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";

import { FailureTaggerWidget } from "./failure-tagger";
import { RedactionDrillWidget } from "./redaction-drill";
import { DragReorderWidget } from "./drag-reorder";

/**
 * Tier-A+ exercise widget tests. Each widget gets happy-path +
 * empty/edge + keyboard + reduced-motion render. All three are deterministic
 * (no API, no Math.random / Date.now in their grading), so the assertions are
 * stable.
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

// ─── FailureTagger ────────────────────────────────────────────────

describe("FailureTaggerWidget", () => {
  /** Two-case override keeps the test focused and the threshold predictable. */
  const cases = [
    {
      id: "k1",
      prompt: "Wie hoch ist unser Kontostand?",
      output: "Ihr Konto weist 48.213,77 EUR aus.",
      correct: "halluzination" as const,
      why: "Kein Bankzugriff, Zahl erfunden.",
    },
    {
      id: "k2",
      prompt: "Gib mir eine reine CSV, keine Erklärung.",
      output: "Gerne! Hier ist eine Übersicht: ...",
      correct: "formatdrift" as const,
      why: "Form ignoriert.",
    },
  ];

  it("renders the legend, the prompts and the mode pills per case", () => {
    render(
      <FailureTaggerWidget lessonId="l1" cpId="ft1" cases={cases} />,
    );
    expect(screen.getByText("Wie hoch ist unser Kontostand?")).toBeInTheDocument();
    // 4 modes x 2 cases = 8 radios
    expect(screen.getAllByRole("radio")).toHaveLength(8);
    expect(screen.getAllByRole("radiogroup")).toHaveLength(2);
  });

  it("awards the checkpoint once when enough cases are correct", () => {
    render(
      <FailureTaggerWidget
        lessonId="l1"
        cpId="ft1"
        cases={cases}
        passThreshold={2}
      />,
    );
    const groups = screen.getAllByRole("radiogroup");
    fireEvent.click(within(groups[0]).getByRole("radio", { name: "Halluzination" }));
    fireEvent.click(within(groups[1]).getByRole("radio", { name: "Formatdrift" }));
    expect(isCheckpointDone("l1", "ft1")).toBe(false); // not until submit
    fireEvent.click(screen.getByText("Auswerten"));
    expect(isCheckpointDone("l1", "ft1")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
    expect(screen.getByText("Bestanden")).toBeInTheDocument();
  });

  it("does not award XP when the threshold is not met", () => {
    render(
      <FailureTaggerWidget
        lessonId="l1"
        cpId="ft1"
        cases={cases}
        passThreshold={2}
      />,
    );
    const groups = screen.getAllByRole("radiogroup");
    // Both wrong.
    fireEvent.click(within(groups[0]).getByRole("radio", { name: "Formatdrift" }));
    fireEvent.click(within(groups[1]).getByRole("radio", { name: "Halluzination" }));
    fireEvent.click(screen.getByText("Auswerten"));
    expect(isCheckpointDone("l1", "ft1")).toBe(false);
    expect(getXp()).toBe(0);
    expect(screen.getByText("Nochmal ansehen")).toBeInTheDocument();
  });

  it("keeps Auswerten disabled until every case is tagged", () => {
    render(
      <FailureTaggerWidget lessonId="l1" cpId="ft1" cases={cases} />,
    );
    const submit = screen.getByText("Auswerten");
    expect(submit).toBeDisabled();
    const groups = screen.getAllByRole("radiogroup");
    fireEvent.click(within(groups[0]).getByRole("radio", { name: "Halluzination" }));
    expect(submit).toBeDisabled();
    fireEvent.click(within(groups[1]).getByRole("radio", { name: "Formatdrift" }));
    expect(submit).not.toBeDisabled();
  });

  it("renders with reduced motion enabled", () => {
    setReducedMotion(true);
    render(
      <FailureTaggerWidget
        lessonId="l1"
        cpId="ft1"
        cases={cases}
        passThreshold={2}
      />,
    );
    const groups = screen.getAllByRole("radiogroup");
    fireEvent.click(within(groups[0]).getByRole("radio", { name: "Halluzination" }));
    fireEvent.click(within(groups[1]).getByRole("radio", { name: "Formatdrift" }));
    fireEvent.click(screen.getByText("Auswerten"));
    expect(screen.getByText(/Kein Bankzugriff/)).toBeInTheDocument();
  });

  it("ships the default 5 German Mittelstand cases", () => {
    render(<FailureTaggerWidget lessonId="l1" cpId="ft1" />);
    // 4 modes x 5 cases = 20 radios.
    expect(screen.getAllByRole("radio")).toHaveLength(20);
  });
});

// ─── RedactionDrill ───────────────────────────────────────────────

describe("RedactionDrillWidget", () => {
  /** Single-scenario override: one safe + two sensitive segments. */
  const scenarios = [
    {
      id: "z1",
      label: "Test-Log",
      intro: "Markiere, was nicht raus darf.",
      segments: [
        { text: "Bitte hilf mir mit dem Fehler. " },
        { text: "token=sk-int-9", sensitive: "API-Zugangstoken" },
        { text: " und " },
        { text: "[email protected]", sensitive: "Kunden-E-Mail" },
        { text: " betrag=12 EUR" },
      ],
    },
  ];

  it("renders the scenario passage and the two risky segments", () => {
    render(
      <RedactionDrillWidget lessonId="l1" cpId="rd1" scenarios={scenarios} />,
    );
    expect(
      screen.getByRole("button", { name: /API-Zugangstoken/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Kunden-E-Mail/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 2 erfasst/)).toBeInTheDocument();
  });

  it("awards the checkpoint when every sensitive segment is redacted", () => {
    render(
      <RedactionDrillWidget lessonId="l1" cpId="rd1" scenarios={scenarios} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /API-Zugangstoken/ }));
    fireEvent.click(screen.getByRole("button", { name: /Kunden-E-Mail/ }));
    fireEvent.click(screen.getByText("Einfügen prüfen"));
    expect(isCheckpointDone("l1", "rd1")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
    expect(screen.getByText(/Sicher zum Einfügen/)).toBeInTheDocument();
  });

  it("does not award when a sensitive segment is missed", () => {
    render(
      <RedactionDrillWidget lessonId="l1" cpId="rd1" scenarios={scenarios} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /API-Zugangstoken/ }));
    fireEvent.click(screen.getByText("Einfügen prüfen"));
    expect(isCheckpointDone("l1", "rd1")).toBe(false);
    expect(getXp()).toBe(0);
    expect(screen.getByText(/Noch nicht abschicken/)).toBeInTheDocument();
  });

  it("requires BOTH default scenarios to be cleaned before awarding", () => {
    render(<RedactionDrillWidget lessonId="l1" cpId="rd1" />);
    // Scenario 1: redact its two sensitive segments.
    fireEvent.click(screen.getByRole("button", { name: /API-Zugangstoken/ }));
    fireEvent.click(
      screen.getByRole("button", { name: /Kunden-E-Mail \(personenbezogen\)/ }),
    );
    fireEvent.click(screen.getByText("Einfügen prüfen"));
    // Only scenario 1 done so far → checkpoint must NOT be awarded yet.
    expect(isCheckpointDone("l1", "rd1")).toBe(false);
    // Switch to scenario 2 and clean its three sensitive segments.
    const scenarioTwo = screen.getByRole("button", { name: /Szenario 2/ });
    expect(scenarioTwo).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(scenarioTwo);
    expect(scenarioTwo).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /IBAN/ }));
    fireEvent.click(
      screen.getByRole("button", { name: /private Telefonnummer/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Passwort im Klartext/ }));
    fireEvent.click(screen.getByRole("button", { name: /Name einer Privatperson/ }));
    fireEvent.click(screen.getByText("Einfügen prüfen"));
    expect(isCheckpointDone("l1", "rd1")).toBe(true);
  });

  it("renders with reduced motion enabled", () => {
    setReducedMotion(true);
    render(
      <RedactionDrillWidget lessonId="l1" cpId="rd1" scenarios={scenarios} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /API-Zugangstoken/ }));
    fireEvent.click(screen.getByRole("button", { name: /Kunden-E-Mail/ }));
    fireEvent.click(screen.getByText("Einfügen prüfen"));
    expect(screen.getByText(/Sicher zum Einfügen/)).toBeInTheDocument();
  });
});

// ─── DragReorder ──────────────────────────────────────────────────

describe("DragReorderWidget", () => {
  it("renders all blocks and starts scrambled (not in correct order)", () => {
    render(<DragReorderWidget lessonId="l1" cpId="dr1" />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    const order = items.map((li) => li.getAttribute("data-id"));
    expect(order).not.toEqual([
      "verboten",
      "hochrisiko",
      "transparenz",
      "minimal",
    ]);
  });

  it("does not award the checkpoint when checked in the wrong order", () => {
    render(<DragReorderWidget lessonId="l1" cpId="dr1" />);
    fireEvent.click(screen.getByText("Reihenfolge prüfen"));
    expect(isCheckpointDone("l1", "dr1")).toBe(false);
    expect(screen.getByText(/Noch nicht ganz/)).toBeInTheDocument();
  });

  it("awards the checkpoint once the nudge buttons reach the correct order", () => {
    const blocks = [
      { id: "a", label: "Stufe A" },
      { id: "b", label: "Stufe B" },
    ];
    render(
      <DragReorderWidget
        lessonId="l1"
        cpId="dr1"
        blocks={blocks}
        correctOrder={["a", "b"]}
      />,
    );
    // initialScramble reverses the correct order: reverse([a,b]) = [b,a],
    // which is not the answer, so the learner starts with work to do.
    let ids = screen
      .getAllByRole("listitem")
      .map((li) => li.getAttribute("data-id"));
    expect(ids).toEqual(["b", "a"]);
    // Move "Stufe A" up to position 0.
    fireEvent.click(screen.getByRole("button", { name: /Stufe A nach oben/ }));
    ids = screen.getAllByRole("listitem").map((li) => li.getAttribute("data-id"));
    expect(ids).toEqual(["a", "b"]);
    fireEvent.click(screen.getByText("Reihenfolge prüfen"));
    expect(isCheckpointDone("l1", "dr1")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });

  it("supports drag-and-drop reordering", () => {
    const blocks = [
      { id: "a", label: "Stufe A" },
      { id: "b", label: "Stufe B" },
    ];
    render(
      <DragReorderWidget
        lessonId="l1"
        cpId="dr1"
        blocks={blocks}
        correctOrder={["a", "b"]}
      />,
    );
    // Scramble is [b, a]; drag item 0 (b) onto item 1 (a) => [a, b].
    const items = screen.getAllByRole("listitem");
    const dt = { effectAllowed: "" } as unknown as DataTransfer;
    fireEvent.dragStart(items[0], { dataTransfer: dt });
    fireEvent.dragOver(items[1], { dataTransfer: dt });
    fireEvent.drop(items[1], { dataTransfer: dt });
    const ids = screen
      .getAllByRole("listitem")
      .map((li) => li.getAttribute("data-id"));
    expect(ids).toEqual(["a", "b"]);
  });

  it("reshuffle never lands on the correct answer", () => {
    render(<DragReorderWidget lessonId="l1" cpId="dr1" />);
    const correct = ["verboten", "hochrisiko", "transparenz", "minimal"];
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByText("Mischen"));
      const ids = screen
        .getAllByRole("listitem")
        .map((li) => li.getAttribute("data-id"));
      expect(ids).not.toEqual(correct);
    }
  });
});
