import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
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

import { InteractiveDiagram, type DiagramNode } from "./interactive-diagram";
import {
  RiskPyramidDiagram,
  ObligationLayersDiagram,
  RISK_PYRAMID_NODES,
  OBLIGATION_LAYER_NODES,
} from "./diagram-presets";

/**
 * tests. The diagram is deterministic when `reducedMotion` is forced:
 * trace resolves to the final frame synchronously, so checkpoint assertions are
 * stable without faking timers. Each variant gets happy + keyboard + empty +
 * reduced-motion coverage.
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

const STACK_NODES: readonly DiagramNode[] = [
  { id: "a", label: "Quelle", sub: "Erste Stufe" },
  { id: "b", label: "Verarbeitung", sub: "Zweite Stufe" },
  { id: "c", label: "Ausgabe", sub: "Dritte Stufe" },
];

const COMPARE_NODES: readonly DiagramNode[] = [
  {
    id: "x",
    label: "Schicht X",
    detail: "Was X tut.",
    consequence: "Ohne X bricht alles.",
  },
  {
    id: "y",
    label: "Schicht Y",
    detail: "Was Y tut.",
    consequence: "Ohne Y wird es langsam.",
  },
];

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

// ─── Primitive: stack variant ─────────────────────────────────────

describe("InteractiveDiagram (stack)", () => {
  it("renders the title, caption and every node", () => {
    render(
      <InteractiveDiagram
        variant="stack"
        nodes={STACK_NODES}
        title="Mein Stapel"
      />,
    );
    expect(screen.getByText("Mein Stapel")).toBeInTheDocument();
    expect(screen.getByText("Quelle")).toBeInTheDocument();
    expect(screen.getByText("Verarbeitung")).toBeInTheDocument();
    expect(screen.getByText("Ausgabe")).toBeInTheDocument();
    // One trace button + three node buttons.
    expect(screen.getByText("Verlauf abspielen")).toBeInTheDocument();
  });

  it("records the checkpoint once when traced (reduced motion = instant)", () => {
    render(
      <InteractiveDiagram
        variant="stack"
        nodes={STACK_NODES}
        lessonId="l1"
        cpId="diag1"
        reducedMotion
      />,
    );
    expect(isCheckpointDone("l1", "diag1")).toBe(false);
    fireEvent.click(screen.getByText("Verlauf abspielen"));
    expect(isCheckpointDone("l1", "diag1")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
    expect(screen.getByText(/Durchlauf komplett/)).toBeInTheDocument();
  });

  it("does not duplicate completion on a second trace", () => {
    render(
      <InteractiveDiagram
        variant="stack"
        nodes={STACK_NODES}
        lessonId="l1"
        cpId="diag1"
        reducedMotion
      />,
    );
    fireEvent.click(screen.getByText("Verlauf abspielen"));
    fireEvent.click(screen.getByText("Verlauf abspielen"));
    expect(getXp()).toBe(XP.CHECKPOINT);
  });

  it("works as a pure exhibit with no checkpoint props", () => {
    render(
      <InteractiveDiagram variant="stack" nodes={STACK_NODES} reducedMotion />,
    );
    fireEvent.click(screen.getByText("Verlauf abspielen"));
    // No progress-ledger change, no crash.
    expect(getXp()).toBe(0);
    expect(screen.getByText(/Durchlauf komplett/)).toBeInTheDocument();
  });

  it("renders nothing breakable for an empty node list", () => {
    render(<InteractiveDiagram variant="stack" nodes={[]} title="Leer" />);
    expect(screen.getByText("Leer")).toBeInTheDocument();
    // Trace on an empty diagram is a no-op (does not throw).
    fireEvent.click(screen.getByText("Verlauf abspielen"));
    expect(getXp()).toBe(0);
  });
});

// ─── Primitive: compare variant ───────────────────────────────────

describe("InteractiveDiagram (compare)", () => {
  it("shows a node detail panel on click (toggle)", () => {
    render(<InteractiveDiagram variant="compare" nodes={COMPARE_NODES} />);
    // Empty state first.
    expect(screen.getByText("Schicht antippen")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Schicht X/ }));
    expect(screen.getByText("Was X tut.")).toBeInTheDocument();
    expect(screen.getByText("Ohne X bricht alles.")).toBeInTheDocument();
    // Click again closes it.
    fireEvent.click(screen.getByRole("button", { name: /Schicht X/ }));
    expect(screen.getByText("Schicht antippen")).toBeInTheDocument();
  });

  it("is keyboard-operable: Enter on a node opens its detail", () => {
    render(
      <InteractiveDiagram
        variant="compare"
        nodes={COMPARE_NODES}
        lessonId="l1"
        cpId="cmp1"
      />,
    );
    const nodeX = screen.getByRole("button", { name: /Schicht X/ });
    nodeX.focus();
    fireEvent.keyDown(nodeX, { key: "Enter" });
    expect(screen.getByText("Was X tut.")).toBeInTheDocument();
  });

  it("records the checkpoint once every layer has been inspected", () => {
    render(
      <InteractiveDiagram
        variant="compare"
        nodes={COMPARE_NODES}
        lessonId="l1"
        cpId="cmp1"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Schicht X/ }));
    expect(isCheckpointDone("l1", "cmp1")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /Schicht Y/ }));
    expect(isCheckpointDone("l1", "cmp1")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });

  it("has no trace button (compare is inspection-driven)", () => {
    render(<InteractiveDiagram variant="compare" nodes={COMPARE_NODES} />);
    expect(screen.queryByText("Verlauf abspielen")).not.toBeInTheDocument();
  });
});

// ─── Presets ──────────────────────────────────────────────────────

describe("RiskPyramidDiagram", () => {
  it("renders the four EU risk tiers, highest first", () => {
    render(<RiskPyramidDiagram />);
    expect(RISK_PYRAMID_NODES).toHaveLength(4);
    expect(RISK_PYRAMID_NODES[0].id).toBe("verboten");
    expect(RISK_PYRAMID_NODES[3].id).toBe("minimal");
    expect(screen.getByText("Verbotene Praktiken")).toBeInTheDocument();
    expect(screen.getByText("Minimales Risiko")).toBeInTheDocument();
  });

  it("traces to record its checkpoint (reduced motion)", () => {
    render(<RiskPyramidDiagram lessonId="eu1" cpId="pyr1" reducedMotion />);
    fireEvent.click(screen.getByText("Verlauf abspielen"));
    expect(isCheckpointDone("eu1", "pyr1")).toBe(true);
  });
});

describe("ObligationLayersDiagram", () => {
  it("renders every obligation layer with a consequence on inspect", () => {
    render(<ObligationLayersDiagram />);
    expect(OBLIGATION_LAYER_NODES.length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText("Risikomanagement")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risikomanagement/ }));
    expect(screen.getByText(/Wenn diese Schicht fehlt/)).toBeInTheDocument();
  });
});
