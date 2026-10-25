import { describe, expect, it } from "vitest";
import { runCheck } from "./check";
import { baselinePin, causeBefore, chances, dataGap, longestRun, planErrors, rangeSplit, redRuns, runningHits, runningMeans } from "./derive";
import { KIT_CSV } from "./kit-series";
import { parseTable } from "./parse";

function kit(fehlmenge = 1.5, rest = 0.4) {
  const parsed = parseTable(KIT_CSV);
  if (!parsed.ok) throw new Error("kit CSV does not parse");
  const outcome = runCheck(parsed.rows, { fehlmenge, rest, messlatte: "wie letzte Woche" });
  if (!outcome.ok) throw new Error("kit CSV does not check");
  return outcome;
}

describe("the stage points at computed weeks (kit)", () => {
  const { check, result } = kit();

  it("pins the promotion in the baseline beat", () => {
    const pin = baselinePin(check);
    expect(pin?.woche).toBe("2025-05-12");
    expect(pin?.ruleError).toBe(167);
    expect(pin?.forecastError).toBe(34);
  });

  it("finds the red runs of the rule strip", () => {
    const runs = redRuns(check);
    const longest = longestRun(runs);
    expect(longest && check.rows[longest.from]?.woche).toBe("2025-04-21");
    expect(longest && check.rows[longest.to]?.woche).toBe("2025-07-21");
    expect(longest && longest.to - longest.from + 1).toBe(14);
    expect(runs.reduce((n, run) => n + run.to - run.from + 1, 0)).toBe(15);
    expect(check.rows[runs[0]!.from]?.woche).toBe("2025-02-03");
    expect(runs[0]!.lamps).toEqual(["daten"]);
    expect(dataGap(check, runs[0]!.from)).toBe("prognose");
  });

  it("names only the lamps red in every week of a run, the others apart", () => {
    const longest = longestRun(redRuns(check))!;
    // Bias and range stay red for all 14 weeks; the Messlatte lamp only on 28.04.
    expect(longest.lamps).toEqual(["bias", "spanne"]);
    expect(longest.extra.map(({ key, weeks }) => [key, weeks.map((t) => check.rows[t]?.woche)])).toEqual([
      ["messlatte", ["2025-04-28"]],
    ]);
    for (const t of check.streifen.filter((week) => week >= longest.from && week <= longest.to)) {
      const lamps = check.lamps(t)!;
      for (const key of longest.lamps) expect(lamps[key], `${check.rows[t]?.woche} ${key}`).toBe(false);
    }
  });

  it("splits the range hits at the delisting", () => {
    const run = longestRun(redRuns(check))!;
    const cause = causeBefore(check, run.from);
    expect(cause?.woche).toBe("2025-04-07");
    expect(run.from - (cause?.t ?? 0)).toBe(2);
    const split = rangeSplit(check, cause)!;
    expect(split.before).toEqual({ hits: 9, weeks: 12 });
    expect(split.after).toEqual({ hits: 27, weeks: 38 });
    expect(split.misses).toBe(14);
    expect(split.missesAfter).toBe(11);
  });

  it("counts the replay up to the final tallies", () => {
    const means = runningMeans(check, check.wochen.length);
    expect(means.forecast).toBeCloseTo(33.26, 2);
    expect(means.rule).toBeCloseTo(42.24, 2);
    expect(runningMeans(check, 0)).toEqual({ forecast: 0, rule: 0 });
    expect(runningHits(check, 50)).toBe(36);
  });

  it("has the chance lines", () => {
    const c = chances(result);
    expect(Math.round(c.year * 100)).toBe(11);
    expect(Math.round(c.lamp * 1000) / 10).toBe(9.9);
  });

  it("sorts the 26 errors behind the planning number", () => {
    const { errors, buffer } = planErrors(check, result);
    expect(errors).toHaveLength(26);
    expect(buffer).toBe(19);
    expect(errors.filter((e) => e > (buffer as number))).toHaveLength(5);
    expect(errors.filter((e) => e < (buffer as number))).toHaveLength(19);
  });

  it("picks the forecast itself without the canteen", () => {
    const other = kit(1.5, 1.6);
    expect(other.result.naechste?.planzahl).toBe(729);
    expect(planErrors(other.check, other.result).buffer).toBe(0);
  });
});
