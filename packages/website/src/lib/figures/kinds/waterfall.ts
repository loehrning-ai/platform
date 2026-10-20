/** Waterfall (C4): totals from zero and signed changes, vertical on wide screens, horizontal on phones. */

import { makeBarAxis, valueGrid } from "../axes.ts";
import { formatValue } from "../format.ts";
import { niceTicks } from "../math.ts";
import {
  FS, dim, el, fitEllipsis, flowLegend, frame, isEmphasised, op, text, textLines, textWidth, wrapText,
  type Ctx, type LegendItem, type SvgNode,
} from "../svg.ts";
import { frameReveal, reveal } from "../timing.ts";
import type { WaterfallData } from "../types.ts";
import type { ReactElement } from "react";

const M = 16;

interface Bar {
  readonly id: string;
  readonly label: string;
  readonly kind: "total" | "delta";
  readonly v0: number;
  readonly v1: number;
  readonly value: number;
  readonly slot: number;
  readonly gapBefore: boolean;
}

/** Running levels; gaps add half a slot between groups. */
export function waterfallBars(data: WaterfallData): { bars: Bar[]; slots: number } {
  let run = 0;
  let slot = 0;
  const bars = data.items.map((item, i) => {
    const gap = Boolean(item.gapBefore) && i > 0;
    if (gap) slot += 0.5;
    const v0 = item.kind === "total" ? 0 : run;
    const v1 = item.kind === "total" ? item.value : Math.round((run + item.value) * 1e9) / 1e9;
    run = Math.round(v1 * 1e9) / 1e9;
    const bar: Bar = { id: item.id, label: item.label, kind: item.kind, v0, v1, value: item.value, slot, gapBefore: gap };
    slot += 1;
    return bar;
  });
  return { bars, slots: slot };
}

/**
 * A stepped waterfall shows what is still to come as a dashed outline at the
 * final size ("kommt noch"), so the empty part of the chart reads as a plan
 * and not as a bug. The outline fades as the bar grows; at progress 1 it is gone.
 */
function ghostOpacity(ctx: Ctx<WaterfallData>, f: number): number {
  return ctx.spec.steps && ctx.spec.steps.length > 0 ? Math.max(0, 1 - f) * 0.9 : 0;
}

export function renderWaterfall(ctx: Ctx<WaterfallData>): ReactElement {
  const { data, width, pal, spec, p } = ctx;
  const { bars, slots } = waterfallBars(data);
  const levels = bars.flatMap((b) => [b.v0, b.v1]);
  const lo = Math.min(0, ...levels);
  const ticks = niceTicks(lo, Math.max(...levels), 4);
  const domain: [number, number] = [ticks[0] ?? 0, ticks[ticks.length - 1] ?? 1];
  const orient = data.orientation ?? "auto";
  const horizontal = orient === "horizontal" || (orient === "auto" && width < 520);
  const nodes: SvgNode[] = [];
  const o = op(frameReveal(p));
  let anyGhost = false;

  const fillFor = (b: Bar): { fill: string; stroke?: string; strokeWidth?: number } =>
    b.kind === "total"
      ? { fill: pal.ink }
      : b.value < 0
        ? { fill: pal.accent }
        : { fill: pal.card, stroke: pal.ink, strokeWidth: 2 };

  const valueText = (b: Bar): string => formatValue(data.fmt, b.value, b.kind === "delta");

  let axisBottom: number;
  if (horizontal) {
    const valueW = Math.max(...bars.map((b) => textWidth(valueText(b), FS.value, 600))) + 12;
    // A stepped chart is pinned on a phone and must leave room for the step text: tighter rows there.
    const rowH = spec.steps && spec.steps.length > 0 ? 38 : 48;
    // The row label sits above its bar: leave a line below the tick labels for the first one.
    const head = 16;
    const plot = { x: M, y: 26, w: width - M * 2 - valueW, h: slots * rowH + head };
    const bandPlot = { ...plot, y: plot.y + head, h: slots * rowH };
    const axis = makeBarAxis("h", bandPlot, slots, domain, 0.5);
    nodes.push(...valueGrid(ctx, { ...axis, plot }, ticks, data.fmt));
    bars.forEach((b, i) => {
      const r = axis.rect(b.slot, b.v0, b.v1);
      const f = reveal(spec, p, b.id, i, bars.length);
      const st = fillFor(b);
      const start = b.kind === "total" ? 0 : b.v0;
      if (b.gapBefore) {
        const gy = bandPlot.y + (b.slot - 0.25) * axis.band.step;
        nodes.push(el("line", { key: `gap${b.id}`, x1: M, y1: gy, x2: width - M, y2: gy, stroke: pal.edge, strokeWidth: 1, strokeDasharray: "2 3", opacity: o }));
      }
      const ghost = ghostOpacity(ctx, f);
      if (ghost > 0.01) {
        anyGhost = true;
        nodes.push(
          el("g", { key: `ghost${b.id}`, "data-ghost": b.id, opacity: op(ghost) },
            text(M, r.y - 6, fitEllipsis(b.label, width - M * 2, FS.label), { fill: pal.mutedLight }),
            el("rect", { x: r.x, y: r.y, width: Math.max(r.w, 1.5), height: r.h, fill: pal.inset, stroke: pal.edge, strokeWidth: 1.5, strokeDasharray: "4 3" }),
          ),
        );
      }
      nodes.push(
        el("g", { key: b.id, "data-id": b.id, opacity: op(dim(ctx, b.id)) },
          text(M, r.y - 6, fitEllipsis(b.label, width - M * 2, FS.label), { fill: pal.ink, weight: isEmphasised(ctx, b.id) ? 700 : 400, opacity: op(f) }),
          el("rect", { x: r.x, y: r.y, width: Math.max(r.w, 1.5), height: r.h, ...st, transform: axis.grow(f, start) }),
          text(Math.max(axis.val(b.v0), axis.val(b.v1)) + 8, r.y + r.h / 2 + 5, valueText(b), { size: FS.value, weight: 600, fill: pal.ink, opacity: op(f) }),
        ),
      );
    });
    axisBottom = plot.y + plot.h;
  } else {
    const left = 44;
    const plot = { x: M + left, y: 30, w: width - M * 2 - left, h: 250 };
    const axis = makeBarAxis("v", plot, slots, domain, 0.3);
    nodes.push(...valueGrid(ctx, axis, ticks, data.fmt));
    const zero = axis.val(0);
    nodes.push(el("line", { x1: plot.x, y1: zero, x2: plot.x + plot.w, y2: zero, stroke: pal.ink, strokeWidth: 1.5, opacity: o }));
    let maxLines = 1;
    bars.forEach((b, i) => {
      const r = axis.rect(b.slot, b.v0, b.v1);
      const f = reveal(spec, p, b.id, i, bars.length);
      const st = fillFor(b);
      const start = b.kind === "total" ? 0 : b.v0;
      const lines = wrapText(b.label, axis.band.step - 6, FS.small, 4);
      maxLines = Math.max(maxLines, lines.length);
      const cx = r.x + r.w / 2;
      const next = bars[i + 1];
      if (b.gapBefore) {
        const gx = plot.x + (b.slot - 0.25) * axis.band.step;
        nodes.push(el("line", { key: `gap${b.id}`, x1: gx, y1: plot.y - 8, x2: gx, y2: plot.y + plot.h + 4, stroke: pal.edge, strokeWidth: 1, strokeDasharray: "2 3", opacity: o }));
      }
      const ghost = ghostOpacity(ctx, f);
      if (ghost > 0.01) {
        anyGhost = true;
        nodes.push(
          el("g", { key: `ghost${b.id}`, "data-ghost": b.id, opacity: op(ghost) },
            el("rect", { x: r.x, y: r.y, width: r.w, height: Math.max(r.h, 1.5), fill: pal.inset, stroke: pal.edge, strokeWidth: 1.5, strokeDasharray: "4 3" }),
            textLines(cx, plot.y + plot.h + 18, lines, 14, { size: FS.small, fill: pal.mutedLight, anchor: "middle" }),
          ),
        );
      }
      nodes.push(
        el("g", { key: b.id, "data-id": b.id, opacity: op(dim(ctx, b.id)) },
          el("rect", { x: r.x, y: r.y, width: r.w, height: Math.max(r.h, 1.5), ...st, transform: axis.grow(f, start) }),
          text(cx, Math.min(axis.val(b.v0), axis.val(b.v1)) - 8, valueText(b), { size: FS.value, weight: 600, fill: pal.ink, anchor: "middle", opacity: op(f) }),
          textLines(cx, plot.y + plot.h + 18, lines, 14, { size: FS.small, fill: pal.muted, anchor: "middle", opacity: op(f) }),
        ),
      );
      if (next && !next.gapBefore) {
        const level = axis.val(b.v1);
        const nr = axis.rect(next.slot, next.v0, next.v1);
        nodes.push(
          el("line", { key: `c${b.id}`, x1: r.x + r.w, y1: level, x2: nr.x, y2: level, stroke: pal.edge, strokeWidth: 1, strokeDasharray: "3 3", opacity: op(reveal(spec, p, next.id, i + 1, bars.length)) }),
        );
      }
    });
    axisBottom = plot.y + plot.h + 18 + maxLines * 14;
  }

  const swatch = (fill: string, stroke?: string) => (x: number, y: number) =>
    el("rect", { x: x - 7, y: y - 6, width: 14, height: 12, fill, stroke, strokeWidth: stroke ? 2 : undefined });
  const words = data.legend ?? {};
  const legendItems: LegendItem[] = [{ label: words.total ?? "Messwert", marker: swatch(pal.ink) }];
  if (bars.some((b) => b.kind === "delta" && b.value < 0)) {
    legendItems.push({ label: words.down ?? "Rückgang", marker: swatch(pal.accent) });
  }
  if (bars.some((b) => b.kind === "delta" && b.value > 0)) {
    legendItems.push({ label: words.up ?? "Anstieg", marker: swatch(pal.card, pal.ink) });
  }
  if (anyGhost) {
    legendItems.push({
      label: "kommt noch",
      marker: (x, y) => el("rect", { x: x - 7, y: y - 6, width: 14, height: 12, fill: pal.inset, stroke: pal.edge, strokeWidth: 1.5, strokeDasharray: "3 2" }),
    });
  }
  const legend = flowLegend(legendItems, M, width - M, axisBottom + 18, pal.muted, o);
  nodes.push(...legend.nodes);
  return frame({ ctx, height: legend.bottom + 4, children: nodes });
}
