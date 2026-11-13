// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { COPY } from "./demo-cases/audit-vorbereitung-mit-ki/copy";

/**
 * The Workshop 05 deck (both editions) tells the kit's and the demo's story: 16 main slides for 90 minutes and four appendix
 * slides outside the arrow path, the seven scripts in the designed order, every prompt is START-HERE.md's block, the Cyrillic
 * quotes (the evidence wall and the notice) have their translation, every Claude result is either a recorded take with its chip or the labelled empty
 * frame, and the numbers on the slides are the kit's numbers. Built by scripts/workshop05/deck-src/build.mjs (`--check` there
 * catches drift); the word counts, the no-poll rule, motion, visual law and take rendering are held by
 * scripts/__tests__/workshop05-*.test.mjs.
 */

const root = resolve(process.cwd(), "public", "workshops", "audit-vorbereitung-mit-ki");
const kitDir = resolve(process.cwd(), "../../scripts/workshop05/kit");
const kitDirDe = resolve(process.cwd(), "../../scripts/workshop05/kit-de");
const kit = (file: string) => readFileSync(resolve(kitDir, file), "utf8");
const kitDe = (file: string) => readFileSync(resolve(kitDirDe, file), "utf8");
const flat = (text: string) => text.replace(/\s+/g, " ").trim();
const expected = JSON.parse(readFileSync(resolve(process.cwd(), "../../scripts/workshop05/oracle/expected.json"), "utf8")) as {
  rowsRead: number;
  tally: { covered: number; weak: number; gap: number };
  findings: unknown[];
  decoys: unknown[];
  register: { rows: number; expired: unknown[]; expiring: unknown[]; missing: unknown[]; byDate: Record<string, { rows: number; expired: number; expiring: number; missing: number }> };
};

const MAIN_IDS = ["cover", "today", "why", "sectors", "we", "letter", "time", "kit", "step1", "step2", "tests", "step3", "register", "watch", "safety", "close"];
const SCRIPTS = ["deck-keys.js", "deck-stage.js", "scenes.js", "geo.js", "globe.js", "w05-field.js", "w05-scrub.js"];

const EDITIONS = [
  { lang: "de", file: "slides.html", deckId: "audit-vorbereitung-mit-ki", start: () => kitDe("START-HIER.md"), status: { covered: "BELEGT", weak: "SCHWACH", gap: "LÜCKE" }, other: ["COVERED", "WEAK", "GAP"], cover: "erfundener Fall", frame: "noch nicht aufgezeichnet", chip: "aufgezeichnet" },
  { lang: "en", file: "en/slides.html", deckId: "audit-vorbereitung-mit-ki:en", start: () => kit("START-HERE.md"), status: { covered: "COVERED", weak: "WEAK", gap: "GAP" }, other: ["BELEGT", "SCHWACH", "LÜCKE"], cover: "invented case", frame: "not recorded yet", chip: "recorded" },
] as const;

const parse = (file: string) => new DOMParser().parseFromString(readFileSync(resolve(root, file), "utf8"), "text/html");

describe.each(EDITIONS)("W05 deck, $lang edition", (edition) => {
  const doc = parse(edition.file);
  const sections = Array.from(doc.querySelectorAll("deck-stage > section"));
  const main = sections.filter((section) => section.getAttribute("data-kind") === "main");

  it("has 16 main slides for 90 minutes and four appendix slides outside the arrow path", () => {
    expect(doc.documentElement.lang).toBe(edition.lang);
    expect(doc.documentElement.dataset.deckId).toBe(edition.deckId);
    expect(main.map((section) => section.id)).toEqual(MAIN_IDS);
    expect(main.slice(0, 4).map((section) => section.id)).toEqual(["cover", "today", "why", "sectors"]);
    expect(main.reduce((sum, section) => sum + Number(section.getAttribute("data-seconds")), 0)).toBe(5400);
    expect(sections.filter((section) => section.getAttribute("data-kind") === "appendix").map((section) => section.id)).toEqual(["a1", "a2", "a3", "a4"]);
    const notes = JSON.parse(doc.getElementById("speaker-notes")?.textContent ?? "[]") as string[];
    expect(notes).toHaveLength(sections.length);
    expect(notes).toHaveLength(20);
    for (const note of notes) for (const line of ["Time:", "Say:", "Students:", "Cue:", "Remember:"]) expect(note).toContain(line);
  });

  it("loads the shared key contract, the engine runtime, scenes and globe, then the one W05 script", () => {
    const scripts = Array.from(doc.querySelectorAll("script[src]")).map((script) => script.getAttribute("src"));
    const up = edition.lang === "de" ? "./" : "../";
    expect(scripts).toEqual(SCRIPTS.map((name) => `${up}lib/${name}`));
    expect(Array.from(doc.querySelectorAll("script:not([src])")).every((script) => script.getAttribute("type") === "application/json")).toBe(true);
    const sheets = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).map((link) => (link.getAttribute("href") ?? "").split("/").pop());
    expect(sheets).toEqual(["fonts.css", "engine.css", "deck.css", "w05-fx.css"]);
  });

  it("opens on the invented case and names the one company, never the old one", () => {
    const opening = flat(doc.getElementById("cover")?.textContent ?? "");
    expect(opening).toContain(edition.cover);
    const we = flat(doc.getElementById("we")?.textContent ?? "");
    expect(we).toContain("Gradba-Pro");
    const html = readFileSync(resolve(root, edition.file), "utf8");
    expect(flat(doc.body.textContent ?? "")).not.toMatch(/vardar works|tannwald|Vier Tage bis zur Kontrolle/i);
    expect(html).not.toMatch(/vardar works|tannwald|Vier Tage bis zur Kontrolle/i);
  });

  it("has the kit's notice date in the letter slide's text and names no weekday for the visit", () => {
    const notice = kit("notice_DIT_2026-11-23.md");
    expect(notice).toContain("27 November 2026");
    expect(doc.getElementById("clock")).toBeNull();
    const text = flat(doc.body.textContent ?? "");
    expect(text).not.toMatch(/\b(friday|freitag)\b/i);
  });

  it("has Cyrillic quotes on the evidence wall and the letter only, each with its translation beside it", () => {
    const originals = Array.from(main.flatMap((section) => Array.from(section.querySelectorAll(".qd")))).filter((node) => /[\u0400-\u04FF]/.test(flat(node.textContent ?? "")));
    expect(originals.length).toBeGreaterThan(1);
    for (const node of originals) {
      expect(["why", "letter"]).toContain(node.closest("section")?.id);
      expect(node.getAttribute("lang")).toBe("mk");
    }
    expect(originals.filter((node) => node.closest("section")?.id === "letter")).toHaveLength(1);
    for (const id of ["why", "letter"]) {
      const here = originals.filter((node) => node.closest("section")?.id === id).length;
      expect(doc.querySelectorAll(`#${id} .qd-gloss`).length, id).toBeGreaterThanOrEqual(here);
    }
  });

  it("shows the prompts exactly as the start file of its kit edition has them: five cards, step 4 has two", () => {
    const startHere = edition.start();
    const prompts = Array.from(doc.querySelectorAll(".prompt-body"));
    expect(prompts).toHaveLength(5);
    expect(prompts.map((prompt) => prompt.closest("section")?.id)).toEqual(["step1", "step2", "step3", "register", "register"]);
    for (const prompt of prompts) {
      const text = prompt.textContent ?? "";
      expect(text.length).toBeGreaterThan(40);
      // byte for byte: the block of the start file, indented by four spaces there
      const indented = text.split("\n").map((line) => (line === "" ? "" : `    ${line}`)).join("\n");
      expect(startHere, text.slice(0, 40)).toContain(indented);
    }
  });

  it("shows each Claude result as a recorded take with its chip, or as the labelled empty frame, never anything else", () => {
    for (const id of ["step1", "step2", "step3", "register"]) {
      const section = doc.getElementById(id);
      const text = flat(section?.textContent ?? "");
      const takes = section?.querySelectorAll("[data-take]").length ?? 0;
      if (takes > 0) {
        expect(text, id).toContain(edition.chip);
        expect(section?.querySelectorAll(".tk-chip").length, id).toBeGreaterThan(0);
      } else {
        expect(text, id).toContain(edition.frame);
        expect(section?.querySelectorAll(".tk-chip").length, id).toBe(0);
      }
    }
  });

  it("carries the kit's numbers: the status tally, the register counts and the question count", () => {
    const counts = (id: string) => Array.from(doc.querySelectorAll(`#${id} [data-count]`)).map((node) => Number((node.getAttribute("data-count") ?? "").split(",")[1]));
    expect(expected.rowsRead).toBe(693);
    expect(expected.findings).toHaveLength(10);
    expect(expected.decoys).toHaveLength(8);
    // the table counts its rows, the date scrubber counts rows, expired, expiring and missing on each of the three dates
    const dates = Object.values(expected.register.byDate);
    expect(counts("register")).toEqual([expected.register.rows, ...dates.flatMap((x) => [x.rows, x.expired, x.expiring, x.missing])]);
    expect([dates[0]?.expired, dates[0]?.expiring, dates[0]?.missing]).toEqual([expected.register.expired.length, expected.register.expiring.length, expected.register.missing.length]);
    expect([dates[0]?.expired, dates[0]?.expiring, dates[0]?.missing]).toEqual([4, 1, 4]);
    expect(expected.register.rows).toBe(98);
    // the key line of step 2 and step 3 reads the oracle: rows read, findings, checked and the tally
    const step2 = flat(doc.getElementById("step2")?.textContent ?? "");
    expect(step2).toContain(String(expected.rowsRead));
    const step3 = flat(doc.getElementById("step3")?.textContent ?? "");
    for (const n of [expected.tally.covered, expected.tally.weak, expected.tally.gap]) expect(step3).toContain(String(n));
    const kitText = flat(doc.getElementById("kit")?.textContent ?? "");
    expect(kitText).toContain("41");
  });

  it("speaks one language for the statuses and none of the banned words", () => {
    const chips = Array.from(doc.querySelectorAll(".chip")).map((chip) => flat(chip.textContent ?? ""));
    expect(chips.length).toBeGreaterThan(0);
    const statuses = Object.values(edition.status) as string[];
    expect(chips.filter((chip) => statuses.includes(chip)).length).toBeGreaterThan(0);
    for (const word of edition.other) expect(chips).not.toContain(word);
    const html = readFileSync(resolve(root, edition.file), "utf8").replace(/<(p|tr)\b[^>]*data-take=[\s\S]*?<\/\1>/g, "");
    expect(html).not.toMatch(/[‒-―→]/);
    expect(html).not.toMatch(/\b(countdown|stamp|stempel|urgent|dringend|deadline|konform\w*|compliant)\b/i);
    expect(html).not.toMatch(/\/Users\/|\/private\/|mavengence/i);
  });
});

/**
 * One objective, one status rule, one quote rule: the demo's tool card, the kit's START-HERE.md (lines 2 to 4) and the
 * skill carry the same three sentences, so the room, the phone and the visitor's own Claude learn the same thing.
 */
describe("W05 objective lockstep", () => {
  const skill = readFileSync(resolve(process.cwd(), "content/skills/audit-nachweise/SKILL.md"), "utf8");
  // The three rule lines follow the disclaimer and the heading "The rules in one minute"; blank lines and headings are skipped.
  const startLines = (text: string) => text.split("\n").filter((line) => line.trim() !== "" && !line.startsWith("## ")).slice(1, 4).map((line) => line.trim());

  it.each([
    { lang: "de" as const, start: () => kitDe("START-HIER.md") },
    { lang: "en" as const, start: () => kit("START-HERE.md") },
  ])("START-HERE lines 2 to 4 are the demo's $lang objective, status rule and quote rule word for word", ({ lang, start }) => {
    expect(startLines(start())).toEqual([COPY[lang].objective, COPY[lang].tool.status, COPY[lang].tool.rule]);
  });

  it("the skill opens with the German objective and carries the quote rule in both languages", () => {
    const body = skill.slice(skill.indexOf("\n# "));
    const first = flat(body.slice(body.indexOf("\n", 1) + 1).trimStart().split(/\n\s*\n/)[0] ?? "");
    expect(first).toBe(COPY.de.objective);
    expect(flat(skill)).toContain(COPY.en.objective);
    expect(flat(skill)).toContain(COPY.de.tool.rule);
    expect(flat(skill)).toContain(COPY.en.tool.rule);
  });
});
