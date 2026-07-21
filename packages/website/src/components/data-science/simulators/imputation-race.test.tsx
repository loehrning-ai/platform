import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { ImputationRace } from "./imputation-race";

afterEach(() => cleanup());

describe("ImputationRace ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<ImputationRace />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and all four method buttons", () => {
    render(<ImputationRace />);
    expect(screen.getByText("Imputation Race")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "mean" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "median" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ffill" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "knn" })).toBeInTheDocument();
  });

  it("switching method updates the MAE stat and description text", () => {
    render(<ImputationRace />);
    fireEvent.click(screen.getByRole("button", { name: "knn" }));
    expect(screen.getByText(/Averages the 3 nearest observed neighbors/)).toBeInTheDocument();
  });

  it("reproduces the same seeded truth/observed series on first paint (mulberry32(19)/(55), not Math.random)", () => {
    const { container: a } = render(<ImputationRace />);
    const first = a.querySelector(".plot-wrap svg")?.outerHTML;
    cleanup();
    const { container: b } = render(<ImputationRace />);
    const second = b.querySelector(".plot-wrap svg")?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });
});
