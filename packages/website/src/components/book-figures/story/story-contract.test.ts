import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findPrivacyFindings } from "@/lib/figures";
import { C12_TIMELINE, C1_LADDER, C2_ICEBERG, C4_HEADLINE } from "./fixtures.provisional";

const DIR = __dirname;

describe("source hygiene", () => {
  const files = readdirSync(DIR).filter((name) => /\.(tsx?|css)$/.test(name) && !/\.test\./.test(name));
  const sources = files.map((name) => [name, readFileSync(join(DIR, name), "utf8")] as const);

  it("renders no raw HTML", () => {
    for (const [name, source] of sources) {
      expect(source, name).not.toMatch(/dangerouslySetInnerHTML/);
    }
  });

  it("writes no em or en dashes and no vault, home or retired-brand strings", () => {
    const brand = ["Digi", "fyde"].join("");
    // Built from pieces so this file itself carries no private path.
    const vaultPattern = new RegExp(["\\/Us" + "ers\\/", "maven" + "gence_obs" + "idian", "\\/priv" + "ate\\/tmp"].join("|"));
    for (const [name, source] of sources) {
      expect(source, name).not.toMatch(/[–—]/);
      expect(source, name).not.toMatch(vaultPattern);
      expect(source.toLowerCase(), name).not.toContain(brand.toLowerCase());
    }
  });
});

describe("provisional fixtures", () => {
  it("is labelled provisional and passes the privacy checks of the engine", () => {
    const fixtures = readFileSync(join(DIR, "fixtures.provisional.ts"), "utf8");
    expect(fixtures).toMatch(/PROVISIONAL/);
    for (const spec of [C4_HEADLINE, C1_LADDER, C2_ICEBERG, C12_TIMELINE]) {
      expect(findPrivacyFindings(spec), spec.id).toEqual([]);
    }
  });

  it("keeps the C4 numbers of the analysis and the ladder range of the sources", () => {
    expect(C4_HEADLINE.data.items.map((i) => i.value)).toEqual([8.2, 4.3, 4.0, 10.6, 6.3]);
    expect(C1_LADDER.data.rungs.map((r) => r.value)).toEqual([20, 26, 54.5, 57]);
    expect(C1_LADDER.data.ours?.axisMax).toBe(10);
  });
});
