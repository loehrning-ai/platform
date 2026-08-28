import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const globalCss = readFileSync(
  join(__dirname, "..", "app", "globals.css"),
  "utf8",
);

function hexToken(name: string): string {
  const match = globalCss.match(
    new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, "i"),
  );
  if (!match) throw new Error(`Missing hex color token: ${name}`);
  return match[1];
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((index) =>
    Number.parseInt(hex.slice(index, index + 2), 16),
  );
  const linear = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (left, right) => right - left,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Berliner Learning Instrument CSS contract", () => {
  it("separates visible structural boundaries from quiet passive tracks", () => {
    const boundary = hexToken("border");
    const track = hexToken("track");
    const background = hexToken("background");
    const card = hexToken("card");

    expect(boundary).not.toBe(track);
    expect(contrast(boundary, background)).toBeGreaterThanOrEqual(3);
    expect(contrast(boundary, card)).toBeGreaterThanOrEqual(3);
    expect(contrast(track, background)).toBeLessThan(2);
    expect(globalCss).toContain("background-color: var(--color-track)");
    expect(globalCss).toContain(":where(.grid.gap-px, .h-px, .w-px).bg-border");
  });

  it("keeps dark structural boundaries distinct from dark passive tracks", () => {
    expect(globalCss).toContain(
      "--color-dark-border: rgba(247, 241, 231, 0.4)",
    );
    expect(globalCss).toContain(
      "--color-dark-track: rgba(247, 241, 231, 0.14)",
    );
    expect(globalCss).toContain("--color-track: rgba(247, 241, 231, 0.14)");
  });

  it("sets shared overlines at 14px and marginal labels at a 12px minimum", () => {
    expect(globalCss).toMatch(/\.overline\s*\{[^}]*font-size:\s*0\.875rem;/s);
    expect(globalCss).toMatch(/\.ai-marginalia\s*\{[^}]*font-size:\s*12px;/s);
  });

  it("does not run ambient infinite animation or transition every property", () => {
    expect(globalCss).not.toMatch(/animation\s*:[^;]*\binfinite\b/);
    expect(globalCss).not.toMatch(/transition\s*:\s*all\b/);
  });
});
