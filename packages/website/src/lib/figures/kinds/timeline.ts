/** Timeline (C12): dated events on a vertical rail in date order, with a marker for today. Not to scale. */

import { formatDateDe } from "../format.ts";
import { segment } from "../timing.ts";
import {
  FS, dim, el, frame, op, text, textLines, translate, wrapText,
  type Ctx, type SvgNode,
} from "../svg.ts";
import { reveal } from "../timing.ts";
import type { TimelineData, TimelineEvent } from "../types.ts";
import type { ReactElement } from "react";

const M = 16;
const RAIL = 28;
const TEXT_X = 52;

const STATUS_WORD: Record<TimelineEvent["status"], string> = {
  gilt: "gilt",
  kommt: "kommt",
  offen: "offen",
};

export function renderTimeline(ctx: Ctx<TimelineData>): ReactElement {
  const { data, width, pal, spec, p } = ctx;
  const events = [...data.events].sort((a, b) => a.date.localeCompare(b.date));
  const today = spec.asOf;
  const textW = width - TEXT_X - M;
  const nodes: SvgNode[] = [];

  type Row =
    | { type: "event"; event: TimelineEvent; index: number }
    | { type: "today" };
  const rows: Row[] = [];
  let todayPlaced = false;
  events.forEach((event, index) => {
    if (!todayPlaced && event.date > today) {
      rows.push({ type: "today" });
      todayPlaced = true;
    }
    rows.push({ type: "event", event, index });
  });
  if (!todayPlaced) rows.push({ type: "today" });

  let y = 14;
  const railTop = y;
  const placed: SvgNode[] = [];
  rows.forEach((row) => {
    if (row.type === "today") {
      const f = segment(p, 0.05, 0.3);
      placed.push(
        el("g", { key: "today", opacity: op(f) },
          el("line", { x1: RAIL - 12, y1: y + 10, x2: width - M, y2: y + 10, stroke: pal.accent, strokeWidth: 2 }),
          text(TEXT_X, y + 30, `Stand ${formatDateDe(today)}`, { size: FS.small, weight: 700, fill: pal.accent }),
        ),
      );
      y += 44;
      return;
    }
    const { event, index } = row;
    const f = reveal(spec, p, event.id, index, events.length);
    const labelLines = wrapText(event.label, textW, FS.value, 3, 600);
    const detailLines = event.detail ? wrapText(event.detail, textW, FS.label, 4) : [];
    const meta = `${event.tag ? `${event.tag} · ` : ""}${formatDateDe(event.date)} · ${STATUS_WORD[event.status]}`;
    const h = 20 + labelLines.length * 18 + detailLines.length * 17 + 18;
    const my = y + 10;
    const marker =
      event.status === "gilt"
        ? el("circle", { cx: RAIL, cy: my, r: 8, fill: pal.ink })
        : event.status === "kommt"
          ? el("circle", { cx: RAIL, cy: my, r: 7, fill: pal.card, stroke: pal.ink, strokeWidth: 2.5 })
          : el("path", { d: `M${RAIL} ${my - 9} L${RAIL + 9} ${my} L${RAIL} ${my + 9} L${RAIL - 9} ${my} Z`, fill: pal.card, stroke: pal.accent, strokeWidth: 2.5 });
    placed.push(
      el("g", { key: event.id, "data-id": event.id, opacity: op(dim(ctx, event.id) * f), transform: translate(0, (1 - f) * 8) },
        marker,
        text(TEXT_X, y + 14, meta, { size: FS.small, weight: 700, fill: event.status === "offen" ? pal.accent : pal.muted }),
        textLines(TEXT_X, y + 34, labelLines, 18, { size: FS.value, weight: 600, fill: pal.ink }),
        detailLines.length > 0
          ? textLines(TEXT_X, y + 34 + labelLines.length * 18 + 2, detailLines, 17, { size: FS.label, fill: pal.muted })
          : null,
      ),
    );
    y += h;
  });
  const railBottom = y - 6;
  const scaleNote = wrapText("Abstände nicht maßstäblich; die Reihenfolge stimmt.", width - M * 2, FS.small, 2);
  const draw = segment(p, 0, 0.5);
  nodes.push(
    el("line", {
      x1: RAIL, y1: railTop, x2: RAIL, y2: railBottom, stroke: pal.edge, strokeWidth: 2,
      pathLength: draw < 1 ? 1 : undefined,
      strokeDasharray: draw < 1 ? 1 : undefined,
      strokeDashoffset: draw < 1 ? 1 - draw : undefined,
    }),
    ...placed,
    textLines(M, railBottom + 22, scaleNote, 16, { size: FS.small, fill: pal.mutedLight, opacity: op(segment(p, 0.8, 1)) }),
  );
  return frame({ ctx, height: railBottom + 22 + scaleNote.length * 16 + 4, children: nodes });
}
