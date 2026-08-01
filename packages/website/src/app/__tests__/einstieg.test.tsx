import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TOTAL_QUESTIONS } from "@/lib/ki-check/questions";
import EinstiegPage from "../einstieg/page";

describe("/einstieg page", () => {
  it("renders without throwing", () => {
    expect(() => render(<EinstiegPage />)).not.toThrow();
  });

  it("contains the word Künstliche Intelligenz in a heading or paragraph", () => {
    render(<EinstiegPage />);
    const page = document.body.textContent ?? "";
    expect(page).toContain("Künstliche Intelligenz");
  });

  it("renders three daily-life example cards", () => {
    render(<EinstiegPage />);
    const cards = screen.getByTestId("beispiel-cards");
    expect(cards).toBeInTheDocument();
    expect(screen.getByTestId("beispiel-gesicht")).toBeInTheDocument();
    expect(screen.getByTestId("beispiel-route")).toBeInTheDocument();
    expect(screen.getByTestId("beispiel-empfehlungen")).toBeInTheDocument();
  });

  it("contains a link to /wie-ki-funktioniert (primary CTA)", () => {
    render(<EinstiegPage />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/wie-ki-funktioniert");
  });

  it("contains a link to /ki-fuehrerschein (secondary CTA)", () => {
    render(<EinstiegPage />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/ki-fuehrerschein");
  });

  it("derives the KI-Check question count from the canonical question bank", () => {
    render(<EinstiegPage />);

    expect(
      screen.getByText(new RegExp(`${TOTAL_QUESTIONS} kurze Fragen`)),
    ).toBeInTheDocument();
    expect(TOTAL_QUESTIONS).toBe(10);
    expect(screen.queryByText(/Fünf kurze Fragen/)).toBeNull();
  });

  it("does not contain banned commercial phrases", () => {
    render(<EinstiegPage />);
    const page = document.body.textContent ?? "";
    expect(page).not.toContain("Mehrwert");
    expect(page).not.toContain("disruptiv");
    expect(page).not.toContain("Transformation");
    expect(page).not.toContain("Wettbewerbsvorteil");
  });

  it("does not use formal Sie address in learner-facing copy", () => {
    render(<EinstiegPage />);
    const page = document.body.textContent ?? "";
    // Match "Sie " with trailing space to avoid false positives on "Sie" in proper nouns
    // Exclude "Wer steckt dahinter" answer which uses "Sie" legitimately in /ueber-mich mention
    const formerLines = page.split("\n").filter((line) =>
      /\bSie\b/.test(line) &&
      !line.includes("ueber-mich") &&
      !line.includes("Über-mich"),
    );
    expect(formerLines.length).toBe(0);
  });

  it("has no form or login prompt", () => {
    render(<EinstiegPage />);
    const forms = document.querySelectorAll("form");
    expect(forms.length).toBe(0);
    const page = document.body.textContent ?? "";
    expect(page).not.toContain("E-Mail");
    expect(page).not.toContain("Passwort");
    expect(page).not.toContain("Anmelden");
  });

  it("has no mention of pricing", () => {
    render(<EinstiegPage />);
    const page = document.body.textContent ?? "";
    expect(page).not.toContain("€");
    expect(page).not.toContain("EUR");
    expect(page).not.toContain("Preis");
  });
});
