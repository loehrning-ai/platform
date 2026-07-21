import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent, act } from "@testing-library/react";
import { DriftSimulator } from "./drift-simulator";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("DriftSimulator (plan 012 stage 11)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<DriftSimulator />);
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and both charts", () => {
    render(<DriftSimulator />);
    expect(screen.getByText("Drift simulator")).toBeInTheDocument();
    expect(screen.getByText("Model accuracy (AUC) over 60 days")).toBeInTheDocument();
    expect(screen.getByText("PSI (Population Stability Index)")).toBeInTheDocument();
    expect(screen.getByText("Day 1 / 60")).toBeInTheDocument();
  });

  it("reproduces the same seeded series on first paint (computeSeries default seed 7, not Math.random)", () => {
    const { container: a } = render(<DriftSimulator />);
    const first = a.querySelectorAll("svg")[0]?.outerHTML;
    cleanup();
    const { container: b } = render(<DriftSimulator />);
    const second = b.querySelectorAll("svg")[0]?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });

  it("advances the day counter while running and stops the interval at day 60, then restarts cleanly from day 1", () => {
    vi.useFakeTimers();
    render(<DriftSimulator />);
    fireEvent.click(screen.getByRole("button", { name: /Start/ }));

    // 60 days * 120ms/tick = 7200ms to fully complete the run.
    act(() => {
      vi.advanceTimersByTime(60 * 120 + 50);
    });
    expect(screen.getByText("Day 60 / 60")).toBeInTheDocument();

    // Advancing further must not throw or push day past 60 — the interval
    // must have been cleared when the run completed (setRunning(false)).
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("Day 60 / 60")).toBeInTheDocument();

    // Restarting after completion must reset day to 1 (handleStart's
    // `if (day >= 60) setDay(1)` branch) and resume ticking — this is the
    // refs/closures split-safety check: a stale tickRef from the completed
    // run must not silently prevent the new interval from being armed.
    fireEvent.click(screen.getByRole("button", { name: /Restart/ }));
    expect(screen.getByText("Day 1 / 60")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(120 * 5 + 20);
    });
    expect(screen.getByText("Day 6 / 60")).toBeInTheDocument();
  });

  it("pausing stops the tick and moving the drift-intensity slider resets to day 1", () => {
    vi.useFakeTimers();
    render(<DriftSimulator />);
    fireEvent.click(screen.getByRole("button", { name: /Start/ }));
    act(() => {
      vi.advanceTimersByTime(120 * 3 + 20);
    });
    expect(screen.getByText("Day 4 / 60")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Pause/ }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("Day 4 / 60")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Drift intensity"), { target: { value: "2" } });
    expect(screen.getByText("Day 1 / 60")).toBeInTheDocument();
  });
});
