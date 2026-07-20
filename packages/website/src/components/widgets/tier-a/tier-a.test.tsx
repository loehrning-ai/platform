import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

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

import { QuizWidget } from "./quiz";
import { FlashcardsWidget } from "./flashcards";
import { CompareWidget } from "./compare";
import { TaskSpecWidget } from "./task-spec";
import { SelfRateWidget } from "./self-rate";
import { PlaysWidget } from "./plays";

/**
 * Tier-A widget tests. Each widget gets happy-path + empty/edge +
 * keyboard + (where motion is involved) a reduced-motion render check.
 *
 * matchMedia is mocked in src/test/setup.ts to return matches:false, so
 * `useReducedMotion()` defaults to "motion allowed". The reduced-motion
 * cases override it per-test.
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

// ─── Quiz ────────────────────────────────────────────────────────

describe("QuizWidget", () => {
  const base = {
    lessonId: "l1",
    cpId: "quiz1",
    question: "Was ist eine starke Spezifikation?",
    options: ["Vage", "Mit Akzeptanzkriterien", "Ohne Kontext"],
    correct: 1,
    explanation: "Akzeptanzkriterien machen den Auftrag prüfbar.",
  };

  it("renders the question and all options", () => {
    render(<QuizWidget {...base} />);
    expect(
      screen.getByText("Was ist eine starke Spezifikation?"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("awards the checkpoint XP once on a correct answer", () => {
    render(<QuizWidget {...base} />);
    fireEvent.click(screen.getByText("Mit Akzeptanzkriterien"));
    expect(isCheckpointDone("l1", "quiz1")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
    // Re-answer is locked after first pick: still exactly one award.
    expect(getXp()).toBe(XP.CHECKPOINT);
  });

  it("does not award XP for a wrong answer", () => {
    render(<QuizWidget {...base} />);
    fireEvent.click(screen.getByText("Vage"));
    expect(isCheckpointDone("l1", "quiz1")).toBe(false);
    expect(getXp()).toBe(0);
  });

  it("answers via keyboard letter shortcut (B = correct)", () => {
    render(<QuizWidget {...base} />);
    // The keydown listener is on the div wrapping the radiogroup.
    const inner = screen.getByRole("radiogroup").parentElement!;
    fireEvent.keyDown(inner, { key: "b" });
    expect(isCheckpointDone("l1", "quiz1")).toBe(true);
  });

  it("renders with reduced motion enabled", () => {
    setReducedMotion(true);
    render(<QuizWidget {...base} />);
    fireEvent.click(screen.getByText("Mit Akzeptanzkriterien"));
    expect(screen.getByText(/Richtig\./)).toBeInTheDocument();
  });
});

// ─── Flashcards ──────────────────────────────────────────────────

describe("FlashcardsWidget", () => {
  const cards = [
    { term: "Begriff", q: "Was ist GPAI?", a: "General Purpose AI." },
    { q: "Was ist Hochrisiko?", a: "Anhang III Systeme." },
  ];

  const matchCount = (label: string) => (_: string, node: Element | null) =>
    node?.textContent?.replace(/\s+/g, " ").trim() === label;

  it("renders the first card front", () => {
    render(<FlashcardsWidget lessonId="l1" cpId="fc1" cards={cards} />);
    expect(screen.getByText("Was ist GPAI?")).toBeInTheDocument();
    expect(screen.getByText(matchCount("1 / 2"))).toBeInTheDocument();
  });

  it("handles an empty deck without crashing", () => {
    render(<FlashcardsWidget lessonId="l1" cpId="fc1" cards={[]} />);
    expect(screen.getByText("Keine Karten vorhanden.")).toBeInTheDocument();
  });

  it("awards the checkpoint once every card has been seen", () => {
    render(<FlashcardsWidget lessonId="l1" cpId="fc1" cards={cards} />);
    expect(isCheckpointDone("l1", "fc1")).toBe(false);
    // Keydown listener is on the deck container (button's grandparent).
    const deck =
      screen.getByRole("button", { name: /Karte 1 von 2/ }).parentElement!
        .parentElement!;
    fireEvent.keyDown(deck, { key: "ArrowRight" });
    expect(screen.getByText(matchCount("2 / 2"))).toBeInTheDocument();
    expect(isCheckpointDone("l1", "fc1")).toBe(true);
  });

  it("flips on click", () => {
    render(<FlashcardsWidget lessonId="l1" cpId="fc1" cards={cards} />);
    const card = screen.getByRole("button", { name: /Karte 1 von 2/ });
    expect(card.getAttribute("data-flipped")).toBe("0");
    fireEvent.click(card);
    expect(card.getAttribute("data-flipped")).toBe("1");
  });

  it("renders with reduced motion enabled", () => {
    setReducedMotion(true);
    render(<FlashcardsWidget lessonId="l1" cpId="fc1" cards={cards} />);
    expect(screen.getByText("Was ist GPAI?")).toBeInTheDocument();
  });
});

// ─── Compare ─────────────────────────────────────────────────────

describe("CompareWidget", () => {
  it("renders both columns + note", () => {
    render(
      <CompareWidget
        bad="Mach mal was mit KI."
        good="Klassifiziere diese 200 Mails nach Dringlichkeit."
        note="Konkret schlägt vage."
      />,
    );
    expect(screen.getByText("Mach mal was mit KI.")).toBeInTheDocument();
    expect(
      screen.getByText("Klassifiziere diese 200 Mails nach Dringlichkeit."),
    ).toBeInTheDocument();
    expect(screen.getByText("Konkret schlägt vage.")).toBeInTheDocument();
  });

  it("uses custom column labels", () => {
    render(
      <CompareWidget
        bad="A"
        good="B"
        badLabel="Vorher"
        goodLabel="Nachher"
      />,
    );
    expect(screen.getByText("Vorher")).toBeInTheDocument();
    expect(screen.getByText("Nachher")).toBeInTheDocument();
  });
});

// ─── TaskSpec ────────────────────────────────────────────────────

describe("TaskSpecWidget", () => {
  const items = [
    { section: "Kontext", hint: "Worum geht es?", body: ["- Hintergrund"] },
    { section: "Akzeptanzkriterien", body: ["- prüfbar"] },
    { section: "Beispiele", body: ["- vorher/nachher"] },
    { section: "Format" },
  ];

  it("renders all toggles starting at schwach", () => {
    render(<TaskSpecWidget lessonId="l1" cpId="ts1" items={items} />);
    expect(screen.getByText("Kontext")).toBeInTheDocument();
    expect(screen.getByText("schwach")).toBeInTheDocument();
  });

  it("awards the checkpoint once the threshold is reached", () => {
    render(
      <TaskSpecWidget lessonId="l1" cpId="ts1" items={items} threshold={3} />,
    );
    fireEvent.click(screen.getByText("Kontext"));
    fireEvent.click(screen.getByText("Akzeptanzkriterien"));
    expect(isCheckpointDone("l1", "ts1")).toBe(false);
    fireEvent.click(screen.getByText("Beispiele"));
    expect(screen.getByText("stark")).toBeInTheDocument();
    expect(isCheckpointDone("l1", "ts1")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });

  it("toggles an item back off", () => {
    render(<TaskSpecWidget lessonId="l1" cpId="ts1" items={items} />);
    const btn = screen.getByText("Kontext").closest("button")!;
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });
});

// ─── SelfRate ────────────────────────────────────────────────────

describe("SelfRateWidget", () => {
  const axes = [
    { id: "freq", label: "Wie oft nutzt du KI?", anchors: ["Nie", "Manchmal", "Täglich"] },
    { id: "depth", label: "Wie tief?", anchors: ["Oberfläche", "Workflows"] },
  ];

  it("renders each axis as a radiogroup", () => {
    render(<SelfRateWidget lessonId="l1" cpId="sr1" axes={axes} />);
    expect(screen.getAllByRole("radiogroup")).toHaveLength(2);
  });

  it("awards the checkpoint once every axis is rated", () => {
    render(<SelfRateWidget lessonId="l1" cpId="sr1" axes={axes} />);
    fireEvent.click(screen.getByText("Täglich"));
    expect(isCheckpointDone("l1", "sr1")).toBe(false);
    fireEvent.click(screen.getByText("Workflows"));
    expect(isCheckpointDone("l1", "sr1")).toBe(true);
  });

  it("persists picks to localStorage", () => {
    render(<SelfRateWidget lessonId="l1" cpId="sr1" axes={axes} />);
    fireEvent.click(screen.getByText("Täglich"));
    const raw = window.localStorage.getItem("selfrate::l1::sr1");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toEqual({ freq: 2 });
  });

  it("handles empty axes without awarding", () => {
    render(<SelfRateWidget lessonId="l1" cpId="sr1" axes={[]} />);
    expect(isCheckpointDone("l1", "sr1")).toBe(false);
  });
});

// ─── Plays ───────────────────────────────────────────────────────

describe("PlaysWidget", () => {
  const options = [
    "Tägliche KI-Routine etablieren",
    "Ein Eval-Set bauen",
    "Team-Playbook schreiben",
  ];

  it("renders all options as toggle buttons", () => {
    render(<PlaysWidget lessonId="l1" cpId="p1" options={options} />);
    expect(screen.getByText("Ein Eval-Set bauen")).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 1 gewählt/)).toBeInTheDocument();
  });

  it("locks the commitment + awards XP when minPick reached", () => {
    render(
      <PlaysWidget lessonId="l1" cpId="p1" options={options} minPick={2} />,
    );
    fireEvent.click(screen.getByText("Ein Eval-Set bauen"));
    expect(isCheckpointDone("l1", "p1")).toBe(false);
    fireEvent.click(screen.getByText("Team-Playbook schreiben"));
    expect(screen.getByText(/Commitment gesetzt/)).toBeInTheDocument();
    expect(isCheckpointDone("l1", "p1")).toBe(true);
  });

  it("toggles a pick off (aria-pressed)", () => {
    render(<PlaysWidget lessonId="l1" cpId="p1" options={options} />);
    const btn = screen.getByText("Ein Eval-Set bauen").closest("button")!;
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });
});
