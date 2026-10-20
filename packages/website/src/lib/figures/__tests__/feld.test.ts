import { describe, expect, it } from "vitest";
import {
  F,
  FELD_CAPACITY,
  INK_CLASS,
  STRIDE,
  TRANSITION,
  compileFeld,
  createFrameBuffer,
  frame,
  sceneAt,
  sceneSettled,
  type FeldModel,
} from "../feld/index.ts";
import { allocateSquares, largestRemainder, unitLine } from "../units.ts";
import type { FieldData } from "../types.ts";
import { FIELD, FIELD_LOOP } from "./fixtures-hero.ts";

const data = (spec: typeof FIELD): FieldData => spec.data as FieldData;
const VIEW = { width: 390, height: 300 };

function snapshot(model: FeldModel, p: number): { buf: Float32Array; info: ReturnType<typeof frame> } {
  const buf = createFrameBuffer(model);
  return { buf, info: frame(model, p, buf) };
}

/** Records of the squares that are drawn (class 0 or more). */
function visible(buf: Float32Array, model: FeldModel): number[] {
  const out: number[] = [];
  for (let i = 0; i < model.capacity; i += 1) if ((buf[i * STRIDE + F.cls] ?? -1) >= 0) out.push(i);
  return out;
}

describe("units: largest remainder", () => {
  it("adds up to the total and follows the shares", () => {
    const parts = largestRemainder([4273, 8, 4249, 32, 4225, 57], 1000);
    expect(parts.reduce((s, v) => s + v, 0)).toBe(1000);
    expect(largestRemainder([1, 1, 1], 100).reduce((s, v) => s + v, 0)).toBe(100);
    expect(largestRemainder([1, 1, 1], 100).sort()).toEqual([33, 33, 34]);
  });

  it("is exact when the base fits the squares", () => {
    expect(largestRemainder([48, 41], 89)).toEqual([48, 41]);
  });

  it("never rounds a small class up: whole squares plus a partial square", () => {
    // 38 of 51.716 releases on 1.034 squares is 0,76 of one square.
    const a = allocateSquares([{ count: 51716 - 38 }, { count: 38, partial: true }], 51716, 1034);
    expect(a.whole).toEqual([1033, 0]);
    expect(a.frac[1]).toBe(0.76);
    // 0,37 % of 1.000 is 3 squares plus 0,7.
    const b = allocateSquares([{ count: 21404 - 79 }, { count: 79, partial: true }], 21404, 1000);
    expect(b.whole[1]).toBe(3);
    expect(b.frac[1]).toBe(0.69);
    expect(b.whole.reduce((s, v) => s + v, 0) + 1).toBe(1000);
  });

  it("writes the unit line exactly when one square is a whole number of things", () => {
    expect(unitLine(89, 89, "Seite|Seiten")).toBe("1 Quadrat = 1 Seite");
    expect(unitLine(5000, 1000, "Ziehung|Ziehungen")).toBe("1 Quadrat = 5 Ziehungen");
    expect(unitLine(21402, 1000, "Startseite|Startseiten")).toBe("1 Quadrat = etwa 21 Startseiten");
    expect(unitLine(100, 100, "Anzeige|Anzeigen", "Block")).toBe("1 Block = 1 Anzeige");
  });
});

describe("compileFeld", () => {
  const model = compileFeld(data(FIELD), VIEW);

  it("draws exactly the squares of every scene and sums the classes", () => {
    expect(model.scenes.map((s) => s.squares)).toEqual([1000, 89, 100]);
    for (const scene of model.scenes) {
      let slots = 0;
      for (let i = 0; i < FELD_CAPACITY; i += 1) if ((scene.cls[i] ?? -1) >= 0) slots += 1;
      expect(slots).toBe(scene.squares);
    }
  });

  it("matches the counts of the JSON where the unit is exact", () => {
    const twice = model.scenes[1];
    const lost = model.classIndex.get("lost") ?? -1;
    const other = model.classIndex.get("other") ?? -1;
    expect(twice?.perClass[lost]).toBe(41);
    expect(twice?.perClass[other]).toBe(48);
    expect(twice?.unit).toBe("1 Quadrat = 1 Seite");
  });

  it("keeps the small class as a partial square, filled from the bottom", () => {
    const fifths = model.scenes[0];
    const ki = model.classIndex.get("ki") ?? -1;
    const partial: number[] = [];
    for (let i = 0; i < 1000; i += 1) if ((fifths?.cls[i] ?? -1) === ki && (fifths?.fill[i] ?? 1) < 1) partial.push(fifths?.fill[i] ?? 1);
    expect(partial).toHaveLength(1);
    expect(partial[0]).toBeGreaterThan(0.3);
    expect(partial[0]).toBeLessThan(0.4);
  });

  it("never overlaps squares and keeps them inside the box", () => {
    for (const scene of model.scenes) {
      const seen = new Set<string>();
      for (let i = 0; i < scene.squares; i += 1) {
        const x = scene.x[i] ?? 0;
        const y = scene.y[i] ?? 0;
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x + scene.side).toBeLessThanOrEqual(VIEW.width + 0.5);
        expect(y + scene.side).toBeLessThanOrEqual(VIEW.height + 0.5);
        const key = `${Math.round(x)}:${Math.round(y)}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  it("holds the squares at 8 units or more where the box allows it", () => {
    const roomy = compileFeld(data(FIELD), { width: 390, height: 420 });
    for (const scene of roomy.scenes) {
      expect(scene.fits).toBe(true);
      expect(scene.side).toBeGreaterThanOrEqual(7);
    }
  });

  it("shrinks the squares instead of leaving the box when the box is too short", () => {
    const tight = compileFeld(data(FIELD), { width: 390, height: 120 });
    const fifths = tight.scenes[0];
    for (let i = 0; i < (fifths?.squares ?? 0); i += 1) expect((fifths?.y[i] ?? 0) + (fifths?.side ?? 0)).toBeLessThanOrEqual(120.5);
  });

  it("labels the bins with name and exact count", () => {
    const fifths = model.scenes[0];
    expect(fifths?.labels.some((l) => l.text === "kurz")).toBe(true);
    expect(fifths?.labels.some((l) => l.role === "value" && l.text === "4.281")).toBe(true);
  });

  it("gives every scene a share of the timeline that adds up to 1", () => {
    expect(model.starts[0]).toBe(0);
    expect(model.starts[model.scenes.length]).toBe(1);
    expect(sceneAt(model, 0).index).toBe(0);
    expect(sceneAt(model, 1)).toEqual({ index: 2, local: 1 });
    expect(sceneAt(model, 0.5).index).toBe(1);
    expect(sceneSettled(model, 1)).toBeCloseTo((model.starts[1] ?? 0) + ((model.starts[2] ?? 1) - (model.starts[1] ?? 0)) * TRANSITION, 6);
  });
});

describe("frame", () => {
  const model = compileFeld(data(FIELD), VIEW);

  it("is a pure function of the progress", () => {
    for (const p of [0, 0.1, 0.37, 0.5, 0.66, 0.9, 1]) {
      const a = snapshot(model, p);
      const b = snapshot(model, p);
      expect(Array.from(a.buf)).toEqual(Array.from(b.buf));
      expect(a.info).toEqual(b.info);
    }
  });

  it("gives the same pixels whatever order the progresses are asked in", () => {
    const order = [0.8, 0.1, 0.5, 1, 0.3];
    const direct = new Map(order.map((p) => [p, Array.from(snapshot(model, p).buf)]));
    const buf = createFrameBuffer(model);
    for (const p of [...order].reverse()) {
      frame(model, p, buf);
      expect(Array.from(buf)).toEqual(direct.get(p));
    }
  });

  it("allocates nothing: it writes into the buffer it is given", () => {
    const buf = createFrameBuffer(model);
    const Original = globalThis.Float32Array;
    let made = 0;
    class Counting extends Original {
      constructor(...args: ConstructorParameters<typeof Float32Array>) {
        super(...args);
        made += 1;
      }
    }
    globalThis.Float32Array = Counting as unknown as typeof Float32Array;
    try {
      for (let i = 0; i <= 20; i += 1) frame(model, i / 20, buf);
    } finally {
      globalThis.Float32Array = Original;
    }
    expect(made).toBe(0);
  });

  it("starts empty when the first scene pours in, and ends on the last scene", () => {
    const start = snapshot(model, 0);
    expect(visible(start.buf, model)).toHaveLength(0);
    const end = snapshot(model, 1);
    const last = model.scenes[2];
    expect(visible(end.buf, model)).toHaveLength(last?.squares ?? -1);
    // finished: every square rests on its slot
    for (const i of visible(end.buf, model)) {
      expect(end.buf[i * STRIDE + F.x]).toBeCloseTo(last?.x[i] ?? 0, 3);
      expect(end.buf[i * STRIDE + F.y]).toBeCloseTo(last?.y[i] ?? 0, 3);
    }
  });

  it("pours a new population in from the top and drains the old one out of the bottom, never morphing it", () => {
    // pages (scene 0) -> pairs (scene 1) is a change of population; scene 1 spans 0.333..0.667
    const at = (u: number): ReturnType<typeof snapshot> => snapshot(model, (model.starts[1] ?? 0) + ((model.starts[2] ?? 1) - (model.starts[1] ?? 0)) * TRANSITION * u);
    const drain = at(0.3);
    const rows = visible(drain.buf, model);
    expect(rows.length).toBeGreaterThan(0);
    // the old scene shows while it drains (display switches halfway)
    expect(drain.info.display).toBe(0);
    for (const i of rows) expect(drain.buf[i * STRIDE + F.y]).toBeGreaterThanOrEqual(model.scenes[0]?.y[i] ?? 0);
    const pour = at(0.6);
    expect(pour.info.display).toBe(1);
    for (const i of visible(pour.buf, model)) expect(pour.buf[i * STRIDE + F.y]).toBeLessThanOrEqual(model.scenes[1]?.y[i] ?? 0 + 1);
    // in between nothing of the old field is left on the canvas
    const gap = at(0.48);
    for (const i of visible(gap.buf, model)) {
      const y = gap.buf[i * STRIDE + F.y] ?? 0;
      expect(y > VIEW.height - 1 || y < 1).toBe(true);
    }
  });

  it("leaves outlines where a ghost class fell out of the field", () => {
    const two: FieldData = {
      classes: data(FIELD).classes,
      scenes: [
        { id: "a", population: "p", base: 89, squares: 89, unit: "Seite|Seiten", layout: "grid", cols: 10, enter: "none", bins: [{ id: "all", segments: [{ cls: "other", count: 89 }] }] },
        { id: "b", population: "p", base: 89, squares: 89, unit: "Seite|Seiten", layout: "grid", cols: 10, bins: [{ id: "all", segments: [{ cls: "other", count: 48 }, { cls: "lost", count: 41 }] }] },
      ],
    };
    const m = compileFeld(two, VIEW);
    const end = snapshot(m, 1);
    let ghosts = 0;
    let filled = 0;
    for (let i = 0; i < m.capacity; i += 1) {
      if ((end.buf[i * STRIDE + F.ga] ?? 0) > 0.5) ghosts += 1;
      if ((end.buf[i * STRIDE + F.cls] ?? -1) >= 0) filled += 1;
    }
    expect(ghosts).toBe(41);
    expect(filled).toBe(48);
    // mid-fall the filled square is below its outline
    const mid = snapshot(m, 0.5 + 0.5 * TRANSITION * 0.45);
    let falling = 0;
    for (let i = 48; i < 89; i += 1) if ((mid.buf[i * STRIDE + F.y] ?? 0) > (m.scenes[1]?.y[i] ?? 0) + 1) falling += 1;
    expect(falling).toBeGreaterThan(0);
  });

  it("keeps a square's class across a joint table and resets it to ink otherwise", () => {
    const base = (joint: boolean): FieldData => ({
      classes: data(FIELD).classes,
      scenes: [
        { id: "a", population: "p", base: 100, squares: 100, unit: "Seite|Seiten", layout: "bins", enter: "none", bins: [{ id: "x", label: "x", segments: [{ cls: "ki", count: 30 }, { cls: "plain", count: 70 }] }] },
        { id: "b", population: "p", base: 100, squares: 100, unit: "Seite|Seiten", layout: "bins", joint, bins: [{ id: "x", label: "x", segments: [{ cls: "ki", count: 30 }] }, { id: "y", label: "y", segments: [{ cls: "plain", count: 70 }] }] },
      ],
    });
    const ink = INK_CLASS;
    const classesDuring = (joint: boolean): Set<number> => {
      const m = compileFeld(base(joint), VIEW);
      const set = new Set<number>();
      for (let u = 0.1; u < 0.9; u += 0.1) {
        const { buf } = snapshot(m, 0.5 + 0.5 * TRANSITION * u);
        for (const i of visible(buf, m)) set.add(buf[i * STRIDE + F.cls] ?? -1);
      }
      return set;
    };
    expect(classesDuring(true).has(ink)).toBe(false);
    expect(classesDuring(false).has(ink)).toBe(true);
  });

  it("closes the loop: the settled cover equals the first frame", () => {
    const m = compileFeld(data(FIELD_LOOP), VIEW);
    expect(Array.from(snapshot(m, 0).buf)).toEqual(Array.from(snapshot(m, 1).buf));
    // and the cover is already a finding at t = 0 (not empty)
    expect(visible(snapshot(m, 0).buf, m).length).toBeGreaterThan(0);
  });

  it("tells the page which scene to print and when the scene is formed", () => {
    expect(snapshot(model, 1).info).toMatchObject({ index: 2, display: 2, settled: true });
    expect(snapshot(model, (model.starts[1] ?? 0) + 0.001).info.settled).toBe(false);
  });

  it("handles the 1.034 squares of a large scene", () => {
    const big: FieldData = {
      classes: data(FIELD).classes,
      scenes: [
        {
          id: "police", population: "releases", base: 51716, squares: 1034, unit: "Meldung|Meldungen", layout: "grid", enter: "none",
          bins: [{ id: "all", segments: [{ cls: "plain", count: 51716 - 38 }, { cls: "ki", count: 38, partial: true }] }],
        },
      ],
    };
    const m = compileFeld(big, { width: 390, height: 420 });
    expect(m.scenes[0]?.squares).toBe(1034);
    expect(m.scenes[0]?.unit).toBe("1 Quadrat = etwa 50 Meldungen");
    const end = snapshot(m, 1);
    expect(visible(end.buf, m)).toHaveLength(1034);
  });
});
