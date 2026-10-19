/** Bars (C5, C9, C10 top shares): horizontal or vertical, optional intervals and baseline. */

import { makeBarAxis, reserveValueWidth, valueGrid } from "../axes.ts";
import { formatValue, SUPPRESSED_LABEL } from "../format.ts";
import { niceTicks } from "../math.ts";
import {
  FS, dim, el, fitEllipsis, frame, labelLines, op, text, textLines, textWidth, wrapText,
  type Ctx, type SvgNode,
} from "../svg.ts";
import { reveal } from "../timing.ts";
import type { BarsData, BarItem } from "../types.ts";
import type { ReactElement } from "react";

const M = 16;

function sorted(data: BarsData): readonly BarItem[] {
  const sort = data.sort ?? "none";
  if (sort === "none") return data.items;
  const dir = sort === "desc" ? -1 : 1;
  return [...data.items].sort((a, b) => {
    if (a.value === null && b.value === null) return 0;
    if (a.value === null) return 1;
    if (b.value === null) return -1;
    return (a.value - b.value) * dir;
  });
}

export function renderBars(ctx: Ctx<BarsData>): ReactElement {
  const { data, width, pal, spec, p } = ctx;
  const items = sorted(data);
  const orient: "h" | "v" = (data.orientation ?? "horizontal") === "horizontal" ? "h" : "v";
  const peak = Math.max(
    data.baseline ?? 0,
    ...items.map((i) => Math.max(i.value ?? 0, i.hi ?? 0)),
  );
  const ticks = niceTicks(0, data.max ?? peak, 4);
  const top = ticks[ticks.length - 1] ?? 1;
  const nodes: SvgNode[] = [];

  if (orient === "h") {
    const measure = (s: string) => textWidth(s, FS.label);
    const valueW = reserveValueWidth(data.fmt, items.map((i) => i.value), (s) => textWidth(s, FS.value, 600)) + 10;
    const rowH = ctx.compact ? 46 : 34;
    const gutter = ctx.compact
      ? 0
      : Math.min(width * 0.38, Math.max(...items.map((i) => measure(i.label))) + 12);
    // On phones the row label sits above its bar, so the first label needs its own
    // line below the tick labels: the grid starts `head` units above the bands.
    const head = ctx.compact ? 16 : 0;
    const plot = { x: M + gutter, y: 26, w: width - M * 2 - gutter - valueW, h: items.length * rowH + head };
    const axis = makeBarAxis("h", { ...plot, y: plot.y + head, h: items.length * rowH }, items.length, [0, top], ctx.compact ? 0.45 : 0.32);
    nodes.push(...valueGrid(ctx, { ...axis, plot }, ticks, data.fmt));
    items.forEach((item, i) => {
      const r = axis.rect(i, 0, item.value ?? 0);
      const f = reveal(spec, p, item.id, i, items.length);
      const d = dim(ctx, item.id);
      const cy = r.y + r.h / 2;
      const labelY = ctx.compact ? r.y - 6 : cy + 4;
      const lines = ctx.compact ? [fitEllipsis(item.label, width - M * 2, FS.label)] : labelLines(item.label, gutter - 8, FS.label);
      const suppressed = item.value === null;
      nodes.push(
        el("g", { key: item.id, "data-id": item.id, opacity: op(d) },
          ...lines.map((line, k) =>
            text(M, lines.length === 1 ? labelY : labelY + (k === 0 ? -6 : 6), line, { fill: pal.ink, extra: { key: `l${k}`, opacity: op(f) } })),
          suppressed
            ? el("rect", { x: plot.x, y: r.y, width: Math.min(plot.w, 56), height: r.h, fill: `url(#${ctx.hatchId})`, stroke: pal.edge, strokeWidth: 1, opacity: op(f) })
            : el("rect", { x: r.x, y: r.y, width: r.w, height: r.h, fill: pal.ink, transform: axis.grow(f, 0) }),
          item.lo !== undefined && item.hi !== undefined && item.value !== null
            ? el("g", { opacity: op(f) },
                ...(["card", "accent"] as const).map((tone) =>
                  el("g", { key: tone, stroke: tone === "card" ? pal.card : pal.accent, strokeWidth: tone === "card" ? 5 : 2 },
                    el("line", { x1: axis.val(item.lo ?? 0), y1: cy, x2: axis.val(item.hi ?? 0), y2: cy }),
                    el("line", { x1: axis.val(item.lo ?? 0), y1: cy - 5, x2: axis.val(item.lo ?? 0), y2: cy + 5 }),
                    el("line", { x1: axis.val(item.hi ?? 0), y1: cy - 5, x2: axis.val(item.hi ?? 0), y2: cy + 5 }))))
            : null,
          text(
            suppressed ? plot.x + Math.min(plot.w, 56) + 8 : Math.max(r.x + r.w, item.hi !== undefined ? axis.val(item.hi) : 0) + 8,
            cy + 5,
            suppressed ? SUPPRESSED_LABEL : formatValue(data.fmt, item.value),
            { size: FS.value, weight: 600, fill: pal.ink, extra: { opacity: op(f) } },
          ),
        ),
      );
    });
    if (data.baseline !== undefined) {
      const bx = axis.val(data.baseline);
      nodes.push(
        el("line", { x1: bx, y1: plot.y - 4, x2: bx, y2: plot.y + plot.h, stroke: pal.accent, strokeWidth: 1.5, strokeDasharray: "4 3", opacity: op(Math.min(1, p * 4)) }),
        data.baselineLabel
          ? text(bx, plot.y + plot.h + 18, data.baselineLabel, { size: FS.small, fill: pal.accent, anchor: "middle", weight: 600, opacity: op(Math.min(1, p * 4)) })
          : null,
      );
    }
    return frame({ ctx, height: plot.y + plot.h + (data.baselineLabel ? 28 : 12), children: nodes });
  }

  // vertical
  const plotH = ctx.compact ? 220 : 260;
  const labelRows = 3;
  const left = 44;
  const plot = { x: M + left, y: 28, w: width - M * 2 - left, h: plotH };
  const axis = makeBarAxis("v", plot, items.length, [0, top], 0.34);
  nodes.push(...valueGrid(ctx, axis, ticks, data.fmt));
  items.forEach((item, i) => {
    const r = axis.rect(i, 0, item.value ?? 0);
    const f = reveal(spec, p, item.id, i, items.length);
    const d = dim(ctx, item.id);
    const cx = r.x + r.w / 2;
    // A single long word must not be cut ("kürzes…"): it may use a little more than its own column.
    const widest = Math.max(0, ...item.label.split(/\s+/).map((word) => textWidth(word, FS.small)));
    const lines = wrapText(item.label, Math.max(axis.band.step - 6, Math.ceil(widest) + 1), FS.small, labelRows);
    const suppressed = item.value === null;
    nodes.push(
      el("g", { key: item.id, "data-id": item.id, opacity: op(d) },
        suppressed
          ? el("rect", { x: r.x, y: plot.y + plot.h - 36, width: r.w, height: 36, fill: `url(#${ctx.hatchId})`, stroke: pal.edge, strokeWidth: 1, opacity: op(f) })
          : el("rect", { x: r.x, y: r.y, width: r.w, height: r.h, fill: pal.ink, transform: axis.grow(f, 0) }),
        item.lo !== undefined && item.hi !== undefined && item.value !== null
          ? el("g", { opacity: op(f) },
              ...(["card", "accent"] as const).map((tone) =>
                el("g", { key: tone, stroke: tone === "card" ? pal.card : pal.accent, strokeWidth: tone === "card" ? 5 : 2 },
                  el("line", { x1: cx, y1: axis.val(item.lo ?? 0), x2: cx, y2: axis.val(item.hi ?? 0) }),
                  el("line", { x1: cx - 5, y1: axis.val(item.lo ?? 0), x2: cx + 5, y2: axis.val(item.lo ?? 0) }),
                  el("line", { x1: cx - 5, y1: axis.val(item.hi ?? 0), x2: cx + 5, y2: axis.val(item.hi ?? 0) }))))
          : null,
        text(cx, (suppressed ? plot.y + plot.h - 42 : Math.min(r.y, item.hi !== undefined ? axis.val(item.hi) : r.y)) - 6, suppressed ? SUPPRESSED_LABEL : formatValue(data.fmt, item.value), {
          size: suppressed ? FS.small : FS.value, weight: 600, fill: pal.ink, anchor: "middle",
          opacity: op(f),
        }),
        textLines(cx, plot.y + plot.h + 18, lines, 14, { size: FS.small, fill: pal.muted, anchor: "middle", opacity: op(f) }),
      ),
    );
  });
  if (data.baseline !== undefined) {
    const by = axis.val(data.baseline);
    nodes.push(
      el("line", { x1: plot.x, y1: by, x2: plot.x + plot.w, y2: by, stroke: pal.accent, strokeWidth: 1.5, strokeDasharray: "4 3", opacity: op(Math.min(1, p * 4)) }),
      data.baselineLabel
        ? text(plot.x + 4, by - 6, data.baselineLabel, { size: FS.small, fill: pal.accent, anchor: "start", weight: 600, opacity: op(Math.min(1, p * 4)) })
        : null,
    );
  }
  return frame({ ctx, height: plot.y + plot.h + 18 + labelRows * 14 + 12, children: nodes });
}
