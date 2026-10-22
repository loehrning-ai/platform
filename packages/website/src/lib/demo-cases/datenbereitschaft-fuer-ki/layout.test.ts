import { describe, expect, it } from "vitest";
import { REQ_01, REQ_02, REQ_05 } from "./cases";
import { DEMO_TEXT } from "./copy";
import { FOLDLINE } from "./data";
import { computeDefinition } from "./engine";
import { formatPct, valuesEqual } from "./format";
import {
  BATHTUB,
  FIGURE_SIZE,
  LABEL,
  fadeIn,
  fadeOut,
  keyItems,
  layout,
  placeLabel,
  resolveRows,
  textWidth,
  type Frame,
  type Label,
  type Shape,
} from "./layout";
import type { Blank, Definition, DefinitionRequest, Reading, Row } from "./model";

/** Every complete definition of a request: the product of its options. */
function definitions(request: DefinitionRequest): Definition[] {
  return request.blanks.reduce<Definition[]>(
    (list, blank: Blank) =>
      list.flatMap((definition) => (request.options[blank] ?? []).map((value) => ({ ...definition, [blank]: value }))),
    [{}],
  );
}

const sameRows = (a: readonly Row[], b: readonly Row[]): boolean =>
  a.length === b.length && a.every((row, index) => row.label === b[index].label && valuesEqual(row.value, b[index].value));

/** Each reading a request can reach, with whether its rows equal the database check. */
function readings(request: DefinitionRequest): Map<Reading, boolean> {
  const out = new Map<Reading, boolean>();
  for (const definition of definitions(request)) {
    const { rows, reading } = computeDefinition(request, definition);
    if (reading === "none") continue;
    out.set(reading, (out.get(reading) ?? true) && sameRows(rows, request.truth));
  }
  return out;
}

const box = (y: number): readonly [number, number] => [y - LABEL.ascent, y + LABEL.descent];
const byId = (frame: Frame): Map<string, Shape> => new Map(frame.shapes.map((shape) => [shape.id, shape]));

describe("figure key and the dashed database check", () => {
  for (const request of [REQ_01, REQ_02, REQ_05]) {
    it(`request ${request.id}: draws the check exactly when the result differs, and the key says so`, () => {
      const reached = readings(request);
      expect(reached.size).toBeGreaterThan(3);
      for (const [reading, right] of reached) {
        const frame = layout(request.figure, reading, { request: request.id });
        const truth = frame.shapes.filter((shape) => shape.truth);
        expect(truth.length > 0, `${request.id} ${reading}`).toBe(!right);
        expect(keyItems(frame).includes("truth"), `${request.id} ${reading}`).toBe(!right);
        for (const shape of truth) expect(shape.solid).toBe(false);
        // The key lists only marks the figure draws.
        const context = frame.shapes.some(
          (shape) => !shape.solid && !shape.truth && (shape.tone === "level" || shape.tone === "change" || shape.tone === "column"),
        );
        expect(keyItems(frame).includes("context"), `${request.id} ${reading}`).toBe(context);
      }
    });
  }

  it("never draws the check before a run", () => {
    for (const request of [REQ_01, REQ_02, REQ_05]) {
      const frame = layout(request.figure, "none", { request: request.id });
      expect(frame.shapes.some((shape) => shape.truth)).toBe(false);
      expect(keyItems(frame)).toEqual(["context"]);
    }
  });

  it("request 02: the check is one dashed 32.380 bar in column five, labelled", () => {
    for (const reading of ["changeDiff", "lastChange", "lastLevel", "stackLevels", "billingSum", "noRows"] as const) {
      const frame = layout("bathtub", reading, { request: "02" });
      const truth = frame.shapes.find((shape) => shape.id === "truth")!;
      expect(truth).toMatchObject({ x: BATHTUB.towerX, w: BATHTUB.columnWidth, truth: true, solid: false });
      expect(truth.h).toBeCloseTo(FOLDLINE.netNewQ2 * BATHTUB.changeScale);
      expect(truth.y + truth.h).toBeCloseTo(BATHTUB.changeBaseline);
      expect(frame.labels.find((label) => label.id === "v-truth")?.text).toEqual({ kind: "eur", amount: FOLDLINE.netNewQ2 });
    }
  });

  it("request 02 billing: the export's sum stands inside the check, labels in the order of the tops", () => {
    const frame = layout("bathtub", "billingSum", { request: "02" });
    const shapes = byId(frame);
    const truth = shapes.get("truth")!;
    const billing = shapes.get("billing")!;
    expect(billing.x).toBeGreaterThan(truth.x);
    expect(billing.x + billing.w).toBeLessThan(truth.x + truth.w);
    const at = (id: string) => {
      const label = frame.labels.find((candidate) => candidate.id === id)!;
      return placeLabel(label, shapes.get(label.attach)!, FIGURE_SIZE.bathtub.width).y;
    };
    // The check's label above yours, neither touching the other or the dashed top edge.
    expect(box(at("v-truth"))[1]).toBeLessThan(box(at("v-billing"))[0]);
    expect(box(at("v-billing"))[1] + LABEL.clear).toBeLessThanOrEqual(truth.y);
  });

  it("request 01: the dashed check is the Q2 month-ends the definition does not give", () => {
    const changes = layout("bathtub", "changes", { request: "01" });
    expect(changes.shapes.filter((shape) => shape.truth).map((shape) => shape.id)).toEqual(["L-2026-04", "L-2026-05", "L-2026-06"]);
    const last = layout("bathtub", "lastLevel", { request: "01" });
    expect(last.shapes.filter((shape) => shape.truth).map((shape) => shape.id)).toEqual(["L-2026-04", "L-2026-05"]);
    const tower = layout("bathtub", "stackLevels", { request: "01" });
    expect(tower.shapes.filter((shape) => shape.truth).map((shape) => shape.id)).toEqual(["GL-2026-04", "GL-2026-05", "GL-2026-06"]);
    // March is never the check: it is there for comparison.
    expect(changes.shapes.find((shape) => shape.id === "L-2026-03")?.truth).toBeFalsy();
  });
});

describe("widths figure labels", () => {
  const reached = [...readings(REQ_05).keys()];

  it("keeps every label clear of every rate line, in DE and EN", () => {
    for (const reading of reached) {
      const frame = layout("widths", reading, { request: "05" });
      const shapes = byId(frame);
      const lines = frame.shapes.filter((shape) => shape.tone === "line").map((shape) => shape.y);
      for (const label of frame.labels) {
        if (label.position === "legend" || label.position === "legendTruth") continue;
        const at = placeLabel(label, shapes.get(label.attach)!, FIGURE_SIZE.widths.width);
        const [top, bottom] = box(at.y);
        for (const y of lines) {
          expect(y < top - LABEL.clear || y > bottom + LABEL.clear, `${reading} ${label.id} vs line ${y}`).toBe(true);
        }
      }
    }
  });

  it("monthlyAveraged: 2,00 % and 2,91 % move inside their columns, paper on ink, under the 3,12 % line", () => {
    const frame = layout("widths", "monthlyAveraged", { request: "05" });
    const shapes = byId(frame);
    for (const id of ["v-M-2026-04", "v-M-2026-05"]) {
      const label = frame.labels.find((candidate) => candidate.id === id)!;
      expect(label).toMatchObject({ position: "insideTop", onSolid: true });
      const column = shapes.get(label.attach)!;
      const [top, bottom] = box(placeLabel(label, column, FIGURE_SIZE.widths.width).y);
      expect(top).toBeGreaterThan(column.y);
      expect(bottom).toBeLessThan(column.y + column.h);
    }
    expect(frame.labels.find((candidate) => candidate.id === "v-M-2026-06")?.position).toBe("above");
  });

  it("puts equal values on equal heights and every name on one row", () => {
    for (const reading of ["pooled", "averageBase", "deptAveraged", "counts"] as const) {
      const frame = layout("widths", reading, { request: "05" });
      const shapes = byId(frame);
      const y = (id: string) => {
        const label = frame.labels.find((candidate) => candidate.id === id)!;
        return placeLabel(label, shapes.get(label.attach)!, FIGURE_SIZE.widths.width).y;
      };
      expect(y("v-D-support")).toBeCloseTo(y("v-D-other"));
      const names = ["engineering", "sales", "support", "other"].map((id) => y(`n-D-${id}`));
      expect(new Set(names).size).toBe(1);
    }
  });

  it("spreads a crowded row so neighbours keep the gap and stay over their columns (DE and EN, phone type)", () => {
    for (const reading of ["pooled", "averageBase", "counts"] as const) {
      for (const locale of ["de", "en"] as const) {
        const frame = layout("widths", reading, { request: "05" });
        const shapes = byId(frame);
        const text = (label: Label): string =>
          label.text.kind === "pct"
            ? formatPct(label.text.pct, locale, label.text.digits ?? 1)
            : label.text.kind === "department"
              ? DEMO_TEXT[locale].figure.departments[label.text.id]
              : "";
        const rows = frame.labels.filter((label) => /^[vn]-D-/.test(label.id));
        const entries = rows.map((label) => {
          const shape = shapes.get(label.attach)!;
          const at = placeLabel(label, shape, FIGURE_SIZE.widths.width);
          const width = textWidth(text(label));
          const center = at.anchor === "middle" ? at.x : at.anchor === "start" ? at.x + width / 2 : at.x - width / 2;
          return { id: label.id, center, y: at.y, width, columnX: shape.x, columnW: shape.w };
        });
        const centers = resolveRows(entries, FIGURE_SIZE.widths.width);
        for (const prefix of ["v-D-", "n-D-"]) {
          const row = entries
            .filter((entry) => entry.id.startsWith(prefix))
            .map((entry) => ({ ...entry, center: centers.get(entry.id)! }))
            .sort((a, b) => a.center - b.center);
          row.forEach((entry, index) => {
            expect(entry.center).toBeGreaterThanOrEqual(entry.columnX);
            expect(entry.center).toBeLessThanOrEqual(entry.columnX + entry.columnW);
            expect(entry.center - entry.width / 2).toBeGreaterThanOrEqual(1);
            expect(entry.center + entry.width / 2).toBeLessThanOrEqual(FIGURE_SIZE.widths.width - 1);
            if (index > 0) {
              const previous = row[index - 1];
              expect(entry.center - entry.width / 2 - (previous.center + previous.width / 2), `${reading} ${locale} ${entry.id}`).toBeGreaterThanOrEqual(
                LABEL.gap - 0.01,
              );
            }
          });
        }
      }
    }
  });

  it("estimates text no narrower than the browser measured it (Figtree 13px)", () => {
    // Measured with getComputedTextLength in the figure at 390px.
    const measured: Record<string, number> = { Support: 47.84, Andere: 43, Other: 33.3, Engineering: 72.13, "10,0 %": 38.86, "Fluktuation 9,80 %": 109.58, "32.380 €": 48.59 };
    for (const [text, width] of Object.entries(measured)) expect(textWidth(text), text).toBeGreaterThanOrEqual(width);
  });
});

describe("request 03 base frame", () => {
  it("labels one value for all segments when the grain is single", () => {
    const single = layout("baseFrame", "base:startOfQuarter", { single: true });
    const labels = single.labels.map((label) => label.id);
    expect(labels).toEqual(["v-frame-all"]);
    expect(single.labels[0].text).toEqual({ kind: "fraction", num: 12, den: 120, digits: 1, scope: "allSegments" });
    const perSegment = layout("baseFrame", "base:startOfQuarter");
    expect(perSegment.labels).toHaveLength(3);
  });
});

describe("fadeIn", () => {
  it("holds new labels back until the marks have moved, then fades them in", () => {
    expect(fadeIn(0)).toBe(0);
    expect(fadeIn(0.6)).toBe(0);
    expect(fadeIn(0.8)).toBeCloseTo(0.5);
    expect(fadeIn(1)).toBe(1);
    expect(fadeIn(Number.NaN)).toBe(1);
  });

  it("clears leaving marks before the new ones arrive", () => {
    expect(fadeOut(0)).toBe(1);
    expect(fadeOut(0.2)).toBeCloseTo(0.5);
    expect(fadeOut(0.4)).toBe(0);
    expect(fadeOut(1)).toBe(0);
  });
});

describe("round 4: the fifth column's name and the base frame's own line", () => {
  const names = (frame: Frame, position: Label["position"]) => frame.labels.filter((label) => label.position === position);

  it("names the fifth column Q2 in the level panel when the tower or the bracket stands there", () => {
    for (const reading of ["stackLevels", "endMinusStart"] as const) {
      const frame = layout("bathtub", reading, { request: "01" });
      expect(names(frame, "levelName").map((label) => label.text.kind), reading).toEqual(["quarter"]);
      const at = placeLabel(names(frame, "levelName")[0], frame.shapes[0], FIGURE_SIZE.bathtub.width);
      expect(at.x).toBe(BATHTUB.towerX + BATHTUB.columnWidth / 2);
      expect(at.y).toBe(BATHTUB.levelBaseline + 16);
    }
    expect(names(layout("bathtub", "levels", { request: "01" }), "levelName")).toEqual([]);
  });

  it("names the fifth column Q2 in the change panel when it holds a result or the check", () => {
    for (const reading of ["changeSum", "changeDiff", "billingSum", "levels", "lastChange"] as const) {
      const frame = layout("bathtub", reading, { request: "02" });
      expect(names(frame, "changeName").length, reading).toBe(1);
    }
    expect(names(layout("bathtub", "endMinusStart", { request: "02" }), "changeName")).toEqual([]);
    expect(names(layout("bathtub", "none", { request: "02" }), "changeName")).toEqual([]);
  });

  it("keeps the change panel's month row under its deepest bar and that bar's label", () => {
    const deepest = Math.max(
      ...(["changes", "changeDiff"] as const).flatMap((reading) =>
        layout("bathtub", reading, { request: "02" }).shapes.filter((shape) => shape.tone === "change").map((shape) => shape.y + shape.h),
      ),
    );
    const labelBottom = deepest + 15 + LABEL.descent;
    expect(BATHTUB.changeNames - LABEL.ascent).toBeGreaterThanOrEqual(labelBottom + LABEL.clear);
    expect(BATHTUB.changeNames + LABEL.descent).toBeLessThanOrEqual(FIGURE_SIZE.bathtub.height);
  });

  it("puts the one value for all segments on its own line under the rows, never on Enterprise's", () => {
    for (const reading of ["zeroBase", "base:startOfQuarter", "base:startPlusJoiners", "base:endOfQuarter"] as const) {
      const frame = layout("baseFrame", reading, { request: "03", single: true });
      const all = frame.labels.filter((label) => label.id === "v-frame-all");
      expect(all.map((label) => label.position), reading).toEqual(["belowRows"]);
      const lastFrame = frame.shapes.filter((shape) => shape.tone === "frame").at(-1) as Shape;
      const at = placeLabel(all[0], lastFrame, FIGURE_SIZE.baseFrame.width);
      expect(at.y - LABEL.ascent).toBeGreaterThan(lastFrame.y + lastFrame.h + LABEL.clear);
      expect(frame.height).toBeGreaterThanOrEqual(at.y + LABEL.descent);
    }
    expect(layout("baseFrame", "zeroBase", { request: "03" }).height).toBeUndefined();
  });

  it("draws no base frame for an empty base, so the key has nothing to name", () => {
    const frame = layout("baseFrame", "zeroBase", { request: "03" });
    expect(frame.shapes.some((shape) => shape.tone === "frame" && shape.w > 0.5)).toBe(false);
  });
});
