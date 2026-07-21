import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent, waitFor } from "@testing-library/react";
import { PeekingSimulator } from "./peeking-simulator";

afterEach(() => {
  cleanup();
});

describe("PeekingSimulator (plan 012 stage 10)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<PeekingSimulator />);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and check-frequency/alpha options before running", () => {
    render(<PeekingSimulator />);
    expect(screen.getByText("Peeking False-Positive Inflator")).toBeInTheDocument();
    expect(screen.getByText("Daily (every 100 obs)")).toBeInTheDocument();
    expect(screen.getByText("End-only (no peeking)")).toBeInTheDocument();
    expect(screen.getByText("Run the simulation to see results.")).toBeInTheDocument();
  });

  it("running the simulation shows the nominal/actual FPR results", async () => {
    render(<PeekingSimulator />);
    fireEvent.click(screen.getByText("Run 1 000 A/A tests"));
    await waitFor(() => {
      expect(screen.getByText("Nominal α")).toBeInTheDocument();
      expect(screen.getByText("Actual FPR")).toBeInTheDocument();
    });
  });
});
