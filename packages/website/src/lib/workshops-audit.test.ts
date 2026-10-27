import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { readZipText } from "./zip/read";
import { AUDIT_WORKSHOP } from "./workshops-audit";

const slug = "audit-vorbereitung-mit-ki";
const root = resolve(process.cwd(), "public", "workshops", slug);
const zipPath = resolve(root, "vardar-audit-kit.zip");
const zipPathDe = resolve(root, "vardar-audit-kit-de.zip");
const kitSource = resolve(process.cwd(), "../../scripts/workshop05/kit");
const kitSourceDe = resolve(process.cwd(), "../../scripts/workshop05/kit-de");
const instructions = readFileSync(resolve(kitSource, "project-instructions.md"), "utf8");
const instructionsDe = readFileSync(resolve(kitSourceDe, "projektanweisungen.md"), "utf8");
const startHere = readFileSync(resolve(kitSource, "START-HERE.md"), "utf8");
const startHier = readFileSync(resolve(kitSourceDe, "START-HIER.md"), "utf8");
const answers = readFileSync(resolve(kitSource, "ANSWERS.md"), "utf8");
const loesungen = readFileSync(resolve(kitSourceDe, "LOESUNGEN.md"), "utf8");
const de = AUDIT_WORKSHOP.de;
const en = AUDIT_WORKSHOP.en;
const both = [de, en] as const;

const KIT_TOP = [
  "START-HERE.md",
  "ANSWERS.md",
  "project-instructions.md",
  "request_tannwald.md",
  "draft-reply.md",
  "folder/",
  "templates/",
  "claude/",
];

const KIT_TOP_DE = [
  "START-HIER.md",
  "LOESUNGEN.md",
  "projektanweisungen.md",
  "request_tannwald.md",
  "draft-reply.md",
  "ordner/",
  "vorlagen/",
  "claude/",
];

/** Per locale: the zip, its root folder, its top-level entries, its instructions, start file and key. */
const EDITION = {
  de: { zip: zipPathDe, root: "vardar-audit-kit-de/", top: KIT_TOP_DE, instructions: instructionsDe, start: startHier, key: loesungen, instructionsFile: "projektanweisungen.md" },
  en: { zip: zipPath, root: "vardar-audit-kit/", top: KIT_TOP, instructions, start: startHere, key: answers, instructionsFile: "project-instructions.md" },
} as const;

/** Every string of the workshop data, for the copy checks. */
function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const inner of value) strings(inner, out);
  else if (value && typeof value === "object") for (const inner of Object.values(value)) strings(inner, out);
  return out;
}

/** File names inside a zip, read from its central directory. */
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
    const nameLength = buffer.readUInt16LE(at + 28);
    const extraLength = buffer.readUInt16LE(at + 30);
    const commentLength = buffer.readUInt16LE(at + 32);
    names.push(buffer.toString("utf8", at + 46, at + 46 + nameLength));
    at += 46 + nameLength + extraLength + commentLength;
  }
  return names;
}

describe("Workshop 05 registry copy (Audit preparation with AI)", () => {
  it("carries the title, teaser and question of the audit workshop", () => {
    expect(en.title).toBe("Audit Preparation with AI: Organize Evidence and Find Gaps");
    expect(de.title).toBe("Audit-Vorbereitung mit KI: Nachweise ordnen, Lücken finden");
    expect(en.summary).toBe("Explore how AI can support audit preparation by organizing documentation.");
    expect(de.summary).toBe("Wie KI hilft, Unterlagen für ein Audit zu ordnen.");
    expect(de.lede).toBe("Du prüfst elf Dateien gegen acht Anforderungen und schreibst die Lückenliste mit zuständiger Person.");
    expect(en.lede).toBe("You test eleven files against eight request items and write the gap list with an owner for each gap.");
    expect(en.question).toBe("Which files in the folder are evidence?");
    expect(de.question).toBe("Welche Dateien im Ordner sind ein Nachweis?");
    for (const workshop of both) {
      expect(workshop.slug).toBe(slug);
      expect(workshop.number).toBe("05");
      expect(workshop.provenance.data).toBe("synthetic");
      expect(workshop.provenance.reviewedAt).toBe("2026-10-25");
      expect(workshop.caseStudy.isFictional).toBe(true);
      expect(workshop.caseStudy.decisionQuestion).toBe(workshop.question);
      expect(workshop.outcomes).toHaveLength(3);
      expect(workshop.accessNote.split(/(?<=\.)\s+/)).toHaveLength(2);
      expect(workshop.caseStudy.narrative.split(/(?<=\.)\s+/)).toHaveLength(3);
    }
  });

  it("has the deck plan's fourteen agenda blocks in both locales, adding up to 90", () => {
    const minutes = [1, 1, 3, 4, 3, 5, 6, 5, 15, 20, 5, 10, 7, 5];
    for (const workshop of both) {
      expect(workshop.agendaSource).toBe("deck");
      expect(workshop.agenda.map((item) => item.minutes)).toEqual(minutes);
      expect(workshop.minutesLive).toBe(90);
      expect(workshop.minutesSelfStudy).toBe(60);
      expect(workshop.agenda.every((item) => item.mode === undefined && item.description === undefined)).toBe(true);
    }
    expect(de.agenda.map((item) => item.activity)).toEqual(en.agenda.map((item) => item.activity));
  });

  it("lists the deck and the kit, and the kit's size is measured", () => {
    expect(en.materials.map((material) => [material.role, material.phase])).toEqual([
      ["deck", "during"],
      ["kit", "after"],
    ]);
    expect(en.materials[1]?.href).toBe(`/workshops/${slug}/vardar-audit-kit.zip`);
    expect(de.materials[1]?.href).toBe(`/workshops/${slug}/vardar-audit-kit-de.zip`);
    for (const workshop of both) {
      const size = statSync(EDITION[workshop === de ? "de" : "en"].zip).size;
      expect(workshop.materials[1]?.sizeLabel).toBe(`${Math.round(size / 1024)} KB`);
      expect(workshop.materials[1]?.href.endsWith(`/${workshop.kit?.fileName}`)).toBe(true);
    }
  });

  it("states the four tests word for word from the project instructions of each edition", () => {
    const tests = (text: string) =>
      text
        .split("\n")
        .filter((line) => /^[4-7]\. /.test(line))
        .map((line) => line.replace(/^\d+\. /, ""));
    expect(tests(instructions)).toHaveLength(4);
    expect(en.kit?.rules).toEqual(tests(instructions));
    expect(de.kit?.rules).toEqual(tests(instructionsDe));
    for (const [index, word] of ["QUOTE", "PERIOD", "SCOPE", "APPROVAL"].entries()) expect(en.kit?.rulesShort?.[index]).toMatch(new RegExp(`^${word}:`));
    for (const [index, word] of ["ZITAT", "ZEITRAUM", "UMFANG", "FREIGABE"].entries()) {
      expect(de.kit?.rules[index]).toMatch(new RegExp(`^${word}:`));
      expect(de.kit?.rulesShort?.[index]).toMatch(new RegExp(`^${word}:`));
    }
    const ruleCount = instructions.split("\n").filter((line) => /^\d+\. /.test(line)).length;
    expect(en.kit?.stats.find((stat) => stat.label === "rules")?.value).toBe(String(ruleCount));
  });

  it.each(["de", "en"] as const)("matches the %s kit: 19 files, three steps, the statuses of the key", (locale) => {
    const edition = EDITION[locale];
    const workshop = AUDIT_WORKSHOP[locale];
    const names = zipNames(edition.zip).filter((name) => !name.endsWith("/"));
    expect(names).toHaveLength(19);
    expect(names.every((name) => name.startsWith(edition.root))).toBe(true);
    const top = new Set(names.map((name) => {
      const rest = name.slice(edition.root.length);
      return rest.includes("/") ? `${rest.split("/")[0]}/` : rest;
    }));
    expect([...top].sort()).toEqual([...edition.top].sort());
    expect(names).toContain(`${edition.root}claude/audit-nachweise/SKILL.md`);
    expect(readZipText(new Uint8Array(readFileSync(edition.zip)), `${edition.root}${edition.instructionsFile}`)).toBe(edition.instructions);
    expect([...edition.start.matchAll(locale === "de" ? /^## Schritt \d/gm : /^## Step \d/gm)]).toHaveLength(3);
    const kit = workshop.kit!;
    expect(workshop.materials[1]?.href.endsWith(`/${kit.fileName}`)).toBe(true);
    expect(kit.stats.map((stat) => stat.value)).toEqual(["19", "3", String(edition.instructions.split("\n").filter((line) => /^\d+\. /.test(line)).length)]);
    expect(kit.contents.map((item) => item.name)).toEqual(edition.top);
    expect(kit.steps.map((step) => step.segments?.map((segment) => segment.value))).toEqual([[8, 3], [2, 1, 5], undefined]);
    const count = (text: string) => text.split(/\s+/).filter(Boolean).length;
    for (const step of kit.steps) {
      for (const line of [step.input, step.action, step.output]) expect(count(line), line).toBeLessThanOrEqual(10);
    }
    for (const item of kit.contents) expect(count(item.description), item.description).toBeLessThanOrEqual(6);
    expect(count(kit.fictionalNote)).toBeLessThanOrEqual(25);
    // The key prints the same tallies the strips show.
    expect(edition.key).toMatch(locale === "de" ? /\b8 von 11\b/ : /\b8 of 11\b/);
    expect(edition.key).toMatch(locale === "de" ? /2 BELEGT, 1 SCHWACH, 5 LÜCKE/ : /2 COVERED, 1 WEAK, 5 GAP/);
  });

  it("keeps the copy plain: no urgency, no boss, no score, no compliance claim", () => {
    const text = strings(both).join("\n");
    for (const banned of [/\bFreitag\b|\bFriday\b/i, /\bChef\b|\bboss\b/i, /\bscore\b|\bPunkte\b/i, /\bStempel\b|\bstamp\b/i, /\bcompliant\b|\bkonform\b/i, /[–—]/, /\bcountdown\b|\bdringend\b|\burgent\b/i]) {
      expect(text, String(banned)).not.toMatch(banned);
    }
    for (const workshop of both) {
      expect(workshop.kit?.fictionalNote).toMatch(/not legal advice|keine Rechtsberatung/i);
    }
  });

  it("names no workshop provider and points at no logo", () => {
    const text = strings(both).join("\n");
    expect(text).not.toMatch(/logo/i);
    const denied = (process.env.PUBLIC_NAME_DENYLIST ?? "").split(",").map((word) => word.trim()).filter(Boolean);
    for (const word of denied) expect(text.toLowerCase()).not.toContain(word.toLowerCase());
  });
});
