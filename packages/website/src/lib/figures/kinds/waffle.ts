/** Waffle of dots (C3): one dot is one of `total`. Dots settle from seeded offsets, then rest on the grid. */

import { formatDecimal } from "../format.ts";
import { easeOutCubic, jitterOffset, springEase } from "../math.ts";
import {
  FS, dim, el, flowLegend, frame, isEmphasised, op, text, translate,
  type Ctx, type LegendItem, type SvgNode,
} from "../svg.ts";
import { revealWindow, segment } from "../timing.ts";
import type { WaffleData, WaffleGroup } from "../types.ts";
import type { Palette } from "../palette.ts";
import type { ReactElement } from "react";

const M = 16;

interface DotStyle {
  readonly fill: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
}

function styleFor(tone: WaffleGroup["tone"], pal: Palette): DotStyle {
  switch (tone) {
    case "accent": return { fill: pal.accent };
    case "ink": return { fill: pal.ink };
    case "light": return { fill: pal.track, stroke: pal.edge, strokeWidth: 1 };
    default: return { fill: "none", stroke: pal.edge, strokeWidth: 1.75 };
  }
}

export function renderWaffle(ctx: Ctx<WaffleData>): ReactElement {
  const { data, width, pal, spec, p } = ctx;
  const columns = data.columns ?? 10;
  const rows = Math.ceil(data.total / columns);
  const side = Math.min(width - M * 2, ctx.compact ? 340 : 360);
  const cell = side / columns;
  const radius = cell * 0.36;
  const originX = (width - side) / 2;
  const headline = data.headline ? 40 : 0;
  const originY = 8 + headline;
  const settle = cell * 2.2;
  const nodes: SvgNode[] = [];

  if (data.headline) {
    nodes.push(
      text(width / 2, 36, data.headline, { size: FS.headline, weight: 700, fill: pal.ink, anchor: "middle", opacity: op(segment(p, 0, 0.15)) }),
    );
  }

  const rest: WaffleGroup = { id: "rest", label: data.restLabel ?? "übrige", dots: 0, tone: "light" };
  const owner: WaffleGroup[] = [];
  data.groups.forEach((g) => {
    for (let i = 0; i < g.dots; i += 1) owner.push(g);
  });
  while (owner.length < data.total) owner.push(rest);
  const hasSteps = (spec.steps?.length ?? 0) > 0;

  owner.slice(0, data.total).forEach((group, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const cx = originX + col * cell + cell / 2;
    const cy = originY + row * cell + cell / 2;
    let start: number;
    let end: number;
    if (hasSteps && data.groups.includes(group)) {
      const gi = data.groups.indexOf(group);
      const w = revealWindow(spec, group.id, gi, data.groups.length);
      const within = owner.indexOf(group);
      const k = (i - within) / Math.max(1, group.dots);
      start = w.start + k * (w.end - w.start) * 0.6;
      end = w.end;
    } else {
      start = 0.04 + (0.7 * i) / data.total;
      end = Math.min(1, start + 0.26);
    }
    const t = segment(p, start, end);
    const move = springEase(t, "soft");
    const [ox, oy] = jitterOffset(ctx.seed, i, settle);
    const dx = ox * (1 - move);
    const dy = oy * (1 - move) - (1 - move) * cell * 0.6;
    const st = styleFor(group.tone, pal);
    const emphasis = isEmphasised(ctx, group.id);
    nodes.push(
      el("circle", {
        key: i, "data-group": group.id, cx, cy, r: emphasis ? radius * 1.12 : radius,
        fill: st.fill, stroke: st.stroke, strokeWidth: st.strokeWidth,
        opacity: op(Math.min(1, easeOutCubic(t) * 3) * dim(ctx, group.id)),
        transform: translate(dx, dy),
      }),
    );
  });

  const legendItems: LegendItem[] = [...data.groups, ...(owner.some((g) => g === rest) ? [rest] : [])].map((g) => {
    const count = g === rest ? data.total - data.groups.reduce((s, x) => s + x.dots, 0) : g.dots;
    const st = styleFor(g.tone, pal);
    return {
      label: `${g.label}: ${formatDecimal(count, 0)} von ${formatDecimal(data.total, 0)}`,
      marker: (x: number, y: number) =>
        el("circle", { cx: x, cy: y, r: 6, fill: st.fill, stroke: st.stroke, strokeWidth: st.strokeWidth }),
      markerWidth: 16,
    };
  });
  const gridBottom = originY + rows * cell;
  const legend = flowLegend(legendItems, M, width - M, gridBottom + 24, pal.ink, op(segment(p, 0.6, 1)));
  nodes.push(...legend.nodes);
  return frame({ ctx, height: legend.bottom + 6, children: nodes });
}
