import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { CorrelationMatrix } from "./correlation-matrix";

afterEach(() => cleanup());

describe("CorrelationMatrix ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<CorrelationMatrix />);
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and all 4 variable labels", () => {
    render(<CorrelationMatrix />);
    expect(screen.getByText("Correlation Matrix")).toBeInTheDocument();
    expect(screen.getAllByText("Age").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Income").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Score").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Satisf.").length).toBeGreaterThan(0);
  });

  it("dragging the noise slider updates the displayed noise value", () => {
    render(<CorrelationMatrix />);
    const slider = screen.getByLabelText("Noise level");
    fireEvent.change(slider, { target: { value: "0.5" } });
    expect(screen.getByText("0.5")).toBeInTheDocument();
  });

  it("reproduces the same seeded matrix for the same noise level (mulberry32, not Math.random)", () => {
    const { container: a } = render(<CorrelationMatrix />);
    const first = a.querySelectorAll(".plot-wrap svg")[0]?.outerHTML;
    cleanup();
    const { container: b } = render(<CorrelationMatrix />);
    const second = b.querySelectorAll(".plot-wrap svg")[0]?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });
});
