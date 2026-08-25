import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { ShadowDeployment } from "./shadow-deployment";

afterEach(() => {
  cleanup();
});

describe("ShadowDeployment ", () => {
  it("renders exclusively via table/no SVG canvas — no canvas element in the DOM", () => {
    const { container } = render(<ShadowDeployment />);
    expect(container.querySelector("canvas")).toBeNull();
    expect(
      screen.getByRole("region", { name: "Shadow deployment comparison" }),
    ).toHaveAttribute("tabindex", "0");
    expect(
      container.querySelector("[data-shadow-deployment-controls]"),
    ).toHaveStyle({ flex: "0 1 210px", maxWidth: "100%", minWidth: "0" });
  });

  it("renders the real panel copy and strategy buttons", () => {
    render(<ShadowDeployment />);
    expect(screen.getByText("Shadow & canary deployment")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Shadow deploy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Canary deploy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Blue-green" }),
    ).toBeInTheDocument();
  });

  it("reproduces the same seeded predictions on first paint (makePredictions seed 42, not Math.random)", () => {
    const { container: a } = render(<ShadowDeployment />);
    const first = a.querySelector("table")?.outerHTML;
    cleanup();
    const { container: b } = render(<ShadowDeployment />);
    const second = b.querySelector("table")?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });

  it("dragging the shift slider updates the synthetic v2 shift", () => {
    render(<ShadowDeployment />);
    const slider = screen.getByLabelText("Synthetic v2 shift percent");
    fireEvent.change(slider, { target: { value: "50" } });
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("switching strategy shows that strategy's description", () => {
    render(<ShadowDeployment />);
    fireEvent.click(screen.getByRole("button", { name: "Canary deploy" }));
    expect(
      screen.getByText(/A defined subset of eligible live traffic uses v2/),
    ).toBeInTheDocument();
  });
});
