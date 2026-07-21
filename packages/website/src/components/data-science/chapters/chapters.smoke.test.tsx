import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getDsChapterMeta } from "@/lib/data-science/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import Ch01Fundamentals from "./ch01-fundamentals";
import Ch06Evaluate from "./ch06-evaluate";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("data-science chapter components render with real ported content, not placeholders (plan 012 stage 6)", () => {
  it("Ch01Fundamentals renders the real hero, DS-loop stages, and GaltonSim", () => {
    render(<Ch01Fundamentals chapter={getDsChapterMeta("fund")} />);
    expect(screen.getByText("turns noise")).toBeInTheDocument();
    expect(screen.getByText("Galton Board · Sampling Distribution")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("Evaluate")).toBeInTheDocument();
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
  });

  it("Ch06Evaluate renders the real hero, confusion-matrix section, and ThresholdSim", () => {
    render(<Ch06Evaluate chapter={getDsChapterMeta("eval")} />);
    expect(screen.getByText(/pick the model/)).toBeInTheDocument();
    expect(screen.getByText("Threshold · confusion · ROC")).toBeInTheDocument();
    expect(screen.getByText(/PR-AUC/)).toBeInTheDocument();
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
  });
});
