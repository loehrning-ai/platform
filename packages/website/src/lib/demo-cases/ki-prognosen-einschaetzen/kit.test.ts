import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { formatEuro, formatPercent } from "./format";
import { KIT_COSTS, kitCheck, kitCsv, kitTable } from "./kit";

const KIT = join(__dirname, "../../../../../../scripts/workshop01/kit");
const kitFile = (path: string) => readFileSync(join(KIT, path), "utf8");

describe("the demo's constants are the kit's", () => {
  it("takes the costs from kosten.md and costs.md", () => {
    const de = kitFile("de/daten/kosten.md");
    const en = kitFile("en/data/costs.md");
    for (const value of [KIT_COSTS.fehlmenge, KIT_COSTS.restKantine, KIT_COSTS.restOhne]) {
      expect(de).toContain(formatEuro(value, "de", 2));
      expect(en).toContain(formatEuro(value, "en", 2));
    }
  });

  it("decodes the tool's claim in tool-export.txt", () => {
    const { result } = kitCheck(null, null);
    const accuracy = 1 - (result.tabelle.Prognose?.wape ?? 1);
    expect(kitFile("de/daten/tool-export.txt")).toContain(formatPercent(accuracy, "de").replace(" ", " "));
    expect(kitFile("en/data/tool-export.txt")).toContain(formatPercent(accuracy, "en").replace(" ", " "));
  });

  it("reads 104 weeks of actuals and one plan week", () => {
    const rows = kitTable().rows;
    expect(rows.filter((row) => row.ist !== null)).toHaveLength(104);
    const { check } = kitCheck(KIT_COSTS.fehlmenge, KIT_COSTS.restKantine);
    expect(check.naechste).toBe(rows.length - 1);
  });

  it("puts the solutions' numbers in loesungen.md and solutions.md", () => {
    const { result } = kitCheck(KIT_COSTS.fehlmenge, KIT_COSTS.restKantine);
    const plan = String(result.naechste?.planzahl);
    expect(kitFile("de/loesungen.md")).toContain(plan);
    expect(kitFile("en/solutions.md")).toContain(plan);
    expect(kitFile("de/loesungen.md")).toContain(`${result.regel_frei}`);
  });

  it("ships the English edition with the same numbers and English notes", () => {
    expect(kitCsv("en")).toBe(kitFile("../data/lentil-soup-weekly.csv"));
    expect(kitCsv("de")).toBe(kitFile("../data/linsensuppe-woechentlich.csv"));
    const [de, en] = [kitTable("de").rows, kitTable("en").rows];
    expect(en.map(({ woche, ist, f }) => [woche, ist, f])).toEqual(de.map(({ woche, ist, f }) => [woche, ist, f]));
    expect(kitCsv("en").split("\n")[0]).toBe("week;actual;forecast;note");
    // No German left in the English notes.
    expect(kitCsv("en")).not.toMatch(/[äöüß]|Aktion|ausverkauft|Kantine|Warenwirtschaft/);
    const [a, b] = [kitCheck(KIT_COSTS.fehlmenge, KIT_COSTS.restKantine, "de"), kitCheck(KIT_COSTS.fehlmenge, KIT_COSTS.restKantine, "en")];
    expect(b.result.naechste?.planzahl).toBe(a.result.naechste?.planzahl);
    expect(b.result.regel_frei).toBe(a.result.regel_frei);
  });
});
