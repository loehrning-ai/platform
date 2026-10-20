import { describe, expect, it, vi } from "vitest";
import {
  closestStage,
  computeScrubState,
  FINISHED_STATE,
  finishedState,
  getStageState,
  holdFirstStep,
  publishStageState,
  sameState,
  scrollDeltaForStep,
  stageCopyProblems,
  STEP_PLAY,
  subscribeStage,
  type StepBox,
} from "./stage-protocol";

// Four steps of 600 px, the first starting at y = 500.
const BOXES: StepBox[] = [0, 1, 2, 3].map((i) => ({ top: 500 + i * 600, height: 600 }));

describe("computeScrubState", () => {
  it("sits at step 0 with progress 0 before the first card", () => {
    expect(computeScrubState(100, BOXES)).toEqual({ mode: "scrub", step: 0, steps: 4, stepProgress: 0, progress: 0 });
  });

  it("plays a step over the first half of its block and holds it finished while the card is centred", () => {
    // 150 px into step 2 (block 600): a quarter of the block, half of the play window.
    const early = computeScrubState(500 + 600 * 2 + 150, BOXES);
    expect(early.step).toBe(2);
    expect(early.stepProgress).toBeCloseTo(0.5, 5);
    // Card centre (the middle of the block): finished.
    const centred = computeScrubState(500 + 600 * 2 + 300, BOXES);
    expect(centred.stepProgress).toBe(1);
    // Past the centre it holds at 1 until the next step starts.
    expect(computeScrubState(500 + 600 * 2 + 590, BOXES).stepProgress).toBe(1);
    expect(computeScrubState(500 + 600 * 3 + 1, BOXES).step).toBe(3);
  });

  it("reaches overall progress 1 only at the end of the last step and holds the last step after it", () => {
    const end = computeScrubState(500 + 600 * 4 + 50, BOXES);
    expect(end).toMatchObject({ step: 3, stepProgress: 1, progress: 1 });
    const mid = computeScrubState(500 + 600 * 1 + 300, BOXES);
    expect(mid.progress).toBeCloseTo((1 + 1) / 4, 5);
  });

  it("is monotone in the reading line", () => {
    let last = -1;
    for (let y = 0; y < 3200; y += 37) {
      const { progress } = computeScrubState(y, BOXES);
      expect(progress).toBeGreaterThanOrEqual(last);
      last = progress;
    }
  });

  it("handles blocks of different heights and no blocks at all", () => {
    const uneven: StepBox[] = [
      { top: 0, height: 400 },
      { top: 400, height: 800 },
    ];
    expect(computeScrubState(400 + 400, uneven)).toMatchObject({ step: 1, stepProgress: 1 });
    expect(computeScrubState(10, [])).toEqual(FINISHED_STATE);
  });
});

describe("holdFirstStep", () => {
  it("shows the first step finished from the first frame, and leaves every other state alone", () => {
    expect(holdFirstStep(computeScrubState(100, BOXES))).toEqual({ mode: "scrub", step: 0, steps: 4, stepProgress: 1, progress: 0.25 });
    const later = computeScrubState(500 + 600 + 150, BOXES);
    expect(holdFirstStep(later)).toEqual(later);
    expect(holdFirstStep(FINISHED_STATE)).toEqual(FINISHED_STATE);
  });
});

describe("scrollDeltaForStep", () => {
  it("centres the card of a step on the reading line, where its figure is finished", () => {
    const line = 700;
    const delta = scrollDeltaForStep(2, line, BOXES);
    // After scrolling by delta every top moves up by delta.
    const moved = BOXES.map((b) => ({ top: b.top - delta, height: b.height }));
    const state = computeScrubState(line, moved);
    expect(state.step).toBe(2);
    expect(state.stepProgress).toBe(1);
    expect(STEP_PLAY).toBe(0.5);
  });

  it("clamps an index outside the column", () => {
    expect(scrollDeltaForStep(99, 0, BOXES)).toBe(scrollDeltaForStep(3, 0, BOXES));
    expect(scrollDeltaForStep(0, 0, [])).toBe(0);
  });
});

describe("states", () => {
  it("finishedState is the last step finished and static", () => {
    expect(finishedState(4)).toEqual({ mode: "static", step: 3, steps: 4, stepProgress: 1, progress: 1 });
    expect(finishedState(0).steps).toBe(1);
  });

  it("sameState ignores sub-pixel noise but not a step change", () => {
    const a = computeScrubState(1000, BOXES);
    expect(sameState(a, { ...a, progress: a.progress + 0.0005 })).toBe(true);
    expect(sameState(a, { ...a, step: a.step + 1 })).toBe(false);
  });
});

describe("the DOM protocol", () => {
  it("publishes to subscribers, replays the current state on subscribe and unsubscribes", () => {
    const root = document.createElement("section");
    root.setAttribute("data-chapter-stage", "x");
    const inner = document.createElement("div");
    root.append(inner);
    expect(getStageState(root)).toBe(FINISHED_STATE);
    expect(closestStage(inner)).toBe(root);
    expect(closestStage(document.createElement("div"))).toBeNull();

    const listener = vi.fn();
    const stop = subscribeStage(root, listener);
    expect(listener).toHaveBeenCalledWith(FINISHED_STATE);
    const next = computeScrubState(1100, BOXES);
    publishStageState(root, next);
    expect(listener).toHaveBeenLastCalledWith(next);
    expect(getStageState(root)).toBe(next);
    stop();
    publishStageState(root, FINISHED_STATE);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("stageCopyProblems", () => {
  const step = (over: Partial<Parameters<typeof stageCopyProblems>[0][number]> = {}) => ({
    id: "a",
    label: "Fünftel",
    text: "Das längste Fünftel schreibt 62-mal so oft KI.",
    numeral: "62x",
    claim: "Wer viel schreibt, schreibt KI",
    unit: "1 Quadrat = 21 Startseiten",
    ...over,
  });

  it("accepts a stage that keeps the word budget", () => {
    expect(stageCopyProblems([step(), step({ id: "b" }), step({ id: "c" })])).toEqual([]);
  });

  it("rejects a claim over 12 words, a card over 30 words, duplicate ids and a missing sentence", () => {
    const longClaim = "eins zwei drei vier fünf sechs sieben acht neun zehn elf zwölf dreizehn";
    const longCard = Array.from({ length: 31 }, (_, i) => `wort${i}`).join(" ");
    const problems = stageCopyProblems([step({ claim: longClaim }), step({ text: longCard }), step({ text: "" }), step()]);
    expect(problems.join("\n")).toMatch(/claim has 13 words/);
    expect(problems.join("\n")).toMatch(/card has 31 words/);
    expect(problems.join("\n")).toMatch(/needs one sentence/);
    expect(problems.join("\n")).toMatch(/duplicate id/);
  });

  it("rejects em and en dashes and a stage with too many steps", () => {
    expect(stageCopyProblems([step({ text: "Ein Satz \u2014 mit Strich." })]).join()).toMatch(/dashes/);
    expect(stageCopyProblems([step({ unit: "10\u201320" })]).join()).toMatch(/dashes/);
    const seven = Array.from({ length: 7 }, (_, i) => step({ id: `s${i}` }));
    expect(stageCopyProblems(seven).join()).toMatch(/1 to 6 steps/);
  });
});
