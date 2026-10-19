import { describe, expect, it } from "vitest";
import {
  PALETTES, RAMP_CLASSES, accentTint, contrastRatio, mixHex, rampClassColor, rampColor, readableOn,
} from "../palette.ts";

describe("palette", () => {
  for (const theme of ["web", "print"] as const) {
    const pal = PALETTES[theme];

    it(`keeps text and accent readable on the ${theme} paper`, () => {
      expect(contrastRatio(pal.ink, pal.paper)).toBeGreaterThanOrEqual(12);
      expect(contrastRatio(pal.muted, pal.paper)).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(pal.mutedLight, pal.paper)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(pal.accent, pal.paper)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(pal.edge, pal.paper)).toBeGreaterThanOrEqual(3);
    });

    it(`keeps text on every ramp tile readable in the ${theme} theme`, () => {
      for (const t of RAMP_CLASSES) {
        const fill = rampColor(pal, t);
        expect(contrastRatio(readableOn(fill, pal), fill)).toBeGreaterThanOrEqual(4.5);
      }
      for (let share = 0; share <= 1; share += 0.05) {
        const fill = rampClassColor(pal, share);
        expect(contrastRatio(readableOn(fill, pal), fill)).toBeGreaterThanOrEqual(4.5);
      }
    });

    it(`uses literal hex values only in the ${theme} theme`, () => {
      for (const value of Object.values(pal)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
    });
  }

  it("mixes colours at the ends and the middle", () => {
    expect(mixHex("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mixHex("#000000", "#ffffff", 1)).toBe("#ffffff");
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  it("builds a ramp from the light tint to the accent", () => {
    expect(rampColor(PALETTES.web, 0)).toBe(PALETTES.web.rampLow);
    expect(rampColor(PALETTES.web, 1)).toBe(PALETTES.web.accent);
    expect(rampColor(PALETTES.web, 7)).toBe(PALETTES.web.accent);
  });

  it("tints the paper towards the accent", () => {
    expect(accentTint(PALETTES.web, 0)).toBe(PALETTES.web.paper);
    expect(accentTint(PALETTES.web, 1)).toBe(PALETTES.web.accent);
  });

  it("uses the brand accent in both themes", () => {
    expect(PALETTES.web.accent).toBe("#b73a15");
    expect(PALETTES.print.paper).toBe("#f3f0e9");
    expect(PALETTES.print.ink).toBe("#121212");
  });
});
