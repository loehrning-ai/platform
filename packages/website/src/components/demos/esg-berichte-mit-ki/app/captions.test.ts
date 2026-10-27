import { describe, expect, it } from "vitest";
import { APP_COPY } from "@/lib/demo-cases/esg-berichte-mit-ki/app-copy";
import { appData } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data.server";
import type { BeatId } from "@/lib/demo-cases/esg-berichte-mit-ki/beats";
import { COPY } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { DEMO_START, demoReducer } from "@/lib/demo-cases/esg-berichte-mit-ki/demo-state";
import { kitText } from "@/lib/demo-cases/esg-berichte-mit-ki/kit-text";
import { ledgerCounts } from "@/lib/demo-cases/esg-berichte-mit-ki/ledger";
import { formatter } from "../fmt";
import { beatCaption, claudeNumber, predictionText, stepCaption, type StepState } from "./captions";
import { INSTALL_STEPS } from "./install-view";
import { PREDICT_RANGE, stepPrediction } from "./prediction";

const EDITIONS = ["de", "en"] as const;
const STATES: readonly StepState[] = ["idle", "running", "done"];
const AFTER: readonly BeatId[] = ["gemessen", "dein-claude", "mitnehmen"];
/** Every lever of the checks moved, so each scene caption is reached too. */
const WORKED = demoReducer(demoReducer(demoReducer(DEMO_START, { type: "card", action: { type: "all" } }), { type: "reach", index: 5 }), { type: "morph", t: 1 });

describe("the dock captions of the depicted app", () => {
  it.each(EDITIONS)("%s: every caption is filled, plain and free of dashes", (edition) => {
    const copy = APP_COPY[edition];
    const pack = COPY[edition];
    const data = appData(edition);
    const input = { copy, pack, fmt: formatter(edition), kit: kitText(edition), data };
    const all: string[] = [];
    for (const step of data.steps) {
      for (const state of STATES) {
        for (const scene of [DEMO_START, WORKED]) all.push(...stepCaption({ ...input, step, state, scene }));
      }
    }
    for (const beat of AFTER) {
      for (let at = 0; at < INSTALL_STEPS; at += 1) all.push(...beatCaption(copy, beat, edition, at));
    }
    expect(all.length).toBeGreaterThan(40);
    for (const sentence of all) {
      expect(sentence, sentence).not.toMatch(/\{\w+\}/);
      expect(sentence, sentence).not.toMatch(/[–—]/);
      expect(sentence.trim(), "no empty sentence").not.toBe("");
    }
  });

  it.each(EDITIONS)("%s: the register counts in the captions are Claude's, and equal the kit's solutions", (edition) => {
    const copy = APP_COPY[edition];
    const data = appData(edition);
    const input = { copy, pack: COPY[edition], fmt: formatter(edition), kit: kitText(edition), data, state: "done" as const, scene: DEMO_START };
    const four = data.steps.find((step) => step.id === "schritt-4");
    const five = data.steps.find((step) => step.id === "schritt-5");
    if (!four || !five) throw new Error("steps 4 and 5");
    const before = ledgerCounts("before");
    const after = ledgerCounts("after");
    expect(data.facts.before).toEqual(before);
    expect(data.facts.after).toEqual(after);
    expect(stepCaption({ ...input, step: four }).join(" ")).toContain(String(before.luecke));
    expect(stepCaption({ ...input, step: five }).join(" ")).toContain(String(after.belegt));
  });

  it("names a run's differing status honestly in step 1 and nowhere else", () => {
    for (const edition of EDITIONS) {
      const data = appData(edition);
      const step = data.steps[0];
      if (!step) throw new Error("step 1");
      const text = stepCaption({ copy: APP_COPY[edition], pack: COPY[edition], fmt: formatter(edition), kit: kitText(edition), data, step, state: "done", scene: DEMO_START }).join(" ");
      for (const item of data.facts.differences) expect(text).toContain(item.row);
      if (data.facts.differences.length === 0) expect(text).not.toContain(APP_COPY[edition].steps.mismatch.slice(0, 12));
    }
  });
  it.each(EDITIONS)("%s: a prediction is set beside Claude's number after the answer, never before and never scored", (edition) => {
    const copy = APP_COPY[edition];
    const data = appData(edition);
    const fmt = formatter(edition);
    const input = { copy, pack: COPY[edition], fmt, kit: kitText(edition), data, scene: DEMO_START };
    for (const step of data.steps) {
      const n = claudeNumber(data, step.id);
      const { min, max } = PREDICT_RANGE[step.id];
      expect(n, step.id).toBeGreaterThanOrEqual(min);
      expect(n, step.id).toBeLessThanOrEqual(max);
      const guess = stepPrediction(step.id, null, 1);
      const done = stepCaption({ ...input, step, state: "done", prediction: guess }).join(" ");
      expect(done).toContain(predictionText(copy, fmt, step.id, guess));
      expect(done).toContain(predictionText(copy, fmt, step.id, n));
      expect(done).not.toMatch(/richtig|falsch|right|wrong|Punkt|point/i);
      const idle = stepCaption({ ...input, step, state: "idle", prediction: guess }).join(" ");
      expect(idle).not.toContain(copy.predict.steps[step.id].result.slice(0, 8));
      const none = stepCaption({ ...input, step, state: "done", prediction: null }).join(" ");
      expect(none).not.toContain(copy.predict.steps[step.id].result.slice(0, 8));
    }
    expect(claudeNumber(data, "schritt-3")).toBe(data.facts.payback);
  });

  it("steps a prediction inside its range, starting in the middle", () => {
    expect(stepPrediction("schritt-1", null, 1)).toBe(4);
    expect(stepPrediction("schritt-3", null, -1)).toBe(7.5);
    expect(stepPrediction("schritt-3", 7.5, 1)).toBe(8);
    expect(stepPrediction("schritt-2", 0, -1)).toBe(0);
    expect(stepPrediction("schritt-4", 21, 1)).toBe(21);
  });
});
