import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { EncodingComparison } from "./encoding-comparison";

afterEach(() => {
  cleanup();
});

describe("EncodingComparison ", () => {
  it("renders exclusively via a table — no canvas element in the DOM", () => {
    const { container } = render(<EncodingComparison />);
    expect(container.querySelector("canvas")).toBeNull();
    expect(container.querySelector("table")).not.toBeNull();
  });

  it("renders the real panel copy and defaults to one-hot encoding of the 5 cities", () => {
    render(<EncodingComparison />);
    expect(screen.getByText("Categorical encoding methods")).toBeInTheDocument();
    expect(screen.getByText("New York")).toBeInTheDocument();
    expect(screen.getAllByText("Berlin").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "One-Hot" })).toBeInTheDocument();
  });

  it("switching to label encoding shows the false-ordering warning", () => {
    render(<EncodingComparison />);
    fireEvent.click(screen.getByRole("button", { name: "Label" }));
    expect(screen.getByText(/Linear models will treat Berlin/)).toBeInTheDocument();
  });

  it("switching to target encoding shows the out-of-fold confirmation and correct values", () => {
    render(<EncodingComparison />);
    fireEvent.click(screen.getByRole("button", { name: "Target" }));
    expect(screen.getByText(/Computed out-of-fold/)).toBeInTheDocument();
    expect(screen.getByText("7.20")).toBeInTheDocument();
  });

  it("switching to frequency encoding shows city_freq computed from CITY_COUNTS", () => {
    render(<EncodingComparison />);
    fireEvent.click(screen.getByRole("button", { name: "Frequency" }));
    expect(screen.getByText("city_freq")).toBeInTheDocument();
    // New York: 38 / (38+22+18+12+10) = 0.38
    expect(screen.getByText("0.38")).toBeInTheDocument();
  });
});
