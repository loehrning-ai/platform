/**
 * evidence-badge.test.tsx (regression coverage)
 *
 * EvidenceBadge maps a DemoEvidenceMode to a labelled, colour-coded badge whose
 * tooltip toggles open/closed, plus an optional external-action badge driven by
 * DemoExternalActionMode, plus the always-on SIMULIERT marker. SimulationDisclosure
 * wraps arbitrary children in an accessible "note" region.
 *
 * These are pure UI units (state = the open/closed toggle, config = the two
 * lookup tables), so no mocks are needed: we assert the real labels, the real
 * tooltip copy per mode, the toggle behaviour, and the action-label mapping.
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EvidenceBadge, SimulationDisclosure } from "./evidence-badge";

describe("<EvidenceBadge> mode badge + tooltip", () => {
  it.each([
    ["synthetic", "Synthetisch", "erfundene Beispieldaten", "#9a3412"],
    ["rule_based", "Regelbasiert", "If-Else-Regeln", "#1d4ed8"],
    [
      "recorded_trace",
      "Aufgezeichnete Spur",
      "aufgezeichnete Beispielspur",
      "#4b5563",
    ],
    ["live_api", "Live-API", "tatsächliche Anfragen", "#166534"],
  ] as const)(
    "labels the %s badge with an AA-safe tone and reveals/hides its tooltip",
    (mode, label, tooltipFragment, foreground) => {
      render(<EvidenceBadge evidenceMode={mode} externalActionMode="none" />);

      const button = screen.getByRole("button", {
        name: new RegExp(`Evidenzmodus: ${label}`),
      });
      expect(button).toHaveStyle({ color: foreground });
      expect(button).toHaveStyle({ minHeight: "44px", fontSize: "12px" });
      // Collapsed by default.
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("tooltip")).toBeNull();

      // Open -> tooltip appears with this mode's explanation.
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("tooltip")).toHaveTextContent(tooltipFragment);

      // Toggle closed again.
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("tooltip")).toBeNull();
    },
  );

  it("always renders the SIMULIERT marker regardless of mode", () => {
    render(<EvidenceBadge evidenceMode="live_api" externalActionMode="none" />);
    expect(screen.getByText("SIMULIERT")).toBeInTheDocument();
  });
});

describe("<EvidenceBadge> external-action label", () => {
  it("omits the action badge when the action mode is 'none'", () => {
    render(
      <EvidenceBadge evidenceMode="synthetic" externalActionMode="none" />,
    );
    expect(screen.queryByText(/Aktionen|Freigabe-Schritt/)).toBeNull();
  });

  it.each([
    ["simulated", "Aktionen simuliert"],
    ["review_gated", "Freigabe-Schritt simuliert"],
    ["real_disabled", "Aktionen deaktiviert"],
  ] as const)("renders the '%s' action label", (mode, label) => {
    render(
      <EvidenceBadge evidenceMode="synthetic" externalActionMode={mode} />,
    );
    expect(screen.getByText(new RegExp(label))).toBeInTheDocument();
  });
});

describe("<SimulationDisclosure>", () => {
  it("wraps its children in an accessible simulation note", () => {
    render(
      <SimulationDisclosure>Alle Zahlen sind erfunden.</SimulationDisclosure>,
    );
    const note = screen.getByRole("note", { name: "Hinweis zur Simulation" });
    expect(note).toBeInTheDocument();
    expect(note).toHaveTextContent("Alle Zahlen sind erfunden.");
    expect(note).toHaveStyle({ fontSize: "12px" });
  });
});
