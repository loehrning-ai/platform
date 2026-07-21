import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { FeatureSelectionSim } from "./feature-selection-sim";

afterEach(() => {
  cleanup();
});

describe("FeatureSelectionSim ", () => {
  it("renders exclusively via plain markup — no canvas element in the DOM", () => {
    const { container } = render(<FeatureSelectionSim />);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the real panel copy and all 8 features, defaulting to correlation filter", () => {
    render(<FeatureSelectionSim />);
    expect(screen.getByText("Feature selection methods")).toBeInTheDocument();
    expect(screen.getByText("user_age")).toBeInTheDocument();
    expect(screen.getByText("random_noise_1")).toBeInTheDocument();
    expect(screen.getByText("5/8 features kept")).toBeInTheDocument();
  });

  it("switching to mutual information shows the drop count for that method", () => {
    render(<FeatureSelectionSim />);
    fireEvent.click(screen.getByRole("button", { name: "Mutual Information" }));
    // page_views(0.76), ad_relevance(0.72), device_type(0.49), time_of_day(0.61), user_age(0.68), session_dur(0.81) > 0.1; noise1(0.06)/noise2(0.03) <= 0.1 → 6/8
    expect(screen.getByText("6/8 features kept")).toBeInTheDocument();
  });

  it("switching to LASSO shows the correlation-filter callout only on the corr view", () => {
    render(<FeatureSelectionSim />);
    expect(screen.getByText(/page_views dropped/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "LASSO" }));
    expect(screen.queryByText(/page_views dropped/)).not.toBeInTheDocument();
  });
});
