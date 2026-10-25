import { describe, expect, it } from "vitest";
import { getWorkshops } from "@/lib/workshops";
import { materialMeta, workshopStage } from "./workshop-stage";

/** The expected cards per workshop: slides, lab or demo, kit or case. */
const EXPECTED: Readonly<Record<string, { a: "slides" | "lab" | "demo"; b: "kit" | "case"; kitPage: boolean }>> = {
  // Workshop 01 starts at its demo (the kit, made visible); the labs are its secondary link.
  "ki-prognosen-einschaetzen": { a: "demo", b: "kit", kitPage: true },
  "geschaeftsberichte-mit-ki-lesen": { a: "slides", b: "kit", kitPage: false },
  "datenbereitschaft-fuer-ki": { a: "slides", b: "kit", kitPage: false },
  "esg-berichte-mit-ki": { a: "slides", b: "kit", kitPage: true },
  "ki-im-unternehmen-sicher-nutzen": { a: "slides", b: "kit", kitPage: true },
};

describe("workshopStage", () => {
  for (const locale of ["de", "en"] as const) {
    for (const workshop of getWorkshops(locale)) {
      it(`${locale}/${workshop.slug}: card A opens the primary file, card B hands over the second one`, () => {
        const expected = EXPECTED[workshop.slug];
        expect(expected, `no expectation for ${workshop.slug}`).toBeDefined();
        const stage = workshopStage(workshop, locale);
        const primary = workshop.materials.find((material) => material.primary)!;
        expect(stage.a?.kind).toBe(expected.a);
        expect(stage.a?.href).toBe(primary.href);
        expect(stage.a?.material).toBe(primary);
        if (expected.a === "demo") {
          expect(stage.a?.demoHref).toBeUndefined();
          expect(stage.a?.labHref).toBe(workshop.materials.find((material) => material.role === "lab")?.href);
        }
        expect(stage.b?.kind).toBe(expected.b);
        expect(stage.b?.material).not.toBe(primary);
        expect(stage.b?.href).toBe(stage.b?.material.href);
        // The file (zip) downloads; a case opens like a page.
        expect(stage.b?.download).toBe(expected.b === "kit");
        if (expected.kitPage) {
          expect(stage.b?.kitPageHref).toBe(`${locale === "de" ? "" : "/en"}/workshops/${workshop.slug}/kit`);
        } else {
          expect(stage.b?.kitPageHref).toBeUndefined();
        }
      });

      it(`${locale}/${workshop.slug}: the meta lines carry time and size, never a slide or file count`, () => {
        const stage = workshopStage(workshop, locale);
        for (const card of [stage.a, stage.b]) {
          expect(card?.meta).toBeDefined();
          expect(card!.meta).not.toMatch(/\b\d+\s*(?:Folien|slides|Dateien|files)\b/i);
          expect(card!.meta).not.toMatch(/[–—]/);
        }
        if (stage.b?.kind === "kit") {
          expect(stage.b.meta).toBe(materialMeta(stage.b.material));
          expect(stage.b.meta).toMatch(/^ZIP · \d+(?:[.,]\d+)? (?:KB|MB)$/);
          expect(stage.b.fileFacts).toMatch(/^, ZIP, \d/);
        } else {
          expect(stage.b?.fileFacts).toBeUndefined();
        }
        if (stage.a?.minutes) {
          expect(stage.a.meta).toContain(locale === "de" ? `${stage.a.minutes} Min.` : `${stage.a.minutes} min`);
        }
      });
    }
  }

  it("gives every deck card minutes, never just the page language, a lab or case card its time alone and a demo card what it is", () => {
    for (const locale of ["de", "en"] as const) {
      for (const workshop of getWorkshops(locale)) {
        const stage = workshopStage(workshop, locale);
        const unit = locale === "de" ? "Min." : "min";
        if (stage.a?.kind === "slides") {
          expect(stage.a.meta, `${locale}/${workshop.slug}`).toMatch(new RegExp(`^Deck · (?:ca\\. |about )?\\d+ ${unit.replace(".", "\\.")}$`));
        } else if (stage.a?.kind === "demo") {
          expect(stage.a.meta).toMatch(new RegExp(`^${locale === "de" ? "Kit als Demo" : "Kit as a demo"} · \\d+ ${unit.replace(".", "\\.")}$`));
        } else if (stage.a) {
          // The title already says "lab": the meta is the time alone.
          expect(stage.a.meta).toMatch(new RegExp(`^\\d+ ${unit.replace(".", "\\.")}$`));
        }
        if (stage.b?.kind === "case") {
          expect(stage.b.meta).toMatch(new RegExp(`^\\d+ ${unit.replace(".", "\\.")}$`));
        }
      }
    }
  });

  it("formats a material as format and size, falling back to the language for a page", () => {
    const [w05] = getWorkshops("de").filter((workshop) => workshop.slug === "ki-im-unternehmen-sicher-nutzen");
    expect(materialMeta(w05.materials.find((material) => material.kind === "zip")!)).toBe("ZIP · 14 KB");
    expect(materialMeta(w05.materials.find((material) => material.kind === "html")!)).toBe("HTML · EN");
  });

  it("returns no card for a workshop without materials, so the stage never breaks", () => {
    const [first] = getWorkshops("en");
    expect(workshopStage({ ...first, materials: [] }, "en")).toEqual({});
  });
});
