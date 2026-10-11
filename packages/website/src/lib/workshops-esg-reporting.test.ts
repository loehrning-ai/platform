import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ESG_REPORTING_WORKSHOP } from "./workshops-esg-reporting";

const slug = "esg-berichte-mit-ki";
const publicRoot = resolve(process.cwd(), "public");
const root = resolve(publicRoot, "workshops", slug);
const de = ESG_REPORTING_WORKSHOP.de;
const en = ESG_REPORTING_WORKSHOP.en;
const both = [de, en] as const;

const slides = readFileSync(resolve(root, "slides.html"), "utf8");
// The kit zip stores its entries uncompressed, so its text can be read straight from the bytes.
const kitText = readFileSync(resolve(root, "vardar-oak-esg-kit.zip")).toString("utf8");

/** A printed number without its thousands separators, with "." as the decimal point. */
function bare(token: string, locale: "de" | "en"): string {
  return locale === "de" ? token.replace(/\.(?=\d{3}\b)/g, "").replace(",", ".") : token.replace(/,(?=\d{3}\b)/g, "");
}

/** Every number the deck or the kit prints, normalized the same way (deck count-ups included). */
const printed = new Set(
  [...`${slides}\n${kitText}`.replace(/(\d),(?=\d{3}\b)/g, "$1").matchAll(/\d+(?:\.\d+)?/g)].map(([token]) => token),
);

describe("Workshop 04 registry copy (Answer ESG by Friday)", () => {
  it("identifies itself as workshop 04 with the fixed catalogue labels", () => {
    for (const workshop of both) {
      expect(workshop.slug).toBe(slug);
      expect(workshop.number).toBe("04");
      expect(workshop.topic).toBe("ESG");
      expect(workshop.eyebrow).toBe("Workshop 04 · ESG");
      expect(workshop.summary.length).toBeLessThanOrEqual(160);
      expect(workshop.accessNote.split(/(?<=\.)\s+/).length).toBeLessThanOrEqual(2);
      expect(workshop.outcomes.length).toBeGreaterThanOrEqual(3);
      expect(workshop.outcomes.length).toBeLessThanOrEqual(4);
      expect(workshop.notCovered.length).toBeGreaterThanOrEqual(2);
      expect(workshop.notCovered.length).toBeLessThanOrEqual(4);
      expect(workshop.provenance.data).toBe("synthetic");
      expect(workshop.provenance.reviewedAt).toBe("2026-10-11");
      expect(workshop.caseStudy.isFictional).toBe(true);
      // The prompts were pre-run on Claude models; no live session is claimed yet.
      expect(workshop.provenance.liveRunAt).toBeUndefined();
      expect(workshop.provenance.aiOutputsRecordedAt).toBeUndefined();
      expect(workshop.provenance.note).toMatch(/Claude-Modellen|Claude models/);
      expect(workshop.accessNote).toMatch(/Tim/);
    }
    expect(de.title).toBe("ESG-Anfragen bis Freitag beantworten");
    expect(en.title).toBe("Answer ESG by Friday");
    expect(de.duration).toBe("~60 Minuten");
    expect(en.duration).toBe("~60 minutes");
    expect(de.format).not.toBe(en.format);
  });

  it("uses no en or em dashes anywhere", () => {
    for (const workshop of both) expect(JSON.stringify(workshop)).not.toMatch(/[–—]/);
  });

  it("has five to seven steps with the same numbering in both locales", () => {
    for (const workshop of both) {
      expect(workshop.steps.length).toBeGreaterThanOrEqual(5);
      expect(workshop.steps.length).toBeLessThanOrEqual(7);
      for (const step of workshop.steps) {
        for (const field of [step.n, step.title, step.description, step.tool]) expect(field.trim()).not.toBe("");
      }
    }
    expect(de.steps.map((step) => step.n)).toEqual(en.steps.map((step) => step.n));
    expect(de.caseStudy.metrics).toHaveLength(en.caseStudy.metrics.length);
    expect(de.caseStudy.dataLimitations).toHaveLength(en.caseStudy.dataLimitations.length);
  });

  it("follows the deck's 60-minute session with no extra question round", () => {
    for (const workshop of both) {
      expect(workshop.agendaSource).toBe("deck");
      expect(workshop.agenda.map((item) => item.minutes)).toEqual([6, 4, 8, 8, 6, 8, 8, 6, 6]);
      expect(workshop.agenda.every((item) => item.mode === undefined)).toBe(true);
      expect(workshop.minutesLive).toBe(60);
      expect(workshop.materials[0]?.minutes).toBe(60);
    }
    expect(de.agenda).toHaveLength(en.agenda.length);
  });

  it("lists the deck and the kit in both locales, and every file exists", () => {
    const frame = (workshop: typeof de) => workshop.materials.map(({ href, kind, language, role, phase, primary, optional, minutes }) => ({ href, kind, language, role, phase, primary, optional, minutes }));
    expect(frame(de)).toEqual(frame(en));
    expect(en.materials.map((material) => material.href.slice(`/workshops/${slug}/`.length))).toEqual([
      "slides.html",
      "vardar-oak-esg-kit.zip",
    ]);
    for (const workshop of both) {
      expect(workshop.materials.filter((material) => material.primary).map((material) => material.role)).toEqual(["deck"]);
      for (const material of workshop.materials) {
        expect(material.language).toBe("en");
        expect(material.label).not.toMatch(/\(|\)|Englisch|English|öffnen|\bOpen\b/);
        if (material.kind !== "html") expect(material.label).toMatch(/\.(?:zip|csv)$/);
        expect(existsSync(resolve(publicRoot, material.href.slice(1))), material.href).toBe(true);
      }
    }
  });

  it("states the measured kit size", () => {
    const size = statSync(resolve(root, "vardar-oak-esg-kit.zip")).size;
    for (const workshop of both) {
      const kit = workshop.materials.find((material) => material.kind === "zip");
      expect(kit?.sizeLabel).toBe(`${Math.round(size / 1024)} KB`);
    }
  });

  it("names the deck's slide count", () => {
    const count = [...slides.matchAll(/<section\b/g)].length;
    expect(de.materials[0]?.label).toBe(`Deck · ${count} Folien`);
    expect(en.materials[0]?.label).toBe(`Deck · ${count} slides`);
  });

  it("prints only numbers the published deck or kit prints", () => {
    for (const [locale, workshop] of [["de", de], ["en", en]] as const) {
      const text = JSON.stringify(workshop)
        .replace(/\/workshops\/[^"]+/g, "")
        .replace(/"(?:minutes|minutesLive|minutesSelfStudy|value)":\d+/g, "")
        .replace(/"(?:n|number|reviewedAt)":"[^"]*"/g, "")
        .replace(/CO₂e|Workshop 04|START-HERE/g, "");
      for (const [token] of text.matchAll(/\d+(?:[.,]\d+)*/g)) {
        expect(printed.has(bare(token, locale)), `${locale} ${token}`).toBe(true);
      }
    }
  });

  it("keeps the case facts the deck and kit show", () => {
    expect(de.description).toContain("13 von 16");
    expect(de.description).toContain("653,7 MWh");
    expect(de.description).toContain("31. August 2026");
    expect(de.description).toContain("320.000 kWh × 0,75 kg = 240 t CO₂e");
    expect(en.description).toContain("13 of 16");
    expect(en.description).toContain("653.7 MWh");
    expect(en.description).toContain("31 August 2026");
    expect(en.description).toContain("320,000 kWh × 0.75 kg = 240 t CO₂e");
    expect(slides).toContain('data-count="653.7"');
    expect(slides).toContain("Expired 31 Aug 2026");
    expect(slides).toMatch(/data-count="13"[\s\S]*data-count="3"/);
    expect(slides).toMatch(/data-count="9">0<\/span><small>filled from our files<\/small>/);
  });
});
