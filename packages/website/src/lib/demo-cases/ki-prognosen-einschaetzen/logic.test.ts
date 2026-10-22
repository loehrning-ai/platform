import { describe, expect, it } from "vitest";
import {
  ASKS,
  MEDIANS,
  MORNINGS,
  OPTION_DELIVERY,
  PREORDERS,
  SUPPLY_CAP,
  type Morning,
  type OptionKey,
  type Triple,
} from "./data";
import {
  assessAllocation,
  clampUnits,
  countryBias,
  detectPattern,
  deviatesFromMedian,
  failedChecks,
  gateChecks,
  gradeMorning,
  INITIAL_STATE,
  isRed,
  MEDIAN_DELIVERY,
  modelDelivery,
  ownerAccepted,
  PRESET_SPLITS,
  reducer,
  rightOption,
  splitBy,
  splitMessage,
  standingDelivery,
  sumOf,
  summarizeWeek,
  trimRole,
  type DemoAction,
  type DemoState,
} from "./logic";

const morning = (day: number): Morning => {
  const found = MORNINGS[day - 1];
  if (!found) throw new Error(`no morning ${day}`);
  return found;
};

describe("splitBy", () => {
  it("returns the spec's splits", () => {
    expect(splitBy(1050, MEDIANS)).toEqual([480, 365, 205]);
    expect(splitBy(1050, ASKS)).toEqual([468, 360, 222]);
    expect(splitBy(1050, PREORDERS)).toEqual([514, 377, 159]);
    expect(splitBy(50, MEDIANS)).toEqual([23, 17, 10]);
  });

  it("always sums to the total, ties go to the earlier index", () => {
    expect(splitBy(1050, [1, 1, 1])).toEqual([350, 350, 350]);
    expect(splitBy(50, [1, 1, 1])).toEqual([17, 17, 16]);
    expect(splitBy(10, [0, 0, 0])).toEqual([4, 3, 3]);
    for (const total of [0, 1, 7, 50, 999, 1050]) {
      for (const weights of [[3, 2, 1], [0, 5, 0], [540, 410, 230], [1e-9, 1, 1]]) {
        expect(sumOf(splitBy(total, weights))).toBe(total);
      }
    }
  });

  it("ignores negative and non-finite weights", () => {
    expect(splitBy(50, [-5, Number.NaN, 10])).toEqual([0, 0, 50]);
  });
});

describe("clampUnits", () => {
  it("clamps to whole numbers in 0..1050", () => {
    expect(clampUnits(-10)).toBe(0);
    expect(clampUnits(1200)).toBe(1050);
    expect(clampUnits(204.6)).toBe(205);
    expect(clampUnits(Number.NaN)).toBe(0);
  });
});

describe("assessAllocation", () => {
  it("case split: everything sells, short 40 / 40 / 50, least room in the city centre (7,4 %)", () => {
    const a = assessAllocation([500, 370, 180]);
    expect(a.pattern).toBe("case");
    expect(a.unsoldAtMedian).toBe(0);
    expect(a.shortAtMedian).toEqual([40, 40, 50]);
    expect(a.customersWithout).toBe(130);
    expect(a.minHeadroomStore).toBe(0);
    expect(a.headroom[0]).toBeCloseTo(0.074, 3);
    expect(a.coverage.map((c) => Number((c * 100).toFixed(1)))).toEqual([92.6, 90.2, 78.3]);
  });

  it("equal split: 120 left over", () => {
    const a = assessAllocation([350, 350, 350]);
    expect(a.pattern).toBe("equal");
    expect(a.unsoldAtMedian).toBe(120);
    expect(a.shortAtMedian[0]).toBe(190);
    expect(a.customersWithout).toBe(130 + 120);
  });

  it("[700, 250, 100]: the city centre is over its ask, 160 left over, edge of town 160 short", () => {
    const a = assessAllocation([700, 250, 100]);
    expect(a.overAsk).toEqual([0]);
    expect(a.unsoldAtMedian).toBe(160);
    expect(a.shortAtMedian[1]).toBe(160);
    expect(a.maxShortStore).toBe(1);
  });

  it("ask and preorder headrooms match the spec", () => {
    const ask = assessAllocation(PRESET_SPLITS.ask);
    expect(ask.headroom.map((h) => Number((h * 100).toFixed(1)))).toEqual([13.3, 12.2, 3.5]);
    const pre = assessAllocation(PRESET_SPLITS.preorders);
    expect(pre.headroom.map((h) => Number((h * 100).toFixed(1)))).toEqual([4.8, 8.0, 30.9]);
    expect(pre.shortAtMedian[2]).toBe(71);
  });

  it("median split: 88,9 / 89,0 / 89,1 % coverage, nothing moved", () => {
    const a = assessAllocation([480, 365, 205]);
    expect(a.coverage.map((c) => Number((c * 100).toFixed(1)))).toEqual([88.9, 89.0, 89.1]);
    expect(a.movedFromMedianSplit).toBe(0);
    expect(assessAllocation([500, 370, 180]).movedFromMedianSplit).toBe(25);
  });

  it("customers without a unit are always 130 plus the units left over", () => {
    for (const alloc of [[1050, 0, 0], [0, 1050, 0], [400, 400, 250], [480, 365, 205]] as Triple[]) {
      const a = assessAllocation(alloc);
      expect(a.customersWithout).toBe(130 + a.unsoldAtMedian);
    }
  });
});

describe("detectPattern", () => {
  it("names the rules within ±5 per store; the case split only exactly", () => {
    expect(detectPattern([480, 365, 205])).toBe("median");
    expect(detectPattern([485, 360, 205])).toBe("median");
    expect(detectPattern([468, 360, 222])).toBe("ask");
    expect(detectPattern([514, 377, 159])).toBe("preorders");
    expect(detectPattern([350, 350, 350])).toBe("equal");
    expect(detectPattern([500, 370, 180])).toBe("case");
    expect(detectPattern([501, 369, 180])).toBe("own");
    expect(detectPattern([490, 360, 200])).toBe("own");
  });
});

describe("splitMessage", () => {
  it("picks the first matching message in the spec's order", () => {
    expect(splitMessage([350, 350, 350]).kind).toBe("equal");
    expect(splitMessage([700, 250, 100])).toMatchObject({ kind: "overAsk", store: 0, alloc: 700, ask: 610, left: 160, shortStore: 1, short: 160 });
    expect(splitMessage([600, 300, 150])).toMatchObject({ kind: "overMedian", store: 0, over: 60, shortStore: 1, short: 110 });
    expect(splitMessage([500, 370, 180]).kind).toBe("case");
    expect(splitMessage([480, 365, 205]).kind).toBe("median");
    expect(splitMessage(PRESET_SPLITS.ask).kind).toBe("ask");
    expect(splitMessage(PRESET_SPLITS.preorders)).toMatchObject({ kind: "preorders", shortSmall: 71 });
    expect(splitMessage([520, 330, 200])).toMatchObject({ kind: "own", store: 0 });
  });
});

describe("the gate", () => {
  const base = { freshHours: 1, wape: 0.1, bias: 0, coverage: 0.9 };

  it("is strict at every limit", () => {
    const failsAt = [
      { ...base, freshHours: 2 },
      { ...base, wape: 0.14 },
      { ...base, bias: 0.05 },
      { ...base, bias: -0.05 },
      { ...base, coverage: 0.8 },
    ];
    for (const m of failsAt) expect(gateChecks(m).some((c) => !c.pass)).toBe(true);
    const passesAt = [
      { ...base, freshHours: 1.99 },
      { ...base, wape: 0.1399 },
      { ...base, bias: 0.0499 },
      { ...base, bias: -0.0499 },
      { ...base, coverage: 0.8001 },
    ];
    for (const m of passesAt) expect(gateChecks(m).every((c) => c.pass)).toBe(true);
  });

  it("is red exactly on mornings 2, 3, 4 and 7", () => {
    expect(MORNINGS.filter(isRed).map((m) => m.day)).toEqual([2, 3, 4, 7]);
    expect(failedChecks(morning(2))).toEqual(["fresh"]);
    expect(failedChecks(morning(3))).toEqual(["bias"]);
    expect(failedChecks(morning(4))).toEqual(["coverage"]);
    expect(failedChecks(morning(7))).toEqual(["wape", "bias", "coverage"]);
  });

  it("green mornings use the green option set", () => {
    for (const m of MORNINGS.filter((m) => !isRed(m))) {
      expect(m.options).toEqual(["release", "holdUnknown", "holdNearLimit"]);
    }
  });

  it("morning 1 is the case's own board", () => {
    expect(morning(1)).toMatchObject({ freshHours: 1.2, wape: 0.12, bias: 0.024, coverage: 0.81 });
  });
});

describe("the week's data", () => {
  it("every morning has exactly one right option, graded for all three", () => {
    for (const m of MORNINGS) {
      expect(m.options.filter((o) => m.grade[o] === "right")).toHaveLength(1);
      expect(Object.keys(m.grade).sort()).toEqual([...m.options].sort());
    }
  });

  it("morning 2 repeats morning 1's close: only the data is old", () => {
    const [one, two] = [morning(1), morning(2)];
    expect([two.wape, two.bias, two.coverage, two.storeBias]).toEqual([one.wape, one.bias, one.coverage, one.storeBias]);
    expect(two.freshHours).toBeGreaterThan(one.freshHours);
  });

  it("each country bias equals the median-weighted store bias within 0,05 pp", () => {
    for (const m of MORNINGS) expect(Math.abs(countryBias(m.storeBias) - m.bias)).toBeLessThan(0.0005);
  });

  it("the events sit on mornings 5 and 7", () => {
    expect(MORNINGS.filter((m) => m.event).map((m) => [m.day, m.event])).toEqual([
      [5, "competitorToday"],
      [7, "stockoutZentrum"],
    ]);
  });
});

describe("deliveries", () => {
  it("the model's plan on morning 3 is 22 / 16 / 12", () => {
    expect(modelDelivery(morning(3))).toEqual([22, 16, 12]);
    expect(deviatesFromMedian(modelDelivery(morning(3)))).toBe(true);
  });

  it("the standing plan ships the spec's units", () => {
    expect(MEDIAN_DELIVERY).toEqual([23, 17, 10]);
    expect(standingDelivery([350, 350, 350])).toEqual([17, 17, 16]);
    expect(standingDelivery([500, 370, 180])).toEqual([24, 18, 8]);
    expect(standingDelivery(PRESET_SPLITS.ask)).toEqual([22, 17, 11]);
    expect(standingDelivery([480, 365, 205])).toEqual([23, 17, 10]);
    expect(deviatesFromMedian([22, 17, 11])).toBe(false);
    expect(deviatesFromMedian([24, 18, 8])).toBe(true);
  });

  it("every delivery is 50 units", () => {
    for (const m of MORNINGS) expect(sumOf(modelDelivery(m))).toBe(50);
  });
});

describe("gradeMorning", () => {
  const plan: Triple = [480, 365, 205];
  const grid: Record<number, Record<string, [string, string, string]>> = {
    1: { release: ["right", "rightRelease", "model"], holdUnknown: ["needless", "needless", "standing"], holdNearLimit: ["needless", "needless", "standing"] },
    2: { releaseOthersGreen: ["missed", "missed", "model"], waitRefresh: ["right", "rightAction", "waitData"], retrain: ["wrongStep", "wrongStep", "waitRetrain"] },
    3: { releaseBestWape: ["missed", "missed", "model"], overrideReportBias: ["right", "rightAction", "standing"], waitFresh: ["wrongStep", "wrongStep", "waitStock"] },
    4: { releaseMedianFine: ["missed", "missed", "model"], overrideAskWhy: ["right", "rightAction", "standing"], lowerLimit: ["wrongStep", "wrongStep", "model"] },
    5: { release: ["missed", "missed", "model"], holdUnknown: ["right", "rightHold", "standing"], holdNearLimit: ["wrongStep", "wrongStep", "standing"] },
    6: { release: ["right", "rightRelease", "model"], holdUnknown: ["needless", "needless", "standing"], holdNearLimit: ["needless", "needless", "standing"] },
    7: { retrainRaw: ["wrongStep", "wrongStep", "waitRetrain"], overrideReconstruct: ["right", "rightAction", "standing"], releaseAnyway: ["missed", "missed", "model"] },
  };

  it("maps all 21 day x option pairs to outcome, stamp and delivery", () => {
    let pairs = 0;
    for (const m of MORNINGS) {
      for (const option of m.options) {
        const [outcome, stamp, kind] = grid[m.day]?.[option] ?? [];
        const grade = gradeMorning(m, option, plan);
        expect([grade.outcome, grade.stamp, grade.delivery.kind], `${m.day} ${option}`).toEqual([outcome, stamp, kind]);
        expect(grade.right).toBe(rightOption(m));
        if (kind === "model") expect(grade.delivery.units).toEqual(modelDelivery(m));
        if (kind === "standing") expect(grade.delivery.units).toEqual([23, 17, 10]);
        if (kind?.startsWith("wait")) expect(grade.delivery.units).toBeUndefined();
        pairs += 1;
      }
    }
    expect(pairs).toBe(21);
  });

  it("refuses an option the morning does not offer", () => {
    expect(() => gradeMorning(morning(1), "retrain", plan)).toThrow();
  });

  it("every option has a delivery kind", () => {
    for (const m of MORNINGS) for (const o of m.options) expect(OPTION_DELIVERY[o]).toBeDefined();
  });
});

describe("summarizeWeek", () => {
  const rights = MORNINGS.map(rightOption);

  it("counts a perfect week: four hold mornings ship the standing plan", () => {
    const summary = summarizeWeek(rights, [480, 365, 205]);
    expect(summary).toMatchObject({ right: 7, missed: [], needless: [], wrongStep: [], holdDays: 4 });
    expect(summary.deviation).toBeUndefined();
  });

  it("names the misses by type and the store that drifted from the median split", () => {
    const answers: OptionKey[] = ["holdNearLimit", "releaseOthersGreen", "overrideReportBias", "lowerLimit", "holdUnknown", "holdUnknown", "overrideReconstruct"];
    const summary = summarizeWeek(answers, [500, 370, 180]);
    expect(summary.right).toBe(3);
    expect(summary.missed).toEqual([2]);
    expect(summary.needless).toEqual([1, 6]);
    expect(summary.wrongStep).toEqual([4]);
    // Hold mornings 1, 3, 5, 6, 7 ship 24 / 18 / 8: the small town got 40 instead of 50.
    expect(summary.holdDays).toBe(5);
    expect(summary.deviation).toEqual({ store: 2, got: 40, median: 50 });
  });

  it("skips unanswered mornings", () => {
    expect(summarizeWeek([rights[0] ?? "release", null, null, null, null, null, null], [480, 365, 205]).right).toBe(1);
  });
});

describe("owner", () => {
  it("accepts the planner on duty and an own role, not analytics or whoever is free", () => {
    expect(ownerAccepted({ key: "plannerOnDuty", custom: "" })).toBe(true);
    expect(ownerAccepted({ key: "custom", custom: "Schichtleitung" })).toBe(true);
    expect(ownerAccepted({ key: "custom", custom: "   " })).toBe(false);
    expect(ownerAccepted({ key: "analytics", custom: "" })).toBe(false);
    expect(ownerAccepted({ key: "whoeverFree", custom: "" })).toBe(false);
    expect(ownerAccepted(null)).toBe(false);
  });

  it("trims an own role to 40 characters", () => {
    expect(trimRole("  Leitung   Disposition  ")).toBe("Leitung Disposition");
    expect(trimRole("x".repeat(60))).toHaveLength(40);
  });
});

describe("reducer", () => {
  const run = (actions: readonly DemoAction[], from: DemoState = INITIAL_STATE) => actions.reduce(reducer, from);
  const toMornings: DemoAction[] = [
    { type: "SET_UNITS", store: 0, value: 500 },
    { type: "SET_UNITS", store: 1, value: 370 },
    { type: "SET_UNITS", store: 2, value: 180 },
    { type: "CHECK" },
    { type: "CONTINUE", with: "own" },
  ];

  it("checks only at exactly 1.050", () => {
    const short = run([{ type: "SET_UNITS", store: 0, value: 1000 }, { type: "CHECK" }]);
    expect(short.checked).toBe(false);
    const exact = run([{ type: "SET_UNITS", store: 0, value: SUPPLY_CAP }, { type: "CHECK" }]);
    expect(exact.checked).toBe(true);
  });

  it("presets only after a first check", () => {
    expect(run([{ type: "APPLY_PRESET", pattern: "ask" }]).alloc).toEqual([0, 0, 0]);
    const after = run([{ type: "SET_UNITS", store: 0, value: 1050 }, { type: "CHECK" }, { type: "APPLY_PRESET", pattern: "ask" }]);
    expect(after.alloc).toEqual([468, 360, 222]);
  });

  it("continues with the own split or the median split, and keeps the opening split", () => {
    const own = run(toMornings);
    expect(own).toMatchObject({ step: "mornings", plan: [500, 370, 180], planSource: "own", opening: [500, 370, 180] });
    const median = run([...toMornings.slice(0, 4), { type: "CONTINUE", with: "median" }]);
    expect(median).toMatchObject({ plan: [480, 365, 205], planSource: "median", opening: [500, 370, 180] });
  });

  it("no action edits Part 1 after CONTINUE", () => {
    const state = run(toMornings);
    const after = run(
      [
        { type: "SET_UNITS", store: 0, value: 0 },
        { type: "APPLY_PRESET", pattern: "equal" },
        { type: "CHECK" },
        { type: "CONTINUE", with: "median" },
        { type: "ENTER_MORNINGS" },
      ],
      state,
    );
    expect(after).toEqual(state);
  });

  it("a direct entry to the mornings sets the median split", () => {
    expect(run([{ type: "ENTER_MORNINGS" }])).toMatchObject({ step: "mornings", plan: [480, 365, 205], planSource: "fallback", opening: null });
  });

  it("starts the mornings only with an accepted owner, then locks it", () => {
    let state = run([...toMornings, { type: "PICK_OWNER", owner: { key: "analytics", custom: "" } }, { type: "START_MORNINGS" }]);
    expect(state.ownerLocked).toBe(false);
    state = run([{ type: "PICK_OWNER", owner: { key: "plannerOnDuty", custom: "" } }, { type: "START_MORNINGS" }], state);
    expect(state.ownerLocked).toBe(true);
    state = run([{ type: "PICK_OWNER", owner: { key: "whoeverFree", custom: "" } }], state);
    expect(state.owner?.key).toBe("plannerOnDuty");
  });

  it("answers each morning once, in order, then reaches the result", () => {
    let state = run([...toMornings, { type: "PICK_OWNER", owner: { key: "custom", custom: " Schichtleitung " } }, { type: "START_MORNINGS" }]);
    expect(state.owner).toEqual({ key: "custom", custom: "Schichtleitung" });
    expect(run([{ type: "ANSWER", day: 1, option: "waitRefresh" }], state)).toBe(state);
    expect(run([{ type: "NEXT" }], state)).toBe(state);
    for (const [day, m] of MORNINGS.entries()) {
      state = run([{ type: "ANSWER", day, option: m.options[0] }], state);
      const again = run([{ type: "ANSWER", day, option: m.options[1] }], state);
      expect(again.answers[day]).toBe(m.options[0]);
      state = run([{ type: "NEXT" }], state);
    }
    expect(state.step).toBe("result");
    expect(state.answers.every((a) => a !== null)).toBe(true);
  });

  it("RESTART clears every downstream value", () => {
    const state = run([...toMornings, { type: "PICK_OWNER", owner: { key: "plannerOnDuty", custom: "" } }, { type: "START_MORNINGS" }, { type: "ANSWER", day: 0, option: "release" }]);
    expect(run([{ type: "RESTART" }], state)).toEqual(INITIAL_STATE);
  });
});
