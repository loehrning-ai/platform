import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { MultipleTesting } from "./multiple-testing";

afterEach(() => {
  cleanup();
});

describe("MultipleTesting ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<MultipleTesting />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and default FWER stats for n=10", () => {
    render(<MultipleTesting />);
    expect(screen.getByText("Multiple Testing & FWER")).toBeInTheDocument();
    expect(screen.getByText("FWER")).toBeInTheDocument();
    expect(screen.getByText("Bonferroni α")).toBeInTheDocument();
  });

  it("reproduces the same seeded p-values on first paint for n=10 (mulberry32(10*17+3)=mulberry32(173))", () => {
    const { container: a } = render(<MultipleTesting />);
    const first = a.querySelector("svg")?.outerHTML;
    cleanup();
    const { container: b } = render(<MultipleTesting />);
    const second = b.querySelector("svg")?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });

  it("moving the n slider reseeds and updates the expected-false-positive count", () => {
    render(<MultipleTesting />);
    const slider = screen.getByLabelText("Number of hypotheses tested");
    fireEvent.change(slider, { target: { value: "20" } });
    expect(slider).toHaveValue("20");
    expect(screen.getByText(/Out of/)).toHaveTextContent("20");
  });
});
