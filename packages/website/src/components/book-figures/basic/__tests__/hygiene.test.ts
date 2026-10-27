import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseFigureSpec, findPrivacyFindings } from "@/lib/figures";
import {
  ALL_FIGURE_FIXTURES,
  DUMBBELL_DETAILS,
  DUMBBELL_LAENDER,
  FUNNEL_KREISE,
  PROVISIONAL,
  TICKER_HEADLINE,
  TILEMAP_LAENDER,
  WAFFLE_CHIPS,
} from "../fixtures";

const DIR = join(__dirname, "..");
const files = readdirSync(DIR).filter((f) => /\.(ts|tsx|css)$/.test(f));
const read = (f: string) => readFileSync(join(DIR, f), "utf8");
const part = (...p: string[]) => p.join("");

describe("provisional fixtures", () => {
  it("are marked provisional and say so in every source line", () => {
    expect(PROVISIONAL).toBe(true);
    for (const spec of ALL_FIGURE_FIXTURES) expect(spec.source, spec.id).toMatch(/^Vorläufig/);
    expect(TICKER_HEADLINE.source).toMatch(/^Vorläufig/);
    expect(read("fixtures.ts")).toMatch(/PROVISIONAL FIXTURES/);
  });

  it("pass the engine's spec and privacy checks (k = 5, no identifiers)", () => {
    for (const spec of ALL_FIGURE_FIXTURES) {
      expect(() => parseFigureSpec(spec), spec.id).not.toThrow();
      expect(findPrivacyFindings(spec), spec.id).toEqual([]);
    }
    expect(findPrivacyFindings(TICKER_HEADLINE)).toEqual([]);
  });

  it("never hold a count of 1 to 4 anywhere", () => {
    const counts: number[] = [];
    const walk = (v: unknown, key = ""): void => {
      if (typeof v === "number" && ["n", "hits", "dots_of_firms", "count"].includes(key)) counts.push(v);
      if (Array.isArray(v)) v.forEach((x) => walk(x, key));
      else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => walk(x, k));
    };
    walk(ALL_FIGURE_FIXTURES);
    walk(WAFFLE_CHIPS);
    expect(counts.length).toBeGreaterThan(50);
    expect(counts.filter((c) => c >= 1 && c <= 4)).toEqual([]);
  });

  it("suppress the two Länder with fewer than 5 hits instead of printing a rate", () => {
    const suppressed = TILEMAP_LAENDER.data.tiles.filter((t) => t.value === null).map((t) => t.id);
    expect(suppressed.sort()).toEqual(["SL", "ST"]);
    const dumbNull = DUMBBELL_LAENDER.data.rows.filter((r) => r.b === null).map((r) => r.id);
    expect(dumbNull.sort()).toEqual(["SL", "ST"]);
    expect(DUMBBELL_DETAILS["ST"]).toMatch(/weniger als 5/);
  });

  it("names only places in the funnel, never a firm", () => {
    const labels = FUNNEL_KREISE.data.points.flatMap((p) => (p.label ? [p.label] : []));
    expect(labels.length).toBeGreaterThanOrEqual(5);
    expect(labels).toContain("München");
    expect(FUNNEL_KREISE.data.points.every((p) => /^k\d{3}$/.test(p.id))).toBe(true);
  });
});

describe("source hygiene of the islands", () => {
  const DENY = [
    part("digi", "fyde"),
    part("/Us", "ers/"),
    part("/priv", "ate/tmp"),
    part("maven", "gence_obsidian"),
    part("CLAUDE", ".md"),
    part("mail", "to:"),
  ];

  it.each(files)("%s has no internal path, retired brand, dash between words or banned claim word", (f) => {
    const text = read(f);
    for (const bad of DENY) expect(text, `${f}: ${bad}`).not.toContain(bad);
    expect(text, f).not.toMatch(/[–—]/);
    expect(text, f).not.toMatch(new RegExp(part("compl", "iant|certi", "fied"), "i"));
  });
});
