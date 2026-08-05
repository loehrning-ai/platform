import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import PromptScannerDemo from "./prompt-scanner-demo";

/**
 * prompt-scanner-demo.test.tsx (regression coverage)
 *
 * The scanner is fully deterministic: every visible signal (detections,
 * worst-level verdict, hit count, detect/mask rendering) is derived synchronously
 * from the controlled textarea value via useMemo. No timers, IntersectionObserver
 * or reduced-motion hooks are involved. We type isolated inputs into the real
 * <textarea> and assert the real regex engine's output:
 *
 *  - an e-mail  -> "mask" level  -> MASKIERT verdict, "[E-MAIL]" mask
 *  - an IBAN    -> "block" level -> MARKIERT verdict, block redaction "▓▓▓▓▓▓▓"
 *  - a company  -> "review" level-> "Geschäftsgeheimnis erkannt", "[UNTERNEHMEN]"
 *  - plain text -> no hits       -> "KEINE DEMO-TREFFER", 0 Treffer
 *
 * Inputs are kept lower-case around the target token so the loose
 * "Vorname Nachname" name regex does not add extra detections.
 */

function typePrompt(value: string): void {
  fireEvent.change(screen.getByLabelText("Prompt-Eingabe"), {
    target: { value },
  });
}

describe("<PromptScannerDemo>", () => {
  it("renders the header, disclosure, mode toggle and sample buttons, scanning the default sample", () => {
    render(<PromptScannerDemo />);

    expect(screen.getByText("Compliance-Sandbox")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Prompt-Scanner",
    );
    expect(
      screen.getByRole("note", { name: "Hinweis zur Simulation" }),
    ).toHaveTextContent(/Regex-Regeln/);

    // Both scanner modes are offered; "Erkannt" (detect) is the default.
    expect(screen.getByRole("button", { name: "› Erkannt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "› Maskiert" })).toBeInTheDocument();

    // Four sample buttons (1..4); the first is active by default.
    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "4" })).toBeInTheDocument();

    // The default sample contains an IBAN, so the worst level is "block".
    expect(screen.getByText("MARKIERT")).toBeInTheDocument();
    expect(
      screen.getByText("PII-Treffer im Beispieltext: nicht ungeprüft weitergeben"),
    ).toBeInTheDocument();
  });

  it("classifies an e-mail as a maskable hit and masks it as [E-MAIL] in mask mode", () => {
    render(<PromptScannerDemo />);
    typePrompt("bitte an demo.person@example.invalid senden");

    // One mask-level detection -> MASKIERT verdict + hit count.
    expect(screen.getByText("MASKIERT")).toBeInTheDocument();
    expect(screen.getByText("Maskierte Fassung erzeugt")).toBeInTheDocument();
    expect(
      screen.getByText("1 Treffer · Beispiel-Laufzeit · lokale Regeln"),
    ).toBeInTheDocument();

    // Detect mode highlights the raw address with a type label.
    expect(screen.getByText("demo.person@example.invalid")).toBeInTheDocument();
    expect(screen.getByText("E-Mail")).toBeInTheDocument();

    // Mask mode replaces the address with the [E-MAIL] token.
    fireEvent.click(screen.getByRole("button", { name: "› Maskiert" }));
    expect(screen.getByText("[E-MAIL]")).toBeInTheDocument();
    expect(screen.queryByText("demo.person@example.invalid")).not.toBeInTheDocument();
  });

  it("classifies an IBAN as a block-level hit and redacts it under mask mode", () => {
    render(<PromptScannerDemo />);
    typePrompt("dummy-iban DE00 0000 0000 0000 0000 00 prüfen");

    expect(screen.getByText("MARKIERT")).toBeInTheDocument();
    expect(
      screen.getByText("1 Treffer · Beispiel-Laufzeit · lokale Regeln"),
    ).toBeInTheDocument();
    // The matched IBAN is highlighted with its type label in detect mode.
    expect(screen.getByText("DE00 0000 0000 0000 0000 00")).toBeInTheDocument();
    expect(screen.getByText("IBAN")).toBeInTheDocument();

    // Block-level hits are hard-redacted (not tokenised) in mask mode.
    fireEvent.click(screen.getByRole("button", { name: "› Maskiert" }));
    expect(screen.getByText(/▓▓▓/)).toBeInTheDocument();
  });

  it("classifies a known company as a review-level hit and masks it as [UNTERNEHMEN]", () => {
    render(<PromptScannerDemo />);
    typePrompt("die FIKTIVWERK-BEISPIEL AG plant etwas");

    // "review" verdict - asserted via its unique subtitle (the badge text
    // "REVIEW" is shared with the counter label).
    expect(screen.getByText("Geschäftsgeheimnis erkannt")).toBeInTheDocument();
    expect(screen.getByText("FIKTIVWERK-BEISPIEL AG")).toBeInTheDocument();
    expect(screen.getByText("Unternehmen")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "› Maskiert" }));
    expect(screen.getByText("[UNTERNEHMEN]")).toBeInTheDocument();
  });

  it("reports a safe verdict for plain text with no matches", () => {
    render(<PromptScannerDemo />);
    typePrompt("nur eine harmlose anfrage ohne treffer");

    expect(screen.getByText("KEINE DEMO-TREFFER")).toBeInTheDocument();
    expect(screen.getByText("Prüfung unvollständig möglich")).toBeInTheDocument();
    expect(
      screen.getByText("0 Treffer · Beispiel-Laufzeit · lokale Regeln"),
    ).toBeInTheDocument();
    // The unhighlighted text is rendered verbatim in the output preview. The
    // same string also lives in the textarea value, so it appears more than
    // once; assert the preview copy renders (at least one match) rather than a
    // strict single-element query.
    expect(
      screen.getAllByText("nur eine harmlose anfrage ohne treffer").length,
    ).toBeGreaterThan(0);
  });

  it("demonstrates the missed prompt-injection failure mode on demand", () => {
    render(<PromptScannerDemo />);

    const trigger = screen.getByRole("button", { name: /Prompt-Injection testen/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(/dieser Angriff wurde nicht erkannt/),
    ).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    // The injection payload and the "not detected" verdict are revealed.
    expect(
      screen.getByText(/Ignoriere alle bisherigen Anweisungen/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/dieser Angriff wurde nicht erkannt/),
    ).toBeInTheDocument();
  });
});
