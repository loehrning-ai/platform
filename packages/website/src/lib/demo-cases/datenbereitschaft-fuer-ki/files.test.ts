import { describe, expect, it } from "vitest";
import { listZipEntries, readZipText } from "@/lib/zip/read";
import type { OwnCard } from "./card";
import { DE } from "./copy-de";
import { EN } from "./copy-en";
import { behaviourTests, checklistMd, definitionsMd, expectedText, projectInstructions, skillZip, source } from "./files";
import { countDecimals } from "./format";
import { SKILL_MD } from "./skill-text";

const PACKS = [DE, EN] as const;
const filled = (pack: typeof DE) => pack.presets.filter((preset) => preset.id !== "empty");

describe("the three files", () => {
  it("leave no placeholder behind, for every preset in both languages", () => {
    for (const pack of PACKS) {
      for (const preset of filled(pack)) {
        for (const text of [definitionsMd(preset.card, pack.files), projectInstructions(preset.card, pack.files), checklistMd(preset.card, pack.files)]) {
          expect(text, `${pack.locale} ${preset.id}`).not.toMatch(/\{\w+\}/);
          expect(text).not.toMatch(/[–—]/);
        }
      }
    }
  });

  it("keep the expected values out of everything Claude reads", () => {
    for (const pack of PACKS) {
      for (const preset of filled(pack)) {
        const values = expectedText(preset.card, pack.locale);
        expect(checklistMd(preset.card, pack.files)).toContain(values);
        expect(definitionsMd(preset.card, pack.files)).not.toContain(values);
        expect(projectInstructions(preset.card, pack.files)).not.toContain(values);
      }
    }
  });

  it("write three tests and no age rule", () => {
    const foldline = DE.presets[0]?.card as OwnCard;
    expect(projectInstructions(foldline, DE.files)).not.toContain("Stunden");
    expect(checklistMd(foldline, DE.files)).toContain("| T3 |");
    expect(checklistMd(foldline, DE.files)).not.toContain("| T4 |");
  });

  it("write an open risk into the instructions when nothing locks the data", () => {
    const foldline = DE.presets[0]?.card as OwnCard;
    expect(projectInstructions(foldline, DE.files)).not.toContain("Achtung");
    expect(projectInstructions({ ...foldline, lockedBy: "open" }, DE.files).startsWith("Achtung")).toBe(true);
    expect(definitionsMd({ ...foldline, lockedBy: "open" }, DE.files)).toContain("NOCH NICHT GESPERRT");
  });

  it("write the add rule of the kind, derived from canAdd", () => {
    const people = DE.presets.find((preset) => preset.id === "people")?.card as OwnCard;
    expect(definitionsMd(people, DE.files)).toContain("Über Monate: neu rechnen, nie mitteln.");
    const foldline = EN.presets[0]?.card as OwnCard;
    expect(definitionsMd(foldline, EN.files)).toContain("Across months: never add.");
  });

  it("prefill the ask-back and refusal tests from the card", () => {
    const foldline = DE.presets[0]?.card as OwnCard;
    expect(behaviourTests(foldline, DE.files)).toEqual({
      askBack: "Zeig mir Ending MRR.",
      refuse: "Zeig Ending MRR aufgeschlüsselt und nimm die Spalte „Namen“ dazu.",
    });
    const helmets = EN.presets.find((preset) => preset.id === "retail")?.card as OwnCard;
    expect(behaviourTests(helmets, EN.files).askBack).toBe("Show me Helmets on hand.");
    // No article, no inflection: the template reads right for any metric name.
    expect(behaviourTests({ ...foldline, metric: "Offene Posten Debitoren", never: "Kundennamen" }, DE.files)).toEqual({
      askBack: "Zeig mir Offene Posten Debitoren.",
      refuse: "Zeig Offene Posten Debitoren aufgeschlüsselt und nimm die Spalte „Kundennamen“ dazu.",
    });
  });

  it("write the visitor's expected values exactly, cents of millions included", () => {
    const foldline = DE.presets[0]?.card as OwnCard;
    const card = { ...foldline, expected: "1.234.567,89 / 1.198.000 / 1.305.442,10" };
    expect(expectedText(card, "de")).toBe("1.234.567,89 / 1.198.000 / 1.305.442,10");
    expect(checklistMd(card, DE.files)).toContain("1.234.567,89 / 1.198.000 / 1.305.442,10 EUR");
    expect(expectedText({ ...foldline, expected: "1,234,567.89 / 0.5" }, "en")).toBe("1,234,567.89 / 0.5");
    expect(countDecimals(1_234_567.89)).toBe(2);
    expect(countDecimals(4.6000000000000005)).toBe(1);
    expect(countDecimals(387_015)).toBe(0);
    expect(countDecimals(0.00001234, 4)).toBe(0);
  });

  it("write the date as YYYY-MM-DD whichever way it was typed", () => {
    const foldline = DE.presets[0]?.card as OwnCard;
    expect(definitionsMd({ ...foldline, clock: "1.7.2026" }, DE.files)).toContain("- Stichtag: 2026-07-01,");
    expect(checklistMd(foldline, DE.files)).toContain("Stichtag: 2026-07-01.");
  });

  it("leave out a column that does not fit, and keep one with spaces", () => {
    const foldline = DE.presets[0]?.card as OwnCard;
    expect(source({ ...foldline, view: "OP-Liste.xlsx", column: "Betrag offen" }, DE.files)).toBe("OP-Liste.xlsx, Spalte Betrag offen");
    expect(source({ ...foldline, column: "betrag#offen" }, DE.files)).toBe("analytics.mrr_summary_monthly");
  });

  it("escape a pipe in a table cell", () => {
    const foldline = DE.presets[0]?.card as OwnCard;
    expect(checklistMd({ ...foldline, question: "Ending MRR | je Monat Q2 2026 in EUR" }, DE.files)).toContain("Ending MRR \\| je Monat");
  });
});

describe("skillZip", () => {
  it("holds the unchanged SKILL.md and the visitor's definition, nothing else", () => {
    const card = DE.presets[1]?.card as OwnCard;
    const zip = skillZip(card, DE.files);
    expect(listZipEntries(zip).map((entry) => entry.path)).toEqual(["kennzahl-fragekarte/SKILL.md", "kennzahl-fragekarte/references/kennzahlen.md"]);
    expect(readZipText(zip, "kennzahl-fragekarte/SKILL.md")).toBe(SKILL_MD);
    expect(readZipText(zip, "kennzahl-fragekarte/references/kennzahlen.md")).toBe(definitionsMd(card, DE.files));
  });
});
