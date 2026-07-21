import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { CumulativeSim } from "./cumulative-sim";

afterEach(cleanup);

describe("CumulativeSim (plan 011 stage 6)", () => {
  it("defaults to Day 3 with the unit-mix-up bug flagged as DRIFT", () => {
    render(<CumulativeSim />);
    expect(screen.getByText("Day 3/5")).toBeInTheDocument();
    expect(screen.getByText("DRIFT")).toBeInTheDocument();
    expect(screen.getByText("⚠ unit mix-up: points halved")).toBeInTheDocument();
  });

  it("shows CLEAN on Day 1 before the bug window starts", () => {
    render(<CumulativeSim />);
    fireEvent.click(screen.getByText("DAY 1"));
    expect(screen.getByText("CLEAN")).toBeInTheDocument();
    expect(screen.getByText("- no prior state on Day 1 -")).toBeInTheDocument();
  });

  it("patches and backfills, clearing the drift state", () => {
    render(<CumulativeSim />);
    fireEvent.click(screen.getByRole("button", { name: /Patch & backfill from Day 3/ }));
    expect(screen.getByText("CLEAN")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Backfilled from Day 3/ })).toBeDisabled();
  });
});
