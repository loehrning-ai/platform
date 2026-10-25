import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AI_AT_WORK_WORKSHOP } from "./workshops-ai-at-work";

const slug = "ki-im-unternehmen-sicher-nutzen";
const root = resolve(process.cwd(), "public", "workshops", slug);
const kitSource = resolve(process.cwd(), "../../scripts/workshop05/kit");
const slides = readFileSync(resolve(root, "slides.html"), "utf8");
const startHere = readFileSync(resolve(kitSource, "START-HERE.md"), "utf8");
const answers = readFileSync(resolve(kitSource, "ANSWERS.md"), "utf8");
const instructions = readFileSync(resolve(kitSource, "project-instructions.md"), "utf8");
const de = AI_AT_WORK_WORKSHOP.de;
const en = AI_AT_WORK_WORKSHOP.en;
const both = [de, en] as const;

const KIT_FILES = [
  "START-HERE.md",
  "ANSWERS.md",
  "project-instructions.md",
  "customer-email.md",
  "company-notes.md",
  "scenes.md",
  "facts.md",
];

/** Opening tags of the deck's slides with their data attributes. */
function deckSlides() {
  return [...slides.matchAll(/<section\b[^>]*>/g)].map((match) => {
    const attr = (name: string) => new RegExp(`\\sdata-${name}="([^"]*)"`).exec(match[0])?.[1];
    return {
      act: attr("act"),
      label: attr("label"),
      seconds: attr("seconds"),
      note: attr("note"),
      kind: attr("kind"),
    };
  });
}

/** Words the way a reader counts them: tokens with a letter or a digit, no fences or bullet marks. */
function words(text: string): number {
  return text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

/** File names inside a zip, read from its central directory (no unzip needed). */
function zipNames(path: string): string[] {
  const buffer = readFileSync(path);
  let eocd = -1;
  for (let at = buffer.length - 22; at >= 0; at -= 1) {
    if (buffer.readUInt32LE(at) === 0x06054b50) {
      eocd = at;
      break;
    }
  }
  expect(eocd, "zip end record").toBeGreaterThanOrEqual(0);
  const count = buffer.readUInt16LE(eocd + 10);
  let at = buffer.readUInt32LE(eocd + 16);
  const names: string[] = [];
  for (let index = 0; index < count; index += 1) {
    expect(buffer.readUInt32LE(at)).toBe(0x02014b50);
    const nameLength = buffer.readUInt16LE(at + 28);
    const extraLength = buffer.readUInt16LE(at + 30);
    const commentLength = buffer.readUInt16LE(at + 32);
    names.push(buffer.toString("utf8", at + 46, at + 46 + nameLength));
    at += 46 + nameLength + extraLength + commentLength;
  }
  return names;
}

describe("Workshop 05 registry copy (Where Your Data Goes)", () => {
  it("identifies itself as workshop 05, in the new topic, and uses the reviewed date", () => {
    for (const workshop of both) {
      expect(workshop.slug).toBe(slug);
      expect(workshop.number).toBe("05");
      expect(workshop.summary.length).toBeLessThanOrEqual(160);
      expect(workshop.provenance.data).toBe("synthetic");
      expect(workshop.provenance.reviewedAt).toBe("2026-10-18");
      expect(workshop.provenance.liveRunAt).toBeUndefined();
      // Set it only once a dated fallback run of missions 3 and 5 is recorded.
      expect(workshop.provenance.aiOutputsRecordedAt).toBeUndefined();
      expect(workshop.caseStudy.isFictional).toBe(true);
      expect(workshop.outcomes).toHaveLength(3);
      expect(workshop.notCovered.length).toBeGreaterThanOrEqual(2);
      expect(workshop.notCovered.length).toBeLessThanOrEqual(4);
      expect(workshop.accessNote.split(/(?<=\.)\s+/)).toHaveLength(2);
      expect(workshop.needs).toHaveLength(2);
      expect(workshop.duration).toBe(workshop === de ? "~90 Minuten" : "~90 minutes");
    }
    expect(de.topic).toBe("KI im Unternehmen");
    expect(en.topic).toBe("AI at work");
    expect(de.eyebrow).toBe("Workshop 05 · KI im Unternehmen");
    expect(en.eyebrow).toBe("Workshop 05 · AI at work");
    expect(de.title).toBe("Wohin gehen deine Daten?");
    expect(en.title).toBe("Where does your data go?");
    expect(en.question).toBe(
      "What can we truthfully tell our customer about where their data goes when we use AI?",
    );
    expect(de.question).toBe(
      "Was können wir unserem Kunden wahrheitsgemäß sagen, wohin seine Daten gehen, wenn wir KI nutzen?",
    );
    expect(en.selfStudyDurationLabel).toBeUndefined();
    expect(de.selfStudyDurationLabel).toBeUndefined();
  });

  it("has the same twelve agenda blocks in both locales, adds up to 90 and never lets 15 minutes pass with only listening", () => {
    const minutes = [5, 3, 9, 8, 7, 9, 5, 9, 4, 11, 5, 15];
    for (const workshop of both) {
      expect(workshop.agendaSource).toBe("deck");
      expect(workshop.agenda.map((item) => item.minutes)).toEqual(minutes);
      expect(workshop.agenda.reduce((sum, item) => sum + item.minutes, 0)).toBe(90);
      expect(workshop.minutesLive).toBe(90);
      expect(workshop.minutesSelfStudy).toBe(75);
      let listening = 0;
      let longest = 0;
      for (const item of workshop.agenda) {
        listening = item.activity === "listen" ? listening + item.minutes : 0;
        longest = Math.max(longest, listening);
      }
      expect(longest).toBeLessThanOrEqual(15);
      // The page does not render the agenda; the machine surfaces keep the plain list.
      expect(workshop.agenda.every((item) => item.mode === undefined && item.description === undefined)).toBe(true);
    }
    expect(de.agenda.map((item) => item.activity)).toEqual(en.agenda.map((item) => item.activity));
    expect(en.agenda[0].label).toBe("Cold open: the customer's email");
    expect(de.agenda[0].label).toBe("Kaltstart: Die Mail des Kunden");
    expect(en.agenda[11].activity).toBe("listen");
  });

  it("lists the deck and the kit at the published URLs, nothing else, and measures the zip size", () => {
    expect(en.materials.map((material) => material.href.slice(`/workshops/${slug}/`.length))).toEqual([
      "slides.html",
      "ai-at-work-kit.zip",
    ]);
    expect(en.materials.map((material) => [material.role, material.phase])).toEqual([
      ["deck", "during"],
      ["kit", "after"],
    ]);
    expect(en.materials[0].primary).toBe(true);
    expect(en.materials[0].minutes).toBe(75);
    // The deck and the kit page are the whole workshop: no game sheet, letters or field cards.
    for (const gone of ["sheet.html", "lib/audit.js", "lib/audit.css", "assets/proof"]) {
      expect(existsSync(resolve(root, gone)), gone).toBe(false);
    }
    for (const file of ["assets/brainster-logo.svg", "assets/kit-qr.svg", "lib/motion.js", "lib/motion.css", "card-preview.webp"]) {
      expect(existsSync(resolve(root, file)), file).toBe(true);
    }
    const size = statSync(resolve(root, "ai-at-work-kit.zip")).size;
    const measured = size < 1024 * 1024 ? `${Math.round(size / 1024)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
    for (const workshop of both) {
      expect(workshop.materials[0]?.label).toBe(workshop === de ? "Deck · 12 Folien" : "Deck · 12 slides");
      expect(workshop.materials[1]?.label).toBe(workshop === de ? "Claude-Daten-Kit · .zip" : "Claude data kit · .zip");
      expect(workshop.materials[1]?.sizeLabel).toBe(measured);
    }
  });

  it("has twelve main slides and two appendix slides, each with its metadata, on the agenda's minutes", () => {
    const all = deckSlides();
    const main = all.filter((slide) => slide.kind === "main");
    expect(main).toHaveLength(12);
    expect(all.filter((slide) => slide.kind === "appendix")).toHaveLength(2);
    expect(all).toHaveLength(14);
    for (const slide of all) {
      for (const field of ["act", "label", "seconds", "note", "kind"] as const) {
        expect(slide[field], `${slide.label ?? "slide"} ${field}`).toBeTruthy();
      }
    }
    const seconds = main.map((slide) => Number(slide.seconds));
    expect(seconds.reduce((sum, value) => sum + value, 0)).toBe(4500);
    // Agenda item 1 holds slides 1 and 2; items 2 to 11 hold slides 3 to 12; item 12 is the 15 minutes of questions.
    const grouped = [seconds[0] + seconds[1], ...seconds.slice(2)].map((value) => value / 60);
    expect(grouped).toEqual(en.agenda.slice(0, 11).map((item) => item.minutes));
    expect(en.agenda[11].minutes * 60 + seconds.reduce((sum, value) => sum + value, 0)).toBe(90 * 60);
  });

  it("keeps the kit rules equal to project-instructions.md", () => {
    const ruleLines = instructions
      .split("\n")
      .filter((line) => /^Rule [123]\. /.test(line))
      .map((line) => line.replace(/^Rule [123]\. /, ""));
    expect(ruleLines).toHaveLength(3);
    expect(en.kit?.rules).toEqual(ruleLines);
    // The German rules say the same things: the same markers, the same two banned words.
    expect(de.kit?.rules).toHaveLength(3);
    for (const marker of ["NOT IN FILES", "GREEN", "AMBER", "RED", "compliant", "certified"]) {
      expect(de.kit?.rules.join(" "), marker).toContain(marker);
    }
    expect(de.kit?.rules[0]).toContain("Nie raten");
    expect(de.kit?.rules[2]).toContain("Schreibe nie");
  });

  it("matches the kit: seven text files, five missions, three rules, three steps", () => {
    const names = zipNames(resolve(root, "ai-at-work-kit.zip"))
      .filter((name) => !name.endsWith("/"))
      .map((name) => name.split("/").at(-1));
    expect([...names].sort()).toEqual([...KIT_FILES].sort());
    expect(words(startHere)).toBeLessThanOrEqual(700);
    expect(words(answers)).toBeLessThanOrEqual(600);
    expect([...startHere.matchAll(/^## Mission \d/gm)]).toHaveLength(5);
    for (const workshop of both) {
      const kit = workshop.kit!;
      expect(kit.fileName).toBe("ai-at-work-kit.zip");
      expect(kit.stats.map((stat) => stat.value)).toEqual(["7", "3", "3"]);
      expect(kit.steps).toHaveLength(3);
      expect(kit.rules).toHaveLength(3);
      expect(kit.steps.every((step) => !step.segments && !step.line)).toBe(true);
      expect(kit.contents.map((item) => item.name)).toEqual(KIT_FILES);
      // The kit page stays lean: one short line per step cell, a few words per file, one short note.
      const count = (text: string) => text.split(/\s+/).filter(Boolean).length;
      for (const step of kit.steps) {
        for (const line of [step.input, step.action, step.output]) expect(count(line), line).toBeLessThanOrEqual(10);
      }
      for (const item of kit.contents) expect(count(item.description), item.description).toBeLessThanOrEqual(6);
      expect(count(kit.fictionalNote)).toBeLessThanOrEqual(25);
    }
    expect(en.kit?.steps.map((step) => step.title)).toEqual(["Check your account", "Rate what people paste", "Write your page"]);
    expect(en.kit?.steps[2].note).toContain("must not come back GREEN");
    expect(en.steps).toHaveLength(5);
    expect(en.steps.map((step) => step.tool)).toEqual([
      "Mission 1 · Claude chat",
      "Mission 2 · Claude chat",
      "Mission 3 · Claude Project",
      "Mission 4 · Claude Project",
      "Mission 5 · Claude Project",
    ]);
  });

  it("tells the invented case in three lines and keeps the metrics for the accordion", () => {
    expect(en.caseStudy.companyName).toBe("Vardar Works DOOEL");
    expect(de.caseStudy.companyName).toBe("Vardar Works DOOEL");
    expect(en.caseStudy.location).toBe("Skopje");
    expect(en.caseStudy.narrative.split(/(?<=\.)\s+/)).toHaveLength(3);
    expect(en.caseStudy.decisionQuestion).toBe(en.question);
    expect(de.caseStudy.decisionQuestion).toBe(de.question);
    expect(en.caseStudy.metrics).toEqual([
      { label: "Staff", value: "120" },
      { label: "Claude Team seats", value: "25" },
      { label: "Laptops with Claude Desktop", value: "9" },
      { label: "Days to answer", value: "4" },
    ]);
    expect(de.caseStudy.metrics.map((metric) => metric.value)).toEqual(["120", "25", "9", "4"]);
    expect(en.caseStudy.dataLimitations).toEqual([
      "Every name, number and survey result is invented.",
      "Vendor and law lines are real, dated 18 October 2026, and change often. This is not legal advice.",
    ]);
  });

  it("keeps the excluded facts and every compliance claim out of the page copy", () => {
    const strings: string[] = [];
    const collect = (value: unknown) => {
      if (typeof value === "string") strings.push(value);
      else if (Array.isArray(value)) value.forEach(collect);
      else if (value && typeof value === "object") Object.values(value).forEach(collect);
    };
    collect(both);
    const serialized = strings.join("\n");
    for (const excluded of [/OpenAI/, /Samsung/, /Gartner/, /TELUS/, /LayerX/, /Cyberhaven/, /\bIBM\b/, /Eurostat/, /Bußgeld/i, /\bfines\b|\bfined\b|\bpenalt/i, /[$€]\s?\d|\d\s?(?:€|EUR|USD)/]) {
      expect(serialized, String(excluded)).not.toMatch(excluded);
    }
    // "compliant" and "certified" appear only where the copy says not to use them or not to claim them.
    for (const text of strings.filter((line) => /compliant|certified|zertifiziert/i.test(line))) {
      expect(text, text).toMatch(/Never write|Schreibe nie|any statement|die Aussage/);
    }
    expect(en.notCovered[0]).toBe("Legal advice or a seal of approval for your company");
    expect(en.kit?.fictionalNote).toMatch(/not legal advice/i);
    expect(de.kit?.fictionalNote).toMatch(/keine Rechtsberatung/i);
    expect(en.caseStudy.dataLimitations.join(" ")).toContain("dated 18 October 2026");
    expect(de.caseStudy.dataLimitations.join(" ")).toContain("Stand 18. Oktober 2026");
    expect(en.provenance.note).toContain("Bitkom 2025");
  });

  it("states the limits plainly and names no earlier case company", () => {
    for (const workshop of both) expect(workshop.notForYou.length).toBeGreaterThan(20);
    expect(en.notForYou).toContain("legal advice");
    expect(de.notForYou).toContain("Rechtsberatung");
    expect(JSON.stringify(both)).not.toMatch(/Termin Health|Nordgrid|Rheinland/);
  });
});
