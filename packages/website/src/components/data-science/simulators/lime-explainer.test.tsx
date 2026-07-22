import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { LIMEExplainer } from "./lime-explainer";

afterEach(() => {
  cleanup();
});

describe("LIMEExplainer ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<LIMEExplainer />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and query-point sliders", () => {
    render(<LIMEExplainer />);
    expect(screen.getByText("LIME · local linear explanation")).toBeInTheDocument();
    expect(screen.getByLabelText("Query point X")).toBeInTheDocument();
    expect(screen.getByLabelText("Query point Y")).toBeInTheDocument();
  });

  it("reproduces the same seeded decision boundary on first paint (mulberry32(42), not Math.random)", () => {
    const { container: a } = render(<LIMEExplainer />);
    const first = a.querySelector("svg")?.outerHTML;
    cleanup();
    const { container: b } = render(<LIMEExplainer />);
    const second = b.querySelector("svg")?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });
});
