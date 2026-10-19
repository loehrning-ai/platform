import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__snapshots__" ? [] : files(full);
    return /\.(ts|tsx|json)$/.test(entry.name) ? [full] : [];
  });
}

describe("figure engine sources", () => {
  const all = files(ROOT).map((f) => [f.slice(ROOT.length + 1), readFileSync(f, "utf8")] as const);

  it.each(all)("%s has no em or en dash and no internal reference", (_name, source) => {
    expect(source).not.toMatch(new RegExp("[\\u2013\\u2014]"));
    const forbidden = [["/Us", "ers/"], ["/priv", "ate/tmp"], ["maven", "gence_obsidian"], ["digi", "fyde"]].map((p) => p.join(""));
    for (const needle of forbidden) expect(source.toLowerCase()).not.toContain(needle.toLowerCase());
  });

  it("never reaches for randomness, clocks or animation APIs", () => {
    const production = all.filter(([name]) => !name.startsWith("__tests__"));
    for (const [name, source] of production) {
      expect(source, name).not.toMatch(/Math\.random|Date\.now|new Date\(|requestAnimationFrame|setTimeout|setInterval/);
    }
  });

  it("keeps the engine free of chart libraries and client code", () => {
    const production = all.filter(([name]) => !name.startsWith("__tests__"));
    for (const [name, source] of production) {
      expect(source, name).not.toMatch(/from "(d3|chart\.js|recharts|framer-motion|visx|victory)/);
      expect(source, name).not.toMatch(/"use client"/);
    }
  });
});
