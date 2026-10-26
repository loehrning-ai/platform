import { describe, expect, it } from "vitest";
import { getWorkshops } from "@/lib/workshops";
import { materialMeta, workshopStage } from "./workshop-stage";

/**
 * The expected cards per workshop: slides (or the lab where there is no deck)
 * and kit. The demo is never card A, only card A's secondary link.
 */
const EXPECTED: Readonly<Record<string, { a: "slides" | "lab"; b: "kit" | "case"; kitPage: boolean }>> = {
  // Workshop 01 has no slide deck: its labs play that part.
  "ki-prognosen-einschaetzen": { a: "lab", b: "kit", kitPage: true },
  "geschaeftsberichte-mit-ki-lesen": { a: "slides", b: "kit", kitPage: false },
  "datenbereitschaft-fuer-ki": { a: "slides", b: "kit", kitPage: false },
  "esg-berichte-mit-ki": { a: "slides", b: "kit", kitPage: true },
  "audit-vorbereitung-mit-ki": { a: "slides", b: "kit", kitPage: true },
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
        expect(stage.a?.material.role).not.toBe("demo");
        expect(stage.a?.demoHref).toBe(workshop.materials.find((material) => material.role === "demo")?.href);
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

  it("gives every deck card minutes, never just the page language, and a lab or case card its time alone", () => {
    for (const locale of ["de", "en"] as const) {
      for (const workshop of getWorkshops(locale)) {
        const stage = workshopStage(workshop, locale);
        const unit = locale === "de" ? "Min." : "min";
        if (stage.a?.kind === "slides") {
          const other = locale === "de" ? "auf Englisch" : "in German";
          const note = stage.a.material.language === locale ? "" : ` · ${other}`;
          expect(stage.a.meta, `${locale}/${workshop.slug}`).toMatch(new RegExp(`^Deck · (?:ca\\. |about )?\\d+ ${unit.replace(".", "\\.")}${note}$`));
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

  it("names the deck's language on its card only when it differs from the page", () => {
    const deckLanguages = (locale: "de" | "en") =>
      getWorkshops(locale).flatMap((workshop) => {
        const a = workshopStage(workshop, locale).a;
        return a?.kind === "slides" ? [[a.material.language, a.meta] as const] : [];
      });
    const de = deckLanguages("de");
    expect(de.some(([language]) => language === "en"), "a German page links an English-only deck").toBe(true);
    for (const [language, meta] of de) expect(meta.endsWith(" · auf Englisch")).toBe(language === "en");
    for (const [language, meta] of deckLanguages("en")) expect(meta.endsWith(" · in German")).toBe(language === "de");
  });

  it("formats a material as format and size, falling back to the language for a page", () => {
    const [w05] = getWorkshops("de").filter((workshop) => workshop.slug === "audit-vorbereitung-mit-ki");
    expect(materialMeta(w05.materials.find((material) => material.kind === "zip")!)).toBe("ZIP · 43 KB");
    // The German page links the German edition of the deck.
    expect(materialMeta(w05.materials.find((material) => material.kind === "html")!)).toBe("HTML · DE");
  });

  it("returns no card for a workshop without materials, so the stage never breaks", () => {
    const [first] = getWorkshops("en");
    expect(workshopStage({ ...first, materials: [] }, "en")).toEqual({});
  });
});
