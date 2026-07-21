import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { ShadowDeployment } from "./shadow-deployment";

afterEach(() => {
  cleanup();
});

describe("ShadowDeployment (plan 012 stage 11)", () => {
  it("renders exclusively via table/no SVG canvas — no canvas element in the DOM", () => {
    const { container } = render(<ShadowDeployment />);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and strategy buttons", () => {
    render(<ShadowDeployment />);
    expect(screen.getByText("Shadow & canary deployment")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Shadow deploy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Canary deploy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Blue-green" })).toBeInTheDocument();
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

  it("dragging the traffic slider updates the v2 traffic share", () => {
    render(<ShadowDeployment />);
    const slider = screen.getByLabelText("v2 traffic share percent");
    fireEvent.change(slider, { target: { value: "50" } });
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("switching strategy shows that strategy's description", () => {
    render(<ShadowDeployment />);
    fireEvent.click(screen.getByRole("button", { name: "Canary deploy" }));
    expect(screen.getByText(/A small % of live traffic hits v2/)).toBeInTheDocument();
  });
});
