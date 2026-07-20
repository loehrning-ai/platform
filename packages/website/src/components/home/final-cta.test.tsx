/**
 * final-cta.test.tsx (regression coverage)
 *
 * FinalCta is the closing funnel step. It carries no branching logic, so the
 * assertions guard its contract: the single CTA points at the courses hub
 * (/kurse, not a sales/booking route) and the public-resources copy + maker's
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
      screen.getByRole("heading", { name: "Lernpfad starten." }),
    ).toBeInTheDocument();
  });

  it("routes the single primary CTA to the courses hub", () => {
    render(<FinalCta />);
    const cta = screen.getByRole("link", { name: /Kurse öffnen/i });
    expect(cta).toHaveAttribute("href", "/kurse");
  });

  it("frames the other resources as publicly readable, progress optional", () => {
    render(<FinalCta />);
    expect(screen.getByText(/öffentlich lesbar/)).toBeInTheDocument();
    expect(screen.getByText("// loehrning.ai")).toBeInTheDocument();
  });
});
