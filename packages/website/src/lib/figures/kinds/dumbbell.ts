/** Dumbbell (C11): two measures per row on one shared axis, linear or log. */

import { tickStrings } from "../axes.ts";
import { formatValue } from "../format.ts";
import { logExtent, logTicks, niceTicks, scaleLinear, scaleLog, type LinearScale } from "../math.ts";
import {
  FS, dim, el, fitEllipsis, flowLegend, frame, isEmphasised, labelLines, op, scaleAbout, text, textLines, textWidth, translate,
  type Ctx, type SvgNode,
} from "../svg.ts";
import { frameReveal, reveal } from "../timing.ts";
import type { DumbbellData, DumbbellRow } from "../types.ts";
import type { Palette } from "../palette.ts";
import type { ReactElement } from "react";

const M = 16;

function sorted(data: DumbbellData): readonly DumbbellRow[] {
  const sort = data.sort ?? "none";
  if (sort === "none") return data.rows;
  const key = (r: DumbbellRow): number => {
    if (sort === "a") return r.a ?? -Infinity;
    if (sort === "b") return r.b ?? -Infinity;
    return r.a !== null && r.b !== null ? Math.abs(r.a - r.b) : -Infinity;
  };
  return [...data.rows].sort((x, y) => key(y) - key(x));
}

const diamond = (cx: number, cy: number, r: number): string =>
  `M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z`;

/** One value column cell; a suppressed value takes two short lines so the column stays narrow. */
function wideValue(
  x: number,
  cy: number,
  data: DumbbellData,
  value: number | null,
  pal: Palette,
  opacity: number | undefined,
): SvgNode {
  if (value === null) {
    return textLines(x, cy - 1, ["weniger", "als 5"], 13, { size: FS.small, weight: 600, fill: pal.ink, anchor: "end", opacity });
  }
  return text(x, cy + 5, formatValue(data.fmt, value), { size: FS.value, weight: 600, fill: pal.ink, anchor: "end", opacity });
}

function compactValuesWidth(row: DumbbellRow, data: DumbbellData): number {
  return (
    textWidth(formatValue(data.fmt, row.a), FS.value, 600) +
    textWidth(formatValue(data.fmt, row.b), FS.value, 600) +
    50
  );
}

/** Phone: "● a  ◆ b" right-aligned on the label line; markers repeat the legend, so colour is not the only cue. */
function compactValues(
  row: DumbbellRow,
  data: DumbbellData,
  right: number,
  y: number,
  pal: Palette,
  opacity: number | undefined,
): SvgNode[] {
  const aText = formatValue(data.fmt, row.a);
  const bText = formatValue(data.fmt, row.b);
  const bStart = right - textWidth(bText, FS.value, 600);
  const dX = bStart - 12;
  const aEnd = dX - 14;
  const aStart = aEnd - textWidth(aText, FS.value, 600);
  const cX = aStart - 11;
  return [
    el("circle", { cx: cX, cy: y - 4, r: 4.5, fill: pal.accent, opacity }),
    text(aEnd, y, aText, { size: FS.value, weight: 600, fill: pal.ink, anchor: "end", opacity }),
    el("path", { d: diamond(dX, y - 4, 5), fill: pal.ink, opacity }),
    text(right, y, bText, { size: FS.value, weight: 600, fill: pal.ink, anchor: "end", opacity }),
  ];
}

export function renderDumbbell(ctx: Ctx<DumbbellData>): ReactElement {
  const { data, width, pal, spec, p } = ctx;
  const rows = sorted(data);
  const all = rows.flatMap((r) => [r.a, r.b]).filter((v): v is number => v !== null);
  if (data.reference) all.push(data.reference.value);
  const log = data.scale === "log";
  let sx: LinearScale;
  let ticks: number[];
  const compact = ctx.compact;
  const rowH = compact ? 44 : 32;
  // Phone: the two values sit on the label line, so the plot keeps the full width.
  const colW = compact
    ? 0
    : Math.max(
        ...rows
          .flatMap((r) => [r.a, r.b])
          .filter((v): v is number => v !== null)
          .map((v) => textWidth(formatValue(data.fmt, v), FS.value, 600)),
        36,
        // Two short lines stand in for a suppressed value.
        rows.some((r) => r.a === null || r.b === null) ? textWidth("weniger", FS.small, 600) : 0,
      ) + 10;
  const gutter = compact ? 0 : Math.min(width * 0.32, 200);

  const legendItems = [
    { label: data.aLabel, marker: (x: number, y: number) => el("circle", { cx: x, cy: y, r: 5.5, fill: pal.accent }) },
    { label: data.bLabel, marker: (x: number, y: number) => el("path", { d: diamond(x, y, 6.5), fill: pal.ink }) },
  ];
  const legend = flowLegend(legendItems, M, width - M, 8, pal.muted);
  const top = legend.bottom + 22;
  const plotX = M + gutter + 6;
  const plotW = width - M - plotX - colW * 2 - 6;
  const plot = { x: plotX, y: top, w: plotW, h: rows.length * rowH };

  if (log) {
    const [lo, hi] = logExtent(Math.min(...all), Math.max(...all));
    ticks = logTicks(lo, hi);
    sx = scaleLog([lo, hi], [plot.x, plot.x + plot.w]);
  } else {
    ticks = niceTicks(0, Math.max(...all), 5);
    sx = scaleLinear([ticks[0] ?? 0, ticks[ticks.length - 1] ?? 1], [plot.x, plot.x + plot.w]);
  }
  const labels = tickStrings(data.fmt, ticks);
  const o = op(frameReveal(p));
  const nodes: SvgNode[] = [...legend.nodes];

  // Thin crowded tick labels (log axis: 200, 500, 1.000 sit a few pixels apart): keep a label only if it clears the last kept one.
  let lastKept = Number.NEGATIVE_INFINITY;
  const keep = ticks.map((t, i) => {
    const x = sx(t);
    const need = textWidth(labels[i] ?? "", FS.small, 400) + 10;
    if (x - lastKept < need) return false;
    lastKept = x;
    return true;
  });
  ticks.forEach((t, i) => {
    nodes.push(
      el("line", { key: `g${t}`, x1: sx(t), y1: plot.y - 4, x2: sx(t), y2: plot.y + plot.h, stroke: pal.track, strokeWidth: 1, opacity: o }),
      text(sx(t), plot.y - 10, keep[i] ? (labels[i] ?? "") : "", { size: FS.small, fill: pal.mutedLight, anchor: i === ticks.length - 1 ? "end" : "middle", opacity: o }),
    );
  });
  if (!compact) {
    nodes.push(
      el("circle", { cx: plot.x + plot.w + colW - 6, cy: plot.y - 14, r: 4, fill: pal.accent, opacity: o }),
      el("path", { d: diamond(plot.x + plot.w + colW * 2 - 6, plot.y - 14, 5), fill: pal.ink, opacity: o }),
    );
  }
  if (data.reference) {
    const rx = sx(data.reference.value);
    nodes.push(
      el("line", { x1: rx, y1: plot.y - 4, x2: rx, y2: plot.y + plot.h, stroke: pal.accent, strokeWidth: 1.5, strokeDasharray: "4 3", opacity: o }),
      text(rx, plot.y + plot.h + 18, data.reference.label, { size: FS.small, weight: 600, fill: pal.accent, anchor: "middle", opacity: o }),
    );
  }

  rows.forEach((row, i) => {
    const f = reveal(spec, p, row.id, i, rows.length);
    const cy = plot.y + i * rowH + (compact ? rowH * 0.62 : rowH / 2);
    const labelY = compact ? plot.y + i * rowH + 13 : cy + 4;
    const ax = row.a !== null ? sx(row.a) : null;
    const bx = row.b !== null ? sx(row.b) : null;
    const emphasis = isEmphasised(ctx, row.id);
    const slide = bx !== null && ax !== null ? (1 - f) * (ax - bx) : 0;
    nodes.push(
      el("g", { key: row.id, "data-id": row.id, opacity: op(dim(ctx, row.id)) },
        ...(compact
          ? [fitEllipsis(row.label, width - M * 2 - compactValuesWidth(row, data) - 10, FS.label)]
          : labelLines(row.label, gutter - 6, FS.label)
        ).map((line, k, all) =>
          text(M, all.length === 1 ? labelY : labelY + (k === 0 ? -6 : 6), line, { fill: pal.ink, weight: emphasis ? 700 : 400, opacity: op(f), extra: { key: `l${k}` } })),
        ax !== null && bx !== null
          ? el("line", { x1: Math.min(ax, bx), y1: cy, x2: Math.max(ax, bx), y2: cy, stroke: pal.edge, strokeWidth: 3, transform: scaleAbout(f, 1, ax, 0), opacity: op(Math.min(1, f * 2)) })
          : null,
        ax !== null ? el("circle", { cx: ax, cy, r: 5.5, fill: pal.accent, stroke: pal.card, strokeWidth: 1.5, opacity: op(Math.min(1, f * 2)) }) : null,
        bx !== null ? el("path", { d: diamond(bx, cy, 6.5), fill: pal.ink, stroke: pal.card, strokeWidth: 1.5, transform: translate(slide, 0), opacity: op(Math.min(1, f * 2)) }) : null,
        ...(compact
          ? compactValues(row, data, width - M, labelY, pal, op(f))
          : [
              wideValue(plot.x + plot.w + colW - 6, cy, data, row.a, pal, op(f)),
              wideValue(plot.x + plot.w + colW * 2 - 6, cy, data, row.b, pal, op(f)),
            ]),
      ),
    );
  });
  return frame({ ctx, height: plot.y + plot.h + (data.reference ? 30 : 12), children: nodes });
}
