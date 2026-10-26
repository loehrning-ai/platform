import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildModel } from "./demo-cases/audit-vorbereitung-mit-ki/model";

/**
 * The Workshop 05 deck (both editions) tells the kit's and the demo's story: every quoted
 * line is in its kit file, every prompt is START-HERE.md's block, the reality run and the
 * tally are the demo's model, and the numbers on the slides are the kit's numbers.
 * Built by scripts/workshop05/deck-src/build.mjs; `--check` there catches drift.
 */

const root = resolve(process.cwd(), "public", "workshops", "audit-vorbereitung-mit-ki");
const kitDir = resolve(process.cwd(), "../../scripts/workshop05/kit");
const kitDirDe = resolve(process.cwd(), "../../scripts/workshop05/kit-de");
const kit = (file: string) => readFileSync(resolve(kitDir, file), "utf8");
const kitDe = (file: string) => readFileSync(resolve(kitDirDe, file), "utf8");
const flat = (text: string) => text.replace(/\s+/g, " ").trim();

const EDITIONS = [
  { lang: "de", file: "slides.html", deckId: "audit-vorbereitung-mit-ki", start: () => kitDe("START-HIER.md"), status: { covered: "BELEGT", weak: "SCHWACH", gap: "LÜCKE" }, share: "20,8", other: ["COVERED", "WEAK", "GAP"] },
  { lang: "en", file: "en/slides.html", deckId: "audit-vorbereitung-mit-ki:en", start: () => kit("START-HERE.md"), status: { covered: "COVERED", weak: "WEAK", gap: "GAP" }, share: "20.8", other: ["BELEGT", "SCHWACH", "LÜCKE"] },
] as const;

const parse = (file: string) => new DOMParser().parseFromString(readFileSync(resolve(root, file), "utf8"), "text/html");
const model = buildModel();

describe.each(EDITIONS)("W05 deck, $lang edition", (edition) => {
  const doc = parse(edition.file);
  const sections = Array.from(doc.querySelectorAll("deck-stage > section"));
  const main = sections.filter((section) => section.getAttribute("data-kind") === "main");

  it("has eleven main slides for 90 minutes and three appendix slides outside the arrow path", () => {
    expect(doc.documentElement.lang).toBe(edition.lang);
    expect(doc.documentElement.dataset.deckId).toBe(edition.deckId);
    expect(main).toHaveLength(11);
    expect(main.reduce((sum, section) => sum + Number(section.getAttribute("data-seconds")), 0)).toBe(5400);
    expect(sections.filter((section) => section.getAttribute("data-kind") === "appendix").map((section) => section.id)).toEqual(["a1", "a2", "a3"]);
    const notes = JSON.parse(doc.getElementById("speaker-notes")?.textContent ?? "[]") as string[];
    expect(notes).toHaveLength(sections.length);
    for (const note of notes) for (const line of ["Time:", "Say:", "Students:", "Cue:", "Remember:"]) expect(note).toContain(line);
  });

  it("loads the shared key contract before its runtime", () => {
    const scripts = Array.from(doc.querySelectorAll("script[src]")).map((script) => script.getAttribute("src"));
    const up = edition.lang === "de" ? "./" : "../";
    expect(scripts).toEqual([`${up}lib/deck-keys.js`, `${up}lib/scenes.js`, `${up}lib/deck-stage.js`]);
  });

  it("quotes only lines that are in the kit, word for word", () => {
    const quotes = Array.from(doc.querySelectorAll(".q"));
    expect(quotes.length).toBeGreaterThan(10);
    for (const quote of quotes) {
      const file = quote.getAttribute("data-file");
      expect(file, flat(quote.textContent ?? "")).toBeTruthy();
      expect(flat(kit(file as string)), `${file}: ${flat(quote.textContent ?? "")}`).toContain(flat(quote.textContent ?? ""));
    }
  });

  it("shows the prompts exactly as the start file of its kit edition has them", () => {
    const startHere = flat(edition.start());
    const prompts = Array.from(doc.querySelectorAll(".prompt-body"));
    expect(prompts.length).toBeGreaterThanOrEqual(3);
    for (const prompt of prompts) expect(startHere).toContain(flat(prompt.textContent ?? ""));
  });

  it("runs the demo's reality run: the same files, failed tests, statuses and tally", () => {
    const rows = Array.from(doc.querySelectorAll('#mission-2 [data-links="run"] .lk-row'));
    expect(rows.map((row) => row.getAttribute("data-item"))).toEqual(model.rows.map((row) => row.item.id));
    expect(rows.map((row) => row.getAttribute("data-status"))).toEqual(model.rows.map((row) => row.status));
    expect(rows.map((row) => row.getAttribute("data-fails-at") || null)).toEqual(model.rows.map((row) => row.failsAt));
    expect(rows.map((row) => (row.querySelector(".lk-file .fname")?.textContent ?? "").replace(/\s+/g, ""))).toEqual(model.rows.map((row) => row.item.naive));
    const tally = Array.from(doc.querySelectorAll("#mission-2 [data-tally] > span")).map((cell) => flat(cell.textContent ?? "").replace(/(\D)(\d)/, "$1 $2"));
    expect(tally).toEqual([
      `${edition.status.covered} ${model.tally.covered}`,
      `${edition.status.weak} ${model.tally.weak}`,
      `${edition.status.gap} ${model.tally.gap}`,
    ]);
    expect(doc.querySelector("[data-result-title]")?.getAttribute("data-covered")).toBe(String(model.tally.covered));
  });

  it("shows the R7 candidates failing exactly the tests the demo's model fails", () => {
    const cands = Array.from(doc.querySelectorAll("#mission-2 .cand"));
    expect(cands.map((cand) => cand.getAttribute("data-file"))).toEqual(model.r7.map((result) => result.doc.file));
    expect(cands.map((cand) => (cand.getAttribute("data-failed") ?? "").split(" "))).toEqual(model.r7.map((result) => [...result.failed]));
  });

  it("carries the kit's numbers", () => {
    const text = flat(doc.body.textContent ?? "");
    for (const needle of ["8 / 11", "25", "120", edition.share, "114", "89", "295"]) expect(text, needle).toContain(needle);
  });

  it("speaks one language for the statuses and none of the banned words", () => {
    const chips = Array.from(doc.querySelectorAll(".chip")).map((chip) => flat(chip.textContent ?? ""));
    expect(chips.length).toBeGreaterThan(0);
    for (const chip of chips) expect(Object.values(edition.status)).toContain(chip);
    for (const word of edition.other) expect(chips).not.toContain(word);
    const html = readFileSync(resolve(root, edition.file), "utf8");
    expect(html).not.toMatch(/[‒-―]/);
    expect(html).not.toMatch(/\b(countdown|stamp|stempel|urgent|dringend)\b/i);
    expect(html).not.toMatch(/\/Users\/|\/private\//);
  });
});

/**
 * One objective, one status rule, one quote rule: the deck's "four" slide, the demo's tool
 * beat, the kit's START-HERE.md and the skill carry the same three sentences, so the room,
 * the phone and the visitor's own Claude learn the same thing.
 */
describe("W05 objective lockstep", async () => {
  const { COPY } = await import("./demo-cases/audit-vorbereitung-mit-ki/copy");
  const deckCopy = JSON.parse(readFileSync(resolve(process.cwd(), "../../scripts/workshop05/deck-src/deck-copy.json"), "utf8")) as Record<
    "de" | "en",
    { four: { objective: string; tool: readonly string[] } }
  >;
  const skill = readFileSync(resolve(process.cwd(), "content/skills/audit-nachweise/SKILL.md"), "utf8");
  const startHere = flat(kit("START-HERE.md"));

  it.each(["de", "en"] as const)("the demo's %s tool beat says the deck's objective, status rule and quote rule word for word", (lang) => {
    const four = deckCopy[lang].four;
    expect(COPY[lang].objective).toBe(four.objective);
    expect(COPY[lang].tool.status).toBe(four.tool[1]);
    expect(COPY[lang].tool.rule).toBe(four.tool[2]);
    expect(flat(readFileSync(resolve(root, lang === "de" ? "slides.html" : "en/slides.html"), "utf8"))).toContain(four.objective);
  });

  it("the kit and the skill carry the same sentences", () => {
    const en = deckCopy.en.four;
    for (const line of [en.objective, en.tool[1], en.tool[2]]) expect(startHere).toContain(line);
    const de = deckCopy.de.four;
    for (const line of [de.objective, de.tool[1], de.tool[2]]) expect(flat(kitDe("START-HIER.md"))).toContain(line);
    expect(skill).toContain(de.objective);
    expect(skill).toContain(en.objective);
    expect(skill).toContain(deckCopy.de.four.tool[2]);
    expect(skill).toContain(en.tool[2]);
  });
});
