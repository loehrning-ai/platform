import { describe, expect, it } from "vitest";
import { REVENUES } from "./data";
import { BARS, ROW_ZOOM, SLOT, STACK_GAP, STAGE, bars, blocks, cutX, groupLabels, rulerX, slotCenter } from "./geometry";
import { END_SCENE, HERO_SCENE, INTRO_SECONDS, atCut, introScene } from "./motion";
import { septemberRates } from "./logic";

describe("seek determinism", () => {
  it("renders the same frame for the same progress", () => {
    for (const t of [0, 0.3, 1.2, 1.9, 2.3, 99]) expect(introScene(t)).toEqual(introScene(t));
    for (const cut of [3, 3.4, 4, 4.5, 5.9]) {
      expect(blocks(cut, 0.4, 0.8)).toEqual(blocks(cut, 0.4, 0.8));
    }
  });
});

describe("intro", () => {
  it("ends on the settled state: report cut, total view, the weeks stacked into towers", () => {
    const end = introScene(INTRO_SECONDS);
    expect(end).toMatchObject({ cutF: 4, m: 0, s: 1, rise: 1, clock: null, tick5: true, ask: 0, flash: 0, pulse: 0 });
    expect(END_SCENE).toMatchObject({ cutF: 4, m: 0, s: 1, rise: 1 });
  });

  it("opens on the hero, the same frame the server renders: nine columns, +26 %, the hub tile's picture", () => {
    expect(introScene(0)).toEqual({ ...HERO_SCENE, clock: 0 });
    expect(HERO_SCENE).toMatchObject({ cutF: 4, m: 0, s: 0, rise: 1, tick5: false });
    for (let t = 0; t <= INTRO_SECONDS; t += 0.02) {
      const frame = introScene(t);
      expect(frame.m).toBe(0);
      expect(frame.rise).toBe(1);
    }
  });

  it("steps one column right, holds -20 % long enough to read, then springs back", () => {
    expect(introScene(0.95).cutF).toBeCloseTo(5, 5);
    expect(introScene(2.2).cutF).toBeCloseTo(5, 5);
    const held = Array.from({ length: 200 }, (_, i) => i * 0.01 + 0.9).filter((t) => Math.abs(introScene(t).cutF - 5) < 0.005);
    expect(held.length * 0.01).toBeGreaterThanOrEqual(1.1);
    expect(introScene(0.95).tick5).toBe(true);
    expect(introScene(0.5).tick5).toBe(false);
    // the spring swings a little past the report cut, then lands on it
    const dips = Array.from({ length: 140 }, (_, i) => introScene(2.3 + i * 0.01).cutF);
    expect(Math.min(...dips)).toBeLessThan(4);
    expect(Math.min(...dips)).toBeGreaterThan(3.7);
    expect(introScene(INTRO_SECONDS).cutF).toBe(4);
  });

  it("flashes week 5 when it changes side, both ways, and not otherwise", () => {
    expect(introScene(0.3).flash).toBe(0);
    expect(introScene(0.85).flash).toBeGreaterThan(0.9);
    expect(introScene(1.6).flash).toBe(0);
    expect(introScene(2.6).flash).toBeGreaterThan(0.9);
    expect(introScene(3.5).flash).toBe(0);
  });

  it("keeps the columns until the answer is read, then gathers them into the towers", () => {
    expect(introScene(2.8).s).toBe(0);
    expect(introScene(3.3).s).toBeGreaterThan(0.2);
    expect(introScene(3.3).s).toBeLessThan(0.8);
    expect(introScene(3.8).s).toBe(1);
  });

  it("lights the question up only while -20 % stands", () => {
    expect(introScene(0.1).ask).toBe(0);
    expect(introScene(1.6).ask).toBe(1);
    expect(introScene(INTRO_SECONDS).ask).toBe(0);
  });

  it("is a first pass of about four seconds, long enough to read two numbers and a stack", () => {
    expect(INTRO_SECONDS).toBeGreaterThanOrEqual(3.5);
    expect(INTRO_SECONDS).toBeLessThanOrEqual(4.5);
  });
});

describe("stage geometry", () => {
  it("keeps every block's height equal to its revenue in a view: towers 1x less the paper gap, columns and the weekly row at the zoom", () => {
    for (const cut of [3, 3.5, 4, 5, 5.25, 6]) {
      blocks(cut, 0).forEach((block, index) => {
        expect(block.h).toBeCloseTo((REVENUES[index] as number) * STAGE.pxPerEur - STACK_GAP, 6);
      });
      blocks(cut, 0, 1, 0).forEach((block, index) => {
        expect(block.h).toBeCloseTo((REVENUES[index] as number) * STAGE.pxPerEur * ROW_ZOOM, 6);
      });
      blocks(cut, 1).forEach((block, index) => {
        expect(block.h).toBeCloseTo((REVENUES[index] as number) * STAGE.pxPerEur * ROW_ZOOM, 6);
      });
    }
  });

  it("opens as nine columns on the baseline, one slot each, all the same width", () => {
    const columns = blocks(4, 0, 1, 0);
    columns.forEach((block) => expect(block.y + block.h).toBeCloseTo(STAGE.base, 6));
    columns.forEach((block) => expect(block.w).toBeCloseTo(SLOT - 5, 6));
    columns.forEach((block, index) => expect(block.x + block.w / 2).toBeCloseTo(slotCenter(index), 6));
    expect(columns.filter((block) => block.left)).toHaveLength(4);
  });

  it("keeps every block of a tower on one x and one width, at every cut and every stage of the gathering", () => {
    for (const cut of [3, 3.3, 4, 4.0001, 4.5, 4.9999, 5, 5.7, 6]) {
      const list = blocks(cut, 0);
      const low = Math.floor(cut);
      const onTower = list.filter((block) => block.index !== low);
      for (const side of [true, false]) {
        const members = onTower.filter((block) => (block.index < low) === side);
        for (const block of members) {
          expect(block.x).toBeCloseTo(members[0]?.x as number, 6);
          expect(block.w).toBeCloseTo(members[0]?.w as number, 6);
          expect(block.w).toBe(STAGE.towerWidth);
        }
      }
    }
  });

  it("lands the block next to the line exactly on the tower at both ends of its hop, and lifts it clear in between", () => {
    for (const low of [3, 4, 5]) {
      const rest = blocks(low, 0);
      const right = rest.find((block) => block.index > low) as (typeof rest)[number];
      const crossing = rest[low] as (typeof rest)[number];
      expect(crossing.x).toBeCloseTo(right.x, 6);
      expect(crossing.w).toBe(STAGE.towerWidth);
      // it is the top of the right tower: nothing of that tower is above it
      expect(crossing.y).toBeLessThanOrEqual(Math.min(...rest.filter((block) => block.index > low).map((block) => block.y)));
      const after = blocks(low + 1, 0);
      const left = after.find((block) => block.index < low + 1 && block.index !== low) as (typeof after)[number];
      expect((after[low] as (typeof after)[number]).x).toBeCloseTo(left.x, 6);
      const mid = (blocks(low + 0.5, 0)[low] as (typeof rest)[number]);
      const tops = [...rest, ...after].filter((block) => block.index !== low).map((block) => block.y);
      expect(mid.y).toBeLessThan(Math.min(...rest.filter((block) => block.index > low).map((block) => block.y)) );
      expect(mid.y).toBeLessThan(Math.min(...after.filter((block) => block.index < low).map((block) => block.y)) );
      expect(Math.min(...tops)).toBeGreaterThan(0);
    }
  });

  it("gathers the columns into the towers with the baseline weeks first", () => {
    const early = blocks(4, 0, 1, 0.35);
    const rest = blocks(4, 0, 1, 0);
    const done = blocks(4, 0, 1, 1);
    // week 1 (bottom of the left tower) is further along than week 4 (top of it)
    const progress = (i: number) => Math.abs((early[i] as (typeof early)[number]).x - (rest[i] as (typeof rest)[number]).x) / Math.abs((done[i] as (typeof done)[number]).x - (rest[i] as (typeof rest)[number]).x);
    expect(progress(0)).toBeGreaterThan(progress(3));
  });

  it("fills the plot in the weekly view: the row is at least a third as tall as the tallest tower", () => {
    const tallest = STAGE.base - Math.min(...blocks(3, 0).map((b) => b.y));
    const row = Math.max(...blocks(4, 1).map((b) => b.h));
    expect(row).toBeGreaterThan(tallest / 3);
  });

  it("stacks four and five blocks in the total view and a level row in the weekly view", () => {
    const total = blocks(4, 0);
    const tops = (side: boolean) => total.filter((b) => b.left === side).map((b) => b.y);
    expect(total.filter((b) => b.left)).toHaveLength(4);
    expect(Math.min(...tops(false))).toBeLessThan(Math.min(...tops(true)));
    const row = blocks(4, 1);
    row.forEach((block, index) => expect(block.y + block.h).toBeCloseTo(STAGE.base, 6));
    expect(row[0]?.x).toBeLessThan(row[8]?.x as number);
  });

  it("moves week 5 across the line between cut 4 and cut 5, flipping at the half", () => {
    expect(blocks(4, 0)[4]?.left).toBe(false);
    expect(blocks(5, 0)[4]?.left).toBe(true);
    expect(blocks(4.4, 0)[4]?.left).toBe(false);
    expect(blocks(4.6, 0)[4]?.left).toBe(true);
  });

  it("keeps the towers inside the stage at every allowed cut", () => {
    for (const cut of [3, 4, 5, 6]) {
      for (const block of blocks(cut, 0)) {
        expect(block.x).toBeGreaterThanOrEqual(0);
        expect(block.x + block.w).toBeLessThanOrEqual(STAGE.width);
        expect(block.y).toBeGreaterThanOrEqual(STAGE.top);
      }
    }
  });

  it("puts the line between slots", () => {
    expect(cutX(4)).toBeCloseTo(STAGE.pad + 4 * SLOT, 6);
    expect(groupLabels(4, 0).a.n).toBe(4);
    expect(groupLabels(4, 0).b.total).toBe(21687544);
  });

  it("interpolates a per-cut value between neighbours", () => {
    const f = (k: number) => k * 10;
    expect(atCut(f, 4)).toBe(40);
    expect(atCut(f, 4.5)).toBeCloseTo(45, 6);
  });
});

describe("ruler and bars", () => {
  it("maps the axis end to end", () => {
    expect(rulerX(-0.6)).toBeLessThan(rulerX(0));
    expect(rulerX(0)).toBeLessThan(rulerX(1.1));
  });

  it("re-sorts rows from count to rate and ends at the per-1.000 order", () => {
    const rows = septemberRates().map((r) => ({ ...r }));
    const order = (u: number) => [...bars(rows, u)].sort((a, b) => a.y - b.y).map((r) => r.line);
    expect(order(0)).toEqual(["CRAFT", "NEST", "AURA", "PULSE"]);
    expect(order(1)).toEqual(["CRAFT", "NEST", "PULSE", "AURA"]);
    expect(bars(rows, 0)[0]?.length).toBe(1);
    expect(bars(rows, 1)[0]?.length).toBeCloseTo(2.51 / BARS.perMax, 2);
  });
});
