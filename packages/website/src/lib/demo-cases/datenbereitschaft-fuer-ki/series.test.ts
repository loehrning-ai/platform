import { describe, expect, it } from "vitest";
import { classify } from "./classify";
import { formatCompact, formatMoney, formatNumber } from "./format";
import { EMPTY_FIELDS, readFields } from "./input";
import { sceneAt } from "./scene";
import { arithmetic, buildSeries, exampleSeries, FACTS, firstChangeUnknown, formatters, frameFor, operate, ratio, staircase, type OpId, type Reading } from "./series";

const EXAMPLE = exampleSeries(["Apr", "Mai", "Jun"]);

const cell = (reading: Reading, op: OpId) => {
  const result = operate(EXAMPLE, reading, op);
  return result && { value: result.value, verdict: result.verdict, recorded: result.recorded };
};

describe("the example, recomputed from the workshop numbers", () => {
  it("adds the Q2 changes to the growth of the quarter", () => {
    expect(FACTS.sumChanges).toBe(32_380);
    expect(FACTS.sumChanges).toBe(387_015 - 354_635);
  });

  it("fills the operator table with the exact cells", () => {
    expect(cell("change", "sum")).toEqual({ value: 32_380, verdict: "right", recorded: false });
    expect(cell("change", "end")).toEqual({ value: 42_565, verdict: "partial", recorded: false });
    expect(cell("change", "endMinusStart")).toEqual({ value: -17_595, verdict: "wrong", recorded: true });
    expect(cell("level", "sum")).toEqual({ value: 1_066_140, verdict: "wrong", recorded: false });
    expect(cell("level", "end")).toEqual({ value: 387_015, verdict: "right", recorded: false });
    expect(cell("level", "endMinusStart")).toEqual({ value: 32_380, verdict: "right", recorded: false });
    expect(42_565 - 60_160).toBe(FACTS.recordedWrong);
  });

  it("passes the staircase test with a difference of 0", () => {
    expect(staircase(EXAMPLE)).toBe(0);
  });

  it("computes the ratio 1.066.140 / 387.015 = 2,7548 and never types it", () => {
    expect(ratio(EXAMPLE)).toBeCloseTo(2.7548, 4);
    expect(formatNumber(ratio(EXAMPLE) as number, "de", 2)).toBe("2,75");
    expect(formatNumber(ratio(EXAMPLE) as number, "en", 2)).toBe("2.75");
  });

  it("writes the two pinned arithmetic lines", () => {
    expect(arithmetic(EXAMPLE, "change", "de")).toEqual({ lhs: "−19.960 + 9.775 + 42.565", result: "32.380", label: "growth" });
    expect(arithmetic(EXAMPLE, "level", "de")).toEqual({ lhs: "354.635 + 32.380", result: "387.015", label: "staircase" });
    expect(arithmetic(EXAMPLE, "level", "en").lhs).toBe("354,635 + 32,380");
  });

  it("states the two axis frames of the lever: -40k..70k and 300k..400k", () => {
    expect(EXAMPLE.frames).toEqual({ change: { lo: -40_000, hi: 70_000 }, level: { lo: 300_000, hi: 400_000 } });
    for (const [values, frame] of [[EXAMPLE.changes, EXAMPLE.frames.change], [EXAMPLE.levels, EXAMPLE.frames.level]] as const) {
      expect(Math.min(...(values as number[]))).toBeGreaterThan(frame.lo);
      expect(Math.max(...(values as number[]))).toBeLessThan(frame.hi);
    }
  });

  it("frames visitor numbers with room around them", () => {
    const frame = frameFor([-19_960, 9_775, 42_565], true);
    expect(frame.lo).toBeLessThan(-19_960);
    expect(frame.hi).toBeGreaterThan(42_565);
    expect(frameFor([5, 5, 5], false).hi).toBeGreaterThan(5);
  });

  it("keeps heights 1 : 16,8 for the to-scale pair", () => {
    expect(334_675 / 19_960).toBeCloseTo(16.77, 2);
  });
});

describe("visitor series", () => {
  const input = { name: "x", table: "", monthLabel: (n: number) => `M${n}` };

  it("derives levels from changes plus a start", () => {
    const series = buildSeries({ ...input, values: [-19_960, 9_775, 42_565], start: 354_635, kind: "change" });
    expect(series.levels).toEqual([334_675, 344_450, 387_015]);
    expect(staircase(series)).toBe(0);
  });

  it("derives changes from levels, with and without a start", () => {
    const withStart = buildSeries({ ...input, values: [334_675, 344_450, 387_015], start: 354_635, kind: "level" });
    expect(withStart.changes).toEqual([-19_960, 9_775, 42_565]);
    const without = buildSeries({ ...input, values: [334_675, 344_450, 387_015], start: null, kind: "level" });
    // Without a start the first level is the base, but it stays a bar and stays in the sum: nothing typed is dropped.
    expect(without.startNote).toBe("first");
    expect(without.startLevel).toBe(334_675);
    expect(without.levels).toEqual([334_675, 344_450, 387_015]);
    expect(without.changes).toEqual([0, 9_775, 42_565]);
    expect(firstChangeUnknown(without)).toBe(true);
    expect(operate(without, "level", "sum")?.value).toBe(1_066_140);
  });

  it("assumes a start of zero for changes without one, and flags it", () => {
    const series = buildSeries({ ...input, values: [5, 6, 7], start: null, kind: "change" });
    expect(series.startNote).toBe("zero");
    expect(series.levels).toEqual([5, 11, 18]);
    expect(operate(series, "change", "sum")?.value).toBe(18);
  });
});

describe("classify", () => {
  it("calls the example a change and the levels a level", () => {
    expect(classify([-19_960, 9_775, 42_565], true)).toBe("change");
    expect(classify([334_675, 344_450, 387_015], true)).toBe("level");
  });
  it("does not decide mixed signs without the never-negative switch", () => {
    expect(classify([-19_960, 9_775, 42_565], false)).toBe("unclear");
    expect(classify([60_160, 9_775, 42_565], true)).toBe("unclear");
    expect(classify([0, 0, 0], true)).toBe("unclear");
  });
});

describe("format", () => {
  it("groups by locale and uses U+2212", () => {
    expect(formatNumber(-19_960, "de")).toBe("−19.960");
    expect(formatNumber(-19_960, "en")).toBe("−19,960");
    expect(formatMoney(-19_960, "EUR", "de")).toBe("−19.960 €");
    expect(formatMoney(334_675, "EUR", "en")).toBe("€334,675");
    expect(formatMoney(5, "", "de")).toBe("5");
    expect(formatCompact(334_675)).toBe("334.7k");
    expect(formatCompact(334_675, "de")).toBe("334,7k");
    expect(formatCompact(2.5, "de")).toBe("2,5");
    expect(formatCompact(-40_000)).toBe("−40k");
  });
});

describe("readFields", () => {
  it("keeps the example for empty and unreadable input and guesses a reading", async () => {
    const { EMPTY_FIELDS, readFields } = await import("./input");
    const label = (n: number) => `M${n}`;
    expect(readFields(EMPTY_FIELDS, null, label).status).toBe("empty");
    expect(readFields({ ...EMPTY_FIELDS, values: "12k; 3; 4" }, null, label).status).toBe("fail");
    expect(readFields({ ...EMPTY_FIELDS, values: "1;2;3", start: "abc" }, null, label).status).toBe("fail");
    const ok = readFields({ ...EMPTY_FIELDS, values: "-19.960; 9.775; 42.565", start: "354.635", name: "<b>mrr" }, null, label);
    expect(ok.status === "ok" && ok.likely).toBe("change");
    expect(ok.status === "ok" && ok.series.name).toBe("bmrr");
    expect(ok.status === "ok" && ok.series.levels).toEqual([334_675, 344_450, 387_015]);
    const override = readFields({ ...EMPTY_FIELDS, values: "5;900;40" }, "level", label);
    expect(override.status === "ok" && override.kind).toBe("level");
  });
});

describe("own numbers with decimals and without a start", () => {
  const label = (n: number) => `M${n}`;
  const build = (values: number[], start: number | null, kind: "change" | "level") =>
    buildSeries({ values, start, kind, name: "x", table: "", monthLabel: label });

  it("never shows different numbers than typed", () => {
    const series = build([1.2, 3.4, 5.6], null, "change");
    expect(series.decimals).toBe(1);
    expect(arithmetic(series, "change", "de")).toEqual({ lhs: "1,2 + 3,4 + 5,6", result: "10,2", label: "growth" });
    expect(arithmetic(series, "change", "en").lhs).toBe("1.2 + 3.4 + 5.6");
    const withStart = build([1.25, 2, 3], 10, "change");
    expect(withStart.decimals).toBe(2);
    expect(withStart.levels).toEqual([11.25, 13.25, 16.25]);
    expect(formatters(withStart, "de").num(16.25)).toBe("16,25");
  });

  it("uses the first level as the start for levels without one", () => {
    const series = build([120, 135, 180], null, "level");
    expect(arithmetic(series, "level", "de")).toEqual({ lhs: "120 + 60", result: "180", label: "fromFirst" });
  });

  it("flags the assumed zero start of changes at the level reading", () => {
    const series = build([1, 2, 3], null, "change");
    expect(arithmetic(series, "level", "de")).toEqual({ lhs: "0 + 6", result: "6", label: "assumed" });
  });
});

describe("every number the visitor typed stays", () => {
  it("keeps three typed levels as three bars and as the whole sum, with an empty Start", () => {
    const read = readFields({ ...EMPTY_FIELDS, values: "120.000; 135.000; 150.000" }, null, (n) => `M${n}`);
    expect(read.status).toBe("ok");
    if (read.status !== "ok") return;
    expect(read.kind).toBe("level");
    const series = read.series;
    expect(series.levels).toEqual([120_000, 135_000, 150_000]);
    expect(series.months).toHaveLength(3);
    expect(sceneAt(series, 1).steps).toHaveLength(3);
    expect(sceneAt(series, 1).labels).toEqual([120_000, 135_000, 150_000]);
    expect(operate(series, "level", "sum")?.value).toBe(405_000);
    expect(ratio(series)).toBeCloseTo(2.7, 10);
    expect(arithmetic(series, "level", "de").lhs).toBe("120.000 + 30.000");
  });

  it("keeps every typed change too, whether or not there is a start", () => {
    for (const start of ["", "1.000"]) {
      const read = readFields({ ...EMPTY_FIELDS, values: "-50; 20; 70", start }, null, (n) => `M${n}`);
      if (read.status !== "ok") throw new Error("not ok");
      expect(read.series.changes).toEqual([-50, 20, 70]);
      expect(read.series.months).toHaveLength(3);
      expect(operate(read.series, "change", "sum")?.value).toBe(40);
    }
  });
});
