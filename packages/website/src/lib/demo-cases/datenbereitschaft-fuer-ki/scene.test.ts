import { describe, expect, it } from "vitest";
import { INTRO_MS, introAt, LIFT_END, NUDGE_AT, niceTicks, OWN_MS, ownAt, sceneAt, smooth } from "./scene";
import { buildSeries, exampleSeries, headline, type Series } from "./series";

const EXAMPLE = exampleSeries(["Apr", "Mai", "Jun"]);
const own = (values: number[], start: number | null, kind: "change" | "level"): Series =>
  buildSeries({ values, start, kind, name: "x", table: "", monthLabel: (n) => `M${n}` });
const SERIES: readonly [string, Series][] = [
  ["the example", EXAMPLE],
  ["own changes with a start", own([10, -5, 30], 100, "change")],
  ["own levels without a start", own([120, 135, 150], null, "level")],
  ["own levels with a start", own([500, 700, 1000], 400, "level")],
];
const SWEEP = Array.from({ length: 201 }, (_, step) => step / 200);

describe("sceneAt", () => {
  it("is exactly the changes at p = 0 and exactly the levels at p = 1", () => {
    const start = sceneAt(EXAMPLE, 0);
    expect(start.steps.map((step) => step.to - step.from)).toEqual(EXAMPLE.changes);
    expect(start.steps.map((step) => step.from)).toEqual([0, 0, 0]);
    expect(start.pillars).toEqual([null, null, null]);
    expect(start.labels).toEqual(EXAMPLE.changes);
    expect([start.lo, start.hi]).toEqual([-40_000, 70_000]);
    expect(start.counter).toBe(-19_960);
    expect(start.word).toBe("change");
    expect([start.stampBefore, start.stampAfter]).toEqual([1, 0]);
    const end = sceneAt(EXAMPLE, 1);
    expect(end.steps.map((step) => step.to)).toEqual(EXAMPLE.levels);
    expect(end.steps.map((step) => step.from)).toEqual([354_635, 334_675, 344_450]);
    expect(end.labels).toEqual(EXAMPLE.levels);
    expect([end.lo, end.hi]).toEqual([300_000, 400_000]);
    expect(end.counter).toBe(334_675);
    expect(end.word).toBe("level");
    expect([end.stampBefore, end.stampAfter]).toEqual([0, 1]);
    expect([end.sentence, end.pair, end.startRung, end.startLabel]).toEqual([1, 1, 1, 1]);
    expect(end.zeroVisible).toBe(false);
  });

  for (const [name, series] of SERIES) {
    it(`never prints a number that is not in the data, and never stretches a step (${name})`, () => {
      const head = headline(series);
      for (const p of SWEEP) {
        const scene = sceneAt(series, p);
        // every printed number is a change, a level or one of the two headlines
        expect(scene.labels).toEqual(p < LIFT_END ? series.changes : series.levels);
        expect([head.change, head.level]).toContain(scene.counter);
        // a step is exactly as long as its change, at every p
        scene.steps.forEach((step, index) => expect(step.to - step.from).toBeCloseTo(series.changes[index] ?? 0, 6));
      }
    });

    it(`keeps every step and every ground inside the frame on the way (${name})`, () => {
      for (const p of SWEEP) {
        const scene = sceneAt(series, p);
        const slack = (scene.hi - scene.lo) * 1e-9;
        scene.steps.forEach((step, index) => {
          for (const value of [step.from, step.to]) {
            expect(value, `p=${p} bar ${index}`).toBeGreaterThanOrEqual(scene.lo - slack);
            expect(value, `p=${p} bar ${index}`).toBeLessThanOrEqual(scene.hi + slack);
          }
        });
      }
    });

    it(`is final when the labels switch: the shapes do not change at p = ${LIFT_END} (${name})`, () => {
      const before = sceneAt(series, LIFT_END - 1e-6);
      const after = sceneAt(series, LIFT_END);
      expect(after.lift).toBe(1);
      before.steps.forEach((step, index) => {
        expect(step.from).toBeCloseTo(after.steps[index]?.from ?? 0, 3);
        expect(step.to).toBeCloseTo(after.steps[index]?.to ?? 0, 3);
      });
    });
  }

  it("lets the zero line leave the frame early in the lift", () => {
    let exit = -1;
    for (let step = 0; step <= 1000; step += 1) {
      if (sceneAt(EXAMPLE, step / 1000).lo > 0) {
        exit = step / 1000;
        break;
      }
    }
    expect(exit).toBeGreaterThanOrEqual(0.1);
    expect(exit).toBeLessThanOrEqual(0.3);
  });

  it("cuts the word tag and the counter over hard at the end of the lift and fades the stamps only at rest", () => {
    expect(sceneAt(EXAMPLE, LIFT_END - 0.001).word).toBe("change");
    expect(sceneAt(EXAMPLE, LIFT_END).word).toBe("level");
    expect(sceneAt(EXAMPLE, LIFT_END).stampBefore).toBe(0);
    expect(sceneAt(EXAMPLE, LIFT_END).stampAfter).toBe(0);
    expect(sceneAt(EXAMPLE, 0.92).stampAfter).toBe(1);
    expect(sceneAt(EXAMPLE, LIFT_END - 0.001).counter).toBe(-19_960);
    expect(sceneAt(EXAMPLE, LIFT_END).counter).toBe(334_675);
  });

  it("shows the zero note only once the zero line is really out of frame", () => {
    for (const p of SWEEP) {
      const scene = sceneAt(EXAMPLE, p);
      if (scene.zeroVisible) expect(scene.zeroNote).toBe(0);
    }
    expect(sceneAt(EXAMPLE, 0.7).zeroNote).toBe(1);
  });

  it("moves the axis monotonically and keeps the base inside the frame", () => {
    let previous = sceneAt(EXAMPLE, 0);
    for (const p of SWEEP.slice(1)) {
      const scene = sceneAt(EXAMPLE, p);
      expect(scene.lo).toBeGreaterThanOrEqual(previous.lo);
      expect(scene.hi).toBeGreaterThanOrEqual(previous.hi);
      expect(scene.base).toBeGreaterThanOrEqual(scene.lo);
      expect(scene.base).toBeLessThanOrEqual(scene.hi);
      previous = scene;
    }
  });

  it("raises a ground under a step only once the step has left the base line", () => {
    const mid = sceneAt(EXAMPLE, 0.3);
    mid.pillars.forEach((top, index) => {
      const step = mid.steps[index];
      expect(top).not.toBeNull();
      expect(top).toBeCloseTo(Math.min(step?.from ?? 0, step?.to ?? 0), 6);
    });
  });

  it("clamps p and keeps the proof and the sentence for the end", () => {
    expect(sceneAt(EXAMPLE, -1).labels).toEqual(EXAMPLE.changes);
    expect(sceneAt(EXAMPLE, 2).labels).toEqual(EXAMPLE.levels);
    expect(sceneAt(EXAMPLE, 0.5).sentence).toBe(0);
    expect(sceneAt(EXAMPLE, 0.5).pair).toBe(0);
  });

  it("drops the first stamp without the never-negative switch or without a negative change", () => {
    const scene = sceneAt(EXAMPLE, 0, false);
    expect([scene.stampBefore, scene.canBefore]).toEqual([0, false]);
    expect(sceneAt(own([100, 120, 90], null, "level"), 0).canBefore).toBe(false);
  });

  it("gives own levels without a start the rung only where there is a typed start, and keeps all three bars", () => {
    const scene = sceneAt(own([120, 135, 150], null, "level"), 1);
    expect(scene.steps).toHaveLength(3);
    expect(scene.labels).toEqual([120, 135, 150]);
    expect([scene.startRung, scene.startLabel, scene.unknownFirst]).toEqual([0, 0, true]);
    const typed = sceneAt(own([500, 700, 1000], 400, "level"), 1);
    expect([typed.startRung, typed.unknownFirst]).toEqual([1, false]);
    // and no "passt" where the level would fit by construction
    expect([scene.canAfter, scene.stampAfter, typed.canAfter]).toEqual([false, 0, true]);
  });

  it("shows the quarter's increase and the last level as the visitor's big numbers", () => {
    const built = own([10, 20, 30], 100, "change");
    expect([sceneAt(built, 0).counter, sceneAt(built, 1).counter]).toEqual([60, 160]);
  });
});

describe("helpers", () => {
  it("smooth has fixed endpoints", () => {
    expect(smooth(0)).toBe(0);
    expect(smooth(1)).toBe(1);
    expect(smooth(0.5)).toBe(0.5);
  });
  it("picks at most four nice ticks", () => {
    expect(niceTicks(-40_000, 70_000)).toEqual([0, 50_000]);
    expect(niceTicks(300_000, 400_000)).toEqual([300_000, 350_000, 400_000]);
    expect(niceTicks(5, 5)).toEqual([]);
  });
  it("runs the intro from the hero state back to the hero state", () => {
    expect(introAt(0)).toBe(0);
    expect(introAt(1400)).toBeGreaterThan(0);
    expect(introAt(2400)).toBe(1);
    expect(introAt(INTRO_MS)).toBe(0);
    expect(introAt(INTRO_MS + 500)).toBe(0);
  });
  it("nudges the handle once, 12 percent, after the intro and a quiet second", () => {
    expect(introAt(NUDGE_AT - 10)).toBe(0);
    const peak = Math.max(...Array.from({ length: 91 }, (_, i) => introAt(NUDGE_AT + i * 10)));
    expect(peak).toBeCloseTo(0.12, 2);
    expect(introAt(INTRO_MS)).toBe(0);
  });
  it("answers the visitor's own numbers in 1.2 s or less and lands exactly where it started", () => {
    expect(OWN_MS).toBeLessThanOrEqual(1200);
    for (const base of [0, 1] as const) {
      expect(ownAt(0, base)).toBe(base);
      expect(ownAt(OWN_MS, base)).toBe(base);
      expect(Math.abs(ownAt(OWN_MS / 2, base) - base)).toBe(1);
    }
  });
});
