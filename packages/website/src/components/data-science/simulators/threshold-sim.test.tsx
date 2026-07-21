import { StrictMode } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { ThresholdSim } from "./threshold-sim";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ThresholdSim (plan 012 stage 6)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<ThresholdSim />);
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and confusion-matrix cells, not a placeholder", () => {
    render(<ThresholdSim />);
    expect(screen.getByText("Threshold · confusion · ROC")).toBeInTheDocument();
    expect(screen.getByText("TP · caught")).toBeInTheDocument();
    expect(screen.getByText("FN · missed")).toBeInTheDocument();
    expect(screen.getByText("FP · false alarm")).toBeInTheDocument();
    expect(screen.getByText("TN · correct reject")).toBeInTheDocument();
  });

  it("reproduces the same seeded score distribution on first paint (mulberry32(7), not Math.random)", () => {
    const { container: a } = render(<ThresholdSim />);
    const first = a.querySelectorAll(".plot-wrap svg")[0]?.outerHTML;
    cleanup();
    const { container: b } = render(<ThresholdSim />);
    const second = b.querySelectorAll(".plot-wrap svg")[0]?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });

  it("dragging the threshold slider updates the displayed tau and stats", () => {
    render(<ThresholdSim />);
    const slider = screen.getByLabelText("Decision threshold");
    fireEvent.change(slider, { target: { value: "0.9" } });
    expect(screen.getByText("τ = 0.90")).toBeInTheDocument();
  });

  it("toggling auto-sweep flips the button label", () => {
    render(<ThresholdSim />);
    const btn = screen.getByRole("button", { name: /Auto-sweep/ });
    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: /Stop sweep/ })).toBeInTheDocument();
  });

  it("cleans up its auto-sweep RAF loop under React 18 Strict Mode with no leaked handle", () => {
    // auto-sweep starts false, so — unlike GaltonSim's always-on loop — this
    // effect only fires once the user opts in, after the initial-mount
    // double-invoke window StrictMode exercises. The real regression this
    // guards against is a mismatched request/cancel count once the loop
    // actually runs: every requestAnimationFrame this component issues must
    // have a matching cancelAnimationFrame by the time it unmounts.
    const rafSpy = vi.spyOn(window, "requestAnimationFrame");
    const cafSpy = vi.spyOn(window, "cancelAnimationFrame");

    const { unmount } = render(
      <StrictMode>
        <ThresholdSim />
      </StrictMode>,
    );
    expect(rafSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Auto-sweep/ }));
    expect(rafSpy).toHaveBeenCalledTimes(1);
    expect(cafSpy).not.toHaveBeenCalled();

    const requestedId = rafSpy.mock.results[0]?.value;
    unmount();
    expect(cafSpy).toHaveBeenCalledTimes(1);
    expect(cafSpy.mock.calls[0]?.[0]).toBe(requestedId);
  });
});
