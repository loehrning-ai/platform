import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ESG_REPORTING_WORKSHOP } from "./workshops-esg-reporting";

const slug = "esg-berichte-mit-ki";
const publicRoot = resolve(process.cwd(), "public");
const root = resolve(publicRoot, "workshops", slug);
const slides = readFileSync(resolve(root, "slides.html"), "utf8");
const de = ESG_REPORTING_WORKSHOP.de;
const en = ESG_REPORTING_WORKSHOP.en;
const both = [de, en] as const;

describe("Workshop 04 registry copy (Answer ESG by Friday)", () => {
  it("identifies itself as workshop 04 and uses the reviewed date", () => {
    for (const workshop of both) {
      expect(workshop.slug).toBe(slug);
      expect(workshop.number).toBe("04");
      expect(workshop.topic).toBe("ESG");
      expect(workshop.eyebrow).toBe("Workshop 04 · ESG");
      expect(workshop.summary.length).toBeLessThanOrEqual(160);
      expect(workshop.provenance.data).toBe("synthetic");
      expect(workshop.provenance.reviewedAt).toBe("2026-10-15");
      expect(workshop.caseStudy.isFictional).toBe(true);
      expect(workshop.provenance.liveRunAt).toBeUndefined();
      expect(workshop.provenance.aiOutputsRecordedAt).toBeUndefined();
    }
    expect(de.title).toBe("ESG-Anfragen bis Freitag beantworten");
    expect(en.title).toBe("Answer ESG by Friday");
  });

  it("has the same nine agenda blocks in both locales and follows the run sheet clock", () => {
    const minutes = [1, 10, 3.5, 6.5, 7, 4, 9, 8, 11];
    for (const workshop of both) {
      expect(workshop.agendaSource).toBe("deck");
      expect(workshop.agenda.map((item) => item.minutes)).toEqual(minutes);
      expect(workshop.agenda.reduce((sum, item) => sum + item.minutes, 0)).toBe(60);
      expect(workshop.minutesLive).toBe(60);
      expect(workshop.minutesSelfStudy).toBe(120);
    }
    expect(de.agenda).toHaveLength(en.agenda.length);
    expect(en.selfStudyDurationLabel).toBe("self-paced about 2 hours (about 30 min once you know Claude)");
  });

  it("lists the deck and kit at the existing URLs and uses the exact supplied ZIP size", () => {
    expect(slides.match(/<section\b/g)).toHaveLength(19);
    expect(en.materials.map((material) => material.href.slice(`/workshops/${slug}/`.length))).toEqual([
      "slides.html",
      "crvena-zemja-esg-kit.zip",
    ]);
    expect(existsSync(resolve(root, "sheet.html"))).toBe(true);
    expect(statSync(resolve(root, "crvena-zemja-esg-kit.zip")).size).toBe(896622);
    for (const workshop of both) {
      expect(workshop.materials[0]?.label).toBe(workshop === de ? "Deck · 19 Folien" : "Deck · 19 slides");
      expect(workshop.materials[1]?.sizeLabel).toBe("875 KB");
    }
  });

  it("matches the supplied kit rules and keeps step cards predictive", () => {
    const expectedEnglishRules = [
      "Only our files. Never invent a number.",
      "Cite the file and line for every fact (line numbers as in a text editor, counting every line). Do every calculation in code, with units.",
      "Missing document: write NOT FOUND and name the document that would prove it. Document exists but is expired, an estimate or in conflict with another file: write NEEDS CHECK and give the reason in one sentence. If a document is missing and another file also conflicts, write NOT FOUND and name the conflict in the reason. A question with several parts gets the status of its weakest part.",
    ];
    expect(en.kit?.rules).toEqual(expectedEnglishRules);
    for (const workshop of both) {
      const kit = workshop.kit!;
      expect(kit.fileName).toBe("crvena-zemja-esg-kit.zip");
      expect(kit.stats.map((stat) => stat.value)).toEqual(["13", "5", "3"]);
      expect(kit.steps).toHaveLength(5);
      expect(kit.rules).toHaveLength(3);
      expect(kit.steps.every((step) => !step.segments && !step.line)).toBe(true);
    }
    expect(en.kit?.steps[0].note).toBe("Your bet first: how many of the 8 questions come back OK? Check it in ANSWERS.md.");
    expect(en.kit?.steps[1].note).toBe("Mark each claim RED, AMBER or GREEN yourself first. The red claims come first.");
    expect(en.kit?.steps[2].input).toBe("Banka Povardarie's screening form for the solar loan.");
    expect(en.kit?.steps[2].action).toBe("Fills in the form as one table, with a source and a status for each field, and works out the payback in code.");
    expect(en.kit?.steps[2].note).toBe("Race Claude: work out the payback with your phone calculator first.");
    expect(en.kit?.steps[3].note).toBe("Gaps are named, not filled.");
    expect(en.kit?.steps[4].title).toBe("One more surprise");
    expect(en.kit?.steps[4].input).toBe("One more document.");
    expect(en.kit?.steps[4].note).toBe("Your bet: which answers change, and which stay the same?");
    expect(en.kit?.howTo).toContain("About 2 hours the first time");
    expect(en.kit?.contents.map((item) => item.name)).toContain("ANSWERS.md");
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
    expect(en.accessNote).toContain("No laptop, no Claude account.");
    expect(en.needs).toContain("About 2 hours at home for the warm-up and five steps. You can stop after any step.");
    expect(en.caseStudy.metrics).toEqual([
      { label: "Employees", value: "42" },
      { label: "Requests", value: "3" },
      { label: "Company files", value: "13" },
      { label: "Hidden traps", value: "7" },
    ]);
    expect(en.caseStudy.limitationsHeading).toBe("Before you start");
    expect(en.materials[0]?.label).toBe("Deck · 19 slides");
    expect(en.materials[1]?.description).toContain("project-instructions.md");
    expect(en.materials[1]?.description).toContain("ANSWERS.md");
    expect(en.provenance.note).not.toMatch(/prompts were run/i);
  });
});
