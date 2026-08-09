import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { TrustMeterSim } from "./trust-meter-sim";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("TrustMeterSim ", () => {
  it("defaults to full modeled check weight with all 4 checks on", () => {
    const { container } = render(<TrustMeterSim />);
    expect(container.querySelector(".tm-score-big")?.textContent).toContain("100");
    expect(screen.getByText("all modeled categories enabled")).toBeInTheDocument();
  });

  it("unchecking a check lowers the score and can flip the verdict", () => {
    const { container } = render(<TrustMeterSim />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Row-count band/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Schema check/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Freshness/ }));
    expect(container.querySelector(".tm-score-big")?.textContent).toContain("22");
    expect(screen.getByText("few modeled categories enabled")).toBeInTheDocument();
  });

  it("selecting a corruption to inject updates the panel meta", () => {
    render(<TrustMeterSim />);
    fireEvent.click(screen.getByRole("button", { name: /partial write/ }));
    expect(screen.getByText(/corruption: partial write/)).toBeInTheDocument();
  });
});
