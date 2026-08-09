import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { PostDeployChecklist } from "./post-deploy-checklist";

afterEach(() => {
  cleanup();
});

describe("PostDeployChecklist ", () => {
  it("no canvas element in the DOM", () => {
    const { container } = render(<PostDeployChecklist />);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and all 8 checklist items, starting at 0%", () => {
    render(<PostDeployChecklist />);
    expect(
      screen.getByText("Production readiness checklist"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 / 8 complete")).toBeInTheDocument();
    expect(screen.getByText("Model card written")).toBeInTheDocument();
    expect(screen.getByText("Fairness audit done")).toBeInTheDocument();
    expect(
      screen.getByText("Feature drift monitoring set up"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Champion/challenger pipeline"),
    ).toBeInTheDocument();
    expect(screen.getByText("Rollback plan documented")).toBeInTheDocument();
    expect(screen.getByText("Service objectives defined")).toBeInTheDocument();
    expect(screen.getByText("Alert thresholds set")).toBeInTheDocument();
    expect(
      screen.getByText("Pre-promotion evidence collected"),
    ).toBeInTheDocument();
  });

  it("checking an item updates the completion count and records review at 100%", () => {
    render(<PostDeployChecklist />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(8);
    for (const cb of checkboxes) fireEvent.click(cb);
    expect(screen.getByText("8 / 8 complete")).toBeInTheDocument();
    expect(screen.getByText(/review recorded\./)).toBeInTheDocument();
  });

  it("exposes an explicit keyboard-accessible details control", () => {
    render(<PostDeployChecklist />);
    const details = screen.getByRole("button", {
      name: "Show details for Model card written",
    });
    fireEvent.click(details);
    expect(details).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(
        "Document intended use, limitations, training data, and known failure modes.",
      ),
    ).toBeInTheDocument();
  });
});
