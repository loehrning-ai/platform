/** Lorenz curve (C10): concentration of postings across employers, numbered marks with text rows. */

import { formatDecimal } from "../format.ts";
import { accentTint } from "../palette.ts";
import { lerp, scaleLinear } from "../math.ts";
import {
  FS, el, flowLegend, frame, op, text, textLines, wrapText,
  type Ctx, type SvgNode,
} from "../svg.ts";
import { frameReveal, segment } from "../timing.ts";
import type { LorenzData } from "../types.ts";
import type { ReactElement } from "react";

const M = 16;

function readY(points: readonly (readonly [number, number])[], x: number): number {
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    if (a && b && x <= b[0]) {
      const span = b[0] - a[0];
      return span === 0 ? b[1] : lerp(a[1], b[1], (x - a[0]) / span);
    }
  }
  return points[points.length - 1]?.[1] ?? 0;
}

export function renderLorenz(ctx: Ctx<LorenzData>): ReactElement {
  const { data, width, pal, p } = ctx;
  const pts: (readonly [number, number])[] = [...data.points].sort((a, b) => a[0] - b[0]);
  if (pts[0]?.[0] !== 0) pts.unshift([0, 0]);
  if (pts[pts.length - 1]?.[0] !== 100) pts.push([100, 100]);

  const left = 48;
  const side = Math.min(width - M * 2 - left, ctx.compact ? 300 : 380);
  const plot = { x: M + left, y: 34, w: side, h: side };
  const sx = scaleLinear([0, 100], [plot.x, plot.x + plot.w]);
  const sy = scaleLinear([0, 100], [plot.y + plot.h, plot.y]);
  const o = op(frameReveal(p));
  const draw = segment(p, 0.1, 0.8);
  const curve = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${sx(x).toFixed(2)} ${sy(y).toFixed(2)}`).join(" ");
  const area = `${curve} L${sx(100).toFixed(2)} ${sy(100).toFixed(2)} L${sx(0).toFixed(2)} ${sy(0).toFixed(2)} Z`;
  const nodes: SvgNode[] = [];

  [0, 25, 50, 75, 100].forEach((t) => {
    nodes.push(
      el("line", { key: `gx${t}`, x1: sx(t), y1: plot.y, x2: sx(t), y2: plot.y + plot.h, stroke: pal.track, strokeWidth: 1, opacity: o }),
      el("line", { key: `gy${t}`, x1: plot.x, y1: sy(t), x2: plot.x + plot.w, y2: sy(t), stroke: pal.track, strokeWidth: 1, opacity: o }),
      text(sx(t), plot.y + plot.h + 18, `${t}`, { size: FS.small, fill: pal.mutedLight, anchor: "middle", opacity: o }),
      text(plot.x - 8, sy(t) + 4, `${t}`, { size: FS.small, fill: pal.mutedLight, anchor: "end", opacity: o }),
    );
  });
  nodes.push(
    text(plot.x + plot.w / 2, plot.y + plot.h + 38, `${data.xLabel} (%)`, { size: FS.small, fill: pal.muted, anchor: "middle", opacity: o }),
    text(M, 16, `${data.yLabel} (%)`, { size: FS.small, fill: pal.muted, opacity: o }),
    el("path", { d: area, fill: accentTint(pal, 0.22), opacity: op(draw) }),
    el("line", { x1: sx(0), y1: sy(0), x2: sx(100), y2: sy(100), stroke: pal.edge, strokeWidth: 1.5, strokeDasharray: "5 4", opacity: o }),
    el("path", {
      d: curve, fill: "none", stroke: pal.accent, strokeWidth: 3, strokeLinejoin: "round",
      pathLength: draw < 1 ? 1 : undefined,
      strokeDasharray: draw < 1 ? 1 : undefined,
      strokeDashoffset: draw < 1 ? 1 - draw : undefined,
    }),
  );

  const marks = data.marks ?? [];
  marks.forEach((m, i) => {
    const y = readY(pts, m.x);
    const f = segment(p, 0.75 + (0.2 * i) / Math.max(1, marks.length), 0.85 + (0.15 * i) / Math.max(1, marks.length));
    nodes.push(
      el("g", { key: `m${i}`, opacity: op(f) },
        el("line", { x1: sx(m.x), y1: sy(y), x2: sx(m.x), y2: plot.y + plot.h, stroke: pal.ink, strokeWidth: 1, strokeDasharray: "2 3" }),
        el("line", { x1: sx(m.x), y1: sy(y), x2: plot.x, y2: sy(y), stroke: pal.ink, strokeWidth: 1, strokeDasharray: "2 3" }),
        el("circle", { cx: sx(m.x), cy: sy(y), r: 10, fill: pal.ink }),
        text(sx(m.x), sy(y) + 4.5, `${i + 1}`, { size: FS.small, weight: 700, fill: pal.card, anchor: "middle" }),
      ),
    );
  });

  let y = plot.y + plot.h + 62;
  const legend = flowLegend(
    [
      { label: "gleiche Verteilung", markerWidth: 24, marker: (x, yy) => el("line", { x1: x - 12, y1: yy, x2: x + 12, y2: yy, stroke: pal.edge, strokeWidth: 1.5, strokeDasharray: "5 4" }) },
      { label: "tatsächliche Verteilung", markerWidth: 24, marker: (x, yy) => el("line", { x1: x - 12, y1: yy, x2: x + 12, y2: yy, stroke: pal.accent, strokeWidth: 3 }) },
    ],
    M, width - M, y, pal.muted, o,
  );
  nodes.push(...legend.nodes);
  y = legend.bottom + 8;
  if (data.gini !== undefined) {
    nodes.push(text(M, y + 4, `Gini-Koeffizient ${formatDecimal(data.gini, 2)}`, { size: FS.label, weight: 600, fill: pal.ink, opacity: o }));
    y += 24;
  }
  marks.forEach((m, i) => {
    const lines = wrapText(m.label, width - M * 2 - 30, FS.label, 3);
    const f = segment(p, 0.75, 1);
    nodes.push(
      el("g", { key: `r${i}`, opacity: op(f) },
        el("circle", { cx: M + 10, cy: y + 2, r: 10, fill: pal.ink }),
        text(M + 10, y + 6.5, `${i + 1}`, { size: FS.small, weight: 700, fill: pal.card, anchor: "middle" }),
        textLines(M + 30, y + 6, lines, 17, { size: FS.label, fill: pal.ink }),
      ),
    );
    y += Math.max(26, lines.length * 17 + 8);
  });
  return frame({ ctx, height: y + 6, children: nodes });
}
