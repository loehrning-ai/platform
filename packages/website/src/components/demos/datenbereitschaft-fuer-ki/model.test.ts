import { describe, expect, it } from "vitest";
import { boxesDone, START } from "./model";

describe("boxesDone", () => {
  it("fills box 1 only for the exact question, box 2 only for the approved view", () => {
    expect(boxesDone(2, START)).toEqual([false, false, false, false, false]);
    expect(boxesDone(2, { ...START, exact: true })).toEqual([true, false, false, false, false]);
    expect(boxesDone(2, { ...START, exact: true, view: true })).toEqual([true, true, false, false, false]);
  });

  it("lets the kit's answer stand for a box once its beat is passed", () => {
    expect(boxesDone(3, START).slice(0, 2)).toEqual([true, true]);
    expect(boxesDone(7, START)).toEqual([true, true, true, true, true]);
  });
});
