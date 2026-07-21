import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ShuffleSim } from "./shuffle-sim";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ShuffleSim ", () => {
  it("defaults to hash strategy with 6 workers", () => {
    render(<ShuffleSim />);
    expect(screen.getByRole("button", { name: "Hash" }).className).toContain("on");
    expect(screen.getByText("W5")).toBeInTheDocument();
  });

  it("switches to broadcast strategy, relabeling the users side as small", () => {
    render(<ShuffleSim />);
    fireEvent.click(screen.getByRole("button", { name: "Broadcast" }));
    expect(screen.getByText("~10K (small)")).toBeInTheDocument();
  });

  it("pushing skew to max marks worker 0 overloaded", () => {
    render(<ShuffleSim />);
    const [skewSlider] = screen.getAllByRole("slider");
    fireEvent.change(skewSlider, { target: { value: "90" } });
    expect(screen.getByText("OVERLOADED")).toBeInTheDocument();
    expect(screen.getByText("overloaded")).toBeInTheDocument();
  });

  it("pauses and resumes", () => {
    render(<ShuffleSim />);
    fireEvent.click(screen.getByRole("button", { name: /Pause/ }));
    expect(screen.getByRole("button", { name: /Run/ })).toBeInTheDocument();
  });
});
