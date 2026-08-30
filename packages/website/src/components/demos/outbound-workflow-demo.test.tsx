import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import OutboundWorkflowDemo from "./outbound-workflow-demo";

/**
 * outbound-workflow-demo.test.tsx (regression coverage)
 *
 * Drives the real <OutboundWorkflowDemo>. Two deterministic states exist without
 * wall-clock timers:
 *
 *  - Idle: normal motion, but the polyfilled IntersectionObserver never reports
 *    the demo in-view, so useVisibleAutoplay keeps visible=false and the stage
 *    machine stays on stage 0 (the `if (!visible) return;` early exit). The lead
 *    card, pipeline labels and the derived recipient address all render, but the
 *    stage>=4 "was fehlt vor Versand" checklist is absent.
 *  - Reduced motion: the effect jumps straight to `setStage(4)`, so the full
 *    generated email body, the send-simulated header, the token footer and the
 *    failure-mode checklist toggle all render immediately.
 *
 * matchMedia + IntersectionObserver are polyfilled in src/test/setup.ts; we
 * override matchMedia locally to force the reduced-motion branch. leadIndex is
 * manual (a picker row, `aria-pressed`, no timer) and starts at 0 in both
 * states, so the first explicitly fictional lead is deterministic.
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

describe("<OutboundWorkflowDemo>", () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("renders the pipeline, the first lead and the derived recipient address while idle (stage 0)", () => {
    render(<OutboundWorkflowDemo />);

    // Header + section heading.
    expect(
      screen.getByText("Signalbasierte Nachricht · Pipeline"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Öffentliche Signale.",
    );

    // The four pipeline stage labels always render (independent of the stage).
    expect(screen.getByText("DB · Kontakte")).toBeInTheDocument();
    expect(screen.getByText("Text-Generierung")).toBeInTheDocument();
    expect(screen.getByText("Versandfreigabe simuliert")).toBeInTheDocument();

    // First lead card (LEAD #0412, row 1/3 - leadIdx=0 padded to 4 digits).
    expect(screen.getByText("LEAD #0412")).toBeInTheDocument();
    expect(screen.getByText("Fiktivkontakt Alpha")).toBeInTheDocument();
    expect(
      screen.getByText("Head of Ops · Fiktivwerk Alpha (rein fiktiv)"),
    ).toBeInTheDocument();
    expect(screen.getByText("412 Tage")).toBeInTheDocument();
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(
      screen.getByText("Wachstumsphase · 42 Mitarbeitende"),
    ).toBeInTheDocument();

    // All demo addresses use IANA-reserved example domains.
    expect(
      screen.getByText("kontakt-alpha@fiktivwerk.example"),
    ).toBeInTheDocument();
    expect(screen.getByText("vertrieb@fiktivwerk.example")).toBeInTheDocument();

    // The four metric tiles.
    expect(screen.getByText("Quellencheck")).toBeInTheDocument();
    expect(screen.getByText("PII-Check")).toBeInTheDocument();
    expect(screen.getByText("Review-Status")).toBeInTheDocument();

    // Co-located simulation disclosure.
    expect(
      screen.getByRole("note", { name: "Hinweis zur Simulation" }),
    ).toHaveTextContent(/Kein Versand findet statt/);

    // The failure-mode checklist only exists at stage>=4, so it is absent while idle.
    expect(
      screen.queryByRole("button", {
        name: /Was fehlt vor einem echten Versand/,
      }),
    ).not.toBeInTheDocument();
  });

  it("reveals the generated email, the send-simulated footer and the pre-send checklist under reduced motion (stage 4)", () => {
    setReducedMotion(true);
    render(<OutboundWorkflowDemo />);

    // the full generated email body for the first lead is shown.
    expect(
      screen.getByText(/20-minütiges Gespräch, kein Angebot/),
    ).toBeInTheDocument();
    // Signature block.
    expect(screen.getByText("T. Muster")).toBeInTheDocument();

    // Send-simulated status header + token/trace footer (stage>=3 / stage>=4).
    expect(screen.getByText("● Versand simuliert 09:14")).toBeInTheDocument();
    expect(screen.getByText("◆ 247 Tokens")).toBeInTheDocument();
    expect(
      screen.getByText("touched_at = 2026-04-21 09:14:03"),
    ).toBeInTheDocument();

    // The failure-mode block is now present; the checklist is collapsed by default.
    const toggle = screen.getByRole("button", {
      name: "Was fehlt vor einem echten Versand?",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/Rechtliche Grundlage/)).not.toBeInTheDocument();

    // Expanding reveals the four DSGVO / review checklist items.
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Rechtliche Grundlage/)).toBeInTheDocument();
    expect(screen.getByText(/Opt-out-Mechanismus/)).toBeInTheDocument();
    expect(screen.getByText(/Menschliche Freigabe/)).toBeInTheDocument();

    // The toggle label flips to the collapse affordance.
    expect(
      screen.getByRole("button", { name: "Verbergen" }),
    ).toBeInTheDocument();
  });

  it("blocks the simulated send once the score threshold exceeds every lead's score", () => {
    // The intent score was previously display-only. Raising the threshold
    // above 91 (the highest sample score) demonstrates the failure beat: a
    // pipeline that reaches its final stage and sends nothing.
    setReducedMotion(true);
    render(<OutboundWorkflowDemo />);

    expect(screen.getByText("● Versand simuliert 09:14")).toBeInTheDocument();

    const slider = screen.getByRole("slider", {
      name: "Minimale Score-Schwelle für den Versand",
    });
    fireEvent.change(slider, { target: { value: "95" } });

    expect(
      screen.getByText("⛔ Nicht gesendet: unter Score-Schwelle"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("● Versand simuliert 09:14"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("touched_at = 2026-04-21 09:14:03"),
    ).not.toBeInTheDocument();
  });

  it("switches the lead card, address and email body when a different picker button is clicked", () => {
    setReducedMotion(true);
    render(<OutboundWorkflowDemo />);

    expect(screen.getByText("Fiktivkontakt Alpha")).toBeInTheDocument();
    expect(screen.getByText("CRM · ROW 1/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alpha" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Beta" }));

    expect(screen.getByText("Fiktivkontakt Beta")).toBeInTheDocument();
    expect(screen.queryByText("Fiktivkontakt Alpha")).not.toBeInTheDocument();
    expect(
      screen.getByText("kontakt-beta@fiktivwerk.example"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Kundendienst-Entlastung: Kurze Rückfrage"),
    ).toBeInTheDocument();
    expect(screen.getByText("CRM · ROW 2/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Beta" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Alpha" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("keeps both mobile grid panels inside the demo shell", () => {
    const { container } = render(<OutboundWorkflowDemo />);
    const root = container.querySelector<HTMLElement>(
      '[data-demo-id="outbound-workflow"]',
    );
    const body = container.querySelector<HTMLElement>("[data-outbound-body]");

    expect(root).toHaveStyle({ width: "100%", minWidth: "0" });
    expect(body).toHaveStyle({ minWidth: "0" });
    expect(body?.children).toHaveLength(2);
    for (const panel of Array.from(body?.children ?? [])) {
      expect(panel).toHaveStyle({ minWidth: "0" });
    }
  });
});
