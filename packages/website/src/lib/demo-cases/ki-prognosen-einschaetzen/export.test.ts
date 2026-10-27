import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TEMPLATE_SLOTS, fillSlots, toResultCsv, toRuleMarkdown, type RuleFill } from "./export";
import { formatCsvNumber, plural } from "./format";
import { KIT_COSTS, kitCheck } from "./kit";

const KIT = join(__dirname, "../../../../../../scripts/workshop01/kit");
const template = (path: string) => readFileSync(join(KIT, path), "utf8");
const WORDS = { yes: "ja", no: "nein", allGreen: "alle grün" } as const;

function fillFor(longestRed: string, system: string | null): RuleFill {
  return {
    reihe: "Linsensuppe 500 ml",
    system,
    messlatte: "wie letzte Woche",
    owner: "Einkauf",
    fehlmenge: KIT_COSTS.fehlmenge,
    rest: KIT_COSTS.restKantine,
    longestRed,
    lampWords: { green: "grün", red: "rot", none: "keine" },
    lampSummary: (green, red) => `${green} grün, ${red} rot`,
  };
}

describe("the numbers in the files the demo hands out", () => {
  it("writes CSV numbers Excel reads as numbers: ASCII minus, no grouping", () => {
    expect(formatCsvNumber(-50.5, "de")).toBe("-50,5");
    expect(formatCsvNumber(-50.5, "en")).toBe("-50.5");
    expect(formatCsvNumber(8300, "de")).toBe("8300");
    expect(formatCsvNumber(1 / 3, "de")).toBe("0,33");
  });

  it("puts no typographic minus into the result CSV", () => {
    const { check } = kitCheck(KIT_COSTS.fehlmenge, KIT_COSTS.restKantine);
    const csv = toResultCsv(check, "de", WORDS);
    expect(csv).not.toContain("−");
    expect(csv).toMatch(/;-\d/);
  });

  it("counts in the singular and the plural", () => {
    const forms = { one: "{count} Woche", many: "{count} Wochen" };
    expect(plural(1, forms)).toBe("1 Woche");
    expect(plural(14, forms)).toBe("14 Wochen");
  });
});

describe("the filled release rule", () => {
  for (const path of ["de/pruefregel.md", "en/release-rule.md"]) {
    it(`${path} has the ${TEMPLATE_SLOTS} slots the fill knows`, () => {
      expect(template(path).match(/\[[^\]\n]*\]/g)).toHaveLength(TEMPLATE_SLOTS);
    });
  }

  it("states this series' longest red run and keeps the system open for an own file", () => {
    const { result } = kitCheck(KIT_COSTS.fehlmenge, KIT_COSTS.restKantine);
    const sentence = "Bei dieser Reihe war die längste rote Strecke 14 Wochen lang.";
    const own = toRuleMarkdown(template("de/pruefregel.md"), result, fillFor(sentence, null), "de");
    expect(own).toContain(sentence);
    expect(own).toContain("[System]");
    // No kit-only facts leak into a visitor's own rule.
    expect(own).not.toMatch(/Linsensuppe blieb|Warenwirtschaft/);
    const kit = toRuleMarkdown(template("de/pruefregel.md"), result, fillFor(sentence, "Prognosemodul"), "de");
    expect(kit).not.toContain("[System]");
    expect(kit).toContain("748");
  });

  it("leaves unfilled brackets for null values", () => {
    expect(fillSlots("[a] und [b]", ["x", null])).toBe("x und [b]");
  });
});

describe("the result CSV never carries a formula", () => {
  it("prefixes a text cell that starts like a formula and leaves numbers alone", async () => {
    const { csvText } = await import("./export");
    expect(csvText("=HYPERLINK(\"x\")")).toBe("'=HYPERLINK(\"x\")");
    expect(csvText("+1 Aktion")).toBe("'+1 Aktion");
    expect(csvText("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvText("Aktion -10 %")).toBe("Aktion -10 %");
  });
});
