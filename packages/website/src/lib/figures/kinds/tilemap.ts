/** Tile map of the 16 Laender (C7): value and interval printed on every tile. */

import { formatBare, formatIntervalBare, formatValue } from "../format.ts";
import { clamp } from "../math.ts";
import { RAMP_CLASSES, rampClassColor, rampColor, readableOn } from "../palette.ts";
import {
  FS, dim, el, frame, op, scaleAbout, text, textLines, textWidth, wrapText,
  type Ctx, type SvgNode,
} from "../svg.ts";
import { reveal } from "../timing.ts";
import type { TilemapData, TileItem } from "../types.ts";
import type { ReactElement } from "react";

export interface TilePlace {
  readonly id: string;
  readonly name: string;
  readonly col: number;
  readonly row: number;
  readonly region: "ost" | "west" | "berlin";
}

/** Germany-shaped 4 x 4 grid: north on top, west left, south bottom. */
export const TILE_LAYOUT: readonly TilePlace[] = [
  { id: "SH", name: "Schleswig-Holstein", col: 0, row: 0, region: "west" },
  { id: "HH", name: "Hamburg", col: 1, row: 0, region: "west" },
  { id: "MV", name: "Mecklenburg-Vorpommern", col: 2, row: 0, region: "ost" },
  { id: "BE", name: "Berlin", col: 3, row: 0, region: "berlin" },
  { id: "NI", name: "Niedersachsen", col: 0, row: 1, region: "west" },
  { id: "HB", name: "Bremen", col: 1, row: 1, region: "west" },
  { id: "ST", name: "Sachsen-Anhalt", col: 2, row: 1, region: "ost" },
  { id: "BB", name: "Brandenburg", col: 3, row: 1, region: "ost" },
  { id: "NW", name: "Nordrhein-Westfalen", col: 0, row: 2, region: "west" },
  { id: "HE", name: "Hessen", col: 1, row: 2, region: "west" },
  { id: "TH", name: "Thüringen", col: 2, row: 2, region: "ost" },
  { id: "SN", name: "Sachsen", col: 3, row: 2, region: "ost" },
  { id: "SL", name: "Saarland", col: 0, row: 3, region: "west" },
  { id: "RP", name: "Rheinland-Pfalz", col: 1, row: 3, region: "west" },
  { id: "BW", name: "Baden-Württemberg", col: 2, row: 3, region: "west" },
  { id: "BY", name: "Bayern", col: 3, row: 3, region: "west" },
];

const M = 16;
const GAP = 6;

export function renderTilemap(ctx: Ctx<TilemapData>): ReactElement {
  const { data, width, pal, spec, p } = ctx;
  const byId = new Map<string, TileItem>(data.tiles.map((t) => [t.id, t]));
  const tile = Math.min(112, (width - M * 2 - GAP * 3) / 4);
  const tileH = tile * 0.94;
  const gridW = tile * 4 + GAP * 3;
  const x0 = (width - gridW) / 2;
  const y0 = 8;
  const maxValue = data.max ?? Math.max(1e-9, ...data.tiles.map((t) => t.value ?? 0));
  const nodes: SvgNode[] = [];

  TILE_LAYOUT.forEach((place, i) => {
    const item = byId.get(place.id);
    const value = item?.value ?? null;
    const suppressed = item === undefined || value === null;
    const f = reveal(spec, p, place.id, i, TILE_LAYOUT.length);
    const x = x0 + place.col * (tile + GAP);
    const y = y0 + place.row * (tileH + GAP);
    const fill = suppressed ? null : rampClassColor(pal, clamp(value / maxValue));
    const ink = fill ? readableOn(fill, pal) : pal.ink;
    const emphasised = data.emphasis !== undefined && place.region === data.emphasis;
    const pinned = ctx.opts.highlight === place.id;
    const cx = x + tile / 2;
    const interval =
      item?.lo !== undefined && item.hi !== undefined
        ? formatIntervalBare(data.fmt, item.lo, item.hi)
        : "";
    const showInterval = interval !== "" && textWidth(interval, FS.small) <= tile - 8;
    nodes.push(
      el("g", { key: place.id, "data-id": place.id, opacity: op(dim(ctx, place.id) * f), transform: scaleAbout(0.88 + 0.12 * f, 0.88 + 0.12 * f, cx, y + tileH / 2) },
        el("title", {}, `${place.name}: ${formatValue(data.fmt, value)}${item?.lo !== undefined && item.hi !== undefined ? `, Intervall ${interval}` : ""}`),
        el("rect", {
          x, y, width: tile, height: tileH,
          fill: fill ?? `url(#${ctx.hatchId})`,
          stroke: pinned ? pal.ink : emphasised ? pal.ink : pal.edge,
          strokeWidth: pinned ? 3 : emphasised ? 2 : 1,
        }),
        text(x + 8, y + 18, place.id, { size: FS.label, weight: 700, fill: suppressed ? pal.ink : ink }),
        suppressed
          ? text(cx, y + tileH / 2 + 8, "weniger", { size: FS.small, fill: pal.ink, anchor: "middle", weight: 600 })
          : text(cx, y + tileH / 2 + 8, formatBare(data.fmt, value), { size: FS.strong, weight: 700, fill: ink, anchor: "middle" }),
        suppressed
          ? text(cx, y + tileH / 2 + 24, "als 5", { size: FS.small, fill: pal.ink, anchor: "middle", weight: 600 })
          : showInterval
            ? text(cx, y + tileH - 10, interval, { size: FS.small, fill: ink, anchor: "middle" })
            : null,
      ),
    );
  });

  const gridBottom = y0 + 4 * tileH + 3 * GAP;
  const noteLines = wrapText("Klassen nach Anteil; der Wert steht auf jeder Kachel", width - M * 2, FS.small, 2);
  const legendY = gridBottom + 12 + noteLines.length * 16;
  const classes = RAMP_CLASSES.length;
  const sw = Math.min(52, (gridW - 8) / classes);
  const legendX = x0;
  const lo = op(Math.min(1, p * 3));
  const legendNodes: SvgNode[] = [
    textLines(M, legendY - 8 - (noteLines.length - 1) * 16, noteLines, 16, { size: FS.small, fill: pal.muted, opacity: lo }),
  ];
  RAMP_CLASSES.forEach((t, s) => {
    legendNodes.push(
      el("rect", { key: `c${s}`, x: legendX + s * sw, y: legendY, width: sw, height: 12, fill: rampColor(pal, t), stroke: pal.edge, strokeWidth: 1, opacity: lo }),
      text(legendX + s * sw + 2, legendY + 28, `ab ${formatBare(data.fmt, (s / classes) * maxValue)}`, { size: FS.small, fill: pal.mutedLight, opacity: lo }),
    );
  });
  let rowY = legendY + 52;
  legendNodes.push(
    el("rect", { x: legendX, y: rowY - 11, width: sw, height: 12, fill: `url(#${ctx.hatchId})`, stroke: pal.edge, strokeWidth: 1, opacity: lo }),
    text(legendX + sw + 8, rowY, "weniger als 5", { size: FS.small, fill: pal.muted, opacity: lo }),
  );
  if (data.emphasis) {
    rowY += 22;
    legendNodes.push(
      el("rect", { x: legendX, y: rowY - 11, width: 16, height: 12, fill: "none", stroke: pal.ink, strokeWidth: 2, opacity: lo }),
      text(legendX + 24, rowY, `dicke Linie: ${data.emphasis === "ost" ? "ostdeutsche" : "westdeutsche"} Länder`, { size: FS.small, fill: pal.muted, opacity: lo }),
    );
  }
  const height = rowY;
  return frame({ ctx, height: height + 8, children: [...nodes, ...legendNodes] });
}
