import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { BackfillSim } from "./backfill-sim";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("BackfillSim (plan 011 stage 6)", () => {
  it("defaults to OVERWRITE mode with 7 pending partitions", () => {
    render(<BackfillSim />);
    expect(screen.getByRole("button", { name: /OVERWRITE/ }).className).toContain("on");
    expect(screen.getAllByText("queued")).toHaveLength(7);
  });

  it("switches to INSERT mode and updates the panel title", () => {
    render(<BackfillSim />);
    fireEvent.click(screen.getByRole("button", { name: /INSERT/ }));
    expect(screen.getByText("Backfill with INSERT (non-idempotent)")).toBeInTheDocument();
  });

  it("starts a backfill run without throwing", () => {
    render(<BackfillSim />);
    fireEvent.click(screen.getByRole("button", { name: /Run backfill/ }));
    expect(screen.getByText(/Backfill dispatched/)).toBeInTheDocument();
  });

  it("reset stays enabled while idle and keeps all 7 partitions queued", () => {
    render(<BackfillSim />);
    const resetBtn = screen.getByRole("button", { name: "Reset" });
    expect(resetBtn).toBeEnabled();
    fireEvent.click(resetBtn);
    expect(screen.getAllByText("queued")).toHaveLength(7);
  });
});
