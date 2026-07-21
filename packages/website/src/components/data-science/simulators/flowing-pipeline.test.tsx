import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { FlowingPipeline } from "./flowing-pipeline";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("FlowingPipeline (plan 012 stage 7)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<FlowingPipeline onStageClick={() => {}} />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders all 6 station labels from source", () => {
    render(<FlowingPipeline onStageClick={() => {}} />);
    expect(screen.getByText(/Data/)).toBeInTheDocument();
    expect(screen.getByText(/Explore/)).toBeInTheDocument();
    expect(screen.getByText(/Clean/)).toBeInTheDocument();
    expect(screen.getByText(/Feature/)).toBeInTheDocument();
    expect(screen.getByText(/Model/)).toBeInTheDocument();
    expect(screen.getByText(/Evaluate/)).toBeInTheDocument();
  });

  it("clicking a station invokes onStageClick with that station's chapter id", () => {
    const onStageClick = vi.fn();
    const { container } = render(<FlowingPipeline onStageClick={onStageClick} />);
    const nodes = container.querySelectorAll(".ov-loop-node");
    expect(nodes.length).toBe(6);
    fireEvent.click(nodes[0]!);
    expect(onStageClick).toHaveBeenCalledWith("fund");
  });

  it("does not throw despite jsdom lacking SVGPathElement.getPointAtLength/getTotalLength", () => {
    expect(() => render(<FlowingPipeline onStageClick={() => {}} />)).not.toThrow();
  });
});
