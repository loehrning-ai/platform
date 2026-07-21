import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { PrecisionRecallTradeoff } from "./precision-recall-tradeoff";

afterEach(() => {
  cleanup();
});

describe("PrecisionRecallTradeoff (plan 012 stage 11)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<PrecisionRecallTradeoff />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and cost-calculator controls", () => {
    render(<PrecisionRecallTradeoff />);
    expect(screen.getByText("Precision–recall tradeoff")).toBeInTheDocument();
    expect(screen.getByText("Business cost calculator")).toBeInTheDocument();
    expect(screen.getByLabelText("Decision threshold")).toBeInTheDocument();
    expect(screen.getByLabelText("Cost per missed fraud in dollars")).toBeInTheDocument();
    expect(screen.getByLabelText("Cost per false alert in dollars")).toBeInTheDocument();
  });

  it("moving the threshold slider updates the meta line", () => {
    render(<PrecisionRecallTradeoff />);
    const slider = screen.getByLabelText("Decision threshold");
    fireEvent.change(slider, { target: { value: "0.7" } });
    expect(screen.getByText(/Threshold: 0.70/)).toBeInTheDocument();
  });
});
