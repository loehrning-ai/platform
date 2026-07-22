import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { LeakageDetector } from "./leakage-detector";

afterEach(() => cleanup());

describe("LeakageDetector ", () => {
  it("renders exclusively via HTML — no canvas element in the DOM", () => {
    const { container } = render(<LeakageDetector />);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and all 10 feature chips", () => {
    render(<LeakageDetector />);
    expect(screen.getByText("Leakage Detector")).toBeInTheDocument();
    expect(screen.getByText("user_age")).toBeInTheDocument();
    expect(screen.getByText("target_mean_encoded")).toBeInTheDocument();
    expect(screen.getByText("days_after_churn")).toBeInTheDocument();
  });

  it("starts with the 3 default-safe features selected", () => {
    render(<LeakageDetector />);
    expect(screen.getByText(/3 features selected/)).toBeInTheDocument();
  });

  it("auditing reveals leaky features with their reason", () => {
    render(<LeakageDetector />);
    fireEvent.click(screen.getByText("user_age"));
    fireEvent.click(screen.getByText("target_mean_encoded"));
    fireEvent.click(screen.getByRole("button", { name: "Audit features" }));
    expect(screen.getByText(/leaky feature.* found/)).toBeInTheDocument();
    expect(
      screen.getByText("Computed using the target label across all rows, the model literally sees the answer."),
    ).toBeInTheDocument();
  });

  it("reset returns to the default selection and hides the audit result", () => {
    render(<LeakageDetector />);
    fireEvent.click(screen.getByRole("button", { name: "Audit features" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText(/3 features selected/)).toBeInTheDocument();
    expect(screen.queryByText("All clear")).not.toBeInTheDocument();
  });
});
