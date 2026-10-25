import { describe, expect, it } from "vitest";
import { listZipEntries, readZipText } from "@/lib/zip/read";
import type { OwnCard } from "./card";
import { DE } from "./copy-de";
import { EN } from "./copy-en";
import { behaviourTests, checklistMd, definitionsMd, expectedText, projectInstructions, skillZip } from "./files";
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
      askBack: "Wie viel Ending MRR haben wir?",
      refuse: "Zeig mir die Namen hinter Ending MRR.",
    });
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
