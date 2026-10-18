import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AUDIT_PREP_WORKSHOP } from "./workshops-audit-prep";

const slug = "audit-vorbereitung-mit-ki";
const root = resolve(process.cwd(), "public", "workshops", slug);
const kitSource = resolve(process.cwd(), "../../scripts/workshop05/kit");
const slides = readFileSync(resolve(root, "slides.html"), "utf8");
const startHere = readFileSync(resolve(kitSource, "START-HERE.md"), "utf8");
const instructions = readFileSync(resolve(kitSource, "project-instructions.md"), "utf8");
const de = AUDIT_PREP_WORKSHOP.de;
const en = AUDIT_PREP_WORKSHOP.en;
const both = [de, en] as const;

const unescape = (html: string) =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

/** The fenced prompt blocks of START-HERE.md, in file order. */
function startHerePrompts(): string[] {
  return [...startHere.matchAll(/```\n([\s\S]*?)```/g)].map((match) => match[1].trim());
}

describe("Workshop 05 registry copy (Audit Preparation with AI)", () => {
  it("identifies itself as workshop 05 and uses the reviewed date", () => {
    for (const workshop of both) {
      expect(workshop.slug).toBe(slug);
      expect(workshop.number).toBe("05");
      expect(workshop.topic).toBe("Audit");
      expect(workshop.eyebrow).toBe("Workshop 05 · Audit");
      expect(workshop.summary.length).toBeLessThanOrEqual(160);
      expect(workshop.provenance.data).toBe("synthetic");
      expect(workshop.provenance.reviewedAt).toBe("2026-10-18");
      expect(workshop.caseStudy.isFictional).toBe(true);
      expect(workshop.provenance.liveRunAt).toBeUndefined();
      expect(workshop.provenance.aiOutputsRecordedAt).toBeUndefined();
      expect(workshop.outcomes.length).toBeGreaterThanOrEqual(3);
      expect(workshop.notCovered.length).toBeGreaterThanOrEqual(2);
      expect(workshop.notCovered.length).toBeLessThanOrEqual(4);
    }
    expect(de.title).toBe("Audit-Vorbereitung mit KI: Belege ordnen und Lücken finden");
    expect(en.title).toBe("Audit Preparation with AI: Organize Evidence and Find Gaps");
  });

  it("has the same ten agenda blocks in both locales, adds up to 60 and never lets 15 minutes pass with only listening", () => {
    const minutes = [1, 9, 3, 7, 6, 5, 8, 6, 7, 8];
    for (const workshop of both) {
      expect(workshop.agendaSource).toBe("deck");
      expect(workshop.agenda.map((item) => item.minutes)).toEqual(minutes);
      expect(workshop.agenda.reduce((sum, item) => sum + item.minutes, 0)).toBe(60);
      expect(workshop.minutesLive).toBe(60);
      expect(workshop.minutesSelfStudy).toBe(120);
      expect(workshop.agenda.every((item) => item.activity !== "listen")).toBe(true);
    }
    expect(de.agenda.map((item) => item.activity)).toEqual(en.agenda.map((item) => item.activity));
    expect(en.selfStudyDurationLabel).toBe("about 2 hours the first time");
  });

  it("lists the deck and kit at the published URLs and uses the exact ZIP size", () => {
    expect(slides.match(/<section\b/g)).toHaveLength(19);
    const notes = JSON.parse(/<script type="application\/json" id="speaker-notes">([\s\S]*?)<\/script>/.exec(slides)![1]) as string[];
    expect(notes).toHaveLength(19);
    expect(en.materials.map((material) => material.href.slice(`/workshops/${slug}/`.length))).toEqual([
      "slides.html",
      "termin-health-audit-kit.zip",
    ]);
    for (const file of ["sheet.html", "assets/brainster-logo.svg", "assets/kit-qr.svg", "assets/proof/nordgrid-invoice.png"]) {
      expect(existsSync(resolve(root, file)), file).toBe(true);
    }
    expect(statSync(resolve(root, "termin-health-audit-kit.zip")).size).toBe(706369);
    for (const workshop of both) {
      expect(workshop.materials[0]?.label).toBe(workshop === de ? "Deck · 19 Folien" : "Deck · 19 slides");
      expect(workshop.materials[1]?.sizeLabel).toBe("690 KB");
    }
  });

  it("keeps the kit rules equal to project-instructions.md and the deck's prompt cards equal to the kit", () => {
    const ruleLines = instructions.split("\n").filter((line) => /^[123]\. /.test(line)).map((line) => line.slice(3));
    expect(ruleLines).toHaveLength(3);
    expect(en.kit?.rules).toEqual(ruleLines);
    // the German rules follow the same source: same status words, same colours, same quoted markers, no line numbers
    expect(de.kit?.rules).toHaveLength(3);
    for (const word of ["COVERED", "WEAK", "GAP", "RED", "AMBER", "GREEN", "pending", "none", "not done"]) {
      expect(de.kit?.rules[2].split(word).length, word).toBe(ruleLines[2].split(word).length);
    }
    expect(de.kit?.rules[2]).toContain("fehlende oder alte Teil");
    expect(de.kit?.rules[1]).toContain("Nie Zeilennummern");
    expect(ruleLines[1]).toContain("Never cite line numbers");
    expect(ruleLines[2]).not.toMatch(/\bline\b/);
    const norm = (text: string) => text.replace(/\s+/g, " ").trim();
    const cards = [...slides.matchAll(/<p class="(prompt )?pc-body"[^>]*>([\s\S]*?)<\/p>/g)].map((match) => ({ isPrompt: Boolean(match[1]), text: norm(unescape(match[2])) }));
    // the setup card carries the project instructions, with the two hidden lines inside it
    const setup = cards.find((card) => !card.isPrompt)!;
    expect(setup.text).toBe(norm(instructions));
    const fences = startHerePrompts();
    const pick = (match: (text: string) => boolean) => {
      const found = fences.filter(match);
      expect(found).toHaveLength(1);
      return found[0];
    };
    // the optional bonus prompt and the Monday template are not on a deck card
    const kitPrompts = [
      pick((text) => text.startsWith("Answer the audit document request")),
      pick((text) => text.startsWith("Check the seven claims")),
      pick((text) => text.startsWith("Trace patient P-48213")),
      pick((text) => text.startsWith("The three attached files are this week's requests.")),
      pick((text) => text.startsWith("I attached an invoice from Nordgrid Cloud AB. Read it first.")),
    ].map(norm);
    expect(cards.filter((card) => card.isPrompt).map((card) => card.text)).toEqual(kitPrompts);
    // the status words are the same single rule in the guide, and no prompt asks for a line number
    for (const prompt of kitPrompts) expect(prompt).not.toMatch(/\bline\b/i);
    for (const sentence of ruleLines[2].split(/(?<=\.) /)) {
      expect(startHere.replace(/\*\*/g, "").replace(/\n- /g, " "), sentence).toContain(sentence.replace(/^(Several parts|Claims): /, ""));
    }
  });

  it("matches the kit contents and keeps step cards predictive", () => {
    for (const workshop of both) {
      const kit = workshop.kit!;
      expect(kit.fileName).toBe("termin-health-audit-kit.zip");
      expect(kit.stats.map((stat) => stat.value)).toEqual(["13", "5", "3"]);
      expect(kit.steps).toHaveLength(5);
      expect(kit.rules).toHaveLength(3);
      expect(kit.steps.every((step) => !step.segments && !step.line)).toBe(true);
    }
    expect(en.kit?.steps[0].note).toBe("Your bet first: how many of the 8 items come back COVERED? Check it in ANSWERS.md.");
    expect(en.kit?.steps[4].note).toBe("Your bet: does a status change, or only a reason?");
    expect(en.kit?.contents.map((item) => item.name)).toEqual([
      "START-HERE.md",
      "ANSWERS.md",
      "project-instructions.md",
      "project-files/",
      "inbox/",
    ]);
  });

  it("removes answer spoilers from page copy, including descriptions used for metadata", () => {
    const pageCopy = JSON.stringify(both);
    for (const spoiler of [
      /3 of 8/i,
      /3 von 8/i,
      /\b231\b/,
      /US-East/i,
      /Ashburn/i,
      /83[.,]9/,
      /61[.,]3/,
      /us-central/i,
      /Nordgrid/i,
      /Rechnungsfoto/i,
      /invoice photo/i,
    ]) {
      // the kit's own file listing may name the photo; page copy outside the materials and the kit block may not
      const outside = JSON.stringify(both.map(({ materials: _m, kit: _k, steps: _s, ...rest }) => rest));
      expect(outside).not.toMatch(spoiler);
    }
    expect(pageCopy).not.toMatch(/prompts were run/i);
    expect(en.description).toContain("Tim demos Claude live on a projector");
    expect(en.accessNote).toContain("no laptop or Claude account needed.");
    expect(en.caseStudy.metrics).toEqual([
      { label: "Employees", value: "31" },
      { label: "Clinics", value: "46" },
      { label: "Company files", value: "13" },
      { label: "Hidden traps", value: "7" },
    ]);
  });

  it("states the company, laws and certification limits plainly", () => {
    for (const workshop of both) {
      expect(workshop.notForYou.length).toBeGreaterThan(20);
    }
    expect(en.kit?.fictionalNote).toContain("certifies nothing");
    expect(de.kit?.fictionalNote).toContain("bescheinigt nichts");
  });
});
