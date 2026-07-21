import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { PermissionGateSim } from "./permission-gate-sim";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("PermissionGateSim (plan 011 stage 8)", () => {
  it("renders all 5 columns with the 3 PII columns flagged as needing an actor", () => {
    render(<PermissionGateSim />);
    expect(screen.getByText("employee_email")).toBeInTheDocument();
    expect(screen.getAllByText(/needs/).length).toBe(3);
  });

  it("blocks the ship when PII columns are unannotated", async () => {
    render(<PermissionGateSim />);
    fireEvent.click(screen.getByRole("button", { name: /Ship dbt/ }));
    await waitFor(() => expect(screen.getByText(/deploy aborted/)).toBeInTheDocument(), { timeout: 3000 });
  }, 6000);

  it("autofix assigns every required actor and ships cleanly", async () => {
    render(<PermissionGateSim />);
    fireEvent.click(screen.getByRole("button", { name: /Autofix/ }));
    // 3 assigned columns + 1 chip-rail label for the same actor.
    expect(screen.getAllByText("PII_Person").length).toBe(4);
    fireEvent.click(screen.getByRole("button", { name: /Ship dbt/ }));
    await waitFor(() => expect(screen.getByText(/dbt v238 is live/)).toBeInTheDocument(), { timeout: 3000 });
  }, 6000);

  it("resets assignments and console", () => {
    render(<PermissionGateSim />);
    fireEvent.click(screen.getByRole("button", { name: /Autofix/ }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getAllByText(/needs/).length).toBe(3);
  });
});
