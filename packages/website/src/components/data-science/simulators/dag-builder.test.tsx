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
    expect(
      screen.getByText("DAG patterns · should you adjust for Z?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Yes, directly.")).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "DAG pattern" }),
    ).toBeInTheDocument();
    const direct = screen.getByRole("button", { name: /Direct effect/ });
    expect(direct).toHaveAttribute("aria-pressed", "true");
    expect(direct).toHaveClass("min-h-11");
  });

  it("clicking through all 4 patterns renders each pattern's own distinct answer/explanation — verifies edgePath stayed scoped to its own data across the file split", () => {
    render(<DAGBuilder />);

    const fork = screen.getByRole("button", { name: /^Fork \/ Confounder/ });
    fireEvent.click(fork);
    expect(fork).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /^Direct effect/ }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByText("Yes, but only after controlling for Z."),
    ).toBeInTheDocument();
    expect(screen.getByText(/creates the backdoor path/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/^Mediator/));
    expect(
      screen.getByText("Yes, but do NOT control for Z."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/on the causal path from X to Y/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText(/^Collider/));
    expect(
      screen.getByText(
        "For the displayed total effect, do not condition on Z.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/can open a non-causal association/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText(/^Direct effect/));
    expect(screen.getByText("Yes, directly.")).toBeInTheDocument();
    expect(
      screen.getByText(/assumes no open backdoor path/),
    ).toBeInTheDocument();
  });
});
