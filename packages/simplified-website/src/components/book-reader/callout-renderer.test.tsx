import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalloutRenderer } from "./callout-renderer";

/**
 * callout-renderer.test.tsx (regression coverage)
 *
 * Guards the book-reader callout type-detection + fallback. CalloutRenderer is
 * the custom blockquote renderer for the German book callouts (Tipp, Achtung,
 * Rechtlicher Hinweis, Prompt-Vorlage, ...). It reads the FIRST <strong> label
 * out of the blockquote children and maps it to a styled `role="note"` box, or
 * falls back to a plain italic <blockquote> for unknown/absent labels.
 *
 * We drive it with plain React children shaped like react-markdown's blockquote
 * output (a <p> wrapping a <strong> label plus body text) so the test never
 * pulls in react-markdown itself. Assertions target STRUCTURE (role, aria-label,
 * the mono/kupfer style class, the fallback element), not the book prose, so a
 * content refresh keeps them green.
 */

describe("<CalloutRenderer>", () => {
  it("renders a styled note with the label as accessible name for a known type", () => {
    render(
      <CalloutRenderer>
        <p>
          <strong>Tipp:</strong> Nutze klare Prompts.
        </p>
      </CalloutRenderer>,
    );
    const note = screen.getByRole("note", { name: "Tipp" });
    expect(note).toBeInTheDocument();
    // The colon is stripped from the label but the body text stays intact.
    expect(note).toHaveTextContent("Nutze klare Prompts.");
  });

  it("strips the trailing colon from the label", () => {
    render(
      <CalloutRenderer>
        <p>
          <strong>Achtung:</strong> Vorsicht bei personenbezogenen Daten.
        </p>
      </CalloutRenderer>,
    );
    // aria-label is exactly "Achtung" (no trailing colon).
    expect(screen.getByRole("note", { name: "Achtung" })).toBeInTheDocument();
    expect(screen.queryByRole("note", { name: "Achtung:" })).toBeNull();
  });

  it("applies the mono style to Prompt-Vorlage callouts", () => {
    render(
      <CalloutRenderer>
        <p>
          <strong>Prompt-Vorlage:</strong> Schreibe eine E-Mail an ...
        </p>
      </CalloutRenderer>,
    );
    const note = screen.getByRole("note", { name: "Prompt-Vorlage" });
    expect(note.className).toMatch(/font-mono/);
  });

  it("uses the Kupfer border (not red) for Rechtlicher Hinweis", () => {
    render(
      <CalloutRenderer>
        <p>
          <strong>Rechtlicher Hinweis:</strong> Keine Rechtsberatung.
        </p>
      </CalloutRenderer>,
    );
    const note = screen.getByRole("note", { name: "Rechtlicher Hinweis" });
    expect(note.className).toContain("border-[#C4431A]");
  });

  it("resolves a compound label via prefix match to its base type", () => {
    render(
      <CalloutRenderer>
        <p>
          <strong>Tipp für Profis:</strong> Halte den Kontext knapp.
        </p>
      </CalloutRenderer>,
    );
    // "tipp für profis" is not an exact key, but startsWith("tipp") maps it to
    // the Tipp style, so it still renders as a styled note.
    const note = screen.getByRole("note", { name: "Tipp für Profis" });
    expect(note).toBeInTheDocument();
  });

  it("falls back to a plain italic blockquote for an unknown label", () => {
    const { container } = render(
      <CalloutRenderer>
        <p>
          <strong>Zufallslabel:</strong> Unbekannter Typ.
        </p>
      </CalloutRenderer>,
    );
    expect(container.querySelector('[role="note"]')).toBeNull();
    const blockquote = container.querySelector("blockquote");
    expect(blockquote).not.toBeNull();
    expect(blockquote?.className).toMatch(/italic/);
    expect(blockquote).toHaveTextContent("Unbekannter Typ.");
  });

  it("falls back to a blockquote when there is no strong label at all", () => {
    const { container } = render(
      <CalloutRenderer>
        <p>Nur Text ohne Label.</p>
      </CalloutRenderer>,
    );
    expect(container.querySelector('[role="note"]')).toBeNull();
    expect(container.querySelector("blockquote")).not.toBeNull();
    expect(screen.getByText("Nur Text ohne Label.")).toBeInTheDocument();
  });

  it("does not crash when rendered without children", () => {
    const { container } = render(<CalloutRenderer />);
    // No label -> fallback blockquote, no styled note, no throw.
    expect(container.querySelector("blockquote")).not.toBeNull();
    expect(container.querySelector('[role="note"]')).toBeNull();
  });
});
