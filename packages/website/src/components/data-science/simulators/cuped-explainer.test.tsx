import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { CUPEDExplainer } from "./cuped-explainer";

afterEach(() => {
  cleanup();
});

describe("CUPEDExplainer ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<CUPEDExplainer />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and CUPED formula", () => {
    render(<CUPEDExplainer />);
    expect(screen.getByText("CUPED — Variance Reduction via Covariates")).toBeInTheDocument();
    expect(screen.getByText("CUPED FORMULA")).toBeInTheDocument();
  });

  it("reproduces the same seeded dataset on first paint (mulberry32(99), not Math.random)", () => {
    const { container: a } = render(<CUPEDExplainer />);
    const first = a.querySelector("svg")?.outerHTML;
    cleanup();
    const { container: b } = render(<CUPEDExplainer />);
    const second = b.querySelector("svg")?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });

  it("toggling Apply CUPED switches the chart label to the adjusted metric", () => {
    render(<CUPEDExplainer />);
    expect(screen.getByText("Raw metric (wide CIs)")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Apply CUPED"));
    expect(screen.getByText("CUPED-adjusted metric (narrower CIs)")).toBeInTheDocument();
  });
});
