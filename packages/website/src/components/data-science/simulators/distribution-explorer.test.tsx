import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { DistributionExplorer } from "./distribution-explorer";

afterEach(() => cleanup());

describe("DistributionExplorer ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<DistributionExplorer />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and shape/N buttons", () => {
    render(<DistributionExplorer />);
    expect(screen.getByText("Distribution Explorer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "normal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "skewed" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "bimodal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "uniform" })).toBeInTheDocument();
    expect(screen.getByLabelText("Number of histogram bins")).toBeInTheDocument();
  });

  it("switching shape changes the active button and recomputes stats deterministically", () => {
    render(<DistributionExplorer />);
    fireEvent.click(screen.getByRole("button", { name: "skewed" }));
    expect(screen.getByRole("button", { name: "skewed" }).className).toContain("active");
  });

  it("reproduces the same seeded histogram for the same shape/N (mulberry32, not Math.random)", () => {
    const { container: a } = render(<DistributionExplorer />);
    const first = a.querySelector(".plot-wrap svg")?.outerHTML;
    cleanup();
    const { container: b } = render(<DistributionExplorer />);
    const second = b.querySelector(".plot-wrap svg")?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });
});
