import { StrictMode } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";
import { ABSim } from "./ab-sim";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ABSim ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<ABSim />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and all controls", () => {
    render(<ABSim />);
    expect(screen.getByText("Experiment stream")).toBeInTheDocument();
    expect(
      screen.getByText(/A crossing at an interim look is not a stopping rule/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("True lift")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Baseline conversion rate"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Daily visitors")).toBeInTheDocument();
    expect(screen.getByLabelText("Simulation speed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Play/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reset/ })).toBeInTheDocument();
    expect(screen.getByText("CONTROL")).toBeInTheDocument();
    expect(screen.getByText("VARIANT")).toBeInTheDocument();
  });

  it("starts no RAF before explicit Play and cleans up the started loop", () => {
    const rafSpy = vi.spyOn(window, "requestAnimationFrame");
    const cafSpy = vi.spyOn(window, "cancelAnimationFrame");

    const { unmount } = render(
      <StrictMode>
        <ABSim />
      </StrictMode>,
    );

    expect(rafSpy).not.toHaveBeenCalled();
    expect(cafSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Play/ }));
    expect(rafSpy).toHaveBeenCalledTimes(1);
    const requestedId = rafSpy.mock.results[0]?.value;

    unmount();

    expect(cafSpy).toHaveBeenCalledTimes(1);
    expect(cafSpy).toHaveBeenCalledWith(requestedId);
  });
});
