import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import RagVertragsassistentDemo from "./rag-vertragsassistent-demo";

/**
 * rag-vertragsassistent-demo.test.tsx (regression coverage)
 *
 * Drives the real <RagVertragsassistentDemo>, exercising its private keyword
 * router (findAnswer) end-to-end through the chat UI:
 *
 *  - the chat opens on one answered exchange ("Kündigungsfrist", final state
 *    first) instead of an empty prompt, with the remaining suggestions in one
 *    rail above the input,
 *  - a matched question ("Haftungsgrenzen") resolves to the grounded answer
 *    with its bold key figure, matched-term chips and expandable sources, and
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

  it("opens on a worked example: header, cited answer, open suggestions and a disabled send button", () => {
    const { container } = render(<RagVertragsassistentDemo />);

    expect(screen.getByText("Vertrags-Assistent")).toBeInTheDocument();
    // The avatar header repeats the H1, so it hides below sm.
    expect(container.querySelector("[data-rag-header]")).toHaveClass("max-sm:hidden");
    expect(
      screen.getByText("Keyword-Suche · 6 Beispieldokumente"),
    ).toBeInTheDocument();
    // The green DEMO-MODUS pill restated the shell's evidence line.
    expect(screen.queryByText(/DEMO-MODUS/)).toBeNull();

    // The engine no longer restates the simulation mode: the detail shell says
    // it once via EvidenceBadge, and the mode belongs stated once, and
    // riskNotes already carries the legal-interpretation caveat. What the badge
    // could NOT say -- that this engine's "Konfidenz" is a keyword-hit count
    // rather than a model score -- moved next to the chip, and is pinned here
    // so the metric semantics stay guarded.
    expect(
      screen.queryByRole("note", { name: "Hinweis zur Simulation" }),
    ).not.toBeInTheDocument();

    // One plain sr-only landmark heading; no empty-state prompt, and the
    // search limit is said once above the conversation, in du-form.
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveClass("sr-only");
    expect(heading).toHaveTextContent(
      "Vertragsassistent: Fragen an das Beispielarchiv",
    );
    expect(screen.queryByText("Frag das Beispielarchiv.")).toBeNull();
    expect(screen.queryByText(/Fragen Sie/)).toBeNull();
    expect(
      screen.getByText(/kann Treffer übersehen/),
    ).toBeInTheDocument();

    // Final state first: the example question is answered without a tap,
    // with its key figure, its source count and the keyword definition.
    expect(screen.getByText("Wie ist die Kündigungsfrist?")).toBeInTheDocument();
    expect(screen.getByText("3 Monate zum Quartalsende")).toBeInTheDocument();
    expect(screen.getByText(/Keyword-Suche · 2 Quellen/)).toBeInTheDocument();
    expect(screen.getByText(/Konfidenz = Anzahl Treffer/)).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: /Alle 2 Quellen: zur Antwort.*Wie ist die Kündigungsfrist/,
      }),
    ).toHaveAttribute("aria-expanded", "false");

    // Below sm (jsdom has no sm match) the first Fundstelle is one caption
    // line right under the answer, before the terms and the sources link.
    expect(
      screen.getByText("Quelle: Rahmenvereinbarung v3.2, §12.3 Kündigung"),
    ).toHaveClass("sm:hidden");
    // The terms join with breakable separators, so a long term never pushes
    // the chat log sideways at 320.
    const terms = container.querySelector("[data-rag-matched-terms]");
    expect(terms).toHaveTextContent(
      "Treffer: Gefundene Schlüsselwörter (Konfidenz = Anzahl Treffer): Kündigung · Kündigungsfrist · Quartalsende",
    );
    expect(terms).toHaveClass("[overflow-wrap:anywhere]");
    expect(terms?.className).not.toMatch(/rgba\(37/);

    // The asked question leaves the rail; a suggestion that is already a
    // follow-up shows once. getByRole throws on a duplicate. Below sm the
    // follow-ups lead the one rail above the input.
    const rail = screen.getByRole("group", { name: "Weitere Beispielfragen" });
    expect(
      within(rail).queryByRole("button", { name: /Kündigungsfrist/ }),
    ).toBeNull();
    expect(
      within(rail).getByRole("button", { name: /Welche Haftungsgrenzen gelten/ }),
    ).toBeInTheDocument();
    expect(
      within(rail).getByRole("button", { name: /Wer darf unterzeichnen/ }),
    ).toBeInTheDocument();
    const railNames = within(rail)
      .getAllByRole("button")
      .map((b) => b.textContent?.replace(/^→/, ""));
    expect(railNames).toEqual([
      "Gibt es Sonderkündigungsrechte?",
      "Welche Pflichten gelten während der Frist?",
      "Welche Haftungsgrenzen gelten?",
      "Wer darf unterzeichnen?",
      "Grenzfall: Wer hat Prokura für ausländische Verträge?",
    ]);
    // One hairline style below sm (the sm-up arrow prefix hides), and a
    // right fade marks the cut-off.
    expect(within(rail).getAllByText("→")[0]).toHaveClass("max-sm:hidden");
    expect(rail.className).toMatch(/max-sm:\[mask-image:/);

    // Grenzfall trigger (last chip of the rail) + send button (disabled while
    // the input is empty). Rail chips keep their 44px target.
    // No aria-label: the visible text is the accessible name (WCAG 2.5.3).
    const edgeCase = within(rail).getByRole("button", {
      name: "Grenzfall: Wer hat Prokura für ausländische Verträge?",
    });
    expect(edgeCase).not.toHaveAttribute("aria-label");
    expect(edgeCase).toHaveClass("min-h-11");
    expect(screen.getByRole("button", { name: "Frage senden" })).toBeDisabled();
  });

  it("keeps follow-ups under the answer from sm up", () => {
    const original = window.matchMedia;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).matchMedia = (query: string) => ({
      matches: query.includes("reduce") || query.includes("min-width"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
    try {
      render(<RagVertragsassistentDemo />);
      const rail = screen.getByRole("group", { name: "Weitere Beispielfragen" });
      expect(
        within(rail).queryByRole("button", { name: /Sonderkündigungsrechte/ }),
      ).toBeNull();
      expect(
        screen.getByRole("button", { name: /Gibt es Sonderkündigungsrechte/ }),
      ).toBeInTheDocument();
    } finally {
      window.matchMedia = original;
    }
  });

  it("sizes the question field at 16px below lg so iOS does not zoom", () => {
    render(<RagVertragsassistentDemo />);
    const field = screen.getByRole("textbox", {
      name: "Frage an den Vertrags-Assistenten",
    });
    expect(field).toHaveClass("text-base", "lg:text-[13px]");
    expect(field.style.fontSize).toBe("");
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
      screen.getByRole("button", { name: /Welche Haftungsgrenzen gelten/ }),
    );

    // The keyword router resolves to the Haftung answer with its bold key figure.
    expect(
      await screen.findByText("3-fache des Jahreshonorars"),
    ).toBeInTheDocument();
    // Two grounded sources are reported for each of the two answers.
    expect(screen.getAllByText(/Keyword-Suche · 2 Quellen/)).toHaveLength(2);
    // Matched keyword chip (distinct from the bold answer figure).
    expect(screen.getByText("Jahreshonorar")).toBeInTheDocument();

    // Sources are collapsed behind a toggle; expanding reveals the document + chip.
    fireEvent.click(
      screen.getByRole("button", {
        name: /Alle 2 Quellen: zur Antwort.*Haftungsgrenzen/,
      }),
    );
    expect(screen.getByText("Rahmenvereinbarung v3.2")).toBeInTheDocument();
    expect(screen.getByText("Hoch")).toBeInTheDocument();
    // The metric definition relocated out of the removed SimulationDisclosure.
    // It must stay VISIBLE rather than hover-only: the chip reads as a model
    // score otherwise, and it is really a keyword-hit count.
    for (const definition of screen.getAllByText(/Konfidenz = Anzahl Treffer/)) {
      expect(definition).toBeVisible();
    }
  });

  it("keeps accumulated source disclosures tied to their query context", async () => {
    render(<RagVertragsassistentDemo />);

    // The opening example is the first answered query.
    expect(screen.getByText("3 Monate zum Quartalsende")).toBeInTheDocument();

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
      name: /Alle 2 Quellen: zur Antwort.*Wie ist die Kündigungsfrist/,
    });
    const liabilitySources = screen.getByRole("button", {
      name: /Alle 2 Quellen: zur Antwort.*Welche Haftungsgrenzen gelten/,
    });
    expect(terminationSources).toBeInTheDocument();
    expect(liabilitySources).toBeInTheDocument();

    fireEvent.click(terminationSources);
    fireEvent.click(liabilitySources);
    expect(screen.getAllByText("Rahmenvereinbarung v3.2")).toHaveLength(2);
  });

  it("returns an honest no-hit state for the built-in Grenzfall query", async () => {
    render(<RagVertragsassistentDemo />);

    fireEvent.click(screen.getByRole("button", { name: /^Grenzfall: / }));

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
