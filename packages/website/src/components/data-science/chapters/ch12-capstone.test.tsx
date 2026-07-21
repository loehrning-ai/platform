import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import Ch12Capstone from "./ch12-capstone";

describe("Ch12Capstone ", () => {
  beforeEach(() => {
    push.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the real hero and all 4 simulators", () => {
    render(<Ch12Capstone />);
    expect(screen.getByText(/the full DS loop/)).toBeInTheDocument();
    expect(screen.getByText("Dataset explorer — class imbalance")).toBeInTheDocument();
    expect(screen.getByText("ML pipeline — step-by-step")).toBeInTheDocument();
    expect(screen.getByText("Precision–recall tradeoff")).toBeInTheDocument();
    expect(screen.getByText("Production readiness checklist")).toBeInTheDocument();
  });

  it("renders the final CTA and navigates to the course root (home) on click", () => {
    render(<Ch12Capstone />);
    expect(screen.getByText("You've reached the end.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Back to the overview/ }));
    expect(push).toHaveBeenCalledWith("/kurse/open-source/data-science");
  });
});
