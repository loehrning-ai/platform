import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AgentPipelineDemo from "./agent-pipeline-demo";

/**
 * agent-pipeline-demo.test.tsx (regression coverage)
 *
 * Drives the real <AgentPipelineDemo>. The demo has two deterministic states we
 * can exercise without wall-clock timers:
 *
 *  - Idle: normal motion, but the polyfilled IntersectionObserver never reports
 *    the demo in-view, so useVisibleAutoplay keeps visible=false and the
 *    autoplay timers never start. The scripted log stays empty and the memo is
 *    still pending.
 *  - Reduced motion: the effect replays the entire scripted log at once and sets
 *    done=true, so the full log (with the fixed 10:42:15.000 timestamp base
 *    computed by the private fmtTs) and the finished memo render immediately.
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

  it("renders the four agents and the idle placeholders before the pipeline starts", () => {
    render(<AgentPipelineDemo />);

    expect(screen.getByText("Multi-Agent Workflow")).toBeInTheDocument();
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveTextContent("Vier Agenten.");
    expect(heading).toHaveTextContent("Ein Memo.");

    // All four agent cards render regardless of run state (no logs yet, so each
    // agent name appears exactly once).
    expect(screen.getByText("Scout")).toBeInTheDocument();
    expect(screen.getByText("Analyst")).toBeInTheDocument();
    expect(screen.getByText("Kritiker")).toBeInTheDocument();
    expect(screen.getByText("Redakteur")).toBeInTheDocument();
    expect(
      screen.getByText("Verfasst strukturiertes Memo für Geschäftsführung"),
    ).toBeInTheDocument();

    // Idle: empty-log placeholder + memo-pending placeholder are shown.
    expect(screen.getByText(/warten auf pipeline start/)).toBeInTheDocument();
    expect(
      screen.getByText(/MEMO ERSCHEINT NACH PIPELINE-ABSCHLUSS/),
    ).toBeInTheDocument();
    // The finished memo has not been produced yet.
    expect(
      screen.queryByText("KI-Einführung in 2 Phasen, Start Q3/2026."),
    ).not.toBeInTheDocument();
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
    expect(screen.getByText("§1 · KERNTHESE")).toBeInTheDocument();
    expect(screen.getByText("2,4k TOKENS · 18 QUELLEN")).toBeInTheDocument();

    // Both idle placeholders are gone once the pipeline has replayed.
    expect(
      screen.queryByText(/warten auf pipeline start/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/MEMO ERSCHEINT NACH PIPELINE-ABSCHLUSS/),
    ).not.toBeInTheDocument();
  });
});
