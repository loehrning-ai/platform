import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { DatasetExplorer } from "./dataset-explorer";

afterEach(() => {
  cleanup();
});

describe("DatasetExplorer ", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<DatasetExplorer />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy defaulting to raw (no) sampling", () => {
    render(<DatasetExplorer />);
    expect(
      screen.getByText("Dataset explorer, class imbalance"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Predict all-legit/)).toBeInTheDocument();
    expect(screen.getAllByText(/99.83% accuracy/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Catches/)).toBeInTheDocument();
    expect(screen.getByText(/0 of 492 frauds/)).toBeInTheDocument();
    const group = screen.getByRole("group", { name: "Sampling strategy" });
    const raw = screen.getByRole("button", { name: "None (raw)" });
    expect(group).toContainElement(raw);
    expect(raw).toHaveAttribute("aria-pressed", "true");
    expect(raw).toHaveStyle({ minHeight: "44px" });
  });

  it("switching to SMOTE shows its own explanation", () => {
    render(<DatasetExplorer />);
    const smote = screen.getByRole("button", { name: "SMOTE (oversample)" });
    fireEvent.click(smote);
    expect(smote).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "None (raw)" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(
      screen.getByText(/Synthetic Minority Oversampling/),
    ).toBeInTheDocument();
  });

  it("switching to undersampling shows its own explanation", () => {
    render(<DatasetExplorer />);
    fireEvent.click(screen.getByText("Undersampling"));
    expect(
      screen.getByText(/discards 99.8% of your legitimate transaction data/),
    ).toBeInTheDocument();
  });
});
