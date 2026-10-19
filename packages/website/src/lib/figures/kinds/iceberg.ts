/** Iceberg (C2): visible against total. Heights are linear in the values; the tip is small on purpose. */

import { formatValue } from "../format.ts";
import { mulberry32 } from "../math.ts";
import {
  FS, el, frame, op, scaleAbout, text, textLines, translate, wrapText,
  type Ctx, type SvgNode,
} from "../svg.ts";
import { reveal } from "../timing.ts";
import type { IcebergData } from "../types.ts";
import type { ReactElement } from "react";

const M = 16;

function poly(points: readonly (readonly [number, number])[]): string {
  return `${points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ")} Z`;
}

export function renderIceberg(ctx: Ctx<IcebergData>): ReactElement {
  const { data, width, pal, spec, p } = ctx;
  const rand = mulberry32(ctx.seed);
  const jit = (amount: number) => (rand() - 0.5) * 2 * amount;
  const totalH = ctx.compact ? 300 : 340;
  const fraction = Math.min(1, data.visible.value / data.total.value);
  const aboveH = totalH * fraction;
  const belowH = totalH - aboveH;
  const y0 = 40;
  const yw = y0 + aboveH;
  const cx = width * (ctx.compact ? 0.33 : 0.38);
  const tipW = Math.min(150, width * 0.3);
  const bodyW = Math.min(width * 0.52, tipW * 3.2);
  const bottom = yw + belowH;
  const hidden = data.total.value - data.visible.value;

  const tip: [number, number][] = [
    [cx - tipW / 2, yw],
    [cx - tipW * 0.28 + jit(3), yw - aboveH * 0.52],
    [cx - tipW * 0.06 + jit(3), yw - aboveH],
    [cx + tipW * 0.2 + jit(3), yw - aboveH * 0.64],
    [cx + tipW / 2, yw],
  ];
  const body: [number, number][] = [
    [cx - tipW / 2, yw],
    [cx - bodyW * 0.5 + jit(5), yw + belowH * 0.22],
    [cx - bodyW * 0.4 + jit(5), yw + belowH * 0.6],
    [cx - bodyW * 0.12 + jit(5), bottom],
    [cx + bodyW * 0.22 + jit(5), yw + belowH * 0.9],
    [cx + bodyW * 0.5 + jit(5), yw + belowH * 0.42],
    [cx + tipW / 2, yw],
  ];

  const fLine = reveal(spec, p, "waterline", 0, 4);
  const fTip = reveal(spec, p, "tip", 1, 4);
  const fBody = reveal(spec, p, "hidden", 2, 4);
  const fTotal = reveal(spec, p, "total", 3, 4);
  const labelX = Math.min(cx + bodyW / 2 + 16, width - M - 110);
  const bracketX = width - M - 6;
  const labelW = bracketX - 14 - labelX;
  // Long labels wrap onto more lines instead of being cut: a cut label hides what the number means.
  const visLines = wrapText(data.visible.label, labelW, FS.small, 4);
  const hidLines = wrapText(data.hiddenLabel, labelW, FS.small, 5);
  const waterLines = wrapText(data.waterlineLabel, labelW, FS.small, 3, 700);
  const totalLines = wrapText(data.total.label, bracketX - M - 130, FS.small, 4);
  const nodes: SvgNode[] = [
    el("rect", { x: 0, y: yw, width, height: belowH + 24, fill: pal.inset, opacity: op(fLine) }),
    el("g", { transform: translate(0, (1 - fBody) * 36), opacity: op(fBody) },
      el("path", { d: poly(body), fill: pal.accent, stroke: pal.ink, strokeWidth: 1.5, strokeLinejoin: "round" }),
    ),
    el("line", { x1: 0, y1: yw, x2: width, y2: yw, stroke: pal.ink, strokeWidth: 2, transform: scaleAbout(fLine, 1, 0, 0) }),
    el("g", { transform: translate(0, (1 - fTip) * -12), opacity: op(fTip) },
      el("path", { d: poly(tip), fill: pal.card, stroke: pal.ink, strokeWidth: 2, strokeLinejoin: "round" }),
    ),
    textLines(labelX, yw + 18, waterLines, 15, { size: FS.small, weight: 700, fill: pal.muted, opacity: op(fLine) }),
    el("g", { opacity: op(fTip) },
      text(labelX, yw - 8 - (visLines.length - 1) * 15 - 22, formatValue(data.fmt, data.visible.value), { size: FS.headline * 0.75, weight: 700, fill: pal.ink }),
      textLines(labelX, yw - 8 - (visLines.length - 1) * 15, visLines, 15, { size: FS.small, fill: pal.muted }),
    ),
    el("g", { opacity: op(fBody) },
      text(labelX, yw + belowH * 0.45, formatValue(data.fmt, hidden), { size: FS.headline * 0.75, weight: 700, fill: pal.ink }),
      textLines(labelX, yw + belowH * 0.45 + 20, hidLines, 15, { size: FS.small, fill: pal.muted }),
    ),
    el("g", { opacity: op(fTotal) },
      el("line", { x1: bracketX, y1: y0, x2: bracketX, y2: bottom, stroke: pal.ink, strokeWidth: 2 }),
      el("line", { x1: bracketX - 7, y1: y0, x2: bracketX, y2: y0, stroke: pal.ink, strokeWidth: 2 }),
      el("line", { x1: bracketX - 7, y1: bottom, x2: bracketX, y2: bottom, stroke: pal.ink, strokeWidth: 2 }),
      text(bracketX, bottom + 22, `Insgesamt ${formatValue(data.fmt, data.total.value)}`, { size: FS.label, weight: 700, fill: pal.ink, anchor: "end" }),
      textLines(M, bottom + 22, totalLines, 15, { size: FS.small, fill: pal.muted }),
    ),
  ];
  return frame({ ctx, height: bottom + 29 + Math.max(1, totalLines.length) * 15, children: nodes });
}
