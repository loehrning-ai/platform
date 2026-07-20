import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExternalBenchmarkStrip } from "./external-benchmark-strip";
import { benchmarksByIds } from "@/lib/external-benchmarks";

describe("<ExternalBenchmarkStrip>", () => {
  it("renders every item's value, plain, publisher, year", () => {
    const items = benchmarksByIds([
      "bitkom_2026_adoption",
      "gartner_2025_ai_fail",
      "bcg_2025_no_value",
    ]);
    render(<ExternalBenchmarkStrip items={items} />);

    expect(screen.getByText("41 %")).toBeInTheDocument();
    expect(screen.getByText("60 %")).toBeInTheDocument();
    expect(screen.getByText("74 %")).toBeInTheDocument();

    expect(screen.getByText(/Bitkom Research · 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Gartner · 2025/)).toBeInTheDocument();
    expect(screen.getByText(/BCG · 2025/)).toBeInTheDocument();
  });

  it("renders default kicker when none is provided", () => {
    const items = benchmarksByIds(["bitkom_2026_adoption"]);
    render(<ExternalBenchmarkStrip items={items} />);
    expect(
      screen.getByText(/Was unabhängige Studien dazu sagen/),
    ).toBeInTheDocument();
  });

  it("renders custom kicker", () => {
    const items = benchmarksByIds(["bitkom_2026_adoption"]);
    render(
      <ExternalBenchmarkStrip items={items} kicker="Markt im Überblick" />,
    );
    expect(screen.getByText("Markt im Überblick")).toBeInTheDocument();
  });

  it("includes sample size when provided", () => {
    const items = benchmarksByIds(["bitkom_2026_adoption"]);
    render(<ExternalBenchmarkStrip items={items} />);
    expect(screen.getByText(/N = 604/)).toBeInTheDocument();
  });
});
