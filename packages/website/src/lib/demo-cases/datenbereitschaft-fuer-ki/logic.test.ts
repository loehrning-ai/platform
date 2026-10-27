import { describe, expect, it } from "vitest";
import { CLAUDE_ANSWER, ENDING_MRR, NET_NEW_2026, OPENING_DEC_2025, RUN2_ACTIVE, STATUS, SUMMARY } from "./data";
import { ACROSS, canAdd, countCodes, countWho, EDGE_STARTS, gradeValue, KINDS, openingFromStart, previousMonth, readings, sumAt, tubLevels, uncovered } from "./logic";

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

describe("gradeValue", () => {
  const result = readings(NET_NEW_2026, OPENING_DEC_2025);
  it("grades each reading against G01 by exact value", () => {
    expect(gradeValue(result.changeAsLevel, LEVELS)).toEqual({ pass: false, reason: "value", index: 0, got: -19_960, want: 334_675 });
    expect(gradeValue(result.runningNoOpen, LEVELS)).toEqual({ pass: false, reason: "value", index: 0, got: 75_890, want: 334_675 });
    expect(gradeValue([result.levelsSummed], LEVELS)).toEqual({ pass: false, reason: "length", got: 1, want: 3 });
    expect(gradeValue(result.levels, LEVELS)).toEqual({ pass: true });
  });
});

describe("the tub", () => {
  it("gives Claude's table at an opening of zero and the approved view at 258.785", () => {
    expect(tubLevels(NET_NEW_2026, 0).slice(3)).toEqual(CLAUDE_ANSWER);
    expect(tubLevels(NET_NEW_2026, OPENING_DEC_2025).slice(3)).toEqual([334_675, 344_450, 387_015]);
    expect(tubLevels(NET_NEW_2026, 120_000)[5]).toBe(248_230);
  });

  it("pins the opening for each start of the file", () => {
    expect(openingFromStart("2025-01")).toBe(258_785);
    expect(openingFromStart("2025-03")).toBe(218_195);
    expect(openingFromStart("2026-01")).toBe(0);
    expect(EDGE_STARTS).toHaveLength(13);
    const ending = (month: string) => SUMMARY.find((row) => row.month === month)?.ending ?? 0;
    for (const start of EDGE_STARTS.slice(1)) expect(openingFromStart(start), start).toBe(258_785 - ending(previousMonth(start)));
    expect(uncovered("2025-01")).toHaveLength(12);
    expect(uncovered("2026-01")).toHaveLength(0);
  });

  it("knows the month before", () => {
    expect([previousMonth("2025-01"), previousMonth("2025-03"), previousMonth("2026-01")]).toEqual(["2024-12", "2025-02", "2025-12"]);
  });

  it("pours columns and arrows into the numbers of scene 4", () => {
    const levels = [334_675, 344_450, 387_015];
    expect(sumAt(levels, [0, 1])).toBe(679_125);
    expect(sumAt(levels, [0, 1, 2])).toBe(1_066_140);
    expect(sumAt(NET_NEW_2026.slice(3), [0, 1, 2])).toBe(32_380);
  });

  it("counts any set of status codes, and A with C is the 120 of run 2", () => {
    expect(countCodes(new Set(["A", "N"]), STATUS)).toBe(132);
    expect(countCodes(new Set(["A", "C"]), STATUS)).toBe(RUN2_ACTIVE);
    expect(countCodes(new Set(), STATUS)).toBe(0);
    expect(countCodes(new Set(["A", "N", "C"]), STATUS)).toBe(144);
  });
});
