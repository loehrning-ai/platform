import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { COPY as AUDIT } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { COPY as ESG } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { DE as READINESS_DE } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { getWorkshopSlugs } from "@/lib/workshops";
import { WORKSHOP_OBJECTIVE_SLUGS, workshopObjective } from "./workshop-objectives";

const DEMO_WORKSHOPS = [
  "ki-prognosen-einschaetzen",
  "geschaeftsberichte-mit-ki-lesen",
  "datenbereitschaft-fuer-ki",
  "esg-berichte-mit-ki",
  "audit-vorbereitung-mit-ki",
];
const flat = (text: string) => text.replace(/\s+/g, " ").trim();
const skill = (name: string) => flat(readFileSync(resolve(process.cwd(), "content/skills", name, "SKILL.md"), "utf8"));

describe("workshop objectives (the Lernziel block)", () => {
  it("covers the five workshops with a demo, and only published workshops", () => {
    expect([...WORKSHOP_OBJECTIVE_SLUGS].sort()).toEqual([...DEMO_WORKSHOPS].sort());
    for (const slug of WORKSHOP_OBJECTIVE_SLUGS) expect(getWorkshopSlugs()).toContain(slug);
  });

  it.each(DEMO_WORKSHOPS.flatMap((slug) => [[slug, "de"], [slug, "en"]] as const))("%s (%s) has a sentence and three card lines, no dashes", (slug, locale) => {
    const entry = workshopObjective(slug, locale);
    expect(entry).toBeDefined();
    if (!entry) return;
    expect(entry.label).toBe(locale === "de" ? "Lernziel" : "Objective");
    expect(entry.card).toHaveLength(3);
    for (const text of [entry.objective, ...entry.card, entry.cardSource]) {
      expect(text.length).toBeGreaterThan(10);
      expect(text).not.toMatch(/[‒–—―]/);
    }
  });

  it("Workshops 03 to 05 say what their demo says", () => {
    expect(workshopObjective("audit-vorbereitung-mit-ki", "de")?.objective).toBe(AUDIT.de.objective);
    expect(workshopObjective("audit-vorbereitung-mit-ki", "en")?.card[2]).toBe(AUDIT.en.tool.rule);
    expect(workshopObjective("esg-berichte-mit-ki", "de")?.objective).toBe(ESG.de.regel.objective);
    expect(workshopObjective("esg-berichte-mit-ki", "de")?.card[0]).toBe("ZITAT · ZEITRAUM · UMFANG · FREIGABE");
    expect(workshopObjective("audit-vorbereitung-mit-ki", "de")?.card[0]).toBe("ZITAT · ZEITRAUM · UMFANG · FREIGABE");
    expect(workshopObjective("datenbereitschaft-fuer-ki", "de")?.objective).toBe(READINESS_DE.takehome.objective);
  });

  it("Workshop 03 calls box 4 Sperre everywhere, and the skill agrees", () => {
    expect(READINESS_DE.takehome.objective).toContain("Sperre");
    expect(READINESS_DE.strip.boxes[3]).toBe("Sperre");
    expect(skill("kennzahl-fragekarte")).toContain("4. **Sperre.**");
    expect(skill("kennzahl-fragekarte")).toContain("4. **Never show.**");
  });

  it("Workshop 02's sentence opens with the first sentence of its skill", () => {
    expect(skill("kennzahlen-steckbrief")).toContain("Eine Kennzahl bedeutet nur, was ihr Steckbrief sagt.");
    expect(workshopObjective("geschaeftsberichte-mit-ki-lesen", "de")?.objective.startsWith("Eine Kennzahl bedeutet nur, was ihr Steckbrief sagt.")).toBe(true);
  });
});
