/**
 * final-cta.test.tsx (regression coverage)
 *
 * FinalCta is the closing funnel step. It carries no branching logic, so the
 * assertions guard its contract: the single CTA points at the orientation
 * check (/ki-check, not a sales/booking route) and the access copy + maker's
 * mark stay intact.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FinalCta } from "./final-cta";

describe("FinalCta", () => {
  it("renders the closing headline inside the final-cta section", () => {
    render(<FinalCta />);
    expect(screen.getByTestId("final-cta")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Den passenden Einstieg finden." }),
    ).toBeInTheDocument();
  });

  it("renders the English check boundary and localized route", () => {
    const { container } = render(<FinalCta locale="en" />);

    expect(screen.getByRole("heading", { name: "Find the right starting point." })).toBeInTheDocument();
    expect(screen.getByText(/assessment runs in your browser and requires no account/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open AI check/i })).toHaveAttribute("href", "/en/ki-check");
    expect(container.textContent).not.toMatch(/\b(?:passenden|Einstieg|Fragen|Kenntnisstand|Browser|Konto|öffnen)\b/);
  });

  it("routes the single primary CTA to the orientation check", () => {
    render(<FinalCta />);
    const cta = screen.getByRole("link", { name: /KI-Check öffnen/i });
    expect(cta).toHaveAttribute("href", "/ki-check");
  });

  it("states the scope and privacy boundary of the orientation check", () => {
    render(<FinalCta />);
    expect(screen.getByText(/Fünf Fragen ordnen deinen aktuellen Kenntnisstand/)).toBeInTheDocument();
    expect(screen.getByText(/läuft im Browser und benötigt kein Konto/)).toBeInTheDocument();
    expect(screen.getByText("// loehrning.ai")).toBeInTheDocument();
  });
});
