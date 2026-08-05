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
    expect(screen.getByText("Was dich hier erwartet")).toBeInTheDocument();
  });

  it("renders all four principles with label and title", () => {
    render(<CredibilityStrip />);
    const expected: ReadonlyArray<readonly [string, string]> = [
      ["Gratis", "Wirklich kostenlos"],
      ["Deutsch", "Für den Arbeitsalltag hier"],
      ["Belegt", "Jede Zahl hat eine Quelle"],
      ["Ehrlich", "Kein Marketing-Team"],
    ];
    for (const [label, title] of expected) {
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("keeps the anti-selling positioning while stating the account boundary", () => {
    render(<CredibilityStrip />);
    expect(
      screen.getByText(/kein verstecktes Verkaufsgespräch/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/vier deutschen Lernpfad-Kurse brauchen ein kostenloses Konto/),
    ).toBeInTheDocument();
  });

  it("distinguishes public resources from the account-gated German path", () => {
    render(<CredibilityStrip />);
    expect(
      screen.getByText(/Bücher, Demos, KI-Check und technische Vertiefungen sind öffentlich/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/vier deutschen Lernpfad-Kurse brauchst du ein kostenloses Konto/),
    ).toBeInTheDocument();
  });
});
