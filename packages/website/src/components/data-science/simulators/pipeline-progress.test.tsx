import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent, act } from "@testing-library/react";
import { PipelineProgress } from "./pipeline-progress";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("PipelineProgress ", () => {
  it("renders the real panel copy and all 6 pipeline steps", () => {
    render(<PipelineProgress />);
    expect(screen.getByText("ML pipeline, step-by-step")).toBeInTheDocument();
    expect(screen.getByText("Load & Inspect")).toBeInTheDocument();
    expect(screen.getByText("Feature Engineering")).toBeInTheDocument();
    expect(screen.getByText("Scale Amount & Time")).toBeInTheDocument();
    expect(screen.getByText("Train/Test Split")).toBeInTheDocument();
    expect(screen.getByText("Fit XGBoost")).toBeInTheDocument();
    expect(screen.getByText("Evaluate")).toBeInTheDocument();
    expect(screen.getByText("Step 1 / 6")).toBeInTheDocument();
  });

  it("no canvas element in the DOM", () => {
    const { container } = render(<PipelineProgress />);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("running a step types the log lines one at a time and completes the step", () => {
    vi.useFakeTimers();
    render(<PipelineProgress />);
    fireEvent.click(screen.getByRole("button", { name: /Run step 1/ }));

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText("> Loading creditcard.csv …")).toBeInTheDocument();

    // 6 log lines * 200ms to type them out, plus one more 200ms tick for the
    // interval to detect completion (i >= step.log.length) and finalize.
    act(() => {
      vi.advanceTimersByTime(200 * 7 + 50);
    });
    expect(screen.getByText("✓ Dataset loaded.")).toBeInTheDocument();
    expect(screen.getByText("Step 2 / 6")).toBeInTheDocument();
  });

  it("reset clears progress back to step 1", () => {
    vi.useFakeTimers();
    render(<PipelineProgress />);
    fireEvent.click(screen.getByRole("button", { name: /Run step 1/ }));
    act(() => {
      vi.advanceTimersByTime(200 * 7 + 50);
    });
    expect(screen.getByText("Step 2 / 6")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("Step 1 / 6")).toBeInTheDocument();
  });
});
