import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { PowerCalculator } from "./power-calculator";

afterEach(() => {
  cleanup();
});

describe("PowerCalculator (plan 012 stage 10)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<PowerCalculator />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and MDE/n/alpha sliders", () => {
    render(<PowerCalculator />);
    expect(screen.getByText("Statistical Power")).toBeInTheDocument();
    expect(screen.getByLabelText("Minimum detectable effect (MDE)")).toBeInTheDocument();
    expect(screen.getByLabelText("Sample size per arm (n)")).toBeInTheDocument();
    expect(screen.getByLabelText("Significance level (α)")).toBeInTheDocument();
    expect(screen.getByText("Power")).toBeInTheDocument();
    expect(screen.getByText("Min n (80%)")).toBeInTheDocument();
  });

  it("moving the sample-size slider updates power (no RNG involved — pure normCdf/normInv math)", () => {
    render(<PowerCalculator />);
    const nSlider = screen.getByLabelText("Sample size per arm (n)");
    fireEvent.change(nSlider, { target: { value: "20000" } });
    expect(nSlider).toHaveValue("20000");
    expect(screen.getByText("20,000")).toBeInTheDocument();
  });
});
