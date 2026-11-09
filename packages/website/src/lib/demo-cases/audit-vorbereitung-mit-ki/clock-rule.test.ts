/**
 * The clock of the demo: the working days strictly between the
 * notice (Mon 23 Nov) and the visit, "short" below 2, "unclear" at 2, "fits" from 3. The deck draws no
 * clock of its own any more; this holds the demo to the rule for the three visit days and the printed paper dates.
 */
import { describe, expect, it, vi } from "vitest";
import { clockVerdict, NOTICE_WORKING_DAYS } from "./clock-rule";
import { buildModel } from "./model";
import { weekdayOf } from "./oracle";

vi.mock("server-only", () => ({}));

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
