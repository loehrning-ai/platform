/**
 * Curve (H07, the drift of H03): a line drawn by a pen from left to right,
 * its interval band drawn with it, a hatched stretch for what is frozen, a
 * marker the reader moves along the real classes (detents, no values between
 * them) and an optional comparison panel of plain bars.
 */

import type { ReactElement } from "react";
import { formatInterval, formatValue } from "../format.ts";
import { HM, ROLE_ATTR, flexible, flip, heroHeader, pickVariant, roleText } from "../hero.ts";
import { r2, niceTicks, scaleLinear } from "../math.ts";
import { between, settleIn, springIn } from "../motion.ts";
import { FS, dim, el, frame, labelLines, op, textLines, textWidth, translate, type Ctx, type SvgNode } from "../svg.ts";
import { frameReveal } from "../timing.ts";
import type { CurveData, CurvePoint } from "../types.ts";

interface Pt {
  readonly x: number;
  readonly y: number;
  readonly lo: number;
  readonly hi: number;
}

/** Points up to the pen tip at fraction f (0 to 1) of the line, tip interpolated; null values break the line. */
export function penRuns(pts: ReadonlyArray<Pt | null>, f: number): Pt[][] {
  const runs: Pt[][] = [];
  const tipAt = f * (pts.length - 1);
  let run: Pt[] = [];
  for (let i = 0; i < pts.length; i += 1) {
    const here = pts[i];
    if (i > tipAt + 1e-9) break;
    if (here === null || here === undefined) {
      if (run.length > 0) runs.push(run);
      run = [];
      continue;
    }
    run.push(here);
    const next = pts[i + 1];
    if (next && tipAt > i && tipAt < i + 1) {
      const t = tipAt - i;
      run.push({ x: here.x + (next.x - here.x) * t, y: here.y + (next.y - here.y) * t, lo: here.lo + (next.lo - here.lo) * t, hi: here.hi + (next.hi - here.hi) * t });
    }
  }
  if (run.length > 0) runs.push(run);
  return runs.filter((r) => r.length > 0);
}

const lineD = (run: readonly Pt[]): string => run.map((q, i) => `${i === 0 ? "M" : "L"}${r2(q.x)} ${r2(q.y)}`).join("");
const bandD = (run: readonly Pt[]): string =>
  run.length < 2
    ? ""
    : `${run.map((q, i) => `${i === 0 ? "M" : "L"}${r2(q.x)} ${r2(q.hi)}`).join("")}${[...run].reverse().map((q) => `L${r2(q.x)} ${r2(q.lo)}`).join("")}Z`;

export function renderCurve(ctx: Ctx<CurveData>): ReactElement {
  const { data, pal, p, width, compact, hatchId } = ctx;
  const points = data.points;
  const pick = pickVariant(ctx, points as ReadonlyArray<CurvePoint>, data.defaultVariant);
  const { to, from, shift } = pick;
  const valueOf = (q: CurvePoint): number => q.value ?? 0;
  const markValue = between(valueOf(from), valueOf(to), shift);
  const head = heroHeader(ctx, { numeral: formatValue(data.fmt, shift >= 1 ? valueOf(to) : markValue), claim: data.claim, accent: true });
  const nodes: SvgNode[] = [...head.nodes];

  const panelRows = data.panel?.rows.length ?? 0;
  // A panel row is one line (label, bar, value). When the label and the value leave the bar less than 56 units
  // on this width, the row takes two lines (label above, bar and value below) instead of running off the figure.
  const panelLabelW = data.panel ? Math.max(...data.panel.rows.map((r) => textWidth(r.label, FS.label, 600))) + 10 : 0;
  const panelValueW = data.panel ? Math.max(...data.panel.rows.map((r) => textWidth(formatValue(data.panel!.fmt, r.value), FS.value, 700))) + 10 : 0;
  const panelStacked = data.panel !== undefined && width - HM * 2 - panelLabelW - panelValueW < 56;
  const panelRowH = panelStacked ? 44 : 26;
  const below = 44 + 22 + (data.panel ? 22 + panelRows * panelRowH : 0) + 12;
  const plot = { x: HM + 28, y: head.bottom + 12, w: width - HM * 2 - 28 - 6, h: flexible(ctx, head.bottom + 12, below, compact ? 210 : 270, 110) };
  const top = Math.max(data.max ?? 0, ...points.map((q) => q.hi ?? q.value ?? 0));
  const ticks = niceTicks(Math.min(0, data.min ?? 0), top, 4);
  const dom: [number, number] = [ticks[0] ?? 0, ticks[ticks.length - 1] ?? 1];
  const ys = scaleLinear(dom, [plot.y + plot.h, plot.y]);
  const step = points.length > 1 ? plot.w / (points.length - 1) : plot.w;
  const inset = Math.min(18, step / 2);
  const xs = (i: number): number => plot.x + inset + (i * (plot.w - inset * 2)) / Math.max(1, points.length - 1);
  const o = op(frameReveal(p));
  // Class names under the axis. When the names are wider than their column even on two lines (a date axis of
  // 18 points on a phone), only every k-th is written, counted back from the last, so none is cut or overprinted.
  const names = points.map((q) => labelLines(q.label, step - 4, FS.small));
  const widest = Math.max(0, ...points.map((q) => textWidth(q.label, FS.small)));
  const uncut = names.every((q) => q.every((l) => !l.endsWith("…") && textWidth(l, FS.small) <= step - 4));
  const every = uncut ? 1 : Math.max(2, Math.ceil((widest + 8) / Math.max(1, step)));
  const labelNames = names.map((q, i) => ((points.length - 1 - i) % every === 0 ? (every > 1 ? [points[i]?.label ?? ""] : q) : []));
  const extraLines = Math.max(1, ...labelNames.map((q) => q.length)) - 1;

  // Gridlines and value ticks.
  ticks.forEach((t, i) => {
    const y = ys(t);
    nodes.push(el("line", { key: `g${i}`, x1: plot.x, y1: y, x2: plot.x + plot.w, y2: y, stroke: i === 0 ? pal.ink : pal.track, strokeWidth: i === 0 ? 1.6 : 1, opacity: o }));
    const whole = ticks.every((q) => Number.isInteger(q));
    nodes.push(roleText("tick", plot.x - 6, y + 4, formatValue(whole ? { ...data.fmt, digits: 0, unit: undefined } : { ...data.fmt, unit: undefined }, t).replace(/ %$/, ""), { size: FS.small, fill: pal.mutedLight, anchor: "end", opacity: o }));
  });

  // The frozen stretch: hatched behind the line.
  const frozen = points.map((q, i) => (q.frozen ? i : -1)).filter((i) => i >= 0);
  if (frozen.length > 0) {
    const first = frozen[0] ?? 0;
    const last = frozen[frozen.length - 1] ?? 0;
    const x0 = xs(first) - step / 2;
    const x1 = xs(last) + step / 2;
    const reveal = settleIn(p, 0.74, 0.92);
    nodes.push(
      el("g", { "data-layer": "frozen", opacity: op(reveal) },
        el("rect", { x: Math.max(plot.x, x0), y: plot.y, width: Math.min(plot.x + plot.w, x1) - Math.max(plot.x, x0), height: plot.h, fill: `url(#${hatchId})` }),
        data.frozenLabel ? roleText("label", Math.max(plot.x + 4, x0 + 4), plot.y + 16, data.frozenLabel, { size: FS.small, weight: 600, fill: pal.ink, extra: { stroke: pal.paper, strokeWidth: 3.5, strokeLinejoin: "round", paintOrder: "stroke" } }) : null,
      ),
    );
  }

  // Pen: line and band up to the tip.
  const pts: Array<Pt | null> = points.map((q, i) =>
    q.value === null ? null : { x: xs(i), y: ys(q.value), lo: ys(q.lo ?? q.value), hi: ys(q.hi ?? q.value) },
  );
  const f = settleIn(p, 0.08, 0.72);
  const runs = penRuns(pts, f);
  nodes.push(
    el("g", { "data-layer": "band" }, ...runs.map((r, i) => el("path", { key: `b${i}`, d: bandD(r), fill: pal.inset, stroke: "none" }))),
  );
  nodes.push(
    el("g", { "data-layer": "line" }, ...runs.map((r, i) => el("path", { key: `l${i}`, d: lineD(r), fill: "none", stroke: pal.ink, strokeWidth: 2.5, strokeLinejoin: "miter" }))),
  );
  const tip = runs[runs.length - 1]?.[runs[runs.length - 1]!.length - 1];
  if (tip && f > 0 && f < 1) nodes.push(el("rect", { x: tip.x - 3.5, y: tip.y - 3.5, width: 7, height: 7, fill: pal.ink }));

  // Points of the real classes, with direct class names under the axis.
  points.forEach((q, i) => {
    const x = xs(i);
    const reached = p >= 0.08 + (0.64 * i) / Math.max(1, points.length - 1) * 0.98;
    if (q.value !== null) {
      nodes.push(el("rect", { key: `m${q.id}`, "data-id": q.id, x: x - 3.5, y: ys(q.value) - 3.5, width: 7, height: 7, fill: flip(ctx, q.id, pal.ink), opacity: reached ? op(dim(ctx, q.id)) : 0 }));
    }
    nodes.push(textLines(x, plot.y + plot.h + 18, labelNames[i] ?? [q.label], 14, { size: FS.small, fill: pal.muted, anchor: "middle", opacity: o, extra: { [ROLE_ATTR]: "tick" } }));
  });

  // The reader's marker: a lifted accent square on the chosen class.
  const toIdx = Math.max(0, points.findIndex((q) => q.id === to.id));
  const fromIdx = Math.max(0, points.findIndex((q) => q.id === from.id));
  const ease = shift >= 1 ? 1 : springIn(shift, 0, 1, "stiff");
  const mx = xs(fromIdx) + (xs(toIdx) - xs(fromIdx)) * ease;
  const my = ys(valueOf(from)) + (ys(valueOf(to)) - ys(valueOf(from))) * ease;
  const land = springIn(p, 0.74, 0.92, "snap");
  nodes.push(
    el("g", { "data-layer": "marker", opacity: p < 0.74 ? 0 : undefined, transform: translate(0, -(1 - land) * 18) },
      el("line", { x1: mx, y1: my + 8, x2: mx, y2: plot.y + plot.h, stroke: pal.accent, strokeWidth: 1.6 }),
      el("rect", { "data-id": "marker", x: mx - 7, y: my - 7, width: 14, height: 14, fill: pal.accent }),
    ),
  );
  const markLabel = formatValue(data.fmt, valueOf(to));
  const lw = textWidth(markLabel, FS.value, 700);
  const lx = mx + 12 + lw > plot.x + plot.w + 6 ? mx - 12 : mx + 12;
  nodes.push(
    roleText("value", lx, my - 12, markLabel, { size: FS.value, weight: 700, fill: pal.accent, anchor: lx < mx ? "end" : "start", opacity: op(settleIn(p, 0.8, 0.95)), extra: { stroke: pal.paper, strokeWidth: 3.5, strokeLinejoin: "round", paintOrder: "stroke" } }),
  );

  let bottom = plot.y + plot.h + 30 + extraLines * 14;
  const tonePoint = to.lo !== undefined && to.hi !== undefined ? `${formatInterval(data.fmt, to.lo, to.hi)}` : "";
  if (tonePoint) {
    nodes.push(roleText("unit", HM, bottom + 6, `${to.label}: 95 %-Intervall ${tonePoint}`, { size: FS.small, fill: pal.mutedLight, opacity: op(settleIn(p, 0.85, 1)) }));
    bottom += 22;
  }

  // Comparison panel: plain bars, one row each.
  if (data.panel) {
    const rows = data.panel.rows;
    const peak = Math.max(...rows.map((r) => r.value));
    const rowH = panelRowH;
    const barX = panelStacked ? HM : HM + panelLabelW;
    const barW = Math.max(24, width - HM - panelValueW - barX);
    nodes.push(roleText("label", HM, bottom + 14, data.panel.title, { size: FS.label, weight: 700, fill: pal.ink, opacity: op(settleIn(p, 0.85, 1)) }));
    bottom += 22;
    rows.forEach((r, i) => {
      const y = bottom + i * rowH;
      const w = (r.value / peak) * barW;
      const t = settleIn(p, 0.86 + i * 0.02, 0.98);
      const by = panelStacked ? y + 20 : y;
      nodes.push(
        roleText("label", HM, y + 16, r.label, { size: FS.label, fill: pal.ink, opacity: op(t) }),
        el("rect", { key: `pb${r.id}`, "data-id": r.id, x: barX, y: by + 4, width: w, height: 14, fill: flip(ctx, r.id, i === 0 ? pal.accent : pal.ink), opacity: p < 0.86 ? 0 : op(dim(ctx, r.id)) }),
        roleText("value", barX + w + 6, by + 16, formatValue(data.panel!.fmt, r.value), { size: FS.value, weight: 700, fill: pal.ink, opacity: op(t) }),
      );
    });
    bottom += rows.length * rowH;
  }
  return frame({ ctx, height: bottom + 12, children: nodes });
}
