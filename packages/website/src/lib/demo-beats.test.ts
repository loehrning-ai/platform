import { describe, expect, it } from "vitest";
import { beatIndexFromParam, clockT, splitClock, validateBeats, type Beat, type BeatKind } from "./demo-beats";

const beat = (id: string, kind: BeatKind, extra: Partial<Beat> = {}): Beat => ({
  id,
  kind,
  seconds: 2,
  label: { de: id, en: id },
  ...extra,
});

const FIVE = [
  beat("frage", "commit"),
  beat("kipp", "reveal"),
  beat("werkzeug", "tool"),
  beat("deins", "own"),
  beat("mitnehmen", "takehome"),
];

describe("validateBeats", () => {
  it("accepts commit, reveal, tool, own, takehome with 0 to 3 apply beats", () => {
    expect(validateBeats(FIVE)).toEqual([]);
    const withApply = [...FIVE.slice(0, 3), beat("a1", "apply"), beat("a2", "apply"), beat("a3", "apply"), ...FIVE.slice(3)];
    expect(withApply).toHaveLength(8);
    expect(validateBeats(withApply)).toEqual([]);
  });

  it("rejects a wrong order, a missing kind, four apply beats and more than eight", () => {
    expect(validateBeats([FIVE[1] as Beat, FIVE[0] as Beat, ...FIVE.slice(2)])).not.toEqual([]);
    expect(validateBeats(FIVE.slice(0, 4))).not.toEqual([]);
    const four = [...FIVE.slice(0, 3), ...["a", "b", "c", "d"].map((id) => beat(id, "apply")), ...FIVE.slice(3)];
    expect(validateBeats(four).join(" ")).toMatch(/kinds|at most 8/);
  });

  it("rejects bad ids, repeated ids, long labels, out-of-range seconds and kit paths outside the zip", () => {
    const errors = validateBeats([
      beat("Frage", "commit"),
      beat("kipp", "reveal", { seconds: 99 }),
      beat("kipp", "tool", { label: { de: "x".repeat(17), en: "ok" } }),
      beat("deins", "own", { kitFile: "../secret.md" }),
      beat("mitnehmen", "takehome"),
    ]).join("\n");
    expect(errors).toMatch(/not a lower-case slug/);
    expect(errors).toMatch(/repeats/);
    expect(errors).toMatch(/seconds 99/);
    expect(errors).toMatch(/1 to 16 characters/);
    expect(errors).toMatch(/inside the kit zip/);
  });
});

describe("deep links and the clock", () => {
  it("reads ?beat= as an id or a 1-based number", () => {
    expect(beatIndexFromParam(FIVE, "kipp")).toBe(1);
    expect(beatIndexFromParam(FIVE, "3")).toBe(2);
    expect(beatIndexFromParam(FIVE, "5")).toBe(4);
    for (const bad of [null, "", "0", "6", "x", "10", "-1"]) expect(beatIndexFromParam(FIVE, bad)).toBeNull();
  });

  it("maps between t and (beat, progress)", () => {
    expect(clockT(2, 0.5)).toBe(2.5);
    expect(clockT(2, 3)).toBe(3);
    expect(splitClock(2.5, 5)).toEqual({ index: 2, progress: 0.5 });
    expect(splitClock(5, 5)).toEqual({ index: 4, progress: 1 });
    expect(splitClock(-1, 5)).toEqual({ index: 0, progress: 0 });
  });
});
