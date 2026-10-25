import { describe, expect, it } from "vitest";
import { DONE_AT, HIT_SPAN, SNAP_AT, SWEEP_BEATS, sweepP, doneCount, hitFrame, hitU, isSettled, nudge, remaining, sendFrame, settle, snapValue, stopsFor } from "./motion";

describe("redact motion", () => {
  it("counts down from n to 0 across the handle", () => {
    expect(remaining(0, 4)).toBe(4);
    expect(remaining(1, 4)).toBe(0);
    let last = 4;
    for (let p = 0; p <= 1; p += 0.01) {
      const now = remaining(p, 4);
      expect(now).toBeLessThanOrEqual(last);
      last = now;
    }
  });

  it("is monotone per hit and hits go one after another", () => {
    for (let i = 0; i < 4; i += 1) {
      let last = 0;
      for (let p = 0; p <= 1; p += 0.01) {
        const u = hitU(p, i, 4);
        expect(u).toBeGreaterThanOrEqual(last);
        last = u;
      }
    }
    expect(hitU(0, 0, 4)).toBe(0);
    expect(hitU(1, 3, 4)).toBe(1);
    // windows overlap: the next hit has begun before this one is done
    const p = 0.3;
    expect(hitU(p, 0, 4)).toBeGreaterThan(0);
    expect(hitU(p, 0, 4)).toBeLessThan(1);
    expect(hitU(p, 1, 4)).toBeGreaterThan(0);
  });

  it("sweeps the bar visibly, holds it full for a beat, then crossfades the pill", () => {
    // find the u range where the bar is strictly between 0 and 1: the sweep must span a real stretch of the drag
    const n = 4;
    const sweep = Array.from({ length: 1001 }, (_, k) => k / 1000).filter((p) => {
      const f = hitFrame(p, 0, n);
      return f.bar > 0.02 && f.bar < 0.98;
    });
    const span = (sweep[sweep.length - 1] as number) - (sweep[0] as number);
    expect(span).toBeGreaterThan(0.1);
    const held = Array.from({ length: 1001 }, (_, k) => k / 1000).filter((p) => {
      const f = hitFrame(p, 0, n);
      return f.bar === 1 && f.pill === 0;
    });
    expect(held.length / 1000).toBeGreaterThan(0.04);
    // never marker and pill both visible with the bar absent
    for (let k = 0; k <= 1000; k += 1) {
      const f = hitFrame(k / 1000, 0, n);
      if (f.bar === 0 && !f.done && f.pill > 0) throw new Error(`pill without bar at ${k / 1000}`);
    }
    expect(HIT_SPAN).toBeGreaterThan(1);
  });

  it("stops are the handle positions at which each hit is finished, then 1", () => {
    for (const n of [1, 4, 7]) {
      const stops = stopsFor(n);
      expect(stops).toHaveLength(n + 1);
      stops.slice(0, n).forEach((stop, i) => expect(hitU(stop, i, n)).toBeCloseTo(DONE_AT, 9));
      expect(stops[n]).toBe(1);
    }
  });

  it("starts as a marker, sweeps a bar, ends as a pill", () => {
    expect(hitFrame(0, 0, 4)).toEqual({ marker: 1, bar: 0, pill: 0, done: false });
    const mid = hitFrame(0.12, 0, 4);
    expect(mid.bar).toBeGreaterThan(0);
    expect(hitFrame(stopsFor(4)[0] as number, 0, 4)).toMatchObject({ bar: 0, pill: 1, done: true });
  });

  it("a pill is whole exactly when the hit counts as done, in every motion mode", () => {
    for (let v = 0; v <= 1000; v += 3) {
      for (const n of [1, 4, 7]) {
        for (let i = 0; i < n; i += 1) {
          const f = hitFrame(v / 1000, i, n);
          expect(f.pill === 1).toBe(f.done);
          expect(f.done).toBe(hitU(v / 1000, i, n) >= DONE_AT);
        }
      }
    }
  });

  it("quantises to 0 or 1 without a sweep when steps is set", () => {
    for (let p = 0; p <= 1; p += 0.05) {
      const f = hitFrame(p, 1, 4, true);
      expect([0, 1]).toContain(f.pill);
      expect([0, 1]).toContain(f.bar === 0 ? 0 : 1);
    }
    expect(hitFrame(0.12, 0, 4, true).done).toBe(false);
  });

  it("settles after the last hit and settles at once for n = 0", () => {
    expect(settle(0.6, 4)).toBe(0);
    expect(settle(1, 4)).toBe(1);
    expect(isSettled(1, 4)).toBe(true);
    expect(isSettled(0.95, 4)).toBe(false);
    expect(isSettled(0, 0)).toBe(false);
    expect(isSettled(1, 0)).toBe(true);
  });

  it("nudges twice and rests at 0", () => {
    expect(nudge(0)).toBeCloseTo(0);
    expect(nudge(1)).toBeCloseTo(0);
    expect(nudge(0.25)).toBeCloseTo(0.06);
    expect(nudge(0.75)).toBeCloseTo(0.06);
    expect(nudge(0.5)).toBeCloseTo(0);
  });

  it("snaps from the release value to exactly 1", () => {
    expect(snapValue(0.95, 0)).toBeCloseTo(0.95);
    expect(snapValue(0.95, 1)).toBe(1);
    expect(SNAP_AT).toBeLessThan(0.95);
  });

  it("send: chips lift off together, land before the line shuts, and the gap between neighbours never shrinks", () => {
    expect(sendFrame(1)).toMatchObject({ away: 0, ghost: 0, line: 1 });
    expect(sendFrame(0)).toMatchObject({ away: 1, line: 0 });
    expect(sendFrame(0.2).away).toBeGreaterThan(0);
    expect(sendFrame(0.2).away).toBeLessThan(1);
    expect(sendFrame(0.65).away).toBe(0);
    // away is monotonic, so start gap * away + row gap * (1 - away) never drops below the smaller of the two.
    let last = 1;
    for (let t = 0; t <= 1; t += 0.01) {
      expect(sendFrame(t).away).toBeLessThanOrEqual(last + 1e-9);
      last = sendFrame(t).away;
    }
  });

  it("done hits and remaining hits always add up to n, at every value and every n", () => {
    for (let n = 0; n <= 12; n += 1) {
      for (let v = 0; v <= 1000; v += 25) {
        const p = v / 1000;
        expect(doneCount(p, n) + remaining(p, n)).toBe(n);
        // The frame of each hit agrees with the count (full motion and stepped alike).
        for (const steps of [false, true]) {
          const doneFrames = Array.from({ length: n }, (_, i) => hitFrame(p, i, n, steps).done).filter(Boolean).length;
          expect(doneFrames).toBe(doneCount(p, n));
        }
      }
      expect(doneCount(1, n)).toBe(n);
      expect(doneCount(0, n)).toBe(0);
    }
  });

  it("is finite for n = 0..12 and never divides by zero", () => {
    for (let n = 0; n <= 12; n += 1) {
      for (let p = 0; p <= 1; p += 0.125) {
        for (let i = 0; i < Math.max(1, n); i += 1) {
          const f = hitFrame(p, i, n);
          expect(Number.isFinite(f.marker + f.bar + f.pill)).toBe(true);
        }
        expect(Number.isFinite(settle(p, n))).toBe(true);
        expect(remaining(p, n)).toBeGreaterThanOrEqual(0);
      }
      expect(Number.isFinite(sweepP(0.5, n))).toBe(true);
    }
  });
});

describe("the first sweep", () => {
  const { firstEnd, firstHold, allEnd, allHold } = SWEEP_BEATS;

  it("rests at 0 at both ends and never leaves [0, 1]", () => {
    for (const n of [0, 1, 4, 9]) {
      expect(sweepP(0, n)).toBe(0);
      expect(sweepP(1, n)).toBe(0);
      for (let t = 0; t <= 1; t += 0.01) {
        expect(sweepP(t, n)).toBeGreaterThanOrEqual(0);
        expect(sweepP(t, n)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("finishes the first hit alone and holds there before the rest follow", () => {
    for (const n of [1, 2, 4, 7]) {
      const first = stopsFor(n)[0] as number;
      expect(sweepP(firstEnd, n)).toBeCloseTo(first, 9);
      expect(sweepP((firstEnd + firstHold) / 2, n)).toBeCloseTo(first, 9);
      // At the hold exactly one hit is whole and the others are not.
      expect(doneCount(sweepP((firstEnd + firstHold) / 2, n), n)).toBe(1);
      expect(sweepP((allEnd + allHold) / 2, n)).toBe(1);
    }
  });

  it("runs out monotonically and back monotonically", () => {
    for (const n of [0, 3, 6]) {
      let last = 0;
      for (let t = 0; t <= allEnd; t += 0.01) {
        expect(sweepP(t, n)).toBeGreaterThanOrEqual(last - 1e-9);
        last = sweepP(t, n);
      }
      last = 1;
      for (let t = allHold; t <= 1; t += 0.01) {
        expect(sweepP(t, n)).toBeLessThanOrEqual(last + 1e-9);
        last = sweepP(t, n);
      }
    }
  });
});

describe("sendFrame hush", () => {
  it("dims the caption and the handle only while the chips fly, and is pure", () => {
    expect(sendFrame(0).hush).toBe(0);
    expect(sendFrame(0.05).hush).toBe(1);
    expect(sendFrame(0.3).hush).toBe(1);
    expect(sendFrame(0.6).hush).toBeCloseTo(0, 5);
    expect(sendFrame(1).hush).toBe(0);
    expect(sendFrame(0.3)).toEqual(sendFrame(0.3));
  });
});
