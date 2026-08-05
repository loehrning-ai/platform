import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { LineageCamera } from "./lineage-camera";

afterEach(cleanup);

describe("LineageCamera ", () => {
  it("defaults the focus to fct_events", () => {
    render(<LineageCamera />);
    expect(screen.getByText("Lineage of fct_events")).toBeInTheDocument();
  });

  it("re-focuses the camera when a different node is clicked", () => {
    render(<LineageCamera />);
    const node = screen.getByRole("button", {
      name: "Focus lineage on dim_users",
    });
    fireEvent.keyDown(node, { key: "Enter" });
    expect(node).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Lineage of dim_users")).toBeInTheDocument();
  });

  it("renders all 8 nodes", () => {
    render(<LineageCamera />);
    for (const name of ["raw_scans", "raw_accounts", "raw_pageviews", "fct_events", "dim_users", "conversion_rate", "dau_7d", "weekly_exec_dash"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });
});
