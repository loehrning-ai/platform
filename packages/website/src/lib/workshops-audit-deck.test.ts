// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { COPY } from "./demo-cases/audit-vorbereitung-mit-ki/copy";

/**
 * The Workshop 05 deck (both editions) tells the kit's and the demo's story: 26 main slides for 90 minutes and five
 * appendix slides outside the arrow path, the ten scripts in the designed order, every prompt is START-HERE.md's block,
 * every quote that names a kit file is in that file, no Claude result is shown as recorded, and the numbers on the
 * slides are the kit's numbers. Built by scripts/workshop05/deck-src/build.mjs (`--check` there catches drift); the
 * word counts and the polls are held by scripts/__tests__/workshop05-*.test.mjs.
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
};

const MAIN_IDS = ["cover", "doors", "papers", "letter", "clock", "plan", "ghost", "neighbour", "table", "drawer", "tests", "status", "forward", "step1", "step2", "xray", "step3", "ladder", "judge", "visit", "after", "taxsheet", "isosheet", "notmeasured", "transfer", "close"];
const SCRIPTS = ["deck-keys.js", "deck-stage.js", "scenes.js", "geo.js", "globe.js", "w05-tally.js", "w05-clock.js", "w05-matrix.js", "w05-days.js", "w05-gates.js"];

const EDITIONS = [
  { lang: "de", file: "slides.html", deckId: "audit-vorbereitung-mit-ki", start: () => kitDe("START-HIER.md"), status: { covered: "BELEGT", weak: "SCHWACH", gap: "LÜCKE" }, other: ["COVERED", "WEAK", "GAP"], cover: "erfundener Fall", frame: "noch nicht aufgezeichnet" },
  { lang: "en", file: "en/slides.html", deckId: "audit-vorbereitung-mit-ki:en", start: () => kit("START-HERE.md"), status: { covered: "COVERED", weak: "WEAK", gap: "GAP" }, other: ["BELEGT", "SCHWACH", "LÜCKE"], cover: "invented case", frame: "not recorded yet" },
] as const;

const parse = (file: string) => new DOMParser().parseFromString(readFileSync(resolve(root, file), "utf8"), "text/html");

describe.each(EDITIONS)("W05 deck, $lang edition", (edition) => {
  const doc = parse(edition.file);
  const sections = Array.from(doc.querySelectorAll("deck-stage > section"));
  const main = sections.filter((section) => section.getAttribute("data-kind") === "main");

  it("has 26 main slides for 90 minutes and five appendix slides outside the arrow path", () => {
    expect(doc.documentElement.lang).toBe(edition.lang);
    expect(doc.documentElement.dataset.deckId).toBe(edition.deckId);
    expect(main.map((section) => section.id)).toEqual(MAIN_IDS);
    expect(main.reduce((sum, section) => sum + Number(section.getAttribute("data-seconds")), 0)).toBe(5400);
    expect(sections.filter((section) => section.getAttribute("data-kind") === "appendix").map((section) => section.id)).toEqual(["a1", "a2", "a3", "a4", "a5"]);
    const notes = JSON.parse(doc.getElementById("speaker-notes")?.textContent ?? "[]") as string[];
    expect(notes).toHaveLength(sections.length);
    expect(notes).toHaveLength(31);
    for (const note of notes) for (const line of ["Time:", "Say:", "Students:", "Cue:", "Remember:"]) expect(note).toContain(line);
  });

  it("loads the shared key contract, the engine runtime, scenes and globe, then the five W05 scripts in order", () => {
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
    const letter = flat(doc.getElementById("letter")?.textContent ?? "");
    expect(letter).toContain("Gradba-Pro");
    expect(flat(doc.body.textContent ?? "")).not.toMatch(/vardar|tannwald/i);
    const html = readFileSync(resolve(root, edition.file), "utf8");
    expect(html).not.toMatch(/vardar|tannwald/i);
  });

  it("has the clock on the notice date of the kit and the visit as a date, never a weekday", () => {
    expect(doc.querySelector("#clock [data-clock]")?.getAttribute("data-notice")).toBe("2026-11-23");
    const notice = kit("notice_DIT_2026-11-23.md");
    expect(notice).toContain("27 November 2026");
    const text = flat(doc.body.textContent ?? "");
    expect(text).not.toMatch(/\b(friday|freitag)\b/i);
  });

  it("quotes only lines that are in the kit file they name, word for word", () => {
    const named = Array.from(doc.querySelectorAll("[data-file]"));
    for (const quote of named) {
      const file = quote.getAttribute("data-file") as string;
      expect(flat(kit(file)), `${file}: ${flat(quote.textContent ?? "")}`).toContain(flat(quote.textContent ?? ""));
    }
    // Law and court quotes are in their own language and carry a translation; they are not kit text.
    const originals = Array.from(doc.querySelectorAll("#table .qd, #papers .qd, #judge .qd"));
    expect(originals.length).toBeGreaterThan(0);
    for (const original of originals) {
      const text = flat(original.textContent ?? "");
      expect(/[\u0400-\u04FF]/.test(text) || original.getAttribute("lang") === "en", text).toBe(true);
    }
  });

  it("shows the prompts exactly as the start file of its kit edition has them", () => {
    const startHere = flat(edition.start());
    const prompts = Array.from(doc.querySelectorAll(".prompt-body"));
    expect(prompts).toHaveLength(3);
    expect(prompts.map((prompt) => prompt.closest("section")?.id)).toEqual(["step1", "step2", "step3"]);
    for (const prompt of prompts) expect(startHere).toContain(flat(prompt.textContent ?? ""));
  });

  it("shows no Claude result as recorded: three empty frames, no recording folder", () => {
    for (const id of ["step1", "step2", "step3"]) expect(flat(doc.getElementById(id)?.textContent ?? "")).toContain(edition.frame);
    const html = readFileSync(resolve(root, edition.file), "utf8");
    expect(html).not.toMatch(/claude-runs/);
  });

  it("carries the kit's numbers: rows read, findings, checked cells and the status tally", () => {
    const counts = (id: string) => Array.from(doc.querySelectorAll(`#${id} [data-count]`)).map((node) => Number((node.getAttribute("data-count") ?? "").split(",")[1]));
    expect(counts("xray")).toEqual([expected.rowsRead, expected.findings.length, expected.decoys.length]);
    expect(counts("step3")).toEqual([expected.tally.covered, expected.tally.weak, expected.tally.gap]);
    expect(expected.rowsRead).toBe(693);
    expect(flat(doc.getElementById("xray")?.textContent ?? "")).toContain(String(expected.rowsRead));
  });

  it("speaks one language for the statuses and none of the banned words", () => {
    const chips = Array.from(doc.querySelectorAll(".chip")).map((chip) => flat(chip.textContent ?? ""));
    expect(chips.length).toBeGreaterThan(0);
    const statuses = Object.values(edition.status) as string[];
    expect(chips.filter((chip) => statuses.includes(chip)).length).toBeGreaterThan(0);
    for (const word of edition.other) expect(chips).not.toContain(word);
    const html = readFileSync(resolve(root, edition.file), "utf8");
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
  const startLines = (text: string) => text.split("\n").slice(1, 4).map((line) => line.trim());

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
