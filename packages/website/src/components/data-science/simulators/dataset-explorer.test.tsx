import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { DatasetExplorer } from "./dataset-explorer";

afterEach(() => {
  cleanup();
});

describe("DatasetExplorer (plan 012 stage 11)", () => {
  it("renders exclusively via SVG — no canvas element in the DOM", () => {
    const { container } = render(<DatasetExplorer />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy defaulting to raw (no) sampling", () => {
    render(<DatasetExplorer />);
    expect(screen.getByText("Dataset explorer — class imbalance")).toBeInTheDocument();
    expect(screen.getByText(/Predict all-legit/)).toBeInTheDocument();
    expect(screen.getAllByText(/99.83% accuracy/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Catches/)).toBeInTheDocument();
    expect(screen.getByText(/0 of 492 frauds/)).toBeInTheDocument();
  });

  it("switching to SMOTE shows its own explanation", () => {
    render(<DatasetExplorer />);
    fireEvent.click(screen.getByText("SMOTE (oversample)"));
    expect(screen.getByText(/Synthetic Minority Oversampling/)).toBeInTheDocument();
  });

  it("switching to undersampling shows its own explanation", () => {
    render(<DatasetExplorer />);
    fireEvent.click(screen.getByText("Undersampling"));
    expect(screen.getByText(/discards 99.8% of your legitimate transaction data/)).toBeInTheDocument();
  });
});
