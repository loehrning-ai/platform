import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { SHAPWaterfallSim } from "./shap-waterfall-sim";

afterEach(() => {
  cleanup();
});

describe("SHAPWaterfallSim ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<SHAPWaterfallSim />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and every loan feature slider", () => {
    render(<SHAPWaterfallSim />);
    expect(screen.getByText("SHAP waterfall · loan approval")).toBeInTheDocument();
    expect(screen.getByLabelText("Annual income ($k)")).toBeInTheDocument();
    expect(screen.getByLabelText("Age (years)")).toBeInTheDocument();
    expect(screen.getByLabelText("Debt ratio (%)")).toBeInTheDocument();
    expect(screen.getByLabelText("Employment years")).toBeInTheDocument();
    expect(screen.getByLabelText("Credit score")).toBeInTheDocument();
    expect(screen.getByLabelText("Savings ($k)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset to means" })).toBeInTheDocument();
  });

  it("reproduces the same score layout on first paint (no RNG, purely deterministic)", () => {
    const { container: a } = render(<SHAPWaterfallSim />);
    const first = a.querySelector("svg")?.outerHTML;
    cleanup();
    const { container: b } = render(<SHAPWaterfallSim />);
    const second = b.querySelector("svg")?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });
});
