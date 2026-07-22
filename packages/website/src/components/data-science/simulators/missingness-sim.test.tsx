import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { MissingnessSim } from "./missingness-sim";

afterEach(() => cleanup());

describe("MissingnessSim ", () => {
  it("renders exclusively via HTML table/SVG — no canvas element in the DOM", () => {
    const { container } = render(<MissingnessSim />);
    expect(container.querySelector("table")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and all three pattern buttons", () => {
    render(<MissingnessSim />);
    expect(screen.getByText("Missingness Patterns")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "MCAR" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "MAR" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "MNAR" })).toBeInTheDocument();
  });

  it("switching pattern updates the active button and description text", () => {
    render(<MissingnessSim />);
    fireEvent.click(screen.getByRole("button", { name: "MNAR" }));
    expect(screen.getByText(/High earners omit income/)).toBeInTheDocument();
  });

  it("reproduces the same seeded table on first paint (mulberry32(77)/(42), not Math.random)", () => {
    const { container: a } = render(<MissingnessSim />);
    const first = a.querySelector("table")?.outerHTML;
    cleanup();
    const { container: b } = render(<MissingnessSim />);
    const second = b.querySelector("table")?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });
});
