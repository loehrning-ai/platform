import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "./hero";

describe("HeroSection learning-platform positioning", () => {
  it("renders the free German learning platform headline without employer proof", () => {
    render(<HeroSection />);
    expect(screen.getByText("KI")).toBeInTheDocument();
    expect(screen.getByText("lernen.")).toBeInTheDocument();
    expect(screen.getByText("Kostenlos.")).toBeInTheDocument();
    expect(screen.queryByText("Deutsch.")).not.toBeInTheDocument();
    ["Amazon", "Apple", "Red Bull", "Meta"].forEach((name) => {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    });
  });

  it("renders an in-flow primary CTA linking to the courses hub", () => {
    render(<HeroSection />);
    const cta = screen.getByRole("link", { name: /Lernpfad öffnen/i });
    expect(cta).toHaveAttribute("href", "/kurse");
  });
});
