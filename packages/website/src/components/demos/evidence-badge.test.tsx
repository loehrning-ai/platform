/**
 * evidence-badge.test.tsx (regression coverage)
 *
 * EvidenceBadge renders the evidence line in a demo engine's header: the mode
 * and the optional external-action label as one plain phrase, the optional
 * invented-data note, and a last "Was heißt das?" disclosure button whose
 * explanation toggles open/closed. SimulationDisclosure wraps arbitrary children in an
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
    "states the %s mode as plain text and reveals/hides its explanation",
    (mode, label, detailsFragment) => {
      const { container } = render(
        <EvidenceBadge evidenceMode={mode} externalActionMode="simulated" />,
      );

      // The line reads "Label · Aktionen simuliert" with no control glyph
      // between mode and action, so a minus can never pose as a dash.
      const line = container.querySelector("[data-evidence-line]");
      const phrase = line?.querySelector(`[data-evidence-mode="${mode}"]`);
      expect(phrase).toHaveTextContent(`${label}· Aktionen simuliert`);
      expect(phrase?.querySelector("button, [data-disclosure-glyph]")).toBeNull();

      // The disclosure is the last item, with a visible label that starts
      // its accessible name (label in name) and names the mode.
      const button = screen.getByRole("button", {
        name: `Was heißt das? Ausführung: ${label}`,
      });
      expect(line?.lastElementChild).toBe(button);
      expect(button).toHaveTextContent(/^Was heißt das\?$/);
      // Square text control: 44px target, sentence case, ink text.
      expect(button).toHaveClass("min-h-11", "text-foreground");
      expect(button.className).not.toMatch(/uppercase|rounded/);
      // Collapsed by default; the controlled region exists but is hidden.
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(container.querySelector("[data-evidence-details]")).toBeNull();
      const controlled = container.querySelector(
        `[id="${button.getAttribute("aria-controls")}"]`,
      );
      expect(controlled).not.toBeVisible();

      // Open -> the explanation appears and is wired to the button.
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");
      const details = container.querySelector("[data-evidence-details]");
      expect(details).toHaveTextContent(detailsFragment);
      expect(details).toBeVisible();
      expect(button).toHaveAttribute("aria-controls", details?.id);

      // Toggle closed again.
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(container.querySelector("[data-evidence-details]")).toBeNull();
    },
  );

  it("names the disclosure in English on the English page", () => {
    render(
      <EvidenceBadge
        evidenceMode="recorded_trace"
        externalActionMode="none"
        locale="en"
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "What this means. Execution: Recorded trace",
      }),
    ).toHaveTextContent(/^What this means$/);
  });

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
