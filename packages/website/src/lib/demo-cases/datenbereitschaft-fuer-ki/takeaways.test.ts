import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COPY } from "./copy";
import { buildSeries, exampleSeries, type Series } from "./series";

const EXAMPLE = exampleSeries(["Apr", "Mai", "Jun"]);
import { buildTakeaways, joinAll } from "./takeaways";

const KIT = join(__dirname, "../../../../public/workshops/datenbereitschaft-fuer-ki/data-readiness-kit");
const input = { name: "umsatz", table: "", monthLabel: (n: number) => `M${n}` };
const levelSeries: Series = buildSeries({ ...input, values: [334_675, 344_450, 387_015], start: 354_635, kind: "level" });
const unclearSeries: Series = buildSeries({ ...input, values: [5, 900, 40], start: null, kind: "unclear" });

describe("the example", () => {
  const de = buildTakeaways(EXAMPLE, COPY.de);
  const en = buildTakeaways(EXAMPLE, COPY.en);

  it("writes the definition of a level in DE and EN", () => {
    expect(de.definitionText).toBe(
      [
        "Kennzahl: ending_mrr (EUR)",
        "Art: Stand am Monatsende (kein Zuwachs).",
        "Zeilen pro: Monat. Monate: jeder vollständige Monat, hier April bis Juni 2026.",
        "Tabelle: analytics.mrr_summary_monthly.",
        "Nie: Stände über Monate addieren. Prüfung: Stand Vormonat + Veränderung = Stand.",
      ].join("\n"),
    );
    expect(en.definitionText).toBe(
      [
        "Metric: ending_mrr (EUR)",
        "Kind: level at month end (not a change).",
        "Rows per: month. Months: every complete month, here April to June 2026.",
        "Table: analytics.mrr_summary_monthly.",
        "Never: add levels across months. Check: previous level + change = level.",
      ].join("\n"),
    );
  });

  it("writes the careful sentence for the board pack", () => {
    expect(en.board).toBe(
      "Careful before this goes into the board pack: the numbers −19,960, 9,775 and 42,565 add up to 32,380. That is the increase in the quarter, not the level. The level at the end is 387,015 (354,635 + 32,380).",
    );
    expect(de.board).toBe(
      "Vorsicht, bevor das ins Board-Paket geht: Die Zahlen −19.960, 9.775 und 42.565 ergeben zusammen 32.380. Das ist der Zuwachs im Quartal, nicht der Stand. Der Stand am Ende liegt bei 387.015 (354.635 + 32.380).",
    );
  });

  it("asks the question for an AI and for a person", () => {
    expect(de.questionAi).toContain("Ist ending_mrr ein Stand (Wert am Monatsende) oder eine Veränderung");
    expect(de.questionHuman).toBe(
      "Ist ending_mrr ein Stand oder eine Veränderung, und darf ich es über Monate addieren? Aus welcher Tabelle kommt es?",
    );
    expect(en.questionHuman).toContain("Is ending_mrr a level or a change");
  });

  it("joins the three chosen variants under their headings", () => {
    const all = joinAll(COPY.de, de, { yaml: true, human: true });
    expect(all.startsWith("1 Definition\nslug: ending_mrr")).toBe(true);
    expect(all).toContain("\n\n2 Frage\nIst ending_mrr");
    expect(all.endsWith(de.board)).toBe(true);
  });
});

describe("the other readings and the gaps", () => {
  it("states a change and its check when the numbers are changes", () => {
    const series = buildSeries({ ...input, values: [-5, 6, 7], start: null, kind: "change" });
    const take = buildTakeaways(series, COPY.de);
    expect(take.definitionText).toContain("Art: Veränderung im Monat (Zuwachs). Summe über Monate ist erlaubt.");
    expect(take.definitionText).toContain("Prüfung: Stand Vormonat + Veränderung = Stand dieses Monats.");
    expect(take.definitionText).toContain("Tabelle: [Tabelle eintragen].");
    expect(take.board).not.toContain("Der Stand am Ende");
  });

  it("says that adding levels describes nothing, with the computed ratio", () => {
    expect(buildTakeaways(levelSeries, COPY.de).board).toBe(
      "Vorsicht, bevor das ins Board-Paket geht: 334.675, 344.450 und 387.015 sind Stände. Addiert ergäben sie 1.066.140, etwa das 2,75-Fache des letzten Stands, und das beschreibt nichts. Ins Board-Paket gehört der letzte Stand: 387.015.",
    );
    expect(buildTakeaways(levelSeries, COPY.en).board).toContain("about 2.75 times the last level");
  });

  it("asks to clarify when the numbers are unclear", () => {
    expect(buildTakeaways(unclearSeries, COPY.en).board).toContain("I do not know whether 5, 900 and 40 are levels or changes");
    expect(buildTakeaways(unclearSeries, COPY.de).definitionText).toContain("Art: [Stand oder Veränderung eintragen]");
  });
});

describe("the YAML", () => {
  const keys = (yaml: string) => [...yaml.matchAll(/^([a-z_]+):/gm)].map((match) => match[1] as string);
  const kit = readFileSync(join(KIT, "semantic-template/metric.yml"), "utf8");

  it("uses only keys of the kit's metric.yml and snapshot for a level", () => {
    for (const pack of [COPY.de, COPY.en]) {
      const yaml = buildTakeaways(EXAMPLE, pack).definitionYaml;
      for (const key of keys(yaml)) expect(kit, key).toMatch(new RegExp(`^\\s+(- )?${key}:`, "m"));
      expect(yaml).toContain("slug: ending_mrr\nmodel: analytics.mrr_summary_monthly\naggregation: snapshot");
      expect(yaml).toContain("result_grain: monthly\nunit: EUR\nlimitations:\n  - ");
    }
    expect(kit).toContain("aggregation: snapshot");
  });

  it("uses movement without limitations for a change, and quotes a placeholder table", () => {
    const series = buildSeries({ ...input, values: [-5, 6, 7], start: null, kind: "change" });
    const yaml = buildTakeaways(series, COPY.en).definitionYaml;
    expect(yaml).toContain("aggregation: movement");
    expect(yaml).not.toContain("limitations");
    expect(yaml).not.toContain("unit:");
    expect(yaml).toContain('model: "[enter table]"');
  });
});

describe("the sources", () => {
  it("has no em or en dash in any file of the demo", () => {
    for (const file of ["copy-de.ts", "copy-en.ts", "takeaways.ts", "series.ts", "scene.ts"]) {
      expect(readFileSync(join(__dirname, file), "utf8"), file).not.toMatch(/[–—]/);
    }
  });
});

describe("the board sentence follows the reading", () => {
  it("explains the staircase when the lever shows the levels", () => {
    const level = buildTakeaways(EXAMPLE, COPY.de, "level").board;
    expect(level).toContain("Ins Board-Paket gehört der letzte Stand: 387.015");
    expect(buildTakeaways(EXAMPLE, COPY.de, "change").board).toContain("ergeben zusammen 32.380");
    expect(buildTakeaways(EXAMPLE, COPY.en, "level").board).toContain("The last level belongs in the board pack: 387,015");
  });
  it("shows decimals the visitor typed", () => {
    const series = buildSeries({ values: [1.2, 3.4, 5.6], start: null, kind: "change", name: "x", table: "", monthLabel: (n) => `M${n}` });
    expect(buildTakeaways(series, COPY.de).board).toContain("1,2, 3,4 und 5,6 ergeben zusammen 10,2".replace("ergeben zusammen", "ergeben zusammen"));
  });
});

describe("what the board sentence may claim", () => {
  const typed = buildSeries({ ...input, values: [1234.5, 2000, -300], start: null, kind: "change" });

  it("states no end level when the visitor gave no start, whatever the lever shows", () => {
    for (const reading of [null, "change", "level"] as const) {
      const de = buildTakeaways(typed, COPY.de, reading).board;
      const en = buildTakeaways(typed, COPY.en, reading).board;
      expect(de).toBe(
        "Vorsicht, bevor das ins Board-Paket geht: Die Zahlen 1.234,5, 2.000,0 und −300,0 ergeben zusammen 2.934,5. Das ist der Zuwachs im Quartal, nicht der Stand.",
      );
      expect(de).not.toContain("Der Stand am Ende");
      expect(en).toContain("add up to 2,934.5");
      expect(en).not.toContain("The level at the end");
    }
  });

  it("states the end level once a start is given", () => {
    const withStart = buildSeries({ ...input, values: [1234.5, 2000, -300], start: 100, kind: "change" });
    expect(buildTakeaways(withStart, COPY.de, "change").board).toContain("Der Stand am Ende liegt bei 3.034,5 (100,0 + 2.934,5)");
  });

  it("never copies the example's months into the visitor's definition", () => {
    const de = buildTakeaways(typed, COPY.de).definitionText;
    expect(de).toContain("Monate: jeder vollständige Monat, hier die 3 eingegebenen Monate.");
    expect(de).not.toContain("April");
    expect(buildTakeaways(typed, COPY.en).definitionText).toContain("here the 3 months entered");
    expect(buildTakeaways(EXAMPLE, COPY.de).definitionText).toContain("hier April bis Juni 2026");
  });

  it("writes every number of one series with the same decimals", () => {
    const board = buildTakeaways(typed, COPY.de).board;
    expect(board).toContain("1.234,5, 2.000,0 und −300,0");
    expect(board).toContain("2.934,5");
  });
});
