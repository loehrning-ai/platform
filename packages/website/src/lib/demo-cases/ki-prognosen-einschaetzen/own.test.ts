import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { KIT_CSV } from "./kit-series";
import { evaluateOwn, LAMP_WEEKS } from "./own";

const OPTIONS = { fehlmenge: null, rest: null, messlatte: "wie letzte Woche" } as const;

describe("the own-data path", () => {
  it("is empty until there is text", () => {
    expect(evaluateOwn("  \n", OPTIONS)).toEqual({ kind: "empty" });
  });

  it("checks the kit file like the kit", () => {
    const own = evaluateOwn(KIT_CSV, { ...OPTIONS, fehlmenge: 1.5, rest: 0.4 });
    expect(own.kind).toBe("ok");
    if (own.kind !== "ok") return;
    expect(own.result.naechste?.planzahl).toBe(748);
    expect(own.lampsReady).toBe(true);
    expect(own.notices.map((n) => n.key)).toContain("duplicate");
    expect(own.manyZeros).toBe(false);
    // The weeks the summary line counts: a forecast, an actual and a rule value.
    const scored = own.check.rows.filter((_, t) => own.check.valid(t) && own.check.forecast(t) !== null && own.check.rule(t) !== null);
    expect(own.forecastWeeks).toBe(scored.length);
  });

  it("scores the simple rules on a sales-only file", () => {
    const text = readFileSync(join(__dirname, "__fixtures__/linsensuppe-nur-ist.csv"), "utf8");
    const own = evaluateOwn(text, OPTIONS);
    expect(own.kind).toBe("ok");
    if (own.kind !== "ok") return;
    expect(own.check.hasForecast).toBe(false);
    expect(own.result.beste_regel).toBe("wie Vorjahreswoche");
    expect(own.result.tabelle["wie Vorjahreswoche"]?.mae).toBeCloseTo(40, 1);
    expect(own.lampsReady).toBe(false);
  });

  it("needs 33 forecast weeks for the lamps", () => {
    expect(LAMP_WEEKS).toBe(33);
    const lines = KIT_CSV.trim().split("\n");
    const short = [lines[0], ...lines.slice(-20)].join("\n");
    const own = evaluateOwn(short, OPTIONS);
    expect(own.kind).toBe("ok");
    if (own.kind !== "ok") return;
    expect(own.forecastWeeks).toBeLessThan(LAMP_WEEKS);
    expect(own.lampsReady).toBe(false);
  });

  it("names one problem and computes nothing from a broken file", () => {
    expect(evaluateOwn("foo;bar\n1;2", OPTIONS)).toEqual({ kind: "problem", problem: { key: "header" } });
    const few = evaluateOwn("woche;ist\n2025-01-06;5\n2025-01-13;6\n2025-01-20;7", OPTIONS);
    expect(few.kind).toBe("problem");
    if (few.kind === "problem") expect(few.problem.key).toBe("tooFew");
  });

  it("refuses a window without sales", () => {
    const rows = Array.from({ length: 30 }, (_, i) => {
      const day = new Date(Date.UTC(2025, 0, 6 + i * 7)).toISOString().slice(0, 10);
      return `${day};0;0`;
    });
    const own = evaluateOwn(["woche;ist;prognose", ...rows].join("\n"), OPTIONS);
    expect(own).toEqual({ kind: "problem", problem: { key: "zeroSales" } });
  });
});
