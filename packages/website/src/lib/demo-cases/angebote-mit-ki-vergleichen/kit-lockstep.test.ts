import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readZipText } from "@/lib/zip/read";
import { BEATS } from "./beats";
import { DEMO, HORIZON, kitRows, modelAt, PAPER, PAPER_FACTORS, paperFlip, STACK } from "./config";
import { BASIS_TEMPLATE, CASE_CSV, KIT_DATA_PATHS, SECOND_CASE_CSV } from "./kit-data";
import { compute, fmtEur, fmtNumber, parse } from "./stack";

/**
 * Every number the demo shows comes from the kit: the strings it reads are the zip's entries byte for
 * byte, and the figures the kit and the deck print (ANSWERS.md, slides.html) are what the engine computes
 * from them. demo.json's lockstep block names the figures; each is evaluated here.
 */
const ZIP = new Uint8Array(
  readFileSync(path.join(process.cwd(), "public/workshops/angebote-mit-ki-vergleichen/angebote-vergleichen-kit.zip")),
);
const entry = (file: string) => readZipText(ZIP, file);
const answers = entry("angebote-vergleichen-kit/ANSWERS.md") ?? "";
const steps = entry("angebote-vergleichen-kit/schritte.md") ?? "";
const deck = readFileSync(path.join(process.cwd(), "public/workshops/angebote-mit-ki-vergleichen/slides.html"), "utf8");

/** demo.json's lockstep grammar: raw:<option>:<line>, total:<option>[?scale=<line>*<f>&option=<o>], diff:<a>:<b>. */
function lockstep(expression: string): number {
  const rows = kitRows("de");
  const [head, query] = expression.split("?");
  const [kind, a, b] = (head ?? "").split(":");
  let scale = null;
  if (query) {
    const params = new URLSearchParams(query);
    const [line, factor] = (params.get("scale") ?? "").split("*");
    scale = { line: line ?? "", option: params.get("option") ?? undefined, factor: Number(factor) };
  }
  const model = compute(rows, HORIZON, scale, STACK);
  const option = (name: string | undefined) => {
    const found = model.options.find((candidate) => candidate.name === name);
    if (!found) throw new Error(`no offer ${name}`);
    return found;
  };
  if (kind === "raw") return option(a).raw[b ?? ""] ?? Number.NaN;
  if (kind === "total") return option(a).total;
  if (kind === "diff") return option(a).total - option(b).total;
  throw new Error(`unknown lockstep ${expression}`);
}

describe("Workshop 06 demo: the kit in lockstep", () => {
  it("reads the kit's files byte for byte", () => {
    expect(entry(KIT_DATA_PATHS.case)).toBe(CASE_CSV);
    expect(entry(KIT_DATA_PATHS.second)).toBe(SECOND_CASE_CSV);
    expect(entry(KIT_DATA_PATHS.template)).toBe(BASIS_TEMPLATE);
  });

  it("names kit files that exist, for every beat and for demo.json", () => {
    for (const beat of BEATS) if (beat.kitFile) expect(entry(beat.kitFile), beat.id).not.toBeNull();
    for (const file of [DEMO.data, DEMO.own.fixture, ...DEMO.takehome.templates, DEMO.takehome.instructions, DEMO.takehome.prompt, DEMO.takehome.skill]) {
      expect(entry(`angebote-vergleichen-kit/${file}`), file).not.toBeNull();
    }
  });

  it("computes the figures ANSWERS.md and the deck print", () => {
    const expected: Record<string, number> = {
      b_goods: 2080000,
      a_total: 2587200,
      b_total: 2655400,
      c_total: 2491000,
      c_lead: 96200,
      b_over_a: 68200,
      c_total_paper10: 2629000,
    };
    expect(Object.keys(DEMO.lockstep).sort()).toEqual(Object.keys(expected).sort());
    for (const [key, expression] of Object.entries(DEMO.lockstep)) {
      expect(lockstep(expression), key).toBe(expected[key]);
    }
    for (const key of ["b_goods", "a_total", "b_total", "c_total", "c_lead", "b_over_a"]) {
      expect(`${answers}\n${steps}`, key).toContain(fmtEur(Math.abs(expected[key]!), "de"));
    }
    expect(deck).toContain(fmtEur(expected.c_total_paper10!, "de").replace(" €", ""));
  });

  it("ranks by goods first and turns once every line is in", () => {
    const model = modelAt(kitRows("de"), 0);
    expect(model.complete).toBe(true);
    expect(model.byHeadline.map((option) => option.name)).toEqual(["B Poznań", "C Brno", "A Nürnberg"]);
    expect(model.ranked.map((option) => option.name)).toEqual(["C Brno", "A Nürnberg", "B Poznań"]);
    expect(fmtEur(model.headGap, "de")).toBe("2.200 €");
    expect(model.decider).toBe("Ware");
    expect(answers).toContain("Reihenfolge nach Stückpreis: B (0,520 €), C (0,575 €), A (0,660 €).");
    expect(answers).toContain("Reihenfolge geliefert und bezahlt: C (24.910 €), A (25.872 €), B (26.554 €).");
  });

  it("finds the paper index flip from the data, as ANSWERS.md states it", () => {
    const flip = paperFlip(kitRows("de"));
    expect(flip?.rival).toBe("A Nürnberg");
    expect(fmtNumber(flip?.v ?? 0, 2, "de")).toBe("6,97");
    expect(answers).toContain("Bei **6,97 %**");
    expect(PAPER.option).toBe("C Brno");
    expect(PAPER_FACTORS).toEqual([1, 1.018, 1.03, 1.042, 1.06]);
    const at = (stop: number) => modelAt(kitRows("de"), stop);
    expect(at(2).winner.name).toBe("C Brno");
    expect(at(3).winner.name).toBe("A Nürnberg");
    expect(at(4).winner.name).toBe("A Nürnberg");
    expect(at(4).decider).toBe("Fracht");
  });

  it("solves the second case as ANSWERS.md does, and a 0 discount is a line, not a gap", () => {
    const parsed = parse(SECOND_CASE_CSV, "de", STACK);
    expect(parsed.errors).toEqual([]);
    const model = compute(parsed.rows, HORIZON, null, STACK);
    expect(model.complete).toBe(true);
    expect(model.winner.name).toBe("X Kassel");
    expect(fmtEur(model.winner.total, "de")).toBe("9.408 €");
    expect(fmtEur(model.runner.total, "de")).toBe("9.740 €");
    expect(fmtEur(model.gap, "de")).toBe("332 €");
    expect(model.decider).toBe("Fracht");
    expect(answers).toContain("X Kassel kostet im Jahr 9.408 €, Y Leipzig 9.740 €.");
  });
});
