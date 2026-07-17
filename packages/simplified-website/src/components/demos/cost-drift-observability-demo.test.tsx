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
 * four app costs, the co-located simulation disclosure, and the click-driven app
 * selector that swaps the detail panel metrics.
 *
 * The randomized latency series only feeds an aria-hidden SVG, so it is not
 * asserted here.
 */

describe("<CostDriftObservabilityDemo>", () => {
  it("renders the header, simulation disclosure, aggregate spend KPI, and the default app detail", () => {
    render(<CostDriftObservabilityDemo />);

    expect(screen.getByText("Observability & Kosten")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "LLM-Kosten und Drift",
    );

    // The inline simulation disclosure (distinct from the SEED-SZENARIO note,
    // which has a different accessible name).
    const disclosure = screen.getByRole("note", { name: "Hinweis zur Simulation" });
    expect(disclosure).toHaveTextContent(/keine Live-Messwerte/);

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
    expect(screen.getByRole("button", { name: /Memo-Pipeline/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Anfrage-Klassifikation/ }),
    ).toBeInTheDocument();

    // Default selection is the first app; the detail panel shows its 2-decimal
    // cost and its latency (both unique to the detail panel).
    expect(screen.getByText("€186.42")).toBeInTheDocument();
    expect(screen.getByText("1.2 s")).toBeInTheDocument();
  });

  it("swaps the detail panel metrics when a different app is selected", () => {
    render(<CostDriftObservabilityDemo />);

    // Precondition: the first app's detail figures are on screen.
    expect(screen.getByText("€186.42")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Rechnungs-Extraktion/ }));

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
});
