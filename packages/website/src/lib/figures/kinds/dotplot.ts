/** Dot plot with intervals (C6 industries): value dot, Wilson interval, hatched suppressed rows. */

import { tickStrings } from "../axes.ts";
import { formatIntervalBare, formatN, formatValue, SUPPRESSED_LABEL } from "../format.ts";
import { niceTicks, scaleLinear } from "../math.ts";
import {
  FS, dim, el, fitEllipsis, frame, isEmphasised, op, text, textWidth, translate,
  type Ctx, type SvgNode,
} from "../svg.ts";
import { frameReveal, reveal } from "../timing.ts";
import type { DotItem, DotplotData } from "../types.ts";
import type { ReactElement } from "react";

const M = 16;
const ROW = 32;

function sorted(data: DotplotData): readonly DotItem[] {
  const sort = data.sort ?? "none";
  if (sort === "none") return data.items;
  if (sort === "label") return [...data.items].sort((a, b) => a.label.localeCompare(b.label, "de"));
  return [...data.items].sort((a, b) => {
    if (a.value === null && b.value === null) return 0;
    if (a.value === null) return 1;
    if (b.value === null) return -1;
    return b.value - a.value;
  });
}

export function renderDotplot(ctx: Ctx<DotplotData>): ReactElement {
  const { data, width, pal, spec, p } = ctx;
  const items = sorted(data);
  const highest = Math.max(
    data.reference?.value ?? 0,
    ...items.map((i) => Math.max(i.hi ?? 0, i.value ?? 0)),
  );
  const ticks = niceTicks(data.min ?? 0, data.max ?? highest, 4);
  const lo = ticks[0] ?? 0;
  const hi = ticks[ticks.length - 1] ?? 1;
  const compact = ctx.compact;
  const rowH = compact ? 44 : ROW;
  const gutter = compact ? 0 : Math.min(width * 0.38, 220);
  const valueW = textWidth(formatValue(data.fmt, hi), FS.value, 600) + 12;
  const plot = { x: M + gutter + 6, y: 30, w: width - M * 2 - gutter - valueW - 6, h: items.length * rowH };
  const sx = scaleLinear([lo, hi], [plot.x, plot.x + plot.w]);
  const labels = tickStrings(data.fmt, ticks);
  const o = op(frameReveal(p));
  const nodes: SvgNode[] = [];

  ticks.forEach((t, i) => {
    nodes.push(
      el("line", { key: `g${t}`, x1: sx(t), y1: plot.y - 4, x2: sx(t), y2: plot.y + plot.h, stroke: pal.track, strokeWidth: 1, opacity: o }),
      text(sx(t), plot.y - 10, labels[i] ?? "", { size: FS.small, fill: pal.mutedLight, anchor: i === ticks.length - 1 ? "end" : "middle", opacity: o }),
    );
  });
  if (data.reference) {
    const rx = sx(data.reference.value);
    nodes.push(
      el("line", { x1: rx, y1: plot.y - 4, x2: rx, y2: plot.y + plot.h, stroke: pal.accent, strokeWidth: 1.5, strokeDasharray: "4 3", opacity: o }),
      text(rx, plot.y + plot.h + 18, data.reference.label, { size: FS.small, fill: pal.accent, weight: 600, anchor: "middle", opacity: o }),
    );
  }

  items.forEach((item, i) => {
    const f = reveal(spec, p, item.id, i, items.length);
    const cy = plot.y + i * rowH + (compact ? rowH * 0.62 : rowH / 2);
    const labelY = compact ? plot.y + i * rowH + 13 : cy + 4;
    const label = fitEllipsis(item.label, compact ? width - M * 2 : gutter - 8, FS.label);
    const emphasis = isEmphasised(ctx, item.id);
    const suppressed = item.value === null;
    const nText = item.n !== undefined ? formatN(item.n) : "";
    const dx = (1 - f) * (plot.x - (item.value !== null ? sx(item.value) : plot.x));
    const dotX = item.value !== null ? sx(item.value) : plot.x;
    nodes.push(
      el("g", { key: item.id, "data-id": item.id, opacity: op(dim(ctx, item.id)) },
        text(M, labelY, label, { fill: pal.ink, weight: emphasis ? 700 : 400, extra: { opacity: op(f) } }),
        suppressed
          ? el("g", { opacity: op(f) },
              el("rect", { x: plot.x, y: cy - 5, width: Math.min(plot.w, 90), height: 10, fill: `url(#${ctx.hatchId})`, stroke: pal.edge, strokeWidth: 1 }),
              text(plot.x + Math.min(plot.w, 90) + 8, cy + 5, SUPPRESSED_LABEL, { size: FS.small, fill: pal.muted }))
          : el("g", { opacity: op(f), transform: translate(dx, 0) },
              item.lo !== undefined && item.hi !== undefined
                ? el("g", {},
                    el("line", { x1: sx(item.lo), y1: cy, x2: sx(item.hi), y2: cy, stroke: pal.ink, strokeWidth: 2 }),
                    el("line", { x1: sx(item.lo), y1: cy - 4, x2: sx(item.lo), y2: cy + 4, stroke: pal.ink, strokeWidth: 2 }),
                    el("line", { x1: sx(item.hi), y1: cy - 4, x2: sx(item.hi), y2: cy + 4, stroke: pal.ink, strokeWidth: 2 }))
                : null,
              el("circle", { cx: dotX, cy, r: emphasis ? 7 : 5.5, fill: pal.accent, stroke: pal.card, strokeWidth: 1.5 }),
            ),
        suppressed
          ? null
          : text(plot.x + plot.w + 10, cy + 5, formatValue(data.fmt, item.value), {
              size: FS.value, weight: 600, fill: pal.ink, opacity: op(f),
            }),
        emphasis && !compact && item.lo !== undefined && item.hi !== undefined && item.value !== null
          ? text(dotX, cy - 11, `${formatIntervalBare(data.fmt, item.lo, item.hi)}${nText ? `, ${nText}` : ""}`, { size: FS.small, fill: pal.ink, anchor: "middle", weight: 600 })
          : null,
      ),
    );
  });
  return frame({ ctx, height: plot.y + plot.h + (data.reference ? 30 : 12), children: nodes });
}
