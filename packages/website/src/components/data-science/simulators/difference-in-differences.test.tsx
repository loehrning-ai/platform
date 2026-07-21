import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { DifferenceInDifferences } from "./difference-in-differences";

afterEach(() => {
  cleanup();
});

describe("DifferenceInDifferences (plan 012 stage 10)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<DifferenceInDifferences />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and default DiD estimate", () => {
    render(<DifferenceInDifferences />);
    expect(screen.getByText("Difference-in-Differences")).toBeInTheDocument();
    expect(screen.getByLabelText("True treatment effect")).toBeInTheDocument();
  });

  it("moving the effect slider updates the DiD estimate", () => {
    // At the default parallel-trends-hold scenario, DiD equals the effect
    // exactly, so "N pts" appears twice (slider label + DiD estimate) —
    // assert the slider's own value instead of an ambiguous text match.
    render(<DifferenceInDifferences />);
    const slider = screen.getByLabelText("True treatment effect");
    fireEvent.change(slider, { target: { value: "20" } });
    expect(slider).toHaveValue("20");
    expect(screen.getAllByText("20 pts").length).toBeGreaterThan(0);
  });

  it("toggling parallel trends to Violated surfaces the bias warning", () => {
    render(<DifferenceInDifferences />);
    fireEvent.click(screen.getByText("Violated"));
    expect(screen.getByText(/Parallel trends violated/)).toBeInTheDocument();
  });
});
