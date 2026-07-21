import { StrictMode } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { GaltonSim } from "./galton-sim";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("GaltonSim (plan 012 stage 6)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<GaltonSim />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy, not a placeholder", () => {
    render(<GaltonSim />);
    expect(screen.getByText("Galton Board · Sampling Distribution")).toBeInTheDocument();
    expect(screen.getByText("Population")).toBeInTheDocument();
    expect(screen.getByText(/Sample size/)).toBeInTheDocument();
  });

  it("exposes the population/sample-size/drop-rate/play-pause/reset controls", () => {
    render(<GaltonSim />);
    expect(screen.getByRole("button", { name: "bell" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "skew" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "bimodal" })).toBeInTheDocument();
    expect(screen.getByLabelText("Sample size")).toBeInTheDocument();
    expect(screen.getByLabelText("Drop rate per second")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("cleans up its RAF loop correctly under React 18 Strict Mode's double-invoked effects", () => {
    const rafSpy = vi.spyOn(window, "requestAnimationFrame");
    const cafSpy = vi.spyOn(window, "cancelAnimationFrame");

    const { unmount } = render(
      <StrictMode>
        <GaltonSim />
      </StrictMode>,
    );

    // StrictMode mounts the effect, tears it down, then mounts it again —
    // two requestAnimationFrame calls, one matching cancelAnimationFrame
    // from the throwaway first mount's cleanup.
    expect(rafSpy).toHaveBeenCalledTimes(2);
    expect(cafSpy).toHaveBeenCalledTimes(1);

    const requestedIds = rafSpy.mock.results.map((r) => r.value);
    const canceledIds = cafSpy.mock.calls.map((c) => c[0]);
    expect(canceledIds).toEqual([requestedIds[0]]);

    unmount();

    // Real unmount cancels the second (surviving) RAF handle — no stale
    // handle keeps firing after unmount, no duplicate loop left running.
    expect(cafSpy).toHaveBeenCalledTimes(2);
    expect(cafSpy.mock.calls[1]?.[0]).toBe(requestedIds[1]);
  });

  it("reproduces the same seeded layout on first paint (mulberry32(42), not Math.random)", () => {
    const { container: a } = render(<GaltonSim />);
    const first = a.querySelector(".galton-svg")?.outerHTML;
    cleanup();
    const { container: b } = render(<GaltonSim />);
    const second = b.querySelector(".galton-svg")?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });
});
