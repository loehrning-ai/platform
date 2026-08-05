import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { LivingPipeline } from "./living-pipeline";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("LivingPipeline ", () => {
  it("renders all 6 sabotage buttons, all healthy by default", () => {
    render(<LivingPipeline />);
    for (const title of ["Cumulative merge", "Idempotent write", "Watermark + dedup", "Data-quality gate", "Access Gateway deploy", "Semantic binding"]) {
      expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText("healthy")).toHaveLength(6);
  });

  it("breaking the merge contract marks it broken and updates the consumer view", () => {
    render(<LivingPipeline />);
    fireEvent.click(screen.getByRole("button", { name: /01[\s\S]*Cumulative merge/ }));
    expect(screen.getAllByText("broken").length).toBeGreaterThan(0);
    expect(screen.getByText("97.8%")).toBeInTheDocument();
  });

  it("starts and stops the guided tutorial", () => {
    render(<LivingPipeline />);
    fireEvent.click(screen.getByRole("button", { name: /guided tutorial/ }));
    expect(screen.getByText("Pipeline running clean")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /stop tutorial/ }));
    expect(screen.queryByText("Pipeline running clean")).not.toBeInTheDocument();
  });

  it("fix all clears every broken contract", () => {
    render(<LivingPipeline />);
    fireEvent.click(screen.getByRole("button", { name: /01[\s\S]*Cumulative merge/ }));
    fireEvent.click(screen.getByRole("button", { name: /fix all/ }));
    expect(screen.getAllByText("healthy")).toHaveLength(6);
    expect(screen.getByText("94.2%")).toBeInTheDocument();
  });
});
