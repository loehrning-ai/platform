import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CostDriftObservabilityDemo from "./cost-drift-observability-demo";

/**
 * cost-drift-observability-demo.test.tsx (regression coverage)
 *
 * Drives the real <CostDriftObservabilityDemo>. The polyfilled
 * IntersectionObserver never reports the demo in-view, so useVisibleAutoplay
 * keeps the live drift interval paused and the render stays deterministic. We
 * exercise the component's own logic: the aggregate spend KPI derived from the
 * four app costs, the chart caption that discloses the extrapolation, and the
 * click-driven app selector that swaps the detail panel metrics.
 *
 * The engine no longer renders its own SimulationDisclosure. The detail shell
 * states the mode once via EvidenceBadge, so an inline restatement here made it
 * twice, and the mode belongs stated once per detail page. What the badge
 * could NOT
 * say -- that the latency curve moves at runtime and the motion is generated
 * locally rather than streamed -- moved into the chart caption, which is
 * asserted below so the fact stays guarded.
 *
 * The randomized latency series only feeds an aria-hidden SVG, so it is not
 * asserted here.
 */

describe("<CostDriftObservabilityDemo>", () => {
  it("renders the header, chart-caption disclosure, aggregate spend KPI, and the default app detail", () => {
    render(<CostDriftObservabilityDemo />);

    expect(screen.getByText("Observability & Kosten")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "LLM-Kosten und Drift",
    );

    // The engine states the mode exactly zero times now (the detail shell's
    // EvidenceBadge owns that). What has to survive is the extrapolation
    // disclosure, which lives in the chart caption next to the moving line.
    expect(
      screen.getByText("Latenz · Seed-Kurve, fortgeschrieben zur Drift-Erklärung"),
    ).toBeInTheDocument();
    // And no inline simulation note is left to duplicate the badge.
    expect(
      screen.queryByRole("note", { name: "Hinweis zur Simulation" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();

    // Spend MTD = sum of the four app costs
    // (186.42 + 412.08 + 298.15 + 96.33 = 992.98) rounded to "993".
    expect(screen.getByText("Spend · MTD")).toBeInTheDocument();
    expect(screen.getByText("€993")).toBeInTheDocument();

    // All four apps are selectable.
    expect(
      screen.getByRole("button", { name: /Vertrags-Assistent/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Rechnungs-Extraktion/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Memo-Pipeline/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Anfrage-Klassifikation/ }),
    ).toBeInTheDocument();

    // Default selection is the first app; the detail panel shows its 2-decimal
    // cost and its latency (both unique to the detail panel).
    expect(screen.getByText("€186.42")).toBeInTheDocument();
    expect(screen.getByText("1.2 s")).toBeInTheDocument();
  });

  it("shows the log stream as paused, not live, while the update interval never starts", () => {
    render(<CostDriftObservabilityDemo />);

    // useVisibleAutoplay never reports in-view in jsdom, so the interval that
    // would flip this to "LIVE" never runs — the stream must not claim to be
    // live while frozen.
    expect(screen.getByText("Angehalten")).toBeInTheDocument();
    expect(screen.queryByText("LIVE")).not.toBeInTheDocument();
  });

  it("swaps the detail panel metrics when a different app is selected", () => {
    render(<CostDriftObservabilityDemo />);

    // Precondition: the first app's detail figures are on screen.
    expect(screen.getByText("€186.42")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Rechnungs-Extraktion/ }),
    );

    // The detail panel now reflects the selected app. The 2-decimal cost, the
    // latency, and the error rate are all unique to the detail panel (the app
    // button only shows the rounded "€412").
    expect(screen.getByText("€412.08")).toBeInTheDocument();
    expect(screen.getByText("2.8 s")).toBeInTheDocument();
    expect(screen.getByText("0.4 %")).toBeInTheDocument();

    // The previous app's detail figures are gone.
    expect(screen.queryByText("€186.42")).not.toBeInTheDocument();
    expect(screen.queryByText("1.2 s")).not.toBeInTheDocument();
  });

  it("uses bounded responsive grids for KPIs, applications, and chart metrics", () => {
    const { container } = render(<CostDriftObservabilityDemo />);
    const root = container.querySelector<HTMLElement>(
      '[data-demo-id="cost-drift-observability"]',
    );
    const kpis = container.querySelector(".demo-cdo-kpis");
    const applications = container.querySelector(".demo-cdo-apps");
    const chartMetrics = container.querySelector(".demo-cdo-chart-metrics");
    const responsiveRules = container.querySelector("style")?.textContent ?? "";

    expect(root).toHaveStyle({ width: "100%", minWidth: "0" });
    expect(kpis).toBeInTheDocument();
    expect(applications).toBeInTheDocument();
    expect(chartMetrics).toBeInTheDocument();
    expect(responsiveRules).toContain(
      ".demo-cdo-kpis {\n          grid-template-columns: repeat(2, minmax(0, 1fr));",
    );
    expect(responsiveRules).toContain(
      ".demo-cdo-apps {\n          display: grid;\n          grid-template-columns: repeat(2, minmax(0, 1fr));",
    );
    expect(responsiveRules).toContain(
      ".demo-cdo-chart-metrics {\n          grid-template-columns: repeat(2, minmax(0, 1fr));",
    );
  });
});
