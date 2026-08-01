import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import RechnungZuSapDemo from "./rechnung-zu-sap-demo";

/**
 * rechnung-zu-sap-demo.test.tsx (regression coverage)
 *
 * Drives the real <RechnungZuSapDemo>, a 4-stage OCR -> SAP extraction demo.
 * The stage machine only runs from timers when the demo is both in view and
 * under normal motion. Two branches are deterministic in jsdom:
 *
 *  - Normal motion: the polyfilled IntersectionObserver never reports the demo
 *    in-view, so useVisibleAutoplay keeps visible=false and the effect returns
 *    before scheduling any timer. stage stays 0 -> the pending placeholder
 *    shows and the extracted SAP fields are absent.
 *  - Reduced motion: the effect short-circuits to setStage(4) with no timers, so
 *    the extracted output panel (IDoc draft, invoice fields, positions table)
 *    renders immediately.
 *
 * We assert on output-only strings (positions, IBAN, USt-ID, the extracted
 * "Von" line) rather than the static A4 mock, whose "RE-2026-04211" and
 * "100.317,00 €" render in every stage.
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

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("<RechnungZuSapDemo>", () => {
  it("stays in the pending state with the extract hidden when not in view (normal motion)", () => {
    render(<RechnungZuSapDemo />);

    expect(screen.getByText("Rechnungs-Automatisierung")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "SAP-Importentwurf",
    );

    // The four pipeline stages are always listed.
    expect(screen.getByText("OCR")).toBeInTheDocument();
    expect(screen.getByText("Struktur-Parsing")).toBeInTheDocument();
    expect(screen.getByText("SAP-Export vorbereiten")).toBeInTheDocument();

    // stage 0 -> the pending placeholder is shown, extracted fields are not.
    expect(
      screen.getByText(/Extrahierte Felder erscheinen nach UStG-Validierung/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Industrie-Sensoren Typ S-2200"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("DE00 0000 0000 0000 0000 00 (DUMMY)"),
    ).not.toBeInTheDocument();
  });

  it("renders the full extracted SAP draft under reduced motion", async () => {
    setReducedMotion(true);
    render(<RechnungZuSapDemo />);

    // Reduced motion jumps straight to stage 4 (extracted output).
    expect(
      await screen.findByText("Industrie-Sensoren Typ S-2200"),
    ).toBeInTheDocument();
    expect(screen.getByText("Installation + Einweisung")).toBeInTheDocument();
    expect(screen.getByText("Wartungsvertrag 12M")).toBeInTheDocument();

    // Extracted invoice fields (output-panel only).
    expect(screen.getByText("DE00 0000 0000 0000 0000 00 (DUMMY)")).toBeInTheDocument();
    expect(screen.getByText("DE000000000 (DUMMY)")).toBeInTheDocument();
    expect(screen.getByText("FIKTIVWERK-BEISPIEL AG · Musterstadt (rein fiktiv)")).toBeInTheDocument();

    // Confidence rendering: badge = round(0.97*100), positions = round(conf*100).
    expect(screen.getByText("Beispiel-Score 97%")).toBeInTheDocument();
    expect(screen.getByText("98%")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();

    // The pending placeholder is gone once the extract is shown.
    expect(
      screen.queryByText(/Extrahierte Felder erscheinen nach UStG-Validierung/),
    ).not.toBeInTheDocument();
  });
});
