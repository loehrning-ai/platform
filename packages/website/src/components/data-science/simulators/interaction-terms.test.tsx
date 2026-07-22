import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { InteractionTerms } from "./interaction-terms";

afterEach(() => {
  cleanup();
});

describe("InteractionTerms ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<InteractionTerms />);
    expect(container.querySelector("canvas")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders the real panel copy and both feature sliders", () => {
    render(<InteractionTerms />);
    expect(screen.getByText("Interaction terms: A×B vs A+B")).toBeInTheDocument();
    expect(screen.getByLabelText("Feature A (user age score)")).toBeInTheDocument();
    expect(screen.getByLabelText("Feature B (ad relevance)")).toBeInTheDocument();
  });

  it("defaults A=5, B=5 with A×B=25 and A+B=10", () => {
    render(<InteractionTerms />);
    expect(screen.getAllByText("25").length).toBeGreaterThan(0);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("dragging feature A updates the multiplicative and additive values", () => {
    render(<InteractionTerms />);
    fireEvent.change(screen.getByLabelText("Feature A (user age score)"), { target: { value: "9" } });
    // A=9, B=5 → A×B=45, A+B=14
    expect(screen.getAllByText("45").length).toBeGreaterThan(0);
    expect(screen.getByText("14")).toBeInTheDocument();
  });

  it("toggling to the additive heatmap view changes the output label", () => {
    render(<InteractionTerms />);
    expect(screen.getByText(/A × B output/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "A+B" }));
    expect(screen.getByText(/A \+ B output/)).toBeInTheDocument();
  });
});
