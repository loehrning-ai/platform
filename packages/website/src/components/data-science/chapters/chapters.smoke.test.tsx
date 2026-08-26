import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import Ch01Fundamentals from "./ch01-fundamentals";
import Ch06Evaluate from "./ch06-evaluate";
import ChOverview from "./ch-overview";
import Ch02Explore from "./ch02-explore";
import Ch03Clean from "./ch03-clean";
import Ch04Feature from "./ch04-feature";
import Ch05Model from "./ch05-model";
import Ch07Interpret from "./ch07-interpret";
import Ch08Experiment from "./ch08-experiment";
import Ch09Causal from "./ch09-causal";
import Ch10Peeking from "./ch10-peeking";
import Ch11Deploy from "./ch11-deploy";
import Ch12Capstone from "./ch12-capstone";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("data-science chapter components render with real ported content, not placeholders ", () => {
  it("Ch01Fundamentals renders the real hero, DS-loop stages, and GaltonSim", () => {
    render(<Ch01Fundamentals />);
    expect(screen.getByText("turns noise")).toBeInTheDocument();
    expect(
      screen.getByText("Galton Board · Sampling Distribution"),
    ).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("Evaluate")).toBeInTheDocument();
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
  });

  it("Ch06Evaluate renders the real hero, confusion-matrix section, and ThresholdSim", () => {
    render(<Ch06Evaluate />);
    expect(screen.getByText(/pick the model/)).toBeInTheDocument();
    expect(screen.getByText("Threshold · confusion · ROC")).toBeInTheDocument();
    expect(screen.getByText(/PR-AUC/)).toBeInTheDocument();
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
  });
});

describe("data-science chapter components render with real ported content, not placeholders ", () => {
  it("ChOverview renders the real hero copy, all 12 curriculum cards, and reserves the FlowingPipeline", () => {
    const { container } = render(<ChOverview />);
    expect(screen.getByText(/turning data into decisions/)).toBeInTheDocument();
    expect(screen.getByText("Capstone")).toBeInTheDocument();
    expect(screen.getByText("Fundamentals")).toBeInTheDocument();
    expect(screen.getAllByText(/Data/).length).toBeGreaterThan(0);
    expect(container.querySelector(".ov-loop-placeholder")).not.toBeNull();
  });

  it("Ch02Explore renders the real hero, all 3 simulators, and the takeaways", () => {
    render(<Ch02Explore />);
    expect(screen.getByText(/look before you leap/)).toBeInTheDocument();
    expect(screen.getByText("Distribution Explorer")).toBeInTheDocument();
    expect(screen.getByText("Outlier Detector")).toBeInTheDocument();
    expect(screen.getByText("Correlation Matrix")).toBeInTheDocument();
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
  });

  it("Ch03Clean renders the real hero, all 4 simulators, and the takeaways", () => {
    render(<Ch03Clean />);
    expect(screen.getByText(/what the model can learn/)).toBeInTheDocument();
    expect(screen.getByText("Missingness Patterns")).toBeInTheDocument();
    expect(screen.getByText("Imputation Race")).toBeInTheDocument();
    expect(screen.getAllByText("Feature Scaling").length).toBeGreaterThan(0);
    expect(screen.getByText("Leakage Detector")).toBeInTheDocument();
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
  });
});

describe("data-science chapter components render with real ported content, not placeholders ", () => {
  it("Ch04Feature renders the real hero and all 4 simulators", () => {
    render(<Ch04Feature />);
    expect(screen.getByText(/the model input/)).toBeInTheDocument();
    expect(
      screen.getAllByText("Categorical encoding methods").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Polynomial feature expansion").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Feature selection methods").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Interaction terms: A×B vs A+B").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
  });

  it("Ch05Model renders the real hero and BiasVarianceSim", () => {
    render(<Ch05Model />);
    expect(screen.getAllByText(/bias and variance/).length).toBeGreaterThan(0);
    expect(
      screen.getByLabelText("Model complexity (polynomial degree)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
  });
});

describe("data-science chapter components render with real ported content, not placeholders ", () => {
  it("Ch07Interpret renders the real hero and all 4 simulators", () => {
    render(<Ch07Interpret />);
    expect(screen.getByText("specific questions.")).toBeInTheDocument();
    expect(
      screen.getAllByText("SHAP waterfall · loan approval").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("LIME · local linear explanation").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Permutation importance").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Global vs local explanations").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
  });

  it("Ch08Experiment renders the real hero and ABSim", () => {
    render(<Ch08Experiment />);
    expect(screen.getByText(/Interpret it/)).toBeInTheDocument();
    expect(screen.getAllByText("Experiment stream").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("True lift")).toBeInTheDocument();
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
  });
});

describe("data-science chapter components render with real ported content, not placeholders ", () => {
  it("Ch09Causal renders the real hero and all 5 simulators", () => {
    render(<Ch09Causal />);
    expect(screen.getByText(/hypothesis/)).toBeInTheDocument();
    expect(
      screen.getAllByText("Confounding · the lurking variable").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("DAG patterns · should you adjust for Z?").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("DAGs · the three patterns").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Difference-in-Differences").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Instrumental Variables").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
  });

  it("Ch10Peeking renders the real hero and all 4 simulators", () => {
    render(<Ch10Peeking />);
    expect(screen.getAllByText(/lie/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Peeking False-Positive Inflator").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Multiple Testing & FWER").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("CUPED, Variance Reduction via Covariates").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Statistical Power").length).toBeGreaterThan(0);
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
  });
});

describe("data-science chapter components render with real ported content, not placeholders ", () => {
  it("Ch11Deploy renders the real hero and all 4 simulators", () => {
    render(<Ch11Deploy />);
    expect(screen.getByText("maintained system.")).toBeInTheDocument();
    expect(
      screen.getAllByText("Model serving architecture").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Drift simulator").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Shadow & canary deployment").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Feature store & training-serving skew").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
  });

  it("Ch12Capstone renders the real hero, all 4 simulators, and the closing CTA", () => {
    render(<Ch12Capstone />);
    expect(screen.getByText(/the full DS loop/)).toBeInTheDocument();
    expect(
      screen.getAllByText("Dataset explorer, class imbalance").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("ML pipeline, step-by-step").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Precision-recall tradeoff").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Production readiness checklist").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
    expect(screen.getByText("You've reached the end.")).toBeInTheDocument();
  });
});
