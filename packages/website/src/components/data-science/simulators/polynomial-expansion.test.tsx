import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { PolynomialExpansion } from "./polynomial-expansion";

afterEach(() => {
  cleanup();
});

describe("PolynomialExpansion ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<PolynomialExpansion />);
    expect(container.querySelector("canvas")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders the real panel copy and degree controls", () => {
    render(<PolynomialExpansion />);
    expect(screen.getByText("Polynomial feature expansion")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Degree 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Degree 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Degree 3" })).toBeInTheDocument();
  });

  it("defaults to degree 2 with a 'Good fit' complexity label", () => {
    render(<PolynomialExpansion />);
    expect(screen.getByText("Good fit")).toBeInTheDocument();
  });

  it("switching to degree 1 shows the underfit label", () => {
    render(<PolynomialExpansion />);
    fireEvent.click(screen.getByRole("button", { name: "Degree 1" }));
    expect(screen.getByText("Underfits (high bias)")).toBeInTheDocument();
  });

  it("switching to degree 3 shows the overfit label", () => {
    render(<PolynomialExpansion />);
    fireEvent.click(screen.getByRole("button", { name: "Degree 3" }));
    expect(screen.getByText("Slight overfit (high complexity)")).toBeInTheDocument();
  });

  it("reproduces the same seeded scatter on first paint (mulberry32(42), not Math.random)", () => {
    const { container: a } = render(<PolynomialExpansion />);
    const first = a.querySelector("svg")?.outerHTML;
    cleanup();
    const { container: b } = render(<PolynomialExpansion />);
    const second = b.querySelector("svg")?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });
});
