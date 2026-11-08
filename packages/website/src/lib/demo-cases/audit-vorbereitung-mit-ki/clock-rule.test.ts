/**
 * The clock of the demo and the clock of the deck are one rule: the working days strictly between the
 * notice (Mon 23 Nov) and the visit, "short" below 2, "unclear" at 2, "fits" from 3. The deck's own
 * script is loaded here and held to the demo for the three visit days and for the printed paper dates.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { clockVerdict, NOTICE_WORKING_DAYS } from "./clock-rule";
import { buildModel } from "./model";
import { weekdayOf } from "./oracle";

vi.mock("server-only", () => ({}));

/** The deck script is a classic browser script with a module.exports branch: run it in a bare context. */
function loadDeck() {
  const source = readFileSync(path.join(process.cwd(), "public/workshops/audit-vorbereitung-mit-ki/lib/w05-clock.js"), "utf8");
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(source, sandbox, { filename: "w05-clock.js" });
  return sandbox.module.exports as {
    workingDaysBetween: (notice: string, visit: string) => number;
    verdict: (n: number) => "short" | "unclear" | "fits";
  };
}
const deck = loadDeck();

describe("the clock rule", () => {
  it("is short below two working days, unclear at two, fits from three", () => {
    expect(NOTICE_WORKING_DAYS).toBe(3);
    expect([0, 1, 2, 3, 4].map((n) => clockVerdict(n))).toEqual(["short", "short", "unclear", "fits", "fits"]);
  });

  for (const locale of ["de", "en"] as const) {
    it(`${locale}: the visits on 25, 26 and 27 November count 1, 2 and 3 working days and read short, unclear, fits`, () => {
      const model = buildModel(locale);
      expect(model.clock.map((entry) => entry.visit.slice(8))).toEqual(["25", "26", "27"]);
      expect(model.clock.map((entry) => entry.workingBetween)).toEqual([1, 2, 3]);
      expect(model.clock.map((entry) => clockVerdict(entry.workingBetween, model.needWorking))).toEqual(["short", "unclear", "fits"]);
    });

    it(`${locale}: gives the same count and the same verdict as the deck's script`, () => {
      const model = buildModel(locale);
      for (const entry of model.clock) {
        expect(entry.workingBetween).toBe(deck.workingDaysBetween(model.notice, entry.visit));
        expect(clockVerdict(entry.workingBetween, model.needWorking)).toBe(deck.verdict(entry.workingBetween));
      }
    });

    it(`${locale}: names a paper date only on a Monday to Friday, never a Saturday or a Sunday`, () => {
      const model = buildModel(locale);
      for (const entry of model.clock) {
        const day = weekdayOf(entry.papersDue);
        expect(entry.papersDueOnWorkday, entry.papersDue).toBe(day >= 1 && day <= 5);
      }
      expect(model.clock.map((entry) => entry.papersDueOnWorkday)).toEqual([false, false, true]);
      expect(model.clock[2]?.papersDue).toBe("2026-11-30");
    });
  }
});
