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
  it("exposes the platform-principles section anchor and heading, without a kicker", () => {
    render(<CredibilityStrip />);
    expect(screen.getByTestId("platform-principles")).toBeInTheDocument();
    expect(
      screen.getByText("Grundregeln"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Betriebsprinzipien")).not.toBeInTheDocument();
  });

  it("renders the same operating facts in English without German labels", () => {
    const { container } = render(<CredibilityStrip locale="en" />);

    expect(screen.getByText("Ground rules")).toBeInTheDocument();
    expect(screen.getByText("No paywall")).toBeInTheDocument();
    expect(
      screen.getByText(/Four readers require a free learning account/),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(
      /\b(?:Betriebsprinzipien|Zugang|Sprachen|Quellen|Redaktion|Deutsch|öffentlich|Konto)\b/,
    );
  });

  it("renders all four principles as titles, without numbers or labels", () => {
    const { container } = render(<CredibilityStrip />);
    const titles = Array.from(container.querySelectorAll("dt")).map(
      (dt) => dt.textContent,
    );
    expect(titles).toEqual([
      "Keine Paywall",
      "Zwei vollständige Fassungen",
      "Stand und Herkunft sichtbar",
      "Von Tim Löhr redigiert",
    ]);
    // The four have no order: no "01 ·" numbering anywhere.
    expect(container.textContent).not.toMatch(/0\d ·/);
    // Every claim keeps its one-sentence explanation visible at every width:
    // a bare title on a phone read as a cryptic, link-like row.
    const bodies = container.querySelectorAll("dd");
    expect(bodies).toHaveLength(4);
    for (const dd of bodies) {
      expect(dd.className).not.toMatch(/sr-only|line-clamp/);
      expect(dd.textContent?.trim()).toMatch(/\.$/);
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
      screen.getByText(/Alle Kurse gibt es auf Deutsch und Englisch/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Fakten verweisen auf Quellen/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Überarbeitungsstand und bekannte Grenzen bleiben sichtbar/),
    ).toBeInTheDocument();
  });

  it("makes the visible headline the section heading, not the label", () => {
    render(<CredibilityStrip />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Grundregeln",
      }),
    ).toBeInTheDocument();
  });
});
