import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, cleanup, screen } from "@testing-library/react";
import { FlowingPipeline } from "./flowing-pipeline";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("FlowingPipeline ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<FlowingPipeline />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders all 6 station labels from source", () => {
    render(<FlowingPipeline />);
    expect(screen.getByText(/Data/)).toBeInTheDocument();
    expect(screen.getByText(/Explore/)).toBeInTheDocument();
    expect(screen.getByText(/Clean/)).toBeInTheDocument();
    expect(screen.getByText(/Feature/)).toBeInTheDocument();
    expect(screen.getByText(/Model/)).toBeInTheDocument();
    expect(screen.getByText(/Evaluate/)).toBeInTheDocument();
  });

  it("renders every station as a real chapter link", () => {
    render(<FlowingPipeline />);
    const nodes = screen.getAllByRole("link");
    expect(nodes).toHaveLength(6);
    expect(nodes[0]).toHaveAccessibleName("01 · Data - Open chapter");
    expect(nodes[0]).toHaveAttribute(
      "href",
      "/en/kurse/open-source/data-science/fund",
    );
  });

  it("does not throw despite jsdom lacking SVGPathElement.getPointAtLength/getTotalLength", () => {
    expect(() => render(<FlowingPipeline />)).not.toThrow();
  });

  it("does not start the continuous ticker during the initial mobile paint", () => {
    const source = readFileSync(
      join(__dirname, "flowing-pipeline.tsx"),
      "utf8",
    );
    expect(source).toContain('rootMargin: "0px 0px -50% 0px"');
  });
});
