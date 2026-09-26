import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import RechnungZuSapDemo from "./rechnung-zu-sap-demo";

/**
 * rechnung-zu-sap-demo.test.tsx (regression coverage)
 *
 * Drives the real <RechnungZuSapDemo>, a 4-stage OCR -> SAP extraction demo.
 * The engine renders its final state first (design direction, principle 6):
 * the extracted IDoc draft is on screen on load, and "Neu abspielen" is the
 * only way into a replay. A replay only runs from timers when the demo is in
 * view under normal motion; the polyfilled IntersectionObserver never reports
 * it in view, so a replay waits at stage 0 (the pending placeholder) in jsdom.
 * Reduced motion always shows stage 4.
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
  it("renders the extracted SAP draft on load and rewinds to pending on replay", () => {
    render(<RechnungZuSapDemo />);

    expect(screen.queryByText("Rechnungs-Automatisierung")).toBeNull();
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveClass("sr-only");
    expect(heading).toHaveTextContent("Rechnung zum SAP-Importentwurf");
    expect(heading.querySelector("span")).toBeNull();

    // The four pipeline stages are always listed.
    expect(screen.getByText("OCR")).toBeInTheDocument();
    expect(screen.getByText("Struktur-Parsing")).toBeInTheDocument();
    expect(screen.getByText("SAP-Export vorbereiten")).toBeInTheDocument();

    // Final state first: the extract is there, the placeholder is not.
    expect(screen.getByText("Schritt 4 / 4")).toBeInTheDocument();
    expect(screen.getByText("Industrie-Sensoren Typ S-2200")).toBeInTheDocument();
    expect(
      screen.queryByText(/Extrahierte Felder erscheinen nach UStG-Validierung/),
    ).not.toBeInTheDocument();

    // Replay rewinds; off-screen (jsdom) it waits at stage 0.
    fireEvent.click(screen.getByRole("button", { name: "↻ Neu abspielen" }));
    expect(screen.getByText("Schritt 0 / 4")).toBeInTheDocument();
    expect(
      screen.getByText(/Extrahierte Felder erscheinen nach UStG-Validierung/),
    ).toBeInTheDocument();
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

  it("lets the user step through the pipeline manually, independent of autoplay", () => {
    render(<RechnungZuSapDemo />);

    fireEvent.click(screen.getByRole("button", { name: "↻ Neu abspielen" }));
    expect(screen.getByText("Schritt 0 / 4")).toBeInTheDocument();
    const back = screen.getByRole("button", { name: "◀ Zurück" });
    const next = screen.getByRole("button", { name: "Weiter ▶" });
    expect(back).toBeDisabled();
    expect(next).not.toBeDisabled();

    fireEvent.click(next);
    expect(screen.getByText("Schritt 1 / 4")).toBeInTheDocument();
    expect(back).not.toBeDisabled();

    fireEvent.click(back);
    expect(screen.getByText("Schritt 0 / 4")).toBeInTheDocument();
  });

  it("disables Weiter at the final step and offers a replay control", () => {
    render(<RechnungZuSapDemo />);
    const next = screen.getByRole("button", { name: "Weiter ▶" });

    expect(screen.getByText("Schritt 4 / 4")).toBeInTheDocument();
    expect(next).toBeDisabled();
    expect(
      screen.getByText("Industrie-Sensoren Typ S-2200"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "↻ Neu abspielen" }),
    ).toBeInTheDocument();
  });

  it("switches to the flagged document and shows a manual-review outcome instead of a clean export", () => {
    render(<RechnungZuSapDemo />);

    fireEvent.click(
      screen.getByRole("button", { name: "Beleg B · Abweichung" }),
    );
    // Picking a document swaps the data source and shows its own final
    // state; the replay stays a separate choice.
    expect(screen.getByText("Schritt 4 / 4")).toBeInTheDocument();

    expect(
      screen.getByText("Manuelle Prüfung erforderlich"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("IDoc INVOIC02 · Entwurf"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Sonderrabatt (handschriftlich)"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Industrie-Sensoren Typ S-2200"),
    ).not.toBeInTheDocument();
  });
});
