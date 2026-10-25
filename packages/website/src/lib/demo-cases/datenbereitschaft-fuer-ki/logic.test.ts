import { describe, expect, it } from "vitest";
import { CLAUDE_ANSWER, CLOCK_UTC, ENDING_MRR, F01_CLOCK_UTC, LOAD_UTC, NET_NEW_2026, OPENING_DEC_2025, STATUS, WARN_AFTER_H } from "./data";
import { ACROSS, boundaryLocks, boundaryOutcome, canAdd, countWho, freshness, gradeValue, KINDS, readings } from "./logic";

const LEVELS = [ENDING_MRR["2026-04"], ENDING_MRR["2026-05"], ENDING_MRR["2026-06"]];

describe("readings of one correct file", () => {
  const result = readings(NET_NEW_2026, OPENING_DEC_2025);

  it("gives the four tables of the slider", () => {
    expect(result.changeAsLevel).toEqual([-19_960, 9_775, 42_565]);
    expect(result.runningNoOpen).toEqual(CLAUDE_ANSWER);
    expect(result.levelsSummed).toBe(1_066_140);
    expect(result.levels).toEqual(LEVELS);
  });

  it("differs from the right levels by exactly the opening level in every month", () => {
    result.levels.forEach((level, index) => expect(level - (result.runningNoOpen[index] as number)).toBe(258_785));
  });

  it("adds the quarter's changes to the level difference", () => {
    const changes = result.changeAsLevel.reduce((sum, value) => sum + value, 0);
    expect(changes).toBe(32_380);
    expect(changes).toBe(ENDING_MRR["2026-06"] - ENDING_MRR["2026-03"]);
  });
});

describe("canAdd", () => {
  it("fills the nine cells of the grid", () => {
    const grid = KINDS.map((kind) => ACROSS.map((across) => canAdd(kind, across)));
    expect(grid).toEqual([
      ["add", "never", "each-or-last"],
      ["add", "add", "sum"],
      ["recompute", "recompute", "recompute"],
    ]);
  });
});

describe("countWho", () => {
  it("counts 0, 108, 120 and 132 of 144", () => {
    expect((["active", "A", "AC", "AN"] as const).map((filter) => countWho(filter, STATUS).matched)).toEqual([0, 108, 120, 132]);
    expect(countWho("AN", STATUS).of).toBe(144);
  });
});

describe("boundary", () => {
  it("locks only when the data is out of reach", () => {
    expect(boundaryOutcome("instruction")).toBe("guidedOnly");
    expect(boundaryOutcome("notUploaded")).toBe("nothingToRead");
    expect(boundaryOutcome("grant")).toBe("denied42501");
    expect([boundaryLocks("instruction"), boundaryLocks("notUploaded"), boundaryLocks("grant")]).toEqual([false, true, true]);
  });
});

describe("gradeValue", () => {
  const result = readings(NET_NEW_2026, OPENING_DEC_2025);
  it("grades each reading against G01 by exact value", () => {
    expect(gradeValue(result.changeAsLevel, LEVELS)).toEqual({ pass: false, reason: "value", index: 0, got: -19_960, want: 334_675 });
    expect(gradeValue(result.runningNoOpen, LEVELS)).toEqual({ pass: false, reason: "value", index: 0, got: 75_890, want: 334_675 });
    expect(gradeValue([result.levelsSummed], LEVELS)).toEqual({ pass: false, reason: "length", got: 1, want: 3 });
    expect(gradeValue(result.levels, LEVELS)).toEqual({ pass: true });
  });
});

describe("freshness", () => {
  it("is 3 h fresh at the course clock and 60 h with a warning at F01, never blocked", () => {
    expect(freshness(LOAD_UTC, CLOCK_UTC, WARN_AFTER_H)).toEqual({ ageH: 3, state: "fresh" });
    expect(freshness(LOAD_UTC, F01_CLOCK_UTC, WARN_AFTER_H)).toEqual({ ageH: 60, state: "warn" });
    expect(freshness(LOAD_UTC, F01_CLOCK_UTC)).toEqual({ ageH: 60, state: null });
  });
});
