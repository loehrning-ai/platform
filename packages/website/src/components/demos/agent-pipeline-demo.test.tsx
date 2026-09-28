import { afterEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AgentPipelineDemo from "./agent-pipeline-demo";

/**
 * agent-pipeline-demo.test.tsx (regression coverage)
 *
 * Drives the real <AgentPipelineDemo>. The engine renders its final state
 * first (design direction, principle 6): the whole scripted log and the memo
 * are on screen on load, with no "memo appears later" placeholder. The
 * polyfilled IntersectionObserver never reports the demo in view, so a
 * replay started with "Neu abspielen" rewinds to step 0 and waits there; the
 * Zurück/Weiter buttons are a deterministic stand-in for its timers.
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

describe("<AgentPipelineDemo>", () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("renders the four agents, the full trace and the memo on load", () => {
    const { container } = render(<AgentPipelineDemo />);

    // No visible kicker or slogan: the page H1 names the demo. The engine
    // keeps one plain sr-only h2 as a landmark into the instrument.
    expect(screen.queryByText("Multi-Agent Workflow")).toBeNull();
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveClass("sr-only");
    expect(heading).toHaveTextContent("Agent-Pipeline: Spur und Memo");
    expect(heading.querySelector("span")).toBeNull();

    // All four agent cards render.
    expect(
      screen.getByText("Verfasst strukturiertes Memo für Geschäftsführung"),
    ).toBeInTheDocument();
    expect(screen.getByText("01 · Research")).toBeInTheDocument();

    // Final state first: the full log, the memo, and no current step.
    expect(screen.getByText("Schritt 14 / 14")).toBeInTheDocument();
    expect(screen.getByText("Starte Archiv-Suche…")).toBeInTheDocument();
    expect(
      screen.getByText("KI-Einführung in 2 Phasen, Start Q3/2026."),
    ).toBeInTheDocument();
    expect(container.querySelector('[aria-current="step"]')).toBeNull();
    expect(screen.queryByText(/MEMO ERSCHEINT|memo appears/i)).toBeNull();
    expect(screen.queryByText(/Wartet auf den ersten Schritt/)).toBeNull();
    // No looping glow, no Tailwind-orange wash, no two-colour memo heading.
    expect(container.querySelectorAll('[style*="infinite"]')).toHaveLength(0);
    expect(container.innerHTML).not.toMatch(/249,\s*115,\s*22|linear-gradient/);
    const memoHeading = screen.getByRole("heading", { level: 3 });
    expect(memoHeading.querySelector("span")).toBeNull();
  });

  it("replays the full log with deterministic timestamps and the finished memo under reduced motion", async () => {
    setReducedMotion(true);
    render(<AgentPipelineDemo />);

    // The whole scripted log renders at once. Timestamps come from fmtTs off a
    // fixed 10:42:15.000 base: first entry at +200ms, last at +4800ms.
    expect(await screen.findByText("Starte Archiv-Suche…")).toBeInTheDocument();
    expect(screen.getByText("10:42:15.200")).toBeInTheDocument();
    expect(screen.getByText("10:42:19.800")).toBeInTheDocument();
    expect(
      screen.getByText("✓ Memo fertig (2,4k Tokens, 18 Quellen)"),
    ).toBeInTheDocument();

    // done=true -> the memo panel is populated.
    expect(
      screen.getByText("KI-Einführung in 2 Phasen, Start Q3/2026."),
    ).toBeInTheDocument();
    expect(screen.getByText("§1 · Kernthese")).toBeInTheDocument();
    expect(screen.getByText("2,4k Tokens · 18 Quellen")).toBeInTheDocument();
  });

  it("rewinds on Neu abspielen and then steps through the log via Zurück/Weiter", () => {
    render(<AgentPipelineDemo />);

    const back = screen.getByRole("button", { name: "◀ Zurück" });
    const next = screen.getByRole("button", { name: "Weiter ▶" });
    // At rest the run is complete: forward is exhausted, back is open.
    expect(next).toBeDisabled();
    expect(back).not.toBeDisabled();

    // Replay is the only trigger into a run; jsdom never reports the
    // engine in view, so the run waits at step 0.
    fireEvent.click(screen.getByRole("button", { name: "↻ Neu abspielen" }));
    expect(screen.getByText("Schritt 0 / 14")).toBeInTheDocument();
    expect(screen.getByText(/Wartet auf den ersten Schritt/)).toBeInTheDocument();
    expect(back).toBeDisabled();
    // The memo stays on screen while the trace refills.
    expect(
      screen.getByText("KI-Einführung in 2 Phasen, Start Q3/2026."),
    ).toBeInTheDocument();

    fireEvent.click(next);
    expect(screen.getByText("Schritt 1 / 14")).toBeInTheDocument();
    expect(screen.getByText("Starte Archiv-Suche…")).toBeInTheDocument();
    expect(back).not.toBeDisabled();

    fireEvent.click(back);
    expect(screen.getByText("Schritt 0 / 14")).toBeInTheDocument();
    expect(
      screen.queryByText("Starte Archiv-Suche…"),
    ).not.toBeInTheDocument();
    expect(back).toBeDisabled();
  });

  it("steps back from the final state one log line at a time", () => {
    render(<AgentPipelineDemo />);

    fireEvent.click(screen.getByRole("button", { name: "◀ Zurück" }));
    expect(screen.getByText("Schritt 13 / 14")).toBeInTheDocument();
    expect(
      screen.queryByText("✓ Memo fertig (2,4k Tokens, 18 Quellen)"),
    ).not.toBeInTheDocument();
  });

  it("switches to the pricing scenario and shows its own final memo", () => {
    render(<AgentPipelineDemo />);

    const contractsToggle = screen.getByRole("button", {
      name: "Vertragsanalyse",
    });
    const pricingToggle = screen.getByRole("button", { name: "Preisanalyse" });
    expect(contractsToggle).toHaveAttribute("aria-pressed", "true");
    expect(pricingToggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(pricingToggle);
    expect(pricingToggle).toHaveAttribute("aria-pressed", "true");
    // A new task opens on its final state too.
    expect(screen.getByText("Schritt 7 / 7")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Preiserhöhung von 4 % in 5 von 6 Segmenten; Segment 3 zurückstellen.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("1,1k Tokens · 6 Quellen")).toBeInTheDocument();
    expect(
      screen.queryByText("KI-Einführung in 2 Phasen, Start Q3/2026."),
    ).not.toBeInTheDocument();
  });
});
