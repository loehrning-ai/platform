import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { ConfoundingSimulator } from "./confounding-simulator";

afterEach(() => {
  cleanup();
});

describe("ConfoundingSimulator (plan 012 stage 10)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<ConfoundingSimulator />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and scenario picker", () => {
    render(<ConfoundingSimulator />);
    expect(screen.getByText("Confounding · the lurking variable")).toBeInTheDocument();
    // "Ice cream & drowning" appears twice: the scenario button and the
    // panel's own meta line (both show the active scenario's label).
    expect(screen.getAllByText("Ice cream & drowning").length).toBeGreaterThan(0);
    expect(screen.getByText("Shoe size & reading")).toBeInTheDocument();
    expect(screen.getByText("OVERALL r")).toBeInTheDocument();
  });

  it("reproduces the same seeded scatter on first paint for the icecream scenario (mulberry32(42))", () => {
    const { container: a } = render(<ConfoundingSimulator />);
    const first = a.querySelector("svg")?.outerHTML;
    cleanup();
    const { container: b } = render(<ConfoundingSimulator />);
    const second = b.querySelector("svg")?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });

  it("switching scenarios reseeds with mulberry32(77) and reveals per-group correlation on demand", () => {
    render(<ConfoundingSimulator />);
    fireEvent.click(screen.getByText("Shoe size & reading"));
    expect(screen.getAllByText("Shoe size & reading").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("Reveal confounder"));
    expect(screen.getByText("✓ Confounder visible")).toBeInTheDocument();
    expect(screen.getByText("within-group r ≈ 0")).toBeInTheDocument();
  });
});
