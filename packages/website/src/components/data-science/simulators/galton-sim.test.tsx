import { StrictMode } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";
import { GaltonSim } from "./galton-sim";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("GaltonSim ", () => {
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
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("starts no RAF before explicit Play and cleans up the started loop", () => {
    const rafSpy = vi.spyOn(window, "requestAnimationFrame");
    const cafSpy = vi.spyOn(window, "cancelAnimationFrame");

    const { unmount } = render(
      <StrictMode>
        <GaltonSim />
      </StrictMode>,
    );

    expect(rafSpy).not.toHaveBeenCalled();
    expect(cafSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(rafSpy).toHaveBeenCalledTimes(1);
    const requestedId = rafSpy.mock.results[0]?.value;

    unmount();

    expect(cafSpy).toHaveBeenCalledTimes(1);
    expect(cafSpy).toHaveBeenCalledWith(requestedId);
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
