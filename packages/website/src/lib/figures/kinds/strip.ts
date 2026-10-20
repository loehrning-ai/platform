/**
 * Strip (H03, H04, H12): one row per name, N shape-coded markers per row on a
 * shared axis (log or linear), interval bars on the markers. The layer that
 * carries the finding lands last. A variant (a second reading of the base)
 * slides every marker to its value under that reading.
 */

import type { ReactElement } from "react";
import { formatDecimal, formatValue, SUPPRESSED_LABEL } from "../format.ts";
import { HM, ROLE_ATTR, antiOf, flexible, heroHeader, labelLegend, pickVariant, roleText, toneFill } from "../hero.ts";
import { logExtent, logTicks, niceTicks, scaleLinear, scaleLog, type LinearScale } from "../math.ts";
import { settleIn, springIn } from "../motion.ts";
import { FS, dim, el, frame, op, textLines, textWidth, translate, wrapText, type Ctx, type SvgNode } from "../svg.ts";
import { frameReveal } from "../timing.ts";
import type { NumFmt, StripData, StripLayer, StripMark, StripValue } from "../types.ts";
import type { Palette } from "../palette.ts";

/** A mark's value under a variant, falling back to the base reading. */
export function stripValue(mark: StripMark, variantId: string | undefined): StripValue {
  return (variantId !== undefined ? mark.by?.[variantId] : undefined) ?? mark;
}

/** A row label that wraps to a second line instead of running into the plot. */
function rowLabel(x: number, cy: number, label: string, maxWidth: number, opacity: number | undefined, id: string, fill: string): SvgNode {
  const lines = wrapText(label, maxWidth, FS.label, 2, 700);
  if (lines.length < 2) return roleText("label", x, cy + 5, label, { size: FS.label, weight: 700, fill, opacity, extra: { "data-row": id } });
  return textLines(x, cy - 3, lines, 15, { size: FS.label, weight: 700, fill, opacity, extra: { "data-row": id, [ROLE_ATTR]: "label" } });
}

function domainOf(data: StripData, variants: readonly (string | undefined)[]): [number, number] {
  const values: number[] = [];
  for (const row of data.rows) {
    for (const mark of row.marks) {
      for (const v of variants) {
        const q = stripValue(mark, v);
        for (const x of [q.value, q.lo, q.hi]) if (typeof x === "number" && Number.isFinite(x) && (data.scale === "linear" || x > 0)) values.push(x);
      }
    }
  }
  if (data.reference) values.push(data.reference.value);
  const lo = data.min ?? Math.min(...values);
  const hi = data.max ?? Math.max(...values);
  if (data.scale === "log") return logExtent(Math.max(lo, 1e-9), hi);
  const ticks = niceTicks(Math.min(0, lo), hi, 4);
  return [data.min ?? ticks[0] ?? 0, data.max ?? ticks[ticks.length - 1] ?? 1];
}

function tickLabel(fmt: NumFmt, t: number, last: boolean): string {
  const digits = t >= 10 || Number.isInteger(t) ? 0 : t >= 1 ? 1 : t >= 0.1 ? 1 : 2;
  const body = formatDecimal(t, digits);
  return last ? `${body}${fmt.style === "percent" ? " %" : fmt.unit ? ` ${fmt.unit}` : ""}` : body;
}

function markShape(shape: StripLayer["shape"], x: number, y: number, size: number, pal: Palette, tone: StripLayer["tone"], extra: Record<string, unknown>, flipped = false): SvgNode {
  const half = size / 2;
  const base = toneFill(pal, tone);
  const paint = flipped ? { ...base, fill: antiOf(pal, base.fill) } : base;
  const common = { ...extra, fill: shape === "ring" ? pal.paper : paint.fill, stroke: shape === "ring" ? paint.fill : undefined, strokeWidth: shape === "ring" ? 2 : undefined };
  switch (shape) {
    case "diamond": {
      const h = half * 1.15;
      return el("path", { ...common, d: `M${x} ${y - h}L${x + h} ${y}L${x} ${y + h}L${x - h} ${y}Z` });
    }
    case "bar":
      return el("rect", { ...common, x: x - 1.8, y: y - half - 3, width: 3.6, height: size + 6 });
    default:
      return el("rect", { ...common, x: x - half, y: y - half, width: size, height: size });
  }
}

export function renderStrip(ctx: Ctx<StripData>): ReactElement {
  const { data, pal, p, width, compact } = ctx;
  const variants = data.variants ?? [];
  const { to, from, shift } = variants.length > 0
    ? pickVariant(ctx, variants, data.defaultVariant)
    : { to: undefined, from: undefined, shift: 1 };
  const toId = to?.id;
  const fromId = from?.id;
  const [d0, d1] = domainOf(data, variants.length > 0 ? variants.map((v) => v.id) : [undefined]);
  const labelCol = compact ? 0 : 148;
  const railX0 = HM + labelCol + 6;
  const railX1 = width - HM - 8;
  const axis: LinearScale = data.scale === "log" ? scaleLog([d0, d1], [railX0, railX1]) : scaleLinear([d0, d1], [railX0, railX1]);
  const ticks = data.scale === "log" ? logTicks(d0, d1) : niceTicks(d0, d1, compact ? 3 : 5).filter((t) => t >= d0 - 1e-9 && t <= d1 + 1e-9);

  const finding = data.finding ?? null;
  const layers = [...data.layers].sort((a, b) => (a.id === finding ? 1 : 0) - (b.id === finding ? 1 : 0));
  const layerRank = new Map(layers.map((l, i) => [l.id, i]));
  const layerById = new Map(data.layers.map((l) => [l.id, l]));

  const firstRow = data.rows[0];
  const findingMark = finding ? firstRow?.marks.find((m) => m.layer === finding) : undefined;
  const findingValue = findingMark ? stripValue(findingMark, toId).value : null;
  const head = heroHeader(ctx, {
    numeral: findingValue !== null && findingValue !== undefined ? formatValue(data.fmt, findingValue) : undefined,
    claim: data.claim,
    accent: true,
  });
  const nodes: SvgNode[] = [...head.nodes];
  // A reference label sits above the plot, clear of the first row's value label.
  const top = head.bottom + (data.reference ? 20 : 6);
  const naturalRow = compact ? 62 : 50;
  const rowH = flexible(ctx, top, 78, data.rows.length * naturalRow, data.rows.length * 40) / data.rows.length;
  const o = op(frameReveal(p));
  const ease = shift >= 1 ? 1 : springIn(shift, 0, 1, "stiff");
  const plotBottom = top + data.rows.length * rowH;

  // Gridlines and ticks; a tick label that would touch the one to its right is dropped (its gridline stays).
  const grid: SvgNode[] = [];
  let rightEdge = Number.POSITIVE_INFINITY;
  const tickText = ticks.map((t, i) => tickLabel(data.fmt, t, i === ticks.length - 1));
  const keep = new Array<boolean>(ticks.length).fill(false);
  for (let i = ticks.length - 1; i >= 0; i -= 1) {
    const w = textWidth(tickText[i] ?? "", FS.small);
    const x = axis(ticks[i] ?? 0);
    const left = i === ticks.length - 1 ? x - w : x - w / 2;
    if (left + w + 5 <= rightEdge) {
      keep[i] = true;
      rightEdge = left;
    }
  }
  ticks.forEach((t, i) => {
    const x = axis(t);
    grid.push(el("line", { key: `g${i}`, x1: x, y1: top - 2, x2: x, y2: plotBottom, stroke: pal.track, strokeWidth: 1 }));
    if (keep[i]) grid.push(roleText("tick", x, plotBottom + 16, tickText[i] ?? "", { size: FS.small, fill: pal.mutedLight, anchor: i === ticks.length - 1 ? "end" : "middle" }));
  });
  if (data.reference) {
    const x = axis(data.reference.value);
    grid.push(el("line", { key: "ref", x1: x, y1: top - 2, x2: x, y2: plotBottom, stroke: pal.ink, strokeWidth: 1.6 }));
    grid.push(roleText("label", x + 4, top - 6, data.reference.label, { size: FS.small, fill: pal.ink, anchor: x > width - 90 ? "end" : "start" }));
  }
  nodes.push(el("g", { "data-layer": "axis", opacity: o }, ...grid));

  const sizeMark = compact ? 11 : 12;
  data.rows.forEach((row, ri) => {
    const cy = top + ri * rowH + (compact ? Math.min(38, rowH - 16) : rowH / 2);
    const rowStart = ri * 0.012;
    const labelNode = compact
      ? roleText("label", HM, top + ri * rowH + 14, row.label, { size: FS.label, weight: 700, fill: pal.ink, opacity: op(settleIn(p, rowStart, rowStart + 0.12)), extra: { "data-row": row.id } })
      : rowLabel(HM, cy, row.label, labelCol - 4, op(settleIn(p, rowStart, rowStart + 0.12)), row.id, pal.ink);
    nodes.push(labelNode);
    nodes.push(el("line", { key: `rail${row.id}`, x1: railX0, y1: cy, x2: railX1, y2: cy, stroke: pal.track, strokeWidth: 1, opacity: o }));
    for (const mark of row.marks) {
      const layer = layerById.get(mark.layer);
      if (!layer) continue;
      const rank = layerRank.get(layer.id) ?? 0;
      const start = 0.1 + rank * (0.7 / Math.max(1, layers.length));
      const isFinding = layer.id === finding;
      const t = springIn(p, start, start + 0.16, isFinding ? "snap" : "med");
      const a = stripValue(mark, fromId);
      const b = stripValue(mark, toId);
      if (b.value === null || a.value === null) {
        if (b.value === null) {
          nodes.push(roleText("label", railX0, cy - 10, SUPPRESSED_LABEL, { size: FS.small, fill: pal.mutedLight, opacity: op(settleIn(p, start, start + 0.1)) }));
        }
        continue;
      }
      const xa = axis(a.value);
      const xb = axis(b.value);
      const xFinal = xb;
      const xNow = shift < 1 ? xa + (xb - xa) * ease : xFinal;
      // Entering: wipe in from the left end of the rail; the finding layer drops in.
      const slide = isFinding ? 0 : (1 - t) * -(xFinal - railX0) * 0.5;
      const lift = isFinding ? -(1 - t) * 22 : 0;
      const dx = xNow - xFinal + slide;
      const visible = p > start;
      const tx = translate(dx, lift);
      const markId = `${row.id}:${layer.id}`;
      const shade = dim(ctx, markId);
      const attrs: Record<string, unknown> = { "data-id": markId, transform: tx, opacity: visible ? op(shade) : 0 };
      const lo = b.lo !== undefined ? axis(b.lo) : null;
      const hi = b.hi !== undefined ? axis(b.hi) : null;
      const paint = toneFill(pal, layer.tone);
      if (lo !== null && hi !== null) {
        const ia = a.lo !== undefined ? axis(a.lo) : lo;
        const ib = a.hi !== undefined ? axis(a.hi) : hi;
        const loNow = shift < 1 ? ia + (lo - ia) * ease : lo;
        const hiNow = shift < 1 ? ib + (hi - ib) * ease : hi;
        nodes.push(
          el("g", { key: `i${row.id}${layer.id}`, opacity: visible ? op(shade) : 0, transform: translate(slide, lift) },
            el("line", { x1: loNow, y1: cy, x2: hiNow, y2: cy, stroke: paint.fill === "none" ? pal.ink : paint.fill, strokeWidth: 2.5 }),
            el("line", { x1: loNow, y1: cy - 5, x2: loNow, y2: cy + 5, stroke: paint.fill === "none" ? pal.ink : paint.fill, strokeWidth: 1.6 }),
            el("line", { x1: hiNow, y1: cy - 5, x2: hiNow, y2: cy + 5, stroke: paint.fill === "none" ? pal.ink : paint.fill, strokeWidth: 1.6 }),
          ),
        );
      }
      nodes.push(markShape(layer.shape, xFinal, cy, sizeMark, pal, layer.tone, attrs, ctx.opts.highlight === markId));
      if (isFinding || layer.tone === "accent") {
        const text = formatValue(data.fmt, b.value);
        const w = textWidth(text, FS.value, 700);
        const right = xFinal + 12 + w <= width - HM + 4;
        nodes.push(
          roleText("value", right ? xFinal + 12 : xFinal - 12, cy - 12, text, {
            size: FS.value, weight: 700, fill: layer.tone === "accent" ? pal.accent : pal.ink, anchor: right ? "start" : "end",
            opacity: op(settleIn(p, start + 0.08, start + 0.2)),
          }),
        );
      }
    }
  });

  const legend = labelLegend(
    ctx,
    data.layers.map((layer) => ({
      label: layer.label,
      marker: (x: number, y: number) => markShape(layer.shape, x, y, 10, pal, layer.tone, {}),
    })),
    plotBottom + 40,
    op(settleIn(p, 0.5, 0.8)),
  );
  nodes.push(...legend.nodes);
  return frame({ ctx, height: legend.bottom + 4, children: nodes });
}
