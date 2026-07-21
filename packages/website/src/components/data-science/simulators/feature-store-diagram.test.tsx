import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { FeatureStoreDiagram } from "./feature-store-diagram";

afterEach(() => {
  cleanup();
});

describe("FeatureStoreDiagram (plan 012 stage 11)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<FeatureStoreDiagram />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy, defaulting to feature store OFF with a high skew score", () => {
    render(<FeatureStoreDiagram />);
    expect(screen.getByText("Feature store & training-serving skew")).toBeInTheDocument();
    expect(screen.getByText("OFF")).toBeInTheDocument();
    expect(screen.getByText("0.61")).toBeInTheDocument();
    expect(screen.getByText("Feature pipelines diverged.")).toBeInTheDocument();
  });

  it("toggling the feature store on lowers the skew score and updates the explanation", () => {
    render(<FeatureStoreDiagram />);
    fireEvent.click(screen.getByRole("button", { name: "OFF" }));
    expect(screen.getByText("ON")).toBeInTheDocument();
    expect(screen.getByText("0.04")).toBeInTheDocument();
    expect(screen.getByText("Same transform, same result.")).toBeInTheDocument();
  });
});
