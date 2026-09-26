import { afterEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import N8nSupplyChainDemo from "./n8n-supply-chain-demo";

/**
 * n8n-supply-chain-demo.test.tsx (regression coverage)
 *
 * Drives the real <N8nSupplyChainDemo>. The engine renders its final state
 * first (design direction, principle 6): the finished run, all six log lines
 * and the three prepared actions are on screen on load. "Neu abspielen" is
 * the only way into a replay; the polyfilled IntersectionObserver never
 * reports the demo in view, so a replay waits at the unstarted step and the
 * Weiter/Zurück buttons are a deterministic stand-in for its timer. Both
 * autoplay and manual stepping derive the log from (activeStep, scenario) via
 * eventsForStep.
 *
 * matchMedia + IntersectionObserver are polyfilled in src/test/setup.ts; we
 * override matchMedia locally to force the reduced-motion branch.
 */

const originalMatchMedia = window.matchMedia;

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

describe("<N8nSupplyChainDemo>", () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("renders the finished run on load, with a plain sr-only heading", () => {
    const { container } = render(<N8nSupplyChainDemo />);

    expect(screen.queryByText("n8n · Supply-Chain-Automation")).toBeNull();
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveClass("sr-only");
    expect(heading).toHaveTextContent("Lieferverzug im n8n-Workflow");
    expect(heading.querySelector("span")).toBeNull();
    // The timing scope is a caption, not a slogan.
    expect(
      screen.getByText(/zeigen nur die Reihenfolge der sechs Schritte/),
    ).toBeInTheDocument();

    // Final state first.
    expect(screen.getByText("Schritt 4 / 4")).toBeInTheDocument();
    expect(screen.getByText(/Workflow-Simulation abgeschlossen/)).toBeInTheDocument();
    expect(screen.getByText("SAP · MM-BANF")).toBeInTheDocument();
    expect(screen.queryByText(/Wartet auf das Webhook-Ereignis/)).toBeNull();

    // No dot-grid canvas and no invented usage figures.
    expect(container.innerHTML).not.toMatch(/radial-gradient/);
    expect(screen.queryByText(/Beispiel-Läufe/)).toBeNull();
    expect(screen.queryByText(/Manuelle Annahme/)).toBeNull();
    expect(screen.getByText("Beispiel-Reaktionszeit")).toBeInTheDocument();
  });

  it("keeps paper text on the current Mennige node at AA", () => {
    const { container } = render(<N8nSupplyChainDemo />);
    // The three action nodes are current at rest; their sub-lines were
    // rgba(243,240,233,0.9), 4.4:1 on Mennige.
    expect(container.innerHTML).not.toContain("rgba(243,240,233,0.9)");
    const note = screen.getByText("einkauf@fiktivwerk.example");
    expect(note).toHaveStyle({ color: "#f9f7f2" });
  });

  it("enables Zurück and disables Weiter at the finished state", () => {
    render(<N8nSupplyChainDemo />);

    expect(screen.getByRole("button", { name: "◀ Zurück" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Weiter ▶" })).toBeDisabled();
  });

  it("rewinds on Neu abspielen and then steps through the log one line at a time", () => {
    render(<N8nSupplyChainDemo />);

    fireEvent.click(screen.getByRole("button", { name: "↻ Neu abspielen" }));
    expect(screen.getByText("Schritt - / 4")).toBeInTheDocument();
    expect(screen.getByText(/Wartet auf das Webhook-Ereignis/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "◀ Zurück" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Weiter ▶" }));
    expect(screen.getByText("Schritt 1 / 4")).toBeInTheDocument();
    expect(screen.getByText("DHL-Webhook")).toBeInTheDocument();
    // Step 0 is Zurück's floor.
    expect(screen.getByRole("button", { name: "◀ Zurück" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Weiter ▶" }));
    expect(screen.getByText("Schritt 2 / 4")).toBeInTheDocument();
    expect(screen.getByText("SAP · MM02")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "◀ Zurück" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "◀ Zurück" }));
    expect(screen.getByText("Schritt 1 / 4")).toBeInTheDocument();
    expect(screen.queryByText("SAP · MM02")).not.toBeInTheDocument();
  });

  it("opens the low-confidence scenario on its own final state: an escalation instead of the three automated actions", () => {
    render(<N8nSupplyChainDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Konfidenz niedrig" }));
    expect(screen.getByText("Schritt 3 / 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weiter ▶" })).toBeDisabled();
    expect(screen.getByText(/Konfidenz < Schwellenwert/)).toBeInTheDocument();
    expect(
      screen.getByText(/Automatisierter Pfad gestoppt/),
    ).toBeInTheDocument();
  });

  it("jumps to the finished state for the default scenario under reduced motion", () => {
    setReducedMotion(true);
    render(<N8nSupplyChainDemo />);

    expect(screen.getByText("Schritt 4 / 4")).toBeInTheDocument();
    expect(
      screen.getByText(/Workflow-Simulation abgeschlossen/),
    ).toBeInTheDocument();
    // All six scripted events are visible at once.
    expect(screen.getByText("SAP · MM-BANF")).toBeInTheDocument();
  });
});
