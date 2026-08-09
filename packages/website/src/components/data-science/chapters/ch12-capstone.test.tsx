import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";

import Ch12Capstone from "./ch12-capstone";

describe("Ch12Capstone ", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the real hero and all 4 simulators", () => {
    render(<Ch12Capstone />);
    expect(screen.getByText(/the full DS loop/)).toBeInTheDocument();
    expect(
      screen.getByText("Dataset explorer, class imbalance"),
    ).toBeInTheDocument();
    expect(screen.getByText("ML pipeline, step-by-step")).toBeInTheDocument();
    expect(screen.getByText("Precision-recall tradeoff")).toBeInTheDocument();
    expect(
      screen.getByText("Production readiness checklist"),
    ).toBeInTheDocument();
  });

  it("renders the final CTA as a real link to the course root", () => {
    render(<Ch12Capstone />);
    expect(screen.getByText("You've reached the end.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to the overview/ }),
    ).toHaveAttribute("href", "/en/kurse/open-source/data-science");
  });
});
