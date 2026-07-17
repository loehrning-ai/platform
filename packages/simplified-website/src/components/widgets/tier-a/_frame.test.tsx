import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { WidgetFrame } from "./_frame";

/**
 * _frame.test.tsx (regression coverage)
 *
 * Unit coverage for `WidgetFrame`, the shared presentational shell every
 * Tier-A widget (Quiz, Flashcards, Compare, TaskSpec, SelfRate, Plays,
 * FailureTagger, RedactionDrill, DragReorder) renders through. The sibling
 * widget test files exercise it only incidentally via their own happy paths,
 * so its own conditional branches (scenario line, done badge, xpLabel vs.
 * "Erledigt" fallback, `data-done`) had no direct coverage. Structure/props
 * only, no persistence, so this stays green as widget content changes.
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

beforeEach(() => {
  setReducedMotion(false);
});

afterEach(() => {
  cleanup();
});

describe("WidgetFrame", () => {
  it("renders the kind label, title and children; no scenario or done badge by default", () => {
    const { container } = render(
      <WidgetFrame kindLabel="Check" title="Ein kurzer Titel">
        <span>Inhalt des Widgets</span>
      </WidgetFrame>,
    );

    expect(screen.getByText("◆ Check")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Ein kurzer Titel" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Inhalt des Widgets")).toBeInTheDocument();

    const frame = container.querySelector("[data-widget-frame]");
    expect(frame).not.toBeNull();
    expect(frame?.getAttribute("data-done")).toBe("0");

    // No `scenario` passed -> the scenario <p> is not rendered; only the
    // kind-label paragraph remains.
    expect(container.querySelectorAll("p")).toHaveLength(1);
    expect(screen.queryByText("Erledigt")).not.toBeInTheDocument();
  });

  it("renders the scenario line when provided", () => {
    const { container } = render(
      <WidgetFrame
        kindLabel="Vergleich"
        title="Titel"
        scenario="Eine kurze Szenario-Beschreibung."
      >
        <div />
      </WidgetFrame>,
    );

    expect(
      screen.getByText("Eine kurze Szenario-Beschreibung."),
    ).toBeInTheDocument();
    // Kind-label paragraph + scenario paragraph.
    expect(container.querySelectorAll("p")).toHaveLength(2);
  });

  it("shows the Erledigt badge when done is true without an xpLabel", () => {
    const { container } = render(
      <WidgetFrame kindLabel="Check" title="Titel" done>
        <div />
      </WidgetFrame>,
    );

    expect(screen.getByText("Erledigt")).toBeInTheDocument();
    const frame = container.querySelector("[data-widget-frame]");
    expect(frame?.getAttribute("data-done")).toBe("1");
  });

  it("shows the xpLabel with a checkmark instead of Erledigt when both are given", () => {
    render(
      <WidgetFrame kindLabel="Check" title="Titel" done xpLabel="+15 XP">
        <div />
      </WidgetFrame>,
    );

    expect(screen.getByText("+15 XP ✓")).toBeInTheDocument();
    expect(screen.queryByText("Erledigt")).not.toBeInTheDocument();
  });

  it("renders with reduced motion enabled", () => {
    setReducedMotion(true);
    render(
      <WidgetFrame kindLabel="Check" title="Titel" done xpLabel="+10 XP">
        <div />
      </WidgetFrame>,
    );

    expect(screen.getByText("+10 XP ✓")).toBeInTheDocument();
  });
});
