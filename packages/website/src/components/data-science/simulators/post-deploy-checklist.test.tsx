import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { PostDeployChecklist } from "./post-deploy-checklist";

afterEach(() => {
  cleanup();
});

describe("PostDeployChecklist (plan 012 stage 11)", () => {
  it("no canvas element in the DOM", () => {
    const { container } = render(<PostDeployChecklist />);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and all 8 checklist items, starting at 0%", () => {
    render(<PostDeployChecklist />);
    expect(screen.getByText("Production readiness checklist")).toBeInTheDocument();
    expect(screen.getByText("0 / 8 complete")).toBeInTheDocument();
    expect(screen.getByText("Model card written")).toBeInTheDocument();
    expect(screen.getByText("Fairness audit done")).toBeInTheDocument();
    expect(screen.getByText("Feature drift monitoring set up")).toBeInTheDocument();
    expect(screen.getByText("Champion/challenger pipeline")).toBeInTheDocument();
    expect(screen.getByText("Rollback plan documented")).toBeInTheDocument();
    expect(screen.getByText("SLA defined")).toBeInTheDocument();
    expect(screen.getByText("Alert thresholds set")).toBeInTheDocument();
    expect(screen.getByText("Shadow mode first (2 weeks)")).toBeInTheDocument();
  });

  it("checking an item updates the completion count and shows 'ship it' at 100%", () => {
    render(<PostDeployChecklist />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(8);
    for (const cb of checkboxes) fireEvent.click(cb);
    expect(screen.getByText("8 / 8 complete")).toBeInTheDocument();
    expect(screen.getByText(/ship it\./)).toBeInTheDocument();
  });

  it("clicking an item's row expands its description", () => {
    render(<PostDeployChecklist />);
    fireEvent.click(screen.getByText("Model card written"));
    expect(
      screen.getByText("Document intended use, limitations, training data, and known failure modes."),
    ).toBeInTheDocument();
  });
});
