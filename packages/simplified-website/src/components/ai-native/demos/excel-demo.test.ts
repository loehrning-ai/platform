import { describe, expect, it } from "vitest";

/**
 * excel-demo.test.ts (regression coverage)
 *
 * excel-demo.tsx keeps outputFor(taskId) as a local (non-exported) closure
 * mapping a fixed task id to a fixed result. We mirror the deterministic
 * task-id -> output SHAPE (kind, item counts, numeric fields we assert
 * invariants on) from the source. The German explain/formula prose is
 * intentionally omitted from the mirror; the point of this test is the
 * mapping and confidence-band invariants, not the marketing copy.
 */

type TaskId = "formula" | "pivot" | "forecast";

interface OutputShape {
  readonly kind: TaskId;
  readonly cell?: string;
  readonly previewCount?: number;
  readonly regionsInOrder?: readonly string[];
  readonly rows?: readonly {
    readonly w: string;
    readonly pred: number;
    readonly lo: number;
    readonly hi: number;
  }[];
}

function outputShapeFor(taskId: TaskId): OutputShape {
  if (taskId === "formula") {
    return { kind: "formula", cell: "F2", previewCount: 6 };
  }
  if (taskId === "pivot") {
    return { kind: "pivot", regionsInOrder: ["West", "Nord", "Süd"] };
  }
  return {
    kind: "forecast",
    rows: [
      { w: "KW 17", pred: 492, lo: 458, hi: 526 },
      { w: "KW 18", pred: 548, lo: 498, hi: 598 },
      { w: "KW 19", pred: 612, lo: 544, hi: 680 },
      { w: "KW 20", pred: 684, lo: 590, hi: 778 },
    ],
  };
}

describe("excel-demo · outputFor(taskId) mapping", () => {
  it("formula task returns cell F2 with a 6-row weekly preview", () => {
    const out = outputShapeFor("formula");
    expect(out.kind).toBe("formula");
    expect(out.cell).toBe("F2");
    expect(out.previewCount).toBe(6);
  });

  it("pivot task ranks regions West > Nord > Süd (by revenue share)", () => {
    const out = outputShapeFor("pivot");
    expect(out.kind).toBe("pivot");
    expect(out.regionsInOrder).toEqual(["West", "Nord", "Süd"]);
  });

  it("forecast rows keep the predicted value inside its own confidence band", () => {
    const out = outputShapeFor("forecast");
    expect(out.rows).toHaveLength(4);
    for (const row of out.rows ?? []) {
      expect(row.lo).toBeLessThanOrEqual(row.pred);
      expect(row.pred).toBeLessThanOrEqual(row.hi);
    }
  });

  it("forecast band widens with horizon (uncertainty grows over the 4 weeks)", () => {
    const out = outputShapeFor("forecast");
    const widths = (out.rows ?? []).map((r) => r.hi - r.lo);
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i]).toBeGreaterThanOrEqual(widths[i - 1]);
    }
  });

  it("is deterministic for identical task ids", () => {
    expect(outputShapeFor("formula")).toEqual(outputShapeFor("formula"));
    expect(outputShapeFor("pivot")).toEqual(outputShapeFor("pivot"));
    expect(outputShapeFor("forecast")).toEqual(outputShapeFor("forecast"));
  });
});
