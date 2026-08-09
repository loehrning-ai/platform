import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { BiasVarianceSim } from "./bias-variance-sim";

afterEach(() => {
  cleanup();
});

describe("BiasVarianceSim ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<BiasVarianceSim />);
    expect(container.querySelector("canvas")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders the real panel copy and controls", () => {
    render(<BiasVarianceSim />);
    expect(screen.getByText("Bias-variance behavior")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Model complexity (polynomial degree)"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /New training data/ }),
    ).toBeInTheDocument();
  });

  it("defaults to degree 5 with a 'good fit' regime label", () => {
    render(<BiasVarianceSim />);
    expect(screen.getByText("good fit")).toBeInTheDocument();
  });

  it("dragging complexity to 0 shows the underfit regime label", () => {
    render(<BiasVarianceSim />);
    fireEvent.change(
      screen.getByLabelText("Model complexity (polynomial degree)"),
      { target: { value: "0" } },
    );
    expect(screen.getByText("underfit (high bias)")).toBeInTheDocument();
  });

  it("dragging complexity to 15 shows the overfit regime label", () => {
    render(<BiasVarianceSim />);
    fireEvent.change(
      screen.getByLabelText("Model complexity (polynomial degree)"),
      { target: { value: "15" } },
    );
    expect(screen.getByText("overfit (high variance)")).toBeInTheDocument();
  });

  it("reproduces the same seeded training data on first paint (mulberry32(17), not Math.random)", () => {
    const { container: a } = render(<BiasVarianceSim />);
    const first = a.querySelector(".plot-wrap svg")?.outerHTML;
    cleanup();
    const { container: b } = render(<BiasVarianceSim />);
    const second = b.querySelector(".plot-wrap svg")?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });

  it("clicking 'New training data' reshuffles the seed (SVG output changes)", () => {
    const { container } = render(<BiasVarianceSim />);
    const before = container.querySelector(".plot-wrap svg")?.outerHTML;
    fireEvent.click(screen.getByRole("button", { name: /New training data/ }));
    const after = container.querySelector(".plot-wrap svg")?.outerHTML;
    expect(after).not.toBe(before);
  });
});
