import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { readZipText } from "./zip/read";
import { AUDIT_WORKSHOP } from "./workshops-audit";

const slug = "audit-vorbereitung-mit-ki";
const root = resolve(process.cwd(), "public", "workshops", slug);
const zipPath = resolve(root, "gradba-audit-kit.zip");
const zipPathDe = resolve(root, "gradba-audit-kit-de.zip");
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
  "CHANGELOG.md",
  "notice_DIT_2026-11-23.md",
  "checklists/",
  "folder/",
  "cases/",
  "inspector/",
  "templates/",
  "keep-watch/",
  "claude/",
];

const KIT_TOP_DE = [
  "START-HIER.md",
  "LOESUNGEN.md",
  "projektanweisungen.md",
  "AENDERUNGEN.md",
  "mitteilung_DIT_2026-11-23.md",
  "listen/",
  "ordner/",
  "faelle/",
  "inspektor/",
  "vorlagen/",
  "bereit-bleiben/",
  "claude/",
];

/** The deck's main slides in order: their kind (the registry activity) and their minutes. */
const DECK_ACTIVITY = ["listen", "listen", "vote", "vote", "listen", "vote", "listen", "do", "do", "do", "vote", "do", "do", "write", "vote", "vote"];
const DECK_MINUTES = [1, 3, 5, 4, 4, 7, 4, 5, 6, 9, 5, 8, 11, 8, 6, 4];
const DECK_FILE = { de: "slides.html", en: "en/slides.html" } as const;

/** The main slides of a built deck edition: label and minutes, read from its sections. */
function deckSlides(locale: "de" | "en"): { label: string; minutes: number }[] {
  const html = readFileSync(resolve(root, DECK_FILE[locale]), "utf8");
  const unescape = (text: string) => text.replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  return [...html.matchAll(/<section class="slide[^"]*" id="[^"]+" data-kind="main" data-label="([^"]*)" data-seconds="(\d+)"/g)].map((match) => ({
    label: unescape(match[1]),
    minutes: Number(match[2]) / 60,
  }));
}

/** Per locale: the zip, its root folder, its top-level entries, its instructions, start file and key. */
const EDITION = {
  de: { zip: zipPathDe, root: "gradba-audit-kit-de/", top: KIT_TOP_DE, instructions: instructionsDe, start: startHier, key: loesungen, instructionsFile: "projektanweisungen.md" },
  en: { zip: zipPath, root: "gradba-audit-kit/", top: KIT_TOP, instructions, start: startHere, key: answers, instructionsFile: "project-instructions.md" },
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
    // The head before the colon is the plakat head; the old story title lives only inside the story.
    for (const workshop of both) expect(workshop.title).not.toMatch(/Vier Tage bis zur Kontrolle|Four Days Until/i);
    // The teaser names the invented firm, the papers organized with AI and the register.
    expect(en.summary).toMatch(/^An invented firm gets a visit.+papers with AI.+register/);
    expect(de.summary).toMatch(/^Eine erfundene Firma bekommt Besuch.+Papiere mit KI.+Register/);
    for (const workshop of both) expect(workshop.summary.length).toBeLessThanOrEqual(160);
    // The lede opens with the letter on Monday.
    expect(de.lede).toMatch(/^Am Montag kommt ein Brief/);
    expect(en.lede).toMatch(/^On Monday a letter arrives/);
    for (const workshop of both) {
      expect(workshop.description.length).toBeLessThanOrEqual(160);
      expect(workshop.stageExplainer.body).toContain("Claude");
      expect(workshop.stageExplainer.body).toMatch(/90/);
      expect(workshop.needs.join(" ")).toContain("Claude");
      expect(workshop.needs.join(" ")).not.toContain("Codex");
      expect(workshop.stageExplainer.facts).toHaveLength(3);
    }
    expect(de.stageExplainer.facts).toEqual(["41 Dateien", "4 Schritte", "13 Fragen"]);
    expect(en.stageExplainer.facts).toEqual(["41 files", "4 steps", "13 questions"]);
    // The question is the deck's two hands-up prompts and its close, word for word.
    expect(en.question).toBe("Which check could come to you, and would your papers hold up?");
    expect(de.question).toBe("Welche Kontrolle könnte zu dir kommen, und halten deine Papiere?");
    expect(de.caseStudy.companyName).toBe("Gradba-Pro DOOEL");
    expect(en.caseStudy.companyName).toBe("Gradba-Pro DOOEL");
    expect(en.caseStudy.metrics.map((metric) => metric.value)).toEqual(["13", "10", "8", "4"]);
    expect(de.steps).toHaveLength(5);
    expect(en.steps).toHaveLength(5);
    for (const workshop of both) {
      expect(workshop.slug).toBe(slug);
      expect(workshop.number).toBe("05");
      expect(workshop.provenance.data).toBe("synthetic");
      expect(workshop.provenance.reviewedAt).toBe("2026-11-07");
      expect(workshop.caseStudy.isFictional).toBe(true);
      expect(workshop.caseStudy.decisionQuestion).toBe(workshop.question);
      expect(workshop.outcomes).toHaveLength(3);
      expect(workshop.accessNote.split(/(?<=\.)\s+/)).toHaveLength(2);
      // A day number such as "23. November" is not a sentence end.
      expect(workshop.caseStudy.narrative.split(/(?<=\.)(?<!\b\d{1,2}\.)\s+/)).toHaveLength(3);
    }
  });

  it("has one agenda block per main slide of the deck, equal in label, minutes and activity, adding up to 90", () => {
    for (const locale of ["de", "en"] as const) {
      const workshop = AUDIT_WORKSHOP[locale];
      const slides = deckSlides(locale);
      expect(slides).toHaveLength(16);
      expect(workshop.agendaSource).toBe("deck");
      expect(workshop.agenda).toHaveLength(16);
      expect(workshop.agenda.map((item) => item.label)).toEqual(slides.map((slide) => slide.label));
      expect(workshop.agenda.map((item) => item.minutes)).toEqual(slides.map((slide) => slide.minutes));
      expect(workshop.agenda.map((item) => item.minutes)).toEqual(DECK_MINUTES);
      expect(workshop.agenda.map((item) => item.activity)).toEqual(DECK_ACTIVITY);
      expect(workshop.agenda.reduce((sum, item) => sum + item.minutes, 0)).toBe(90);
      expect(workshop.minutesLive).toBe(90);
      expect(workshop.minutesSelfStudy).toBe(90);
      expect(workshop.agenda.every((item) => item.mode === undefined && item.description === undefined)).toBe(true);
    }
    expect(de.agenda.map((item) => item.activity)).toEqual(en.agenda.map((item) => item.activity));
    // The room never listens for more than 15 minutes in a row; the longest run is 4 minutes (cover and today, the case, the lanes).
    let run = 0;
    let longest = 0;
    for (const item of en.agenda) {
      run = item.activity === "listen" ? run + item.minutes : 0;
      longest = Math.max(longest, run);
    }
    expect(longest).toBeLessThanOrEqual(5);
  });

  it("lists the deck and the kit, and the kit's size is measured", () => {
    expect(en.materials.map((material) => [material.role, material.phase])).toEqual([
      ["deck", "during"],
      ["kit", "after"],
    ]);
    expect(en.materials[1]?.href).toBe(`/workshops/${slug}/gradba-audit-kit.zip`);
    expect(de.materials[1]?.href).toBe(`/workshops/${slug}/gradba-audit-kit-de.zip`);
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
    expect(en.kit?.stats.find((stat) => stat.label.startsWith("rules"))?.value).toBe(String(ruleCount));
    // The page numbers the four tests 1 to 4, so its heading names their real place in the file.
    expect(en.kit?.rulesHeading).toMatch(/rules 4 to 7 of 13/);
    expect(de.kit?.rulesHeading).toMatch(/Regeln 4 bis 7 von 13/);
  });

  it.each(["de", "en"] as const)("matches the %s kit: 41 files, 12 entries, four steps, the statuses and the register of the key", (locale) => {
    const edition = EDITION[locale];
    const workshop = AUDIT_WORKSHOP[locale];
    const names = zipNames(edition.zip).filter((name) => !name.endsWith("/"));
    expect(names).toHaveLength(41);
    expect(names.every((name) => name.startsWith(edition.root))).toBe(true);
    const top = new Set(names.map((name) => {
      const rest = name.slice(edition.root.length);
      return rest.includes("/") ? `${rest.split("/")[0]}/` : rest;
    }));
    expect([...top].sort()).toEqual([...edition.top].sort());
    expect(names).toContain(`${edition.root}claude/audit-nachweise/SKILL.md`);
    expect(readZipText(new Uint8Array(readFileSync(edition.zip)), `${edition.root}${edition.instructionsFile}`)).toBe(edition.instructions);
    expect([...edition.start.matchAll(locale === "de" ? /^## Schritt \d/gm : /^## Step \d/gm)]).toHaveLength(4);
    const kit = workshop.kit!;
    expect(workshop.materials[1]?.href.endsWith(`/${kit.fileName}`)).toBe(true);
    expect(kit.stats.map((stat) => stat.value)).toEqual(["41", "4", String(edition.instructions.split("\n").filter((line) => /^\d+\. /.test(line)).length)]);
    expect(kit.contents.map((item) => item.name)).toEqual(edition.top);
    // Predict, then check: the page shows no result bars, the steps ask for a prediction and name the key.
    expect(kit.steps.map((step) => step.segments)).toEqual([undefined, undefined, undefined, undefined]);
    expect(kit.steps[0]?.note).toMatch(locale === "de" ? /voraus, dann prüf es in LOESUNGEN\.md/ : /Predict first, then check ANSWERS\.md/);
    expect(kit.steps[1]?.note).toMatch(locale === "de" ? /Sag es zuerst voraus/ : /Predict first/);
    const count = (text: string) => text.split(/\s+/).filter(Boolean).length;
    // The register line of step 4 is the literal summary line of the key and the deck: DE needs 11 words.
    for (const step of kit.steps) {
      for (const line of [step.input, step.action, step.output]) expect(count(line), line).toBeLessThanOrEqual(step.tag.endsWith("4") ? 11 : 10);
    }
    for (const item of kit.contents) expect(count(item.description), item.description).toBeLessThanOrEqual(6);
    expect(count(kit.fictionalNote)).toBeLessThanOrEqual(25);
    // The key prints the same tallies the strips show.
    expect(edition.key).toMatch(locale === "de" ? /Zählung: 10 Funde, 8 geprüft ohne Befund\./ : /Count: 10 findings, 8 checked, no problem\./);
    expect(edition.key).toMatch(locale === "de" ? /Zählung: 2 BELEGT, 1 SCHWACH, 10 LÜCKE\./ : /Count: 2 COVERED, 1 WEAK, 10 GAP\./);
    // The near-miss list of a run is not stable, so the page promises the key's 8 as a floor.
    expect(kit.steps[1]?.output).toMatch(locale === "de" ? /10 Funde und mindestens 8 geprüft ohne Befund/ : /10 findings and at least 8 checked with no problem/);
    expect(kit.steps[2]?.output).toMatch(locale === "de" ? /2 BELEGT, 1 SCHWACH, 10 LÜCKE/ : /2 COVERED, 1 WEAK, 10 GAP/);
    // Step 4 prints the register's three counts exactly as the key and the deck do.
    const registerLine = locale === "de" ? "register.csv mit 98 Zeilen, 4 abgelaufen, 1 läuft ab, 4 fehlen" : "register.csv with 98 rows, 4 expired, 1 expiring, 4 missing";
    expect(kit.steps[3]?.output).toBe(registerLine);
    expect(edition.key).toContain(locale === "de" ? "Zählung: 98 Zeilen, 4 abgelaufen, 1 läuft ab, 4 fehlen." : "Count: 98 rows, 4 expired, 1 expiring, 4 missing.");
    expect(kit.steps[3]?.note).toMatch(locale === "de" ? /voraus, dann prüf es in LOESUNGEN\.md/ : /Predict first, then check ANSWERS\.md/);
    expect(kit.stepsHeading).toBe(locale === "de" ? "Vier Schritte" : "Four steps");
    expect(kit.contents.find((item) => item.name === (locale === "de" ? "START-HIER.md" : "START-HERE.md"))?.description).toMatch(locale === "de" ? /vier Prompts/ : /four prompts/);  });

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
