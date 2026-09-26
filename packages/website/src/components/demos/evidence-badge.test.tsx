/**
 * evidence-badge.test.tsx (regression coverage)
 *
 * EvidenceBadge renders the single evidence line above a demo engine: the mode
 * as a disclosure button whose explanation toggles open/closed, an optional
 * external-action label driven by DemoExternalActionMode, and the optional
 * invented-data note. SimulationDisclosure wraps arbitrary children in an
 * accessible "note" region.
 *
 * These are pure UI units (state = the open/closed toggle, config = the two
 * lookup tables), so no mocks are needed: we assert the real labels, the real
 * explanation per mode, the toggle behaviour, and the action-label mapping.
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EvidenceBadge, SimulationDisclosure } from "./evidence-badge";

describe("<EvidenceBadge> evidence line + disclosure", () => {
  it.each([
    ["synthetic", "Synthetisch", "Alle Daten in diesem Beispiel sind erfunden"],
    ["rule_based", "Regelbasiert", "festen Regeln in deinem Browser"],
    ["recorded_trace", "Aufgezeichnete Spur", "aufgezeichneten Ablauf"],
    ["live_api", "Live-API", "würde echte Anfragen"],
  ] as const)(
    "labels the %s mode in ink and reveals/hides its explanation",
    (mode, label, detailsFragment) => {
      const { container } = render(
        <EvidenceBadge evidenceMode={mode} externalActionMode="none" />,
      );

      const button = screen.getByRole("button", {
        name: new RegExp(`Evidenzmodus: ${label}`),
      });
      // Square text control: 44px target, sentence-case label, ink text.
      expect(button).toHaveClass("min-h-11", "text-label", "text-foreground");
      expect(button.className).not.toMatch(/uppercase|rounded/);
      expect(button).toHaveTextContent(label);
      // Collapsed by default.
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(container.querySelector("[data-evidence-details]")).toBeNull();

      // Open -> the explanation appears and is wired to the button.
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");
      const details = container.querySelector("[data-evidence-details]");
      expect(details).toHaveTextContent(detailsFragment);
      expect(button).toHaveAttribute("aria-controls", details?.id);

      // Toggle closed again.
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(container.querySelector("[data-evidence-details]")).toBeNull();
    },
  );

  it("states the invented-data note once on the same line", () => {
    render(
      <EvidenceBadge
        evidenceMode="synthetic"
        externalActionMode="none"
        note="Fiktive Tabellenwerte."
      />,
    );
    expect(screen.getByText("Fiktive Tabellenwerte.")).toBeInTheDocument();
    // The old all-caps SIMULIERT stamp duplicated the mode and is gone.
    expect(screen.queryByText("SIMULIERT")).toBeNull();
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
    // Caption token (13px); no box and no left bar.
    expect(note).toHaveClass("text-caption", "text-muted-foreground");
    expect(note.getAttribute("style")).toBeNull();
  });
});
