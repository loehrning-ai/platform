/** Range ladder (C1): published surveys on one axis with wording beside every dot; our own measure on a separate axis. */

import { formatBare, formatInterval, formatValue } from "../format.ts";
import { niceTicks, scaleLinear } from "../math.ts";
import {
  FS, dim, el, frame, isEmphasised, op, text, textLines, translate, wrapText,
  type Ctx, type SvgNode,
} from "../svg.ts";
import { frameReveal, reveal } from "../timing.ts";
import type { LadderData } from "../types.ts";
import type { ReactElement } from "react";

const M = 16;

/** Text of a dimmed rung stays at 0.92: the accent label on the inset panel and the muted grey both keep 4.5:1. */
const textOpacity = (markDim: number): number => (markDim < 1 ? 0.92 : 1);

export function renderLadder(ctx: Ctx<LadderData>): ReactElement {
  const { data, width, pal, spec, p } = ctx;
  const top = Math.max(100, ...data.rungs.map((r) => r.value), 0);
  const axisMax = data.axisMax ?? niceTicks(0, top, 4).slice(-1)[0] ?? 100;
  const ticks = niceTicks(0, axisMax, 4);
  const trackX = M + 6;
  const trackW = width - M * 2 - 12;
  const sx = scaleLinear([0, axisMax], [trackX, trackX + trackW]);
  const o = op(frameReveal(p));
  const nodes: SvgNode[] = [];
  let y = 6;

  const tickRow = (axisTicks: readonly number[], scale: (v: number) => number, yy: number, keyPrefix: string) => {
    axisTicks.forEach((t, i) => {
      nodes.push(
        el("line", { key: `${keyPrefix}${t}`, x1: scale(t), y1: yy - 5, x2: scale(t), y2: yy + 5, stroke: pal.edge, strokeWidth: 1, opacity: o }),
        text(scale(t), yy + 20, i === axisTicks.length - 1 ? formatValue(data.fmt, t) : formatBare(data.fmt, t), { size: FS.small, fill: pal.mutedLight, anchor: i === axisTicks.length - 1 ? "end" : "middle", opacity: o }),
      );
    });
  };

  data.rungs.forEach((r, i) => {
    const f = reveal(spec, p, r.id, i, data.rungs.length);
    const emphasis = isEmphasised(ctx, r.id);
    const defLines = wrapText(r.definition, width - M * 2, FS.small, 3);
    const head = y + 16;
    const trackY = y + 38;
    const dotX = sx(r.value);
    const slide = (1 - f) * (trackX - dotX);
    // A published 54,5 must not read "55": a rung with a fractional value keeps one decimal.
    const valueStr = formatValue(Number.isInteger(r.value) ? data.fmt : { ...data.fmt, digits: Math.max(data.fmt.digits ?? 0, 1) }, r.value);
    // Only the marks dim for an unselected rung; the words keep their contrast (text at 0.4 was unreadable on a phone).
    const markDim = dim(ctx, r.id);
    const textF = f * textOpacity(markDim);
    nodes.push(
      el("g", { key: r.id, "data-id": r.id },
        text(M, head, r.year ? `${r.label} (${r.year})` : r.label, { size: FS.value, weight: emphasis ? 700 : 600, fill: pal.ink, opacity: op(textF) }),
        text(width - M, head, valueStr, { size: FS.strong, weight: 700, fill: pal.ink, anchor: "end", opacity: op(textF) }),
        el("line", { x1: trackX, y1: trackY, x2: trackX + trackW, y2: trackY, stroke: pal.track, strokeWidth: 4, strokeLinecap: "butt", opacity: op(markDim * (o ?? 1)) }),
        r.from !== undefined
          ? el("g", { opacity: op(f * markDim) },
              el("line", { x1: sx(r.from), y1: trackY, x2: dotX, y2: trackY, stroke: pal.edge, strokeWidth: 2 }),
              el("circle", { cx: sx(r.from), cy: trackY, r: 6, fill: pal.card, stroke: pal.ink, strokeWidth: 2 }))
          : null,
        el("circle", { cx: dotX, cy: trackY, r: emphasis ? 9 : 7.5, fill: pal.accent, stroke: pal.card, strokeWidth: 1.5, transform: translate(slide, 0), opacity: op(Math.min(1, f * 2) * markDim) }),
        textLines(M, trackY + 26, defLines, 15, { size: FS.small, fill: pal.muted, opacity: op(textF) }),
      ),
    );
    y = trackY + 26 + (defLines.length - 1) * 15 + 22;
  });
  tickRow(ticks, sx, y, "t");
  y += 36;

  const ours = data.ours;
  if (ours) {
    const fmt = ours.fmt ?? data.fmt;
    const oursTicks = niceTicks(0, ours.axisMax, 4);
    const sOurs = scaleLinear([0, ours.axisMax], [trackX, trackX + trackW]);
    const f = reveal(spec, p, ours.id, data.rungs.length, data.rungs.length + 1);
    const noteLines = wrapText(ours.note, width - M * 2, FS.small, 3);
    const oursDim = dim(ctx, ours.id);
    const oursText = f * textOpacity(oursDim);
    const blockTop = y;
    const tag = y + 22;
    const head = tag + 20;
    const interval = head + 20;
    const trackY = interval + 26;
    const cx = sOurs(ours.value);
    const noteY = trackY + 48;
    const blockH = noteY + noteLines.length * 15 - blockTop + 8;
    nodes.push(
      el("g", { key: ours.id, "data-id": ours.id },
        el("rect", { x: 0, y: blockTop, width, height: blockH, fill: pal.inset, opacity: op(f) }),
        text(M, tag, "Anderes Maß, eigene Achse", { size: FS.small, weight: 700, fill: pal.accent, opacity: op(oursText) }),
        text(M, head, ours.label, { size: FS.value, weight: 600, fill: pal.ink, opacity: op(oursText) }),
        text(width - M, head, formatValue(fmt, ours.value), { size: FS.strong, weight: 700, fill: pal.ink, anchor: "end", opacity: op(oursText) }),
        text(width - M, interval, `Intervall ${formatInterval(fmt, ours.lo, ours.hi)}`, { size: FS.small, fill: pal.muted, anchor: "end", opacity: op(oursText) }),
        el("line", { x1: trackX, y1: trackY, x2: trackX + trackW, y2: trackY, stroke: pal.edge, strokeWidth: 4, opacity: op(f * oursDim) }),
        el("line", { x1: sOurs(ours.lo), y1: trackY, x2: sOurs(ours.hi), y2: trackY, stroke: pal.ink, strokeWidth: 2, opacity: op(f * oursDim) }),
        el("rect", { x: cx - 7, y: trackY - 7, width: 14, height: 14, fill: pal.ink, stroke: pal.card, strokeWidth: 1.5, opacity: op(f * oursDim) }),
        ...oursTicks.flatMap((t, i): SvgNode[] => [
          el("line", { key: `o${t}`, x1: sOurs(t), y1: trackY - 5, x2: sOurs(t), y2: trackY + 5, stroke: pal.edge, strokeWidth: 1, opacity: op(f) }),
          text(sOurs(t), trackY + 20, i === oursTicks.length - 1 ? formatValue({ ...fmt, digits: 0 }, t) : formatBare({ ...fmt, digits: 0 }, t), { size: FS.small, fill: pal.mutedLight, anchor: i === oursTicks.length - 1 ? "end" : "middle", opacity: op(f) }),
        ]),
        textLines(M, noteY, noteLines, 15, { size: FS.small, fill: pal.muted, opacity: op(oursText) }),
      ),
    );
    y = blockTop + blockH;
  }
  return frame({ ctx, height: y + 8, children: nodes });
}
