import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ConveyorSim } from "./conveyor-sim";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ConveyorSim ", () => {
  it("renders in beginner mode by default, hiding the late-drawer and late-% slider", () => {
    render(<ConveyorSim />);
    expect(screen.getByText("Beginner mode")).toBeInTheDocument();
    expect(screen.queryByText("LATE DRAWER")).not.toBeInTheDocument();
    expect(screen.getByText(/Dedup by/)).toBeInTheDocument();
  });

  it("reveals the late-drawer and late-gate guard when beginner mode is switched off", () => {
    render(<ConveyorSim />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Beginner mode/ }));
    expect(screen.getByText("LATE DRAWER")).toBeInTheDocument();
    expect(screen.getByText("Drop late (past watermark)")).toBeInTheDocument();
  });

  it("starts no RAF before explicit Start, then pauses and resets", () => {
    const rafSpy = vi.spyOn(window, "requestAnimationFrame");
    render(<ConveyorSim />);

    expect(rafSpy).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Start/ }));
    expect(rafSpy).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /Pause/ }));
    expect(screen.getByRole("button", { name: /Start/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Reset/ }));
    expect(screen.getByText("ledger empty")).toBeInTheDocument();
  });

  it("toggles the dedup guard off", () => {
    render(<ConveyorSim />);
    const dedupCheckbox = screen.getByRole("checkbox", { name: /Dedup by/ });
    fireEvent.click(dedupCheckbox);
    expect(screen.getByText("dedup · OFF")).toBeInTheDocument();
  });
});
