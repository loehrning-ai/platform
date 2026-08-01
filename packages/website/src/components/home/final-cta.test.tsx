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
      screen.getByRole("heading", { name: "Deinen Start bestimmen." }),
    ).toBeInTheDocument();
  });

  it("routes the single primary CTA to the orientation check", () => {
    render(<FinalCta />);
    const cta = screen.getByRole("link", { name: /Start bestimmen/i });
    expect(cta).toHaveAttribute("href", "/ki-check");
  });

  it("states the public resources and account-gated core-course boundary", () => {
    render(<FinalCta />);
    expect(screen.getByText(/Bücher, Demos und Workshops sind öffentlich/)).toBeInTheDocument();
    expect(screen.getByText(/vier deutschen Kernkurse nutzen ein kostenloses Konto/)).toBeInTheDocument();
    expect(screen.getByText("// loehrning.ai")).toBeInTheDocument();
  });
});
