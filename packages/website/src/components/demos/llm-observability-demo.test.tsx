import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LLM_OBS_STATUS, LlmObservabilityDemo } from "./llm-observability-demo";

/**
 * llm-observability-demo.test.tsx (regression coverage)
 *
 * The engine opens on the first scenario where the automated score and the
 * human rating disagree (the lead's promise). Below sm (jsdom's matchMedia
 * polyfill never matches the sm query) the output opens inline under the
 * selected scenario as an accordion row; from sm up it keeps its own panel.
 * Status marks stay on the one-accent palette.
 */

const originalMatchMedia = window.matchMedia;

function setSmUp(smUp: boolean): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = (query: string) => ({
    matches: smUp && query.includes("min-width"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

/** Paper, ink, Schiefer, hairline and the one Mennige accent. */
const TOKEN_COLOURS = new Set([
  "#121212",
  "#0b0908",
  "#4f4640",
  "#e3dfd6",
  "#b73a15",
  "#f3f0e9",
  "#f7f4ed",
  "rgba(11,9,8,0.62)",
]);

function hexOf(value: string): string {
  const rgb = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!rgb) return value.toLowerCase();
  if (rgb[4] !== undefined && rgb[4] !== "1") {
    return `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${rgb[4]})`;
  }
  return `#${[rgb[1], rgb[2], rgb[3]]
    .map((n) => Number(n).toString(16).padStart(2, "0"))
    .join("")}`;
}

describe("<LlmObservabilityDemo>", () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("opens on the first mismatch, inline under its row below sm", () => {
    setSmUp(false);
    const { container } = render(<LlmObservabilityDemo />);
    const row = screen.getByRole("button", {
      name: /Wie lange gilt ein Vertrag/,
    });
    expect(row).toHaveAttribute("aria-expanded", "true");
    const panelId = row.getAttribute("aria-controls");
    const inline = container.querySelector("[data-llmobs-inline-output]");
    expect(inline?.id).toBe(panelId);
    // The output sits directly after the tapped row, not below the list.
    expect(row.nextElementSibling).toBe(inline);
    expect(inline).toHaveTextContent(/verlängert sich ein Vertrag/);
    expect(container.querySelectorAll("[data-llmobs-output]")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /Risikostufe/ }));
    const drift = screen.getByRole("button", { name: /Risikostufe/ });
    expect(drift).toHaveAttribute("aria-expanded", "true");
    expect(row).toHaveAttribute("aria-expanded", "false");
    expect(drift.nextElementSibling).toHaveTextContent(/Drift-Indikator ausgelöst/);

    // The four KPI tiles become one caption line below sm.
    expect(container.querySelector("[data-llmobs-kpi-line]")).toHaveTextContent(
      "4 Läufe · 1 Drift · 2 Abweichungen · Ø Auto-Score hoch",
    );
    expect(container.querySelector("[data-llmobs-kpi-line]")).toHaveClass("sm:hidden");
  });

  it("keeps the separate output panel and pressed rows from sm up", () => {
    setSmUp(true);
    const { container } = render(<LlmObservabilityDemo />);
    const row = screen.getByRole("button", { name: /Wie lange gilt ein Vertrag/ });
    expect(row).toHaveAttribute("aria-pressed", "true");
    expect(row).not.toHaveAttribute("aria-expanded");
    expect(container.querySelector("[data-llmobs-inline-output]")).toBeNull();
    expect(container.querySelectorAll("[data-llmobs-output]")).toHaveLength(1);
  });

  it("draws status badges and score chips in the token set only", () => {
    setSmUp(true);
    const { container } = render(<LlmObservabilityDemo />);
    const marks = Array.from(
      container.querySelectorAll<HTMLElement>("[data-llmobs-badge], [data-llmobs-output] span"),
    );
    expect(marks.length).toBeGreaterThan(3);
    for (const mark of marks) {
      const { color, borderTopColor } = mark.style;
      if (color) expect(TOKEN_COLOURS, color).toContain(hexOf(color));
      if (borderTopColor) {
        expect(TOKEN_COLOURS, borderTopColor).toContain(hexOf(borderTopColor));
      }
    }
    expect(LLM_OBS_STATUS.mismatch.fg).toBe("#b73a15");
    expect(LLM_OBS_STATUS.drift.border).toContain("dashed");
    expect(container.innerHTML).not.toMatch(/#b91c1c|#eab308|#854d0e|#205b46/i);
  });
});
