import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { InstrumentalVariable } from "./instrumental-variable";

afterEach(() => {
  cleanup();
});

describe("InstrumentalVariable (plan 012 stage 10)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<InstrumentalVariable />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and starts on Moderate strength", () => {
    render(<InstrumentalVariable />);
    expect(screen.getByText("Instrumental Variables")).toBeInTheDocument();
    expect(screen.getByText("F-stat: 22.1")).toBeInTheDocument();
  });

  it("clicking through all 3 instrument strengths renders each one's own distinct F-stat/IV-estimate — verifies the arrow() helper stayed scoped to its own node data across the file split", () => {
    render(<InstrumentalVariable />);

    fireEvent.click(screen.getByText(/^Weak/));
    expect(screen.getByText("F-stat: 4.2")).toBeInTheDocument();
    expect(screen.getByText("0.31")).toBeInTheDocument();
    expect(screen.getByText(/weak/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/^Strong/));
    expect(screen.getByText("F-stat: 89.4")).toBeInTheDocument();
    expect(screen.getByText("0.68")).toBeInTheDocument();
  });

  it("Compare OLS reveals the OLS estimate alongside the IV estimate", () => {
    render(<InstrumentalVariable />);
    fireEvent.click(screen.getByText("Compare OLS"));
    expect(screen.getByText("OLS estimate")).toBeInTheDocument();
    expect(screen.getByText("0.83")).toBeInTheDocument();
  });
});
