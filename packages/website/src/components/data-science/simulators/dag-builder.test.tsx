import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { DAGBuilder } from "./dag-builder";

afterEach(() => {
  cleanup();
});

describe("DAGBuilder ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<DAGBuilder />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and starts on the Direct effect pattern", () => {
    render(<DAGBuilder />);
    expect(screen.getByText("DAG patterns · should you adjust for Z?")).toBeInTheDocument();
    expect(screen.getByText("Yes — directly.")).toBeInTheDocument();
  });

  it("clicking through all 4 patterns renders each pattern's own distinct answer/explanation — verifies edgePath stayed scoped to its own data across the file split", () => {
    render(<DAGBuilder />);

    fireEvent.click(screen.getByText(/^Fork \/ Confounder/));
    expect(screen.getByText("Yes — but only after controlling for Z.")).toBeInTheDocument();
    expect(screen.getByText(/opens a backdoor path/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/^Mediator/));
    expect(screen.getByText("Yes — but do NOT control for Z.")).toBeInTheDocument();
    expect(screen.getByText(/on the causal path from X to Y/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/^Collider/));
    expect(screen.getByText("Yes — but NEVER condition on Z.")).toBeInTheDocument();
    expect(screen.getByText(/both X and Y point into it/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/^Direct effect/));
    expect(screen.getByText("Yes — directly.")).toBeInTheDocument();
    expect(screen.getByText(/No confounders, no colliders/)).toBeInTheDocument();
  });
});
