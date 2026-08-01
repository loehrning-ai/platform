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

  it("renders an in-flow primary CTA linking to the diagnostic start", () => {
    render(<HeroSection />);
    const cta = screen.getByRole("link", { name: /Start bestimmen/i });
    expect(cta).toHaveAttribute("href", "/ki-check");
  });

  it("renders the above-fold introduction without a delayed clipping reveal", () => {
    render(<HeroSection />);
    const introduction = screen.getByText(/Kurse, Demos, Bücher und Arbeitsnotizen/);

    expect(introduction.tagName).toBe("P");
    expect(introduction).not.toHaveStyle({ opacity: "0" });
    expect(introduction.style.clipPath).toBe("");
  });
});
