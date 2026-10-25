import { describe, expect, it } from "vitest";
import { COPY } from "./copy";
import { formatNumber, formatShort } from "./format";
import { geometry } from "./geometry";
import { layoutAt, overlaps, type Layout, type Rect } from "./layout";
import { sceneAt } from "./scene";
import { buildSeries, exampleSeries, type Series } from "./series";

const EXAMPLE = exampleSeries(["Apr", "Mai", "Jun"]);
const { ui } = COPY.de;
const SIZES = [
  [278, 204],
  [248, 176],
  [660, 332],
] as const;

function layoutFor(series: Series, p: number, width: number, height: number, neverNeg = true) {
  const geo = geometry(width, height);
  const scene = sceneAt(series, p, neverNeg);
  const layout = layoutAt({
    geo,
    scene,
    label: (value, short) => (short ? formatShort(value, "de") : formatNumber(value, "de", series.decimals)),
    unknown: "?",
    startLevel: series.startNote === "given" ? series.startLevel : null,
    startPrefix: ui.start,
    stampBefore: ui.stampBefore,
    stampAfter: ui.stampAfter,
    stepLabel: (value, short) => (short ? formatShort(value, "de") : formatNumber(value, "de", series.decimals)),
    toneGround: ui.toneGround,
    toneStep: ui.toneStep,
  });
  return { geo, scene, layout };
}

/** Everything that prints, as named rectangles. */
function marks(layout: Layout, scene: ReturnType<typeof sceneAt>): [string, Rect][] {
  return [
    ...layout.labels.filter((entry) => !entry.inside).map((entry, index): [string, Rect] => [`label ${index}`, entry.rect]),
    ...(scene.stampBefore > 0.5 ? [["stamp before", layout.before.rect] as [string, Rect]] : []),
    ...(scene.stampAfter > 0.5 ? [["stamp after", layout.after.rect] as [string, Rect]] : []),
    ...(layout.rungLabel && scene.startLabel > 0.5 ? [["start label", layout.rungLabel.rect] as [string, Rect]] : []),
  ];
}

const bars = (layout: Layout): Rect[] => layout.bars.flatMap((bar) => (bar.pillar ? [bar.pillar, bar.step] : [bar.step]));

const OWN: readonly [string, Series][] = [
  ["the example", EXAMPLE],
  ["a mixed own series", buildSeries({ values: [100, -50, 200], start: null, kind: "change", name: "x", table: "", monthLabel: (n) => `M${n}` })],
  ["own levels with a start", buildSeries({ values: [120_000, 135_000, 150_000], start: 100_000, kind: "level", name: "x", table: "", monthLabel: (n) => `M${n}` })],
];

describe("layout", () => {
  for (const [name, series] of OWN) {
    for (const [width, height] of SIZES) {
      it(`puts no text on any other text or stamp, at any p (${name}, ${width} x ${height})`, () => {
        for (const p of [0, 0.05, 0.2, 0.35, 0.49, 0.5, 0.6, 0.75, 0.9, 1]) {
          const { scene, layout } = layoutFor(series, p, width, height);
          const list = marks(layout, scene);
          for (let a = 0; a < list.length; a += 1) {
            for (let b = a + 1; b < list.length; b += 1) {
              expect(overlaps((list[a] as [string, Rect])[1], (list[b] as [string, Rect])[1]), `p=${p}: ${list[a]?.[0]} / ${list[b]?.[0]}`).toBe(false);
            }
          }
        }
      });

      it(`never sets a stamp on a bar (${name}, ${width} x ${height})`, () => {
        for (const p of [0, 0.02, 0.9, 1]) {
          const { scene, layout } = layoutFor(series, p, width, height);
          for (const [label, rect] of marks(layout, scene).filter(([text]) => text.startsWith("stamp"))) {
            for (const bar of bars(layout)) expect(overlaps(rect, bar), `p=${p}: ${label}`).toBe(false);
          }
        }
      });
    }
  }

  it("labels the start rung with the start, on the rung", () => {
    const { layout } = layoutFor(EXAMPLE, 1, 278, 204);
    const label = layout.rungLabel as NonNullable<typeof layout.rungLabel>;
    expect(label.text).toBe("Start 354.635");
    expect(Math.abs(label.y - (layout.rungY as number))).toBeLessThanOrEqual(20);
  });

  it("stands the first stamp over April's column on the zero line", () => {
    const { layout } = layoutFor(EXAMPLE, 0, 278, 204);
    const bar = layout.bars[0] as NonNullable<(typeof layout.bars)[number]>;
    expect(layout.before.rect.y + layout.before.rect.h).toBeLessThanOrEqual(layout.y(0));
    expect(layout.before.rect.x).toBeLessThanOrEqual(bar.center);
  });

  it("stands the first stamp over the first column that really goes below zero", () => {
    const series = OWN[1]?.[1] as Series;
    const { layout } = layoutFor(series, 0, 278, 204);
    const column = layout.bars[1] as NonNullable<(typeof layout.bars)[number]>;
    expect(column.hanging).toBe(true);
    expect(layout.before.rect.x).toBeLessThanOrEqual(column.center);
    expect(layout.before.rect.x + layout.before.rect.w).toBeGreaterThanOrEqual(column.center);
  });

  it("hangs April from the base line and prints one label per bar, with the change before the lift and the level after", () => {
    const start = layoutFor(EXAMPLE, 0, 278, 204);
    expect(start.layout.labels.map((entry) => entry.text)).toEqual(["−19.960", "9.775", "42.565"]);
    expect(start.layout.bars[0]?.hanging).toBe(true);
    expect(start.layout.bars[0]?.step.y).toBeCloseTo(start.layout.y(0), 6);
    const end = layoutFor(EXAMPLE, 1, 278, 204);
    expect(end.layout.labels.map((entry) => entry.text)).toEqual(["334.675", "344.450", "387.015"]);
  });

  it("prints a whole number wherever it fits at 12 px or more, and only otherwise the short form that rounds right", () => {
    const wide = layoutFor(EXAMPLE, 1, 278, 204).layout;
    expect(wide.labels.every((entry) => !entry.text.endsWith("k"))).toBe(true);
    expect(wide.labels.every((entry) => entry.size >= 12)).toBe(true);
    const narrow = layoutFor(EXAMPLE, 1, 240, 176).layout;
    for (const entry of narrow.labels) expect(entry.text).toMatch(/^(\d{3}\.\d{3}|\d{3},\d{1,2}k)$/);
    expect(formatShort(344_450, "de")).toBe("344,45k");
    expect(formatShort(344_450, "en")).toBe("344.45k");
    expect(formatShort(334_675, "de")).toBe("334,68k");
    expect(formatShort(-19_960, "de")).toBe("−19,96k");
    expect(formatShort(120, "de")).toBe("120");
  });

  it("marks an unknown first change with a question mark, not with a zero", () => {
    const series = buildSeries({ values: [120_000, 135_000, 150_000], start: null, kind: "level", name: "x", table: "", monthLabel: (n) => `M${n}` });
    const { layout } = layoutFor(series, 0, 278, 204);
    expect(layout.labels.map((entry) => entry.text)).toEqual(["?", "15.000", "15.000"]);
    expect(layout.labels).toHaveLength(3);
  });
});
