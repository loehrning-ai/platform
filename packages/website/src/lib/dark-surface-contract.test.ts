import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOT = join(__dirname, "..");

function source(relativePath: string): string {
  return readFileSync(join(SOURCE_ROOT, relativePath), "utf8");
}

/**
 * The owner's rule: never a black, graphit or near-black background. The
 * graphit band (.dark-section and the --color-dark-* tokens) is retired, and
 * every surface that used it is a light sheet now: the footer is the
 * Pfirsich-Wash, consoles and logs are Beton, result panels and selected states
 * are the Himmel-Blatt. These are the surfaces that were graphit before, so
 * they are the ones most likely to drift back.
 */
const FORMERLY_DARK = [
  "components/footer.tsx",
  "components/werk/cover-band.tsx",
  "components/werk/question-card.tsx",
  "components/werk/button-link.tsx",
  "components/werk/chip.tsx",
  "components/demos/demo-shell.tsx",
  "components/demos/agent-pipeline-demo.tsx",
  "components/demos/n8n-supply-chain-demo.tsx",
  "components/demos/prompt-scanner-demo.tsx",
  "components/demos/roi-rechner-demo.tsx",
  "components/demos/cost-drift-observability-demo.tsx",
  "components/demos/word-demo.tsx",
  "components/demos/rag-vertragsassistent-demo.tsx",
  "components/demos/rag-vertragsassistent-first-frame.tsx",
  "components/ai-native/primitives.tsx",
  "components/ai-native/debug-panel.tsx",
  "components/ai-native/demos/_shared.tsx",
  "components/ai-native/demos/agent-demo.tsx",
  "components/ai-native/demos/excel-demo.tsx",
  "components/ai-native/demos/finetune-demo.tsx",
  "components/ai-native/demos/logistics-demo.tsx",
  "components/ai-native/demos/maturity-demo.tsx",
  "components/ai-native/demos/observ-demo.tsx",
  "components/ai-native/demos/roi-demo.tsx",
  "components/course-projects/engines/engine-ui.tsx",
  "components/course-projects/engines/data-lab.tsx",
  "components/course-projects/engines/prompt-lab.tsx",
  "components/book-reader/callout-renderer.tsx",
  "components/book-reader/chapter-reader.tsx",
  "app/ki-check/ki-check-client.tsx",
  "app/global-error.tsx",
] as const;

const DARK_SURFACE =
  /\bdark-section\b|--color-dark-(?:bg|fg|muted|border|track)|\bbg-(?:black|graphit|dark-bg|stone-9\d\d|neutral-9\d\d|zinc-9\d\d)\b/i;

/** WCAG relative luminance of a six-digit hex. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((index) => {
    const channel = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Every hex a background, a bg-[...] utility or a fill paints, if near black. */
function nearBlackGrounds(text: string): string[] {
  const grounds = text.matchAll(
    /(?:background(?:Color)?\s*:\s*["'`]?|\bbg-\[)(#[0-9a-f]{6})\b/gi,
  );
  return [...grounds].map((match) => match[1]).filter((hex) => luminance(hex) < 0.03);
}

describe("no dark surfaces", () => {
  it.each(FORMERLY_DARK)("%s paints no black, graphit or near-black ground", (path) => {
    const text = source(path);
    const match = DARK_SURFACE.exec(text);
    expect(match?.[0], `${path} still paints a dark ground`).toBeUndefined();
    expect(nearBlackGrounds(text), `${path} paints a near-black ground`).toEqual([]);
  });

  it("keeps the retired graphit scope and tokens out of the global stylesheet", () => {
    const css = source("app/globals.css");
    expect(css).not.toMatch(/^\s*\.dark-section\b/m);
    expect(css).not.toMatch(/--color-dark-(?:bg|fg|muted|border|track)\s*:/);
    expect(css).not.toMatch(/\.plakat-footer\b/);
  });

  it("fills a selection or an action with a colour, never with ink", () => {
    // Selected states and filled actions in the formerly graphit engines
    // take the pastel sheet or Kobalt; ink only draws text, lines and marks.
    for (const path of FORMERLY_DARK) {
      const text = source(path);
      expect(text, path).not.toMatch(/(?:aria-pressed|hover):bg-foreground\b/);
      expect(text, path).not.toMatch(/\bbg-foreground\s+(?:[^"'`]*\s)?text-background\b/);
    }
  });

  it("keeps ink off the chrome's scroll thread and off every filled scene button", () => {
    // The old site's Mennige thread, never a black line over the header.
    const progress = source("components/ui/scroll-progress.tsx");
    expect(progress).not.toMatch(/\bbg-(?:foreground|black|graphit)\b/);
    expect(progress).toMatch(/\bbg-brand-orange\b/);
    // Bloom's ink is Aubergine (luminance 0.023): as a fill it reads as a
    // black button, so no scene button fills with the scene ink.
    expect(source("components/werk/button-link.tsx")).not.toMatch(/\bbg-scene-ink\b/);
  });

  it("uses paper-safe status tones in consoles and logs, never the light display tones", () => {
    for (const path of [
      "components/demos/n8n-supply-chain-demo.tsx",
      "components/demos/prompt-scanner-demo.tsx",
      "components/demos/cost-drift-observability-demo.tsx",
    ]) {
      const text = source(path);
      expect(text, path).not.toMatch(/statusRedOnDark|rgba\(243,\s*240,\s*233/);
    }
  });
});
