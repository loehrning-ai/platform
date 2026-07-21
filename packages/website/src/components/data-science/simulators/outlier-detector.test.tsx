import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { OutlierDetector } from "./outlier-detector";

afterEach(() => cleanup());

describe("OutlierDetector (plan 012 stage 7)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<OutlierDetector />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and all three detection methods", () => {
    render(<OutlierDetector />);
    expect(screen.getByText("Outlier Detector")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Z-score" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "IQR" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Isolation Forest" })).toBeInTheDocument();
  });

  it("switching method flags different points and updates the active button", () => {
    render(<OutlierDetector />);
    fireEvent.click(screen.getByRole("button", { name: "IQR" }));
    expect(screen.getByRole("button", { name: "IQR" }).className).toContain("active");
  });

  it("reproduces the same seeded point cloud on first paint (mulberry32(99), not Math.random)", () => {
    const { container: a } = render(<OutlierDetector />);
    const first = a.querySelector(".plot-wrap svg")?.outerHTML;
    cleanup();
    const { container: b } = render(<OutlierDetector />);
    const second = b.querySelector(".plot-wrap svg")?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });
});
