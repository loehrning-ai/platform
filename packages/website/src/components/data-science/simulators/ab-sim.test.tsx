import { StrictMode } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { ABSim } from "./ab-sim";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ABSim (plan 012 stage 9)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<ABSim />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and all controls", () => {
    render(<ABSim />);
    expect(screen.getByText("Running experiment")).toBeInTheDocument();
    expect(screen.getByLabelText("True lift")).toBeInTheDocument();
    expect(screen.getByLabelText("Baseline conversion rate")).toBeInTheDocument();
    expect(screen.getByLabelText("Daily visitors")).toBeInTheDocument();
    expect(screen.getByLabelText("Simulation speed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pause/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reset/ })).toBeInTheDocument();
    expect(screen.getByText("CONTROL")).toBeInTheDocument();
    expect(screen.getByText("VARIANT")).toBeInTheDocument();
  });

  it("cleans up its RAF loop correctly under React 18 Strict Mode's double-invoked effects", () => {
    const rafSpy = vi.spyOn(window, "requestAnimationFrame");
    const cafSpy = vi.spyOn(window, "cancelAnimationFrame");

    const { unmount } = render(
      <StrictMode>
        <ABSim />
      </StrictMode>,
    );

    expect(rafSpy).toHaveBeenCalledTimes(2);
    expect(cafSpy).toHaveBeenCalledTimes(1);

    const requestedIds = rafSpy.mock.results.map((r) => r.value);
    const canceledIds = cafSpy.mock.calls.map((c) => c[0]);
    expect(canceledIds).toEqual([requestedIds[0]]);

    unmount();

    expect(cafSpy).toHaveBeenCalledTimes(2);
    expect(cafSpy.mock.calls[1]?.[0]).toBe(requestedIds[1]);
  });
});
