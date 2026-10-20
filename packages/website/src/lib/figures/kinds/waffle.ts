/**
 * Waffle of squares (C3, H05): one hard-edged square is one of `total`. Squares settle from seeded
 * offsets, then rest on the grid. The grid is sized from the available stage height (rows = ceil(n / cols)),
 * so the last row is never cut. A group that is shown first and focused by a later step is a loss: its
 * squares lose their fill one by one in reading order (linear stagger), then hold.
 */

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

/** Progress at which the loss beat of a group starts, or null when the group is not lost. */
function lossWindow(spec: { readonly steps?: ReadonlyArray<{ readonly reveal?: readonly string[]; readonly focus?: readonly string[] }> }, group: WaffleGroup): number | null {
  const steps = spec.steps ?? [];
  if (steps.length < 2 || group.tone !== "accent") return null;
  const shown = steps.findIndex((s) => s.reveal?.includes(group.id));
  const focused = steps.findIndex((s, i) => i > shown && s.focus?.includes(group.id) && !s.reveal?.includes(group.id));
  if (shown < 0 || focused < 0) return null;
  return focused / steps.length;
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
  const base = data.columns ?? 10;
  // In a chapter stage the shell prints the numeral and the claim; a headline in the figure would say a different number.
  const showHeadline = Boolean(data.headline) && !ctx.opts.bare;
  const headline = showHeadline ? 40 : 0;
  const originY = 8 + headline;
  const boxH = ctx.opts.height;
  const maxSide = Math.min(width - M * 2, ctx.compact ? 340 : 360);
  const fitFor = (cols: number): number =>
    boxH === undefined ? Infinity : Math.max(8, (boxH - originY - 56) / Math.ceil(data.total / cols));
  // In a fixed-height stage the waffle takes as many columns as make the squares largest, so it spans the full width.
  let columns = base;
  if (boxH !== undefined && ctx.opts.bare) {
    for (let c = base + 1; c <= base + 8; c += 1) {
      if (Math.min(maxSide / c, fitFor(c)) > Math.min(maxSide / columns, fitFor(columns)) + 0.25) columns = c;
    }
  }
  const rows = Math.ceil(data.total / columns);
  const fitCell = fitFor(columns);
  const cell = Math.min(maxSide / columns, fitCell);
  const side = cell * columns;
  const half = Math.max(1.5, cell * 0.4);
  const originX = (width - side) / 2;
  const settle = cell * 2.2;
  const nodes: SvgNode[] = [];

  if (data.headline && showHeadline) {
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
    const h = emphasis ? half * 1.08 : half;
    const base = {
      "data-group": group.id, x: cx - h, y: cy - h, width: h * 2, height: h * 2, transform: translate(dx, dy),
    };
    const fade = Math.min(1, easeOutCubic(t) * 3) * dim(ctx, group.id);
    const loss = lossWindow(spec, group);
    if (loss !== null) {
      const k = i - owner.indexOf(group);
      const s0 = loss + 0.06 + (k / Math.max(1, group.dots - 1)) * (0.88 - loss - 0.06 - 0.06) * 0.9;
      const gone = easeOutCubic(segment(p, s0, s0 + 0.06));
      nodes.push(
        el("rect", { key: `${i}k`, ...base, fill: pal.ink, opacity: op(fade * (1 - gone)) }),
        el("rect", { key: `${i}o`, ...base, fill: "none", stroke: pal.accent, strokeWidth: 1.75, opacity: op(fade * gone) }),
      );
      return;
    }
    nodes.push(
      el("rect", { key: i, ...base, fill: st.fill, stroke: st.stroke, strokeWidth: st.strokeWidth, opacity: op(fade) }),
    );
  });

  const legendItems: LegendItem[] = [...data.groups, ...(owner.some((g) => g === rest) ? [rest] : [])].map((g) => {
    const count = g === rest ? data.total - data.groups.reduce((s, x) => s + x.dots, 0) : g.dots;
    const st = styleFor(g.tone, pal);
    return {
      label: `${g.label}: ${formatDecimal(count, 0)} von ${formatDecimal(data.total, 0)}`,
      marker: (x: number, y: number) =>
        el("rect", { x: x - 5, y: y - 5, width: 10, height: 10, fill: g.tone === "accent" && lossWindow(spec, g) !== null ? "none" : st.fill, stroke: g.tone === "accent" && lossWindow(spec, g) !== null ? pal.accent : st.stroke, strokeWidth: st.strokeWidth ?? 1.75 }),
      markerWidth: 16,
    };
  });
  const gridBottom = originY + rows * cell;
  const legend = flowLegend(legendItems, M, width - M, gridBottom + 24, pal.ink, op(segment(p, 0.6, 1)));
  nodes.push(...legend.nodes);
  return frame({ ctx, height: legend.bottom + 6, children: nodes });
}
