import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { ScalerDemo } from "./scaler-demo";

afterEach(() => cleanup());

describe("ScalerDemo ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<ScalerDemo />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and all four scaler buttons", () => {
    render(<ScalerDemo />);
    expect(screen.getByText("Feature Scaling")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "raw" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "standard" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "minmax" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "robust" })).toBeInTheDocument();
  });

  it("switching scaler updates the formula description text", () => {
    render(<ScalerDemo />);
    fireEvent.click(screen.getByRole("button", { name: "robust" }));
    expect(
      screen.getByText(/median-centered; tail extremes do not set the scale/),
    ).toBeInTheDocument();
  });

  it("renders one bar group per feature name (deterministic, hardcoded feature values)", () => {
    render(<ScalerDemo />);
    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Spend")).toBeInTheDocument();
  });
});
