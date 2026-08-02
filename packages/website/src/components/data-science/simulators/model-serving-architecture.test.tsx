import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { ModelServingArchitecture } from "./model-serving-architecture";

afterEach(() => {
  cleanup();
});

describe("ModelServingArchitecture ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<ModelServingArchitecture />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and all 7 architecture nodes", () => {
    render(<ModelServingArchitecture />);
    expect(screen.getByText("Model serving architecture")).toBeInTheDocument();
    expect(screen.getByText("Client")).toBeInTheDocument();
    expect(screen.getByText("Load Balancer")).toBeInTheDocument();
    expect(screen.getByText("Feature Store")).toBeInTheDocument();
    expect(screen.getByText("Model Registry")).toBeInTheDocument();
    expect(screen.getByText("Monitoring")).toBeInTheDocument();
    expect(screen.getByText("Hover, focus, or select a component to inspect it.")).toBeInTheDocument();
  });

  it("shows a node's description and failure mode on hover", () => {
    render(<ModelServingArchitecture />);
    const monitoring = screen.getByText("Monitoring");
    fireEvent.mouseEnter(monitoring.closest("g")!);
    expect(screen.getByText(/Captures prediction logs/)).toBeInTheDocument();
    expect(screen.getByText(/Alert fatigue/)).toBeInTheDocument();
    fireEvent.mouseLeave(monitoring.closest("g")!);
    expect(screen.getByText("Hover, focus, or select a component to inspect it.")).toBeInTheDocument();
  });

  it("supports focus and keyboard selection for every architecture node", () => {
    render(<ModelServingArchitecture />);
    const monitoring = screen.getByRole("button", { name: "Inspect Monitoring" });

    fireEvent.focus(monitoring);
    expect(screen.getByText(/Captures prediction logs/)).toBeInTheDocument();
    fireEvent.keyDown(monitoring, { key: "Enter" });
    expect(monitoring).toHaveAttribute("aria-pressed", "true");
    fireEvent.blur(monitoring);
    expect(screen.getByText(/Captures prediction logs/)).toBeInTheDocument();

    fireEvent.keyDown(monitoring, { key: " " });
    expect(monitoring).toHaveAttribute("aria-pressed", "false");
  });
});
