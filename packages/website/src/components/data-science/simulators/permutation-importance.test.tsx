import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { PermutationImportance } from "./permutation-importance";

afterEach(() => {
  cleanup();
});

describe("PermutationImportance ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<PermutationImportance />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and the baseline accuracy", () => {
    render(<PermutationImportance />);
    expect(screen.getByText("Permutation importance")).toBeInTheDocument();
    expect(screen.getByText("baseline accuracy 0.847")).toBeInTheDocument();
    expect(screen.getByText("0.847")).toBeInTheDocument();
  });

  it("reproduces the same seeded results on first paint (mulberry32(seed * 31337), not Math.random)", () => {
    const { container: a } = render(<PermutationImportance />);
    const first = a.querySelector("svg")?.outerHTML;
    cleanup();
    const { container: b } = render(<PermutationImportance />);
    const second = b.querySelector("svg")?.outerHTML;
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });

  it("shuffle button toggles the running label while active", () => {
    render(<PermutationImportance />);
    const btn = screen.getByRole("button", { name: /Shuffle features/ });
    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: /Shuffling/ })).toBeDisabled();
  });
});
