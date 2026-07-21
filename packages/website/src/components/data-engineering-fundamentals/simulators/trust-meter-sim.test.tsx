import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { TrustMeterSim } from "./trust-meter-sim";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("TrustMeterSim (plan 011 stage 7)", () => {
  it("defaults to a trusted 100/100 score with all 4 checks on", () => {
    const { container } = render(<TrustMeterSim />);
    expect(container.querySelector(".tm-score-big")?.textContent).toContain("100");
    expect(screen.getByText("trusted")).toBeInTheDocument();
  });

  it("unchecking a check lowers the score and can flip the verdict", () => {
    const { container } = render(<TrustMeterSim />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Row-count band/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Schema check/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Freshness/ }));
    expect(container.querySelector(".tm-score-big")?.textContent).toContain("22");
    expect(screen.getByText("untrusted")).toBeInTheDocument();
  });

  it("selecting a corruption to inject updates the panel meta", () => {
    render(<TrustMeterSim />);
    fireEvent.click(screen.getByRole("button", { name: /half-write/ }));
    expect(screen.getByText(/corruption: half-write/)).toBeInTheDocument();
  });
});
