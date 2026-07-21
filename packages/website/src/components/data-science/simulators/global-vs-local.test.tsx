import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { GlobalVsLocal } from "./global-vs-local";

afterEach(() => {
  cleanup();
});

describe("GlobalVsLocal (plan 012 stage 9)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<GlobalVsLocal />);
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and starts with no point selected", () => {
    render(<GlobalVsLocal />);
    expect(screen.getByText("Global vs local explanations")).toBeInTheDocument();
    expect(screen.getByText("20 data points · click one")).toBeInTheDocument();
    expect(screen.getByText("Select a data point to see its local explanation.")).toBeInTheDocument();
  });

  it("reproduces the same seeded points on first paint (mulberry32(999), not Math.random)", () => {
    const { container: a } = render(<GlobalVsLocal />);
    const first = a.querySelector("svg")?.outerHTML;
    cleanup();
    const { container: b } = render(<GlobalVsLocal />);
    const second = b.querySelector("svg")?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });

  it("clicking a data point selects it and reveals local SHAP", () => {
    const { container } = render(<GlobalVsLocal />);
    const firstPoint = container.querySelector("svg g[style*='cursor: pointer']");
    expect(firstPoint).not.toBeNull();
    if (firstPoint) fireEvent.click(firstPoint);
    expect(screen.getAllByText(/point #0/).length).toBeGreaterThan(0);
  });
});
