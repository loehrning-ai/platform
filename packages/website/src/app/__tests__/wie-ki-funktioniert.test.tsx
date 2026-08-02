import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import WieKiFunktioniertPage from "../wie-ki-funktioniert/page";
import { getLektionById } from "@/lib/wie-ki-funktioniert";

describe("/wie-ki-funktioniert landing page", () => {
  it("renders without throwing", () => {
    expect(() => render(<WieKiFunktioniertPage />)).not.toThrow();
  });

  it("renders all four lesson titles", () => {
    render(<WieKiFunktioniertPage />);
    const page = document.body.textContent ?? "";
    expect(page).toContain("Vorhersage");
    expect(page).toContain("Trainingsdaten");
    expect(page).toContain("Halluzination");
    expect(page).toContain("Grenzen");
  });

  it("renders a lektion-cards container with four cards", () => {
    render(<WieKiFunktioniertPage />);
    const cards = screen.getByTestId("lektion-cards");
    expect(cards).toBeInTheDocument();
    // Should have 4 links (one per lesson card)
    const links = cards.querySelectorAll("a");
    expect(links.length).toBe(4);
  });

  it("renders without any login prompt or auth gate", () => {
    render(<WieKiFunktioniertPage />);
    const page = document.body.textContent ?? "";
    // Must not have login/auth prompts (but "kein Login" — no login — is fine)
    expect(page).not.toContain("Bitte melde dich an");
    expect(page).not.toContain("E-Mail");
    expect(page).not.toContain("Passwort");
    // "kein Login" is expected — there should NOT be any forms
    const forms = document.querySelectorAll("form");
    expect(forms.length).toBe(0);
  });

  it("contains links to /einstieg and /ki-fuehrerschein", () => {
    render(<WieKiFunktioniertPage />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/ki-fuehrerschein");
    expect(hrefs).toContain("/einstieg");
  });

  it("uses descriptive breadcrumb link text for the homepage", () => {
    render(<WieKiFunktioniertPage />);
    expect(screen.getByRole("link", { name: "Startseite" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: "Start" })).not.toBeInTheDocument();
  });
});

describe("getLektionById helper", () => {
  it("returns the correct lektion for lektion-1-vorhersage", () => {
    const l = getLektionById("lektion-1-vorhersage");
    expect(l).toBeDefined();
    expect(l?.title).toContain("Vorhersage");
  });

  it("returns undefined for nonexistent ID", () => {
    expect(getLektionById("nonexistent")).toBeUndefined();
  });
});
