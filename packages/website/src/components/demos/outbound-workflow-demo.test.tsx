import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import OutboundWorkflowDemo from "./outbound-workflow-demo";

/**
 * outbound-workflow-demo.test.tsx (regression coverage)
 *
 * Drives the real German <OutboundWorkflowDemo>. It has the English layout:
 * four review steps, a contact picker with a score gate, the review draft and
 * the pre-send controls. It is static (no timers, no replay), shows its final
 * state on load and makes the same claims as the English page: the source is
 * an unverified sample and the page sends nothing.
 */

describe("<OutboundWorkflowDemo>", () => {
  it("renders the four review steps, the first lead and its derived recipient address", () => {
    render(<OutboundWorkflowDemo />);

    // No kicker and no slogan; one plain sr-only landmark heading.
    expect(
      screen.queryByText("Signalbasierte Nachricht · Pipeline"),
    ).toBeNull();
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveClass("sr-only");
    expect(heading).toHaveTextContent("Nachricht aus öffentlichen Signalen");
    expect(heading.querySelector("span")).toBeNull();

    // The same four steps as the English page.
    const steps = screen.getByLabelText("Ablaufschritte");
    for (const step of [
      "Beispielkontakt",
      "Quellenprüfung",
      "Entwurf",
      "Menschliche Prüfung",
    ]) {
      expect(steps).toHaveTextContent(step);
    }

    // First lead, selected on load.
    expect(
      screen.getByRole("button", { name: /Fiktivkontakt Alpha/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("412 Tage")).toBeInTheDocument();
    expect(screen.getByText("87/100")).toBeInTheDocument();
    expect(
      screen.getByText("Fiktives Einstellungssignal · 42 Mitarbeitende"),
    ).toBeInTheDocument();

    // All demo addresses use IANA-reserved example domains.
    expect(
      screen.getByText(/kontakt-alpha@fiktivwerk\.example/),
    ).toBeInTheDocument();
  });

  it("states the same facts as the English page: unverified source, nothing sent", () => {
    const { container } = render(<OutboundWorkflowDemo />);

    expect(
      screen.getByText(
        "247 Beispiel-Tokens · Label Sonnet 4.6 · Quelle: ungeprüftes Beispiel",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/diese Seite kann keine E-Mail senden/),
    ).toBeInTheDocument();
    expect(screen.getByText("Qualifiziert, nicht gesendet")).toBeInTheDocument();
    // No invented send time, DKIM step, trace timestamp or verified-source claim.
    for (const claim of [
      /Versand simuliert/,
      /DKIM/,
      /touched_at/,
      /Quelle geprüft/,
      /Intent-Score/,
    ]) {
      expect(container.textContent ?? "").not.toMatch(claim);
    }
  });

  it("shows the draft and the collapsed pre-send checklist on load", () => {
    render(<OutboundWorkflowDemo />);

    expect(
      screen.getByText(/Das ist ein Entwurf zur Prüfung durch einen Menschen/),
    ).toBeInTheDocument();

    const toggle = screen.getByRole("button", {
      name: "Was fehlt vor einem echten Versand?",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/Rechtliche Grundlage/)).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Rechtliche Grundlage/)).toBeInTheDocument();
    expect(screen.getByText(/Opt-out-Mechanismus/)).toBeInTheDocument();
    expect(screen.getByText(/Menschliche Freigabe/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Verbergen" }),
    ).toBeInTheDocument();
  });

  it("holds the draft once the score threshold exceeds every lead's score", () => {
    render(<OutboundWorkflowDemo />);

    const slider = screen.getByRole("slider", {
      name: "Minimale Score-Schwelle für den Versand",
    });
    fireEvent.change(slider, { target: { value: "95" } });

    expect(
      screen.getByText("Angehalten: unter der Schwelle"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Qualifiziert, nicht gesendet"),
    ).not.toBeInTheDocument();
  });

  it("switches the address and the draft when another contact is picked", () => {
    render(<OutboundWorkflowDemo />);

    fireEvent.click(screen.getByRole("button", { name: /Fiktivkontakt Beta/ }));

    expect(
      screen.getByRole("button", { name: /Fiktivkontakt Beta/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /Fiktivkontakt Alpha/ }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByText(/kontakt-beta@fiktivwerk\.example/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Kundendienst-Entlastung: Kurze Rückfrage"),
    ).toBeInTheDocument();
  });

  it("keeps both mobile grid panels inside the demo shell", () => {
    const { container } = render(<OutboundWorkflowDemo />);
    const root = container.querySelector<HTMLElement>(
      '[data-demo-id="outbound-workflow"]',
    );
    const body = container.querySelector<HTMLElement>("[data-outbound-body]");

    expect(root).toHaveStyle({ width: "100%", minWidth: "0" });
    expect(body).toHaveStyle({ minWidth: "0" });
    expect(body?.children).toHaveLength(2);
    for (const panel of Array.from(body?.children ?? [])) {
      expect(panel).toHaveStyle({ minWidth: "0" });
    }
  });
});
