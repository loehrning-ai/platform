import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEMO_TEXT } from "./copy";
import { ENDING_MRR, FOLDLINE, FRESHNESS, HEADCOUNT, NET_NEW_MRR } from "./data";

const WEBSITE = join(__dirname, "../../../..");

/** Every string inside a copy object, with its key path. */
function strings(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((item, index) => strings(item, `${path}[${index}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => strings(item, path ? `${path}.${key}` : key));
  }
  return [];
}

function shape(value: unknown): unknown {
  if (typeof value === "string") return "s";
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape(item)]));
  }
  return typeof value;
}

/**
 * The workshop client's name, read at test time from the deck's resolution
 * scene (the word after "×"), so it never lands in a committed demo file.
 */
function clientName(): string {
  const deck = readFileSync(join(WEBSITE, "public/workshops/datenbereitschaft-fuer-ki/slides.html"), "utf8");
  const start = deck.search(/<section[^>]*id="resolution"/);
  const scene = deck.slice(start, deck.indexOf("</section>", start));
  const match = /×\s*([^<\s][^<]*)</.exec(scene);
  return (match?.[1] ?? "").trim();
}

function demoFiles(): string[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
    );
  return [
    ...walk(join(WEBSITE, "src/lib/demo-cases/datenbereitschaft-fuer-ki")),
    ...walk(join(WEBSITE, "src/components/demos/datenbereitschaft-fuer-ki")),
  ];
}

const ALL = (["de", "en"] as const).flatMap((locale) =>
  strings(DEMO_TEXT[locale]).map(([path, text]) => ({ locale, path, text })),
);

describe("demo 03 copy", () => {
  it("has the same keys and list lengths in DE and EN", () => {
    expect(shape(DEMO_TEXT.en)).toEqual(shape(DEMO_TEXT.de));
  });

  it("quotes only numbers the kit has", () => {
    const allowed = new Set<number>([
      ...Object.values(ENDING_MRR),
      ...Object.values(NET_NEW_MRR),
      ...Object.values(HEADCOUNT.level),
      ...Object.values(HEADCOUNT.monthlyExportRatesPct),
      ...HEADCOUNT.departments.flatMap((department) => [department.start, department.leavers, department.ratePct]),
      FOLDLINE.netNewQ2,
      FOLDLINE.levelsSummedQ2,
      Math.abs(FOLDLINE.recordedChangeDiff),
      FOLDLINE.billingEventsQ2,
      FOLDLINE.accounts,
      FOLDLINE.activeEndOfMarch,
      FOLDLINE.churnedQ2,
      FOLDLINE.joinedQ2,
      FOLDLINE.activeEndOfJune,
      Number(FOLDLINE.sqlstateDenied),
      FRESHNESS.warnAfterHours,
      FRESHNESS.whatIfAgeHours,
      FRESHNESS.inventedExpiryHours,
      FRESHNESS.ageHours,
      HEADCOUNT.hiresQ2,
      HEADCOUNT.leaversQ2,
      HEADCOUNT.netQ2,
      HEADCOUNT.averageHeadcount,
      HEADCOUNT.departmentRatesAveragedPct,
      HEADCOUNT.monthlyRatesAveragedPct,
      9.5,
      9.34,
      8.33,
      9.1,
      10,
      12,
      120,
      132,
      // Counts and calendar: 0 of 0, 0 of 3, "every 19th", Q2/Q3, dates, clock, version, PostgreSQL 16.
      0, 1, 2, 3, 5, 16, 18, 19, 30, 31, 2026, 6, 9,
    ]);
    const isNumber = /(?<![\w.])\d{1,3}(?:[.,]\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?/g;
    for (const { locale, path, text } of ALL) {
      if (!/^(?:rules|triageRules|takeaways)/.test(path)) continue;
      const cleaned = text.replace(/`[^`]*`/g, "").replace(/\{[^}]*\}/g, "").replace(/\d{2}:\d{2}/g, "").replace(/1\.0\.0/g, "");
      for (const raw of cleaned.match(isNumber) ?? []) {
        const normalized =
          locale === "de" ? raw.replace(/\.(?=\d{3}\b)/g, "").replace(",", ".") : raw.replace(/,(?=\d{3}\b)/g, "");
        const number = Number(normalized);
        expect(allowed.has(number) || allowed.has(-number), `${locale}.${path}: ${raw}`).toBe(true);
      }
    }
  });

  it("names no workshop client, no internal path", () => {
    const name = clientName();
    expect(name.length).toBeGreaterThan(2);
    const copy = JSON.stringify(DEMO_TEXT);
    expect(copy.toLowerCase()).not.toContain(name.toLowerCase());
    for (const file of demoFiles()) {
      const text = readFileSync(file, "utf8");
      expect(text.toLowerCase().includes(name.toLowerCase()), file).toBe(false);
      // Vault names are guarded repo-wide by the publication scanner (scan:public).
      if (!/\.test\.tsx?$/.test(file)) expect(text, file).not.toMatch(/\/Users\//);
    }
  });
});
