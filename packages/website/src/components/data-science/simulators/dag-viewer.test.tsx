import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { DAGViewer } from "./dag-viewer";

afterEach(() => {
  cleanup();
});

describe("DAGViewer (plan 012 stage 10)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<DAGViewer />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and starts on the Confounding scenario", () => {
    render(<DAGViewer />);
    expect(screen.getByText("DAGs · the three patterns")).toBeInTheDocument();
    expect(screen.getByText(/Age is the confounder/)).toBeInTheDocument();
  });

  it("clicking through all 3 scenarios renders each one's own distinct blurb", () => {
    render(<DAGViewer />);

    fireEvent.click(screen.getByText("Collider bias"));
    expect(screen.getByText(/negatively correlated with looks in Hollywood/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Mediation"));
    expect(screen.getByText(/Sleep is a mediator/)).toBeInTheDocument();
  });
});
