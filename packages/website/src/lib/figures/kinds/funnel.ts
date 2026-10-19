/** Funnel plot (C8): rate against sample size with control limits; no ranked map. */

import { tickStrings } from "../axes.ts";
import { formatDecimal, formatValue } from "../format.ts";
import {
  funnelLimits, logTicks, niceTicks, scaleLinear, scaleLog, zForCoverage,
} from "../math.ts";
import {
  FS, dim, el, flowLegend, frame, op, text, textWidth,
  type Ctx, type LegendItem, type SvgNode,
} from "../svg.ts";
import { frameReveal, segment } from "../timing.ts";
import type { FunnelData } from "../types.ts";
import type { ReactElement } from "react";

const M = 16;

function path(points: readonly (readonly [number, number])[]): string {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
}

export function renderFunnel(ctx: Ctx<FunnelData>): ReactElement {
  const { data, width, pal, p } = ctx;
  const p0 = data.overall / 100;
  const coverages = data.limits ?? [95, 99.8];
  const ns = data.points.map((pt) => pt.n);
  const nMin = Math.min(...ns);
  const nMax = Math.max(...ns);
  const lowN = Math.max(1, Math.floor(nMin * 0.8));
  const highN = Math.ceil(nMax * 1.15);
  const outer = Math.max(...coverages.map(zForCoverage));
  const yHigh = Math.max(
    ...data.points.map((pt) => pt.value),
    ...(lowN > 0 ? [funnelLimits(p0, lowN, outer)[1] * 100] : []),
  );
  const yTicks = niceTicks(0, Math.min(yHigh, 100), 5);
  const yTop = yTicks[yTicks.length - 1] ?? 1;
  const left = 44;
  const plot = { x: M + left, y: 16, w: width - M * 2 - left - 4, h: ctx.compact ? 260 : 320 };
  const sx = scaleLog([lowN, highN], [plot.x, plot.x + plot.w]);
  const sy = scaleLinear([0, yTop], [plot.y + plot.h, plot.y]);
  const xTicks = logTicks(lowN, highN);
  const yLabels = tickStrings(data.fmt, yTicks);
  const o = op(frameReveal(p));
  const nodes: SvgNode[] = [];

  yTicks.forEach((t, i) => {
    nodes.push(
      el("line", { key: `y${t}`, x1: plot.x, y1: sy(t), x2: plot.x + plot.w, y2: sy(t), stroke: pal.track, strokeWidth: 1, opacity: o }),
      text(plot.x - 8, sy(t) + 4, yLabels[i] ?? "", { size: FS.small, fill: pal.mutedLight, anchor: "end", opacity: o }),
    );
  });
  xTicks.forEach((t) => {
    nodes.push(
      el("line", { key: `x${t}`, x1: sx(t), y1: plot.y + plot.h, x2: sx(t), y2: plot.y + plot.h + 4, stroke: pal.edge, strokeWidth: 1, opacity: o }),
      text(sx(t), plot.y + plot.h + 18, formatDecimal(t, 0), { size: FS.small, fill: pal.mutedLight, anchor: "middle", opacity: o }),
    );
  });
  nodes.push(
    text(plot.x + plot.w / 2, plot.y + plot.h + 38, data.xLabel ?? "Größe der Stichprobe (Firmen, logarithmische Achse)", { size: FS.small, fill: pal.muted, anchor: "middle", opacity: o }),
  );

  const curveP = segment(p, 0.05, 0.3);
  const steps = 48;
  const grid = Array.from({ length: steps + 1 }, (_, i) => lowN * (highN / lowN) ** (i / steps));
  coverages.forEach((cov, ci) => {
    const z = zForCoverage(cov);
    const lower = grid.map((n) => [sx(n), sy(funnelLimits(p0, n, z)[0] * 100)] as const);
    const upper = grid.map((n) => [sx(n), sy(funnelLimits(p0, n, z)[1] * 100)] as const);
    const strong = ci === coverages.length - 1;
    for (const [side, pts] of [["lo", lower], ["hi", upper]] as const) {
      nodes.push(
        el("path", {
          key: `l${cov}${side}`, d: path(pts), fill: "none", stroke: strong ? pal.ink : pal.edge,
          strokeWidth: strong ? 1.5 : 1.25, strokeDasharray: strong ? undefined : "5 4", opacity: op(curveP),
        }),
      );
    }
  });
  nodes.push(
    el("line", { x1: plot.x, y1: sy(data.overall), x2: plot.x + plot.w, y2: sy(data.overall), stroke: pal.accent, strokeWidth: 1.5, opacity: op(curveP) }),
    text(plot.x + 6, sy(data.overall) - 6, `Gesamt ${formatValue(data.fmt, data.overall)}`, { size: FS.small, fill: pal.accent, weight: 600, opacity: op(curveP) }),
  );

  const outerZ = zForCoverage(coverages[coverages.length - 1] ?? 95);
  const count = data.points.length;
  const labelled: { x: number; y: number; label: string; outside: "high" | "low" }[] = [];
  data.points.forEach((pt, i) => {
    const [lo, hi] = funnelLimits(p0, pt.n, outerZ);
    const v = pt.value / 100;
    const outside = v > hi ? "high" : v < lo ? "low" : null;
    const start = 0.25 + (0.6 * i) / Math.max(1, count);
    const f = segment(p, start, start + 0.15);
    const cx = sx(pt.n);
    const cy = sy(pt.value);
    nodes.push(
      outside
        ? el("circle", { key: pt.id, "data-id": pt.id, cx, cy, r: 5, fill: pal.accent, stroke: pal.card, strokeWidth: 1, opacity: op(f * dim(ctx, pt.id)) })
        : el("circle", { key: pt.id, "data-id": pt.id, cx, cy, r: 3.2, fill: "none", stroke: pal.muted, strokeWidth: 1.25, opacity: op(f * dim(ctx, pt.id)) }),
    );
    if (outside && pt.label) labelled.push({ x: cx, y: cy, label: pt.label, outside });
  });

  // Labels go where they touch no other label and no outlier dot: the first free spot
  // among right/left and above/below, moving further out step by step. A label that
  // had to move far gets a thin leader line back to its dot.
  interface Box { readonly x0: number; readonly x1: number; readonly y0: number; readonly y1: number }
  const overlaps = (a: Box, b: Box): boolean => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  const dotBoxes = labelled.map((l): Box => ({ x0: l.x - 7, x1: l.x + 7, y0: l.y - 7, y1: l.y + 7 }));
  // Other dots and the "Gesamt" caption are obstacles too, so a name never hides a point.
  const labelledIds = new Set(labelled.map((l) => `${l.x}:${l.y}`));
  const otherBoxes: Box[] = data.points
    .filter((pt) => !labelledIds.has(`${sx(pt.n)}:${sy(pt.value)}`))
    .map((pt): Box => ({ x0: sx(pt.n) - 4.5, x1: sx(pt.n) + 4.5, y0: sy(pt.value) - 4.5, y1: sy(pt.value) + 4.5 }));
  const overallW = textWidth(`Gesamt ${formatValue(data.fmt, data.overall)}`, FS.small, 600);
  const taken: Box[] = [{ x0: plot.x + 6, x1: plot.x + 6 + overallW, y0: sy(data.overall) - 18, y1: sy(data.overall) - 3 }, ...otherBoxes];
  const labelOpacity = op(segment(p, 0.8, 1));
  labelled.sort((a, b) => a.x - b.x).forEach((l, i) => {
    const w = textWidth(l.label, FS.small, 600);
    const own = dotBoxes[labelled.indexOf(l)];
    const up = l.outside === "high" ? -1 : 1;
    let choice: { lx: number; ly: number; end: boolean; box: Box; far: boolean } | null = null;
    search: for (let k = 0; k < 8; k++) {
      for (const dir of [up, -up]) {
        for (const end of [false, true]) {
          const lx = end ? l.x - 8 : l.x + 8;
          const ly = l.y + (dir < 0 ? -9 - 14 * k : 17 + 14 * k);
          const box: Box = { x0: end ? lx - w : lx, x1: end ? lx : lx + w, y0: ly - 11, y1: ly + 3 };
          if (box.x0 < plot.x || box.x1 > plot.x + plot.w + M || box.y0 < plot.y - 4 || box.y1 > plot.y + plot.h) continue;
          if (taken.some((t) => overlaps(box, t))) continue;
          if (dotBoxes.some((d) => d !== own && overlaps(box, d))) continue;
          choice = { lx, ly, end, box, far: k > 0 };
          break search;
        }
      }
    }
    const c = choice ?? { lx: l.x + 8, ly: l.y - 9, end: false, box: { x0: l.x + 8, x1: l.x + 8 + w, y0: l.y - 20, y1: l.y - 6 }, far: false };
    taken.push(c.box);
    if (c.far) {
      nodes.push(el("line", { key: `lead${i}`, x1: l.x, y1: l.y, x2: c.end ? c.lx + 2 : c.lx - 2, y2: c.ly - 4, stroke: pal.ink, strokeWidth: 1, opacity: labelOpacity }));
    }
    const labelOpts = { size: FS.small, weight: 600 as const, anchor: c.end ? ("end" as const) : ("start" as const), opacity: labelOpacity };
    // A halo in the card colour (a second, stroked copy underneath) keeps the name readable where it crosses a limit curve.
    nodes.push(
      text(c.lx, c.ly, l.label, { ...labelOpts, fill: pal.card, extra: { key: `halo${i}`, stroke: pal.card, strokeWidth: 4, strokeLinejoin: "round", "aria-hidden": "true" } }),
      text(c.lx, c.ly, l.label, { ...labelOpts, fill: pal.ink, extra: { key: `lab${i}` } }),
    );
  });

  const legendItems: LegendItem[] = coverages.map((c, ci) => ({
    label: `${formatDecimal(c, c % 1 === 0 ? 0 : 1)} % Zufallsband`,
    markerWidth: 24,
    marker: (x, y) =>
      el("line", {
        x1: x - 12, y1: y, x2: x + 12, y2: y,
        stroke: ci === coverages.length - 1 ? pal.ink : pal.edge,
        strokeWidth: 1.5,
        strokeDasharray: ci === coverages.length - 1 ? undefined : "5 4",
      }),
  }));
  legendItems.push({
    label: "außerhalb des Zufallsbands",
    marker: (x, y) => el("circle", { cx: x, cy: y, r: 5, fill: pal.accent }),
  });
  const legend = flowLegend(legendItems, M, width - M, plot.y + plot.h + 58, pal.muted, o);
  nodes.push(...legend.nodes);
  return frame({ ctx, height: legend.bottom + 4, children: nodes });
}
