/**
 * W05 on the v4 shell: the beats, the intro, the words shared with the deck and the kit (the four tests,
 * the three statuses), the model the stage draws, the new-paper note, the status bound of the visitor's
 * own papers, and that the copy fills every slot it names.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { validateBeatsV4 } from "@/lib/demo-beats";
import { validateIntro } from "@/lib/demo-intro";
import { formatter } from "@/components/demos/audit-vorbereitung-mit-ki/fmt";
import { BEATS, GUESS_LINES, SCENE_MINUTES } from "./beats";
import { ownStatus, statusOf, TEST_ORDER, type TestId } from "./evidence";
import { fill } from "./fill";
import { INTRO, SHELL, TAKEHOME_IN_STAGE } from "./intro";
import { lineList } from "./lines";
import { buildModel, TODAY_IN_EXERCISE } from "./model";
import { fillNote } from "./note";
import { kitVocab } from "./vocab";
import { SCENE } from "./claude-runs";

vi.mock("server-only", () => ({}));

const ROOT = join(__dirname, "../../../../../../scripts/workshop05");
const startLines = (file: string) => readFileSync(join(ROOT, file), "utf8").split("\n");

describe("beats and intro", () => {
  it("pass the v4 contract", () => {
    expect(validateBeatsV4(BEATS)).toEqual([]);
    expect(validateIntro(INTRO)).toEqual([]);
    expect(SHELL).toBe("v4");
    expect(TAKEHOME_IN_STAGE).toBe(true);
    expect(SCENE).toBeNull();
  });

  it("name no kit file and add up to the minutes of the scenes", () => {
    for (const beat of BEATS) expect(beat).not.toHaveProperty("kitFile");
    expect(BEATS.map((beat) => beat.id)).toEqual(Object.keys(SCENE_MINUTES));
    expect(Object.values(SCENE_MINUTES).reduce((sum, minutes) => sum + minutes, 0)).toBe(8);
  });
});

describe("the words shared with the deck and the kit", () => {
  it("reads the four test words and the three status words from the kit", () => {
    expect(kitVocab("en").test).toEqual({ quote: "QUOTE", date: "PERIOD", scope: "SCOPE", approval: "APPROVAL" });
    expect(kitVocab("de").test).toEqual({ quote: "ZITAT", date: "ZEITRAUM", scope: "UMFANG", approval: "FREIGABE" });
    expect(kitVocab("en").status).toEqual({ covered: "COVERED", weak: "WEAK", gap: "GAP" });
    expect(kitVocab("de").status).toEqual({ covered: "BELEGT", weak: "SCHWACH", gap: "LÜCKE" });
    expect([...TEST_ORDER]).toEqual(["quote", "date", "scope", "approval"]);
  });

  it("holds the objective, the status rule and the quote rule to lines 2 to 4 of the start files", async () => {
    const { COPY } = await import("./copy");
    const en = startLines("kit/START-HERE.md");
    const de = startLines("kit-de/START-HIER.md");
    expect(COPY.en.objective).toBe(en[1]);
    expect(COPY.en.tool.status).toBe(en[2]);
    expect(COPY.en.tool.rule).toBe(en[3]);
    expect(COPY.de.objective).toBe(de[1]);
    expect(COPY.de.tool.status).toBe(de[2]);
    expect(COPY.de.tool.rule).toBe(de[3]);
    expect(COPY.de.tool.status).toMatch(/^BELEGT, SCHWACH oder LÜCKE\./);
    expect(COPY.en.toolSource).toBe("In the kit: project-instructions.md, rules 4 to 9");
  });

  it("gives both languages the same shape and fills no slot with nothing", async () => {
    const { COPY } = await import("./copy");
    const shape = (value: unknown): unknown => (Array.isArray(value) ? value.map(shape) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)])) : typeof value);
    expect(shape(COPY.de)).toEqual(shape(COPY.en));
    expect(fill("{a} and {b}", { a: 1 })).toBe("1 and {b}");
  });
});

describe("status words and the status rule", () => {
  it("follows the weakest test", () => {
    const all = { quote: true, date: true, scope: true, approval: true };
    expect(statusOf(all)).toBe("covered");
    expect(statusOf({ ...all, date: false })).toBe("weak");
    expect(statusOf({ ...all, approval: false })).toBe("weak");
    expect(statusOf({ ...all, quote: false })).toBe("gap");
    expect(statusOf({ ...all, scope: false })).toBe("gap");
    expect(statusOf(all, true)).toBe("gap");
  });

  it("never gives the visitor's own paper the status covered", () => {
    const subsets: TestId[][] = [[], ["quote"], ["quote", "scope"], ["quote", "date", "scope"], ["quote", "date", "scope", "approval"]];
    for (const ticked of subsets) expect(ownStatus(new Set(ticked))).not.toBe("covered");
    expect(ownStatus(new Set(["quote", "date", "scope", "approval"]))).toBe("open");
    expect(ownStatus(new Set(["quote", "scope"]))).toBe("weak");
    expect(ownStatus(new Set())).toBe("gap");
  });
});

describe("the model the stage draws", () => {
  for (const locale of ["en", "de"] as const) {
    const model = buildModel(locale);

    it(`${locale}: carries the oracle's numbers`, () => {
      expect(model.lines).toHaveLength(13);
      expect(model.tally).toEqual({ covered: 2, weak: 1, gap: 10 });
      expect(model.rowsRead).toBe(693);
      expect(model.findings).toBe(10);
      expect(model.checked).toBe(8);
      expect(model.people).toHaveLength(24);
      expect(model.cells).toHaveLength(13);
      expect(model.columns.length).toBeGreaterThan(10);
      expect(model.pay.daysLate).toBe(4);
      expect(model.wrong).toEqual({ over: 12, under: 9 });
    });

    it(`${locale}: counts the clock cases and prints only Monday to Thursday`, () => {
      expect(model.clock.map((entry) => [entry.calendar, entry.workingBetween])).toEqual([[2, 1], [3, 2], [4, 3]]);
      expect(model.clock[2]?.papersDue).toBe("2026-11-30");
      expect(model.clock[2]?.weekday).toBeNull();
      expect(model.week.map((cell) => cell.weekday)).toEqual([1, 2, 3, 4, null]);
      expect(model.today).toBe(TODAY_IN_EXERCISE);
      expect(model.needWorking).toBe(3);
    });

    it(`${locale}: offers the three lines to guess, one of each shape`, () => {
      const guess = GUESS_LINES.map((id) => model.lines.find((line) => line.id === id)?.status);
      expect(guess).toEqual(["covered", "gap", "weak"]);
      expect(lineList(locale)).toHaveLength(13);
    });

    it(`${locale}: writes a sentence for every finding without an open slot`, async () => {
      const { COPY } = await import("./copy");
      const fmt = formatter(COPY[locale]);
      for (const line of model.lines) {
        for (const finding of line.findings) {
          const sentence = fmt.finding(line, finding, model);
          expect(sentence, `${line.id} ${finding.id}`).not.toBe("");
          expect(sentence, `${line.id} ${finding.id}`).not.toMatch(/[{}]/);
        }
      }
    });
  }
});

describe("the new-paper note", () => {
  it("fills the title, the day and the known facts and leaves the rest open", () => {
    const model = buildModel("en");
    const text = fillNote(model.noteTemplate, "en", { title: "Pay date", day: "Thu 26 November 2026", known: "paid late" });
    expect(text).toContain("Title: Pay date");
    expect(text).toContain("Written on: Thu 26 November 2026");
    expect(text).toContain("What is known today: paid late");
    expect(() => fillNote("nothing here", "en", { title: "a", day: "b", known: "c" })).toThrow();
    const de = fillNote(buildModel("de").noteTemplate, "de", { title: "Zahltag", day: "Do 26. November 2026", known: "zu spät" });
    expect(de).toContain("Titel: Zahltag");
  });
});
