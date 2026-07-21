import { describe, it, expect } from "vitest";
import { dsInter, dsInstrumentSerif, dsJetBrainsMono, DS_FONT_VARIABLES } from "./fonts";

// ─── Self-hosted font matrix ───────────────────────
// The source loads:
//   family=Inter:wght@400;500;600;700;800;900
//   &family=Instrument+Serif:ital@0;1
//   &family=JetBrains+Mono:wght@400;500;600;700
// from https://fonts.googleapis.com — this course self-hosts the identical
// weight/style matrix via next/font/google instead, with zero runtime
// requests to fonts.googleapis.com/fonts.gstatic.com. next/font/google is
// aliased to src/test/next-font-google.ts in vitest.config.ts, which echoes
// back the raw options object so we can assert the exact matrix requested.

interface MockFontResult {
  readonly variable: string;
  readonly className: string;
  readonly __mockOptions: {
    readonly weight?: string | readonly string[];
    readonly style?: string | readonly string[];
    readonly subsets?: readonly string[];
  };
}

describe("data-science self-hosted fonts ", () => {
  it("requests Inter with the exact source weight matrix (400-900)", () => {
    const font = dsInter as unknown as MockFontResult;
    expect(font.__mockOptions.weight).toEqual([
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
    ]);
    expect(font.__mockOptions.subsets).toEqual(["latin"]);
  });

  it("requests Instrument Serif with both italic (1) and normal (0) styles", () => {
    const font = dsInstrumentSerif as unknown as MockFontResult;
    const style = font.__mockOptions.style;
    expect(style).toContain("italic");
    expect(style).toContain("normal");
  });

  it("requests JetBrains Mono with the exact source weight matrix (400-700)", () => {
    const font = dsJetBrainsMono as unknown as MockFontResult;
    expect(font.__mockOptions.weight).toEqual(["400", "500", "600", "700"]);
    expect(font.__mockOptions.subsets).toEqual(["latin"]);
  });

  it("every font exposes a CSS variable name for the scoped stylesheet to consume", () => {
    expect(dsInter.variable).toBeTruthy();
    expect(dsInstrumentSerif.variable).toBeTruthy();
    expect(dsJetBrainsMono.variable).toBeTruthy();
    // Each variable is distinct — no two families collapse onto the same
    // custom property.
    const variables = [dsInter.variable, dsInstrumentSerif.variable, dsJetBrainsMono.variable];
    expect(new Set(variables).size).toBe(3);
  });

  it("DS_FONT_VARIABLES combines all three variable class names for a single className prop", () => {
    expect(DS_FONT_VARIABLES).toContain(dsInter.variable);
    expect(DS_FONT_VARIABLES).toContain(dsInstrumentSerif.variable);
    expect(DS_FONT_VARIABLES).toContain(dsJetBrainsMono.variable);
  });
});
