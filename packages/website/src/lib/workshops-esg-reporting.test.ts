import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ESG_REPORTING_WORKSHOP } from "./workshops-esg-reporting";
import { readZipText } from "./zip/read";

const slug = "esg-berichte-mit-ki";
const publicRoot = resolve(process.cwd(), "public");
const root = resolve(publicRoot, "workshops", slug);
const slides = readFileSync(resolve(root, "slides.html"), "utf8");
const slidesEn = readFileSync(resolve(root, "en/slides.html"), "utf8");
const de = ESG_REPORTING_WORKSHOP.de;
const en = ESG_REPORTING_WORKSHOP.en;
const both = [de, en] as const;

describe("Workshop 04 registry copy (ESG Reporting with AI)", () => {
  it("identifies itself as workshop 04 and uses the reviewed date", () => {
    for (const workshop of both) {
      expect(workshop.slug).toBe(slug);
      expect(workshop.number).toBe("04");
      expect(workshop.topic).toBe("ESG");
      expect(workshop.eyebrow).toBe("Workshop 04 · ESG");
      expect(workshop.summary.length).toBeLessThanOrEqual(160);
      expect(workshop.provenance.data).toBe("synthetic");
      expect(workshop.provenance.reviewedAt).toBe("2026-10-25");
      expect(workshop.caseStudy.isFictional).toBe(true);
      expect(workshop.provenance.liveRunAt).toBeUndefined();
      expect(workshop.provenance.aiOutputsRecordedAt).toBeUndefined();
    }
    expect(de.title).toBe("ESG-Berichte mit KI");
    expect(en.title).toBe("ESG reports with AI");
  });

  it("has the same nine agenda blocks in both locales and follows the run sheet clock", () => {
    const minutes = [5, 3, 6, 10, 7, 7, 5, 11, 6];
    for (const workshop of both) {
      expect(workshop.agendaSource).toBe("deck");
      expect(workshop.agenda.map((item) => item.minutes)).toEqual(minutes);
      expect(workshop.agenda.reduce((sum, item) => sum + item.minutes, 0)).toBe(60);
      expect(workshop.minutesLive).toBe(60);
      expect(workshop.minutesSelfStudy).toBe(90);
    }
    expect(de.agenda).toHaveLength(en.agenda.length);
    expect(en.selfStudyDurationLabel).toBe("solo about 90 min");
  });

  it("links each locale to its own deck and kit edition, and labels the zip with its real size", () => {
    const mainSlides = (html: string) => html.match(/<section class="slide[^"]*" id="[^"]+" data-kind="main"/g) ?? [];
    expect(mainSlides(slides)).toHaveLength(15);
    expect(mainSlides(slidesEn)).toHaveLength(15);
    const files = (workshop: typeof de) => workshop.materials.map((material) => material.href.slice(`/workshops/${slug}/`.length));
    expect(files(de)).toEqual(["slides.html", "crvena-zemja-nachweisprobe.zip"]);
    expect(files(en)).toEqual(["en/slides.html", "crvena-zemja-esg-kit.zip"]);
    expect(de.materials[0]?.language).toBe("de");
    expect(en.materials[0]?.language).toBe("en");
    expect(existsSync(resolve(root, "sheet.html"))).toBe(true);
    for (const workshop of both) {
      expect(workshop.materials[0]?.label).toBe(workshop === de ? "Deck · 15 Folien" : "Deck · 15 slides");
      expect(existsSync(resolve(publicRoot, workshop.materials[0]!.href.slice(1)))).toBe(true);
      for (const material of workshop.materials.slice(1)) {
        const bytes = statSync(resolve(publicRoot, material.href.slice(1))).size;
        expect(material.sizeLabel, material.href).toBe(`${Math.floor(bytes / 1024)} KB`);
      }
    }
  });

  it("opens both decks on the objective, the shared key contract and no partner mark", () => {
    for (const [html, lang] of [[slides, "de"], [slidesEn, "en"]] as const) {
      expect(html).toContain(`<html lang="${lang}"`);
      expect(html).toContain("lib/deck-keys.js");
      expect(html).toContain('class="objective"');
      expect(html).toContain('data-kind="appendix"');
      expect(html).not.toMatch(/logo/i);
    }
    expect(slides).toContain("Jede Antwort, die die Firma verlässt, trägt ihren Nachweis");
    expect(slidesEn).toContain("Every answer that leaves the company carries its evidence");
  });

  it("repeats the kit's own rules and keeps step cards predictive", () => {
    const zipText = (name: string, file: string) =>
      readZipText(new Uint8Array(readFileSync(resolve(root, name))), file)!.replace(/\n\s+/g, " ");
    const instructions = {
      de: zipText("crvena-zemja-nachweisprobe.zip", "crvena-zemja-nachweisprobe/projektanweisungen.md"),
      en: zipText("crvena-zemja-esg-kit.zip", "crvena-zemja-esg-kit/project-instructions.md"),
    };
    for (const [locale, workshop] of [["de", de], ["en", en]] as const) {
      const kit = workshop.kit!;
      expect(kit.fileName).toBe(locale === "de" ? "crvena-zemja-nachweisprobe.zip" : "crvena-zemja-esg-kit.zip");
      expect(workshop.materials[1]?.href.endsWith(`/${kit.fileName}`)).toBe(true);
      expect(kit.stats.map((stat) => stat.value)).toEqual(["13", "5", "3"]);
      expect(kit.steps).toHaveLength(5);
      expect(kit.rules).toHaveLength(3);
      expect(instructions[locale]).toContain(kit.rules[0]);
      expect(instructions[locale]).toContain(kit.rules[1]);
      const statuses = locale === "de" ? ["BELEGT", "SCHWACH", "LÜCKE"] : ["COVERED", "WEAK", "GAP"];
      for (const status of statuses) {
        expect(kit.rules[2]).toContain(status);
        expect(instructions[locale]).toContain(status);
      }
      expect(kit.steps.every((step) => !step.segments && !step.line)).toBe(true);
    }
    expect(en.kit?.steps[1].note).toBe("Decide for each claim yourself first: send or drop.");
    expect(en.kit?.steps[2].input).toBe("Banka Povardarie's screening form for the solar loan.");
    expect(en.kit?.steps[3].note).toBe("Gaps are named, not filled.");
    expect(en.kit?.steps[4].title).toBe("The late invoice");
    expect(en.kit?.howTo).toContain("About 90 minutes the first time");
    expect(de.kit?.contents.map((item) => item.name)).toContain("loesungen/LOESUNGEN.md");
    expect(de.kit?.howTo).toContain("crvena-zemja-esg-kit.zip");
  });

  it("removes answer spoilers from page copy, including descriptions used for metadata", () => {
    const pageCopy = JSON.stringify(both);
    for (const spoiler of [
      /5 of 8/i,
      /5 von 8/i,
      /4 of 7/i,
      /4 von 7/i,
      /5\.0 years/i,
      /5,0 Jahre/i,
      /320\.9/i,
      /320,9/i,
      /15\.8/i,
      /15,8/i,
      /September/i,
      /invoice photo/i,
      /Rechnungsfoto/i,
    ]) {
      expect(pageCopy).not.toMatch(spoiler);
    }
    expect(en.description).toContain("Tim demos Claude live on a projector");
    expect(en.accessNote).toContain("a phone or paper is enough");
    expect(en.kit?.howTo).toContain("About 90 minutes the first time");
    expect(en.caseStudy.metrics).toEqual([
      { label: "Employees", value: "42" },
      { label: "Requests", value: "3" },
      { label: "Company files", value: "13" },
      { label: "Defects in the files", value: "8" },
    ]);
    expect(en.caseStudy.limitationsHeading).toBe("Before you start");
    expect(en.materials[0]?.label).toBe("Deck · 15 slides");
    expect(en.materials[1]?.description).toContain("project-instructions.md");
    expect(en.materials[1]?.description).toContain("ANSWERS.md");
    expect(en.provenance.note).not.toMatch(/prompts were run/i);
  });
});
