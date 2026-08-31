import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import RagVertragsassistentDemo from "./rag-vertragsassistent-demo";

/**
 * rag-vertragsassistent-demo.test.tsx (regression coverage)
 *
 * Drives the real <RagVertragsassistentDemo>, exercising its private keyword
 * router (findAnswer) end-to-end through the chat UI:
 *
 *  - a matched question ("Kündigungsfrist") resolves to the grounded answer with
 *    its bold key figure, matched-term chips and expandable sources, and
 *  - the built-in "Grenzfall" query (no document matches) resolves to the honest
 *    no-hit state with the default follow-ups.
 *
 * We force reduced motion so the retrieval sequence collapses to a single ~200ms
 * timeout (d3), well within findBy's default 1s poll window, and polyfill the
 * jsdom-29 gap for Element.scrollTo (the auto-scroll effect calls it on mount).
 */

// jsdom 29 does not implement Element.prototype.scrollTo; the demo's auto-scroll
// effect calls it on every message change, so provide a no-op.
if (typeof Element.prototype.scrollTo !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  Element.prototype.scrollTo = () => {};
}

const originalMatchMedia = window.matchMedia;

describe("<RagVertragsassistentDemo>", () => {
  beforeEach(() => {
    // Force reduced motion so the retrieval delay is the short (200ms) branch.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).matchMedia = (query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("renders the empty state: header, disclosure, suggestions and a disabled send button", () => {
    render(<RagVertragsassistentDemo />);

    expect(screen.getByText("Vertrags-Assistent")).toBeInTheDocument();
    expect(
      screen.getByText("Keyword-Suche · 8 Beispieldokumente"),
    ).toBeInTheDocument();
    expect(screen.getByText("● DEMO-MODUS")).toBeInTheDocument();

    // The engine no longer restates the simulation mode: the detail shell says
    // it once via EvidenceBadge, and the mode belongs stated once, and
    // riskNotes already carries the legal-interpretation caveat. What the badge
    // could NOT say -- that this engine's "Konfidenz" is a keyword-hit count
    // rather than a model score -- moved next to the chip, and is pinned here
    // so the metric semantics stay guarded.
    expect(
      screen.queryByRole("note", { name: "Hinweis zur Simulation" }),
    ).not.toBeInTheDocument();

    // Empty-state prompt heading.
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Fragen Sie das Beispielarchiv.",
    );

    // All four suggested questions render as buttons.
    expect(
      screen.getByRole("button", { name: /Wie ist die Kündigungsfrist/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Welche Haftungsgrenzen gelten/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Wer darf unterzeichnen/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Gibt es Sonderkündigungsrechte/ }),
    ).toBeInTheDocument();

    // Grenzfall trigger + send button (send is disabled while the input is empty).
    expect(
      screen.getByRole("button", { name: /Grenzfall testen/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Frage senden" })).toBeDisabled();
  });

  it("enables the send button once the input has content", () => {
    render(<RagVertragsassistentDemo />);

    expect(screen.getByRole("button", { name: "Frage senden" })).toBeDisabled();
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "Frage an den Vertrags-Assistenten",
      }),
      { target: { value: "Frage?" } },
    );
    expect(screen.getByRole("button", { name: "Frage senden" })).toBeEnabled();
  });

  it("answers a matched question with the grounded figure, term chips and expandable sources", async () => {
    render(<RagVertragsassistentDemo />);

    fireEvent.click(
      screen.getByRole("button", { name: /Wie ist die Kündigungsfrist/ }),
    );

    // The keyword router resolves to the Kündigung answer with its bold key figure.
    expect(
      await screen.findByText("3 Monate zum Quartalsende"),
    ).toBeInTheDocument();
    // Two grounded sources are reported.
    expect(screen.getByText(/Keyword-Suche · 2 Quellen/)).toBeInTheDocument();
    // Matched keyword chip (distinct from the bold answer figure).
    expect(screen.getByText("Quartalsende")).toBeInTheDocument();

    // Sources are collapsed behind a toggle; expanding reveals the document + chip.
    fireEvent.click(
      screen.getByRole("button", {
        name: /Quellen anzeigen: 2 Quellen.*Kündigungsfrist/,
      }),
    );
    expect(screen.getByText("Rahmenvereinbarung v3.2")).toBeInTheDocument();
    expect(screen.getByText("Hoch")).toBeInTheDocument();
    // The metric definition relocated out of the removed SimulationDisclosure.
    // It must stay VISIBLE rather than hover-only: the chip reads as a model
    // score otherwise, and it is really a keyword-hit count.
    expect(
      screen.getByText(/Konfidenz = Anzahl Treffer/),
    ).toBeVisible();
  });

  it("keeps accumulated source disclosures tied to their query context", async () => {
    render(<RagVertragsassistentDemo />);

    fireEvent.click(
      screen.getByRole("button", { name: /Wie ist die Kündigungsfrist/ }),
    );
    expect(
      await screen.findByText("3 Monate zum Quartalsende"),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("textbox", {
        name: "Frage an den Vertrags-Assistenten",
      }),
      { target: { value: "Welche Haftungsgrenzen gelten?" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Frage senden" }));
    expect(
      await screen.findByText("3-fache des Jahreshonorars"),
    ).toBeInTheDocument();

    const terminationSources = screen.getByRole("button", {
      name: /Quellen anzeigen: 2 Quellen.*Wie ist die Kündigungsfrist/,
    });
    const liabilitySources = screen.getByRole("button", {
      name: /Quellen anzeigen: 2 Quellen.*Welche Haftungsgrenzen gelten/,
    });
    expect(terminationSources).toBeInTheDocument();
    expect(liabilitySources).toBeInTheDocument();

    fireEvent.click(terminationSources);
    fireEvent.click(liabilitySources);
    expect(screen.getAllByText("Rahmenvereinbarung v3.2")).toHaveLength(2);
  });

  it("returns an honest no-hit state for the built-in Grenzfall query", async () => {
    render(<RagVertragsassistentDemo />);

    fireEvent.click(screen.getByRole("button", { name: /Grenzfall testen/ }));

    // No document matches -> the empty-answer message and "Kein Treffer" label.
    expect(
      await screen.findByText(/Keine Übereinstimmung gefunden/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Kein Treffer/)).toBeInTheDocument();

    // The default follow-ups are offered instead of grounded ones.
    expect(
      screen.getByRole("button", { name: /Was sind typische Klauseln/ }),
    ).toBeInTheDocument();
  });
});
