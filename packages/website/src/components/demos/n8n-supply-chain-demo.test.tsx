import { afterEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import N8nSupplyChainDemo from "./n8n-supply-chain-demo";

/**
 * n8n-supply-chain-demo.test.tsx (regression coverage)
 *
 * Drives the real <N8nSupplyChainDemo>. The polyfilled IntersectionObserver
 * never reports the demo in-view, so useVisibleAutoplay keeps visible=false
 * and the autoplay timer never starts — the demo sits at its initial
 * activeStep=-1 until a manual step-through click moves it. Both autoplay and
 * manual stepping derive the visible log purely from (activeStep, scenario)
 * via eventsForStep, so exercising the Weiter/Zurück buttons is a
 * deterministic stand-in for exercising the timer.
 *
 * matchMedia + IntersectionObserver are polyfilled in src/test/setup.ts; we
 * override matchMedia locally to force the reduced-motion branch, following
 * the same helper as agent-pipeline-demo.test.tsx.
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

  it("renders the header and the idle log placeholder before any step runs", () => {
    render(<N8nSupplyChainDemo />);

    expect(
      screen.getByText("n8n · Supply-Chain-Automation"),
    ).toBeInTheDocument();
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Lieferverzug erkannt.");

    // useVisibleAutoplay never reports in-view in jsdom, so nothing has
    // advanced yet: the step indicator shows the unstarted placeholder and
    // the log shows its waiting message.
    expect(screen.getByText("Schritt – / 4")).toBeInTheDocument();
    expect(screen.getByText(/warte auf Webhook-Ereignis/)).toBeInTheDocument();
  });

  it("disables Zurück and enables Weiter before the sequence has started", () => {
    render(<N8nSupplyChainDemo />);

    expect(screen.getByRole("button", { name: "◀ Zurück" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Weiter ▶" })).toBeEnabled();
  });

  it("advances one step at a time on Weiter and reveals the matching log line, and Zurück reverses it", () => {
    render(<N8nSupplyChainDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Weiter ▶" }));
    expect(screen.getByText("Schritt 1 / 4")).toBeInTheDocument();
    expect(screen.getByText("DHL-Webhook")).toBeInTheDocument();
    // Step 0 is Zurück's floor — it stays disabled here, one click doesn't
    // enable it (there is no manually-reachable state before step 0).
    expect(screen.getByRole("button", { name: "◀ Zurück" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Weiter ▶" }));
    expect(screen.getByText("Schritt 2 / 4")).toBeInTheDocument();
    expect(screen.getByText("SAP · MM02")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "◀ Zurück" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "◀ Zurück" }));
    expect(screen.getByText("Schritt 1 / 4")).toBeInTheDocument();
    expect(screen.queryByText("SAP · MM02")).not.toBeInTheDocument();
  });

  it("offers a replay control that resets the step position", () => {
    render(<N8nSupplyChainDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Weiter ▶" }));
    expect(screen.getByText("Schritt 1 / 4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "↻ Neu abspielen" }));
    expect(screen.getByText("Schritt – / 4")).toBeInTheDocument();
  });

  it("switches to the low-confidence scenario, which stops one step earlier with an escalation line instead of the three automated actions", () => {
    render(<N8nSupplyChainDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Konfidenz niedrig" }));
    expect(screen.getByText("Schritt – / 3")).toBeInTheDocument();

    const weiter = screen.getByRole("button", { name: "Weiter ▶" });
    fireEvent.click(weiter);
    fireEvent.click(weiter);
    fireEvent.click(weiter);

    expect(screen.getByText("Schritt 3 / 3")).toBeInTheDocument();
    expect(weiter).toBeDisabled();
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
