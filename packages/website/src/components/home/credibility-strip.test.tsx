/**
 * credibility-strip.test.tsx (regression coverage)
 *
 * CredibilityStrip maps a fixed set of platform principles into a divider grid.
 * These assertions guard the data -> DOM contract: all four principles render
 * with their label + title, the section keeps its testid anchor, and the
 * no-selling / public-vs-protected positioning copy stays intact.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CredibilityStrip } from "./credibility-strip";

describe("CredibilityStrip", () => {
  it("exposes the platform-principles section anchor and overline", () => {
    render(<CredibilityStrip />);
    expect(screen.getByTestId("platform-principles")).toBeInTheDocument();
    expect(screen.getByText("Betriebsprinzipien")).toBeInTheDocument();
    expect(
      screen.getByText("Was hier nicht verhandelbar ist."),
    ).toBeInTheDocument();
  });

  it("renders the same operating facts in English without German labels", () => {
    const { container } = render(<CredibilityStrip locale="en" />);

    expect(screen.getByText("Operating principles")).toBeInTheDocument();
    expect(screen.getByText("No paywall")).toBeInTheDocument();
    expect(
      screen.getByText(/Four readers require a free learning account/),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(
      /\b(?:Betriebsprinzipien|Zugang|Sprachen|Quellen|Redaktion|Deutsch|öffentlich|Konto)\b/,
    );
  });

  it("renders all four principles with label and title", () => {
    render(<CredibilityStrip />);
    const expected: ReadonlyArray<readonly [string, string]> = [
      ["Zugang", "Keine Paywall"],
      ["Sprachen", "Zwei vollständige Fassungen"],
      ["Quellen", "Stand und Herkunft sichtbar"],
      ["Redaktion", "Von Tim Löhr redigiert"],
    ];
    for (const [label, title] of expected) {
      expect(screen.getAllByText(new RegExp(label)).length).toBeGreaterThan(0);
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("states the commercial and account boundary directly", () => {
    render(<CredibilityStrip />);
    expect(screen.getByText(/Kein Abo/)).toBeInTheDocument();
    expect(
      screen.getByText(/Vier Reader benötigen ein kostenloses Lernkonto/),
    ).toBeInTheDocument();
  });

  it("keeps authorship, evidence, access, and locale as the four operating facts", () => {
    render(<CredibilityStrip />);
    expect(
      screen.getByText(/vollständig auf Deutsch und Englisch/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Fakten verweisen auf Quellen/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Autorschaft, Überarbeitungsstand/),
    ).toBeInTheDocument();
  });
});
