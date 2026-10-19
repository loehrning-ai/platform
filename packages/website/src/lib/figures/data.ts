/**
 * The plotted numbers of a figure as a table and as CSV: the "Daten & Grenzen"
 * disclosure shows exactly what the SVG draws. Raw numbers with a dot as the
 * decimal separator; a suppressed value is an empty cell with the flag text.
 */

import { SUPPRESSED_LABEL } from "./format.ts";
import { waterfallBars } from "./kinds/waterfall.ts";
import type { FigureSpec } from "./types.ts";

export type Cell = string | number | null;

export interface FigureTable {
  readonly columns: readonly string[];
  readonly rows: readonly (readonly Cell[])[];
}

const flag = (v: number | null | undefined): string =>
  v === null ? SUPPRESSED_LABEL : "";

export function figureTable(spec: FigureSpec): FigureTable {
  switch (spec.kind) {
    case "waffle": {
      const sum = spec.data.groups.reduce((s, g) => s + g.dots, 0);
      return {
        columns: ["Gruppe", "Punkte", "von"],
        rows: [
          ...spec.data.groups.map((g) => [g.label, g.dots, spec.data.total] as Cell[]),
          ...(sum < spec.data.total
            ? [[spec.data.restLabel ?? "übrige", spec.data.total - sum, spec.data.total] as Cell[]]
            : []),
        ],
      };
    }
    case "bars":
      return {
        columns: ["Gruppe", "Wert", "Untergrenze", "Obergrenze", "n", "Hinweis"],
        rows: spec.data.items.map((i) => [i.label, i.value, i.lo ?? null, i.hi ?? null, i.n ?? null, flag(i.value)]),
      };
    case "dotplot":
      return {
        columns: ["Gruppe", "Wert", "Untergrenze", "Obergrenze", "n", "Hinweis"],
        rows: spec.data.items.map((i) => [i.label, i.value, i.lo ?? null, i.hi ?? null, i.n ?? null, flag(i.value)]),
      };
    case "tilemap":
      return {
        columns: ["Land", "Wert", "Untergrenze", "Obergrenze", "n", "Hinweis"],
        rows: spec.data.tiles.map((t) => [t.id, t.value, t.lo ?? null, t.hi ?? null, t.n ?? null, flag(t.value)]),
      };
    case "funnel":
      return {
        columns: ["Einheit", "n", "Wert"],
        rows: spec.data.points.map((pt) => [pt.label ?? pt.id, pt.n, pt.value]),
      };
    case "dumbbell":
      return {
        columns: ["Zeile", spec.data.aLabel, spec.data.bLabel, "Hinweis"],
        rows: spec.data.rows.map((r) => [r.label, r.a, r.b, r.a === null || r.b === null ? SUPPRESSED_LABEL : ""]),
      };
    case "lorenz":
      return {
        columns: [spec.data.xLabel, spec.data.yLabel],
        rows: spec.data.points.map(([x, y]) => [x, y]),
      };
    case "waterfall": {
      const { bars } = waterfallBars(spec.data);
      return {
        columns: ["Schritt", "Art", "Wert", "Stand danach", "n"],
        rows: bars.map((b, i) => [
          b.label,
          b.kind === "total" ? "Messwert" : "Veränderung",
          b.value,
          Math.round(b.v1 * 1e6) / 1e6,
          spec.data.items[i]?.n ?? null,
        ]),
      };
    }
    case "ladder":
      return {
        columns: ["Quelle", "Jahr", "Wert", "früherer Wert", "Wortlaut"],
        rows: [
          ...spec.data.rungs.map((r) => [r.label, r.year ?? null, r.value, r.from ?? null, r.definition] as Cell[]),
          ...(spec.data.ours
            ? [[spec.data.ours.label, null, spec.data.ours.value, null, spec.data.ours.note] as Cell[]]
            : []),
        ],
      };
    case "timeline":
      return {
        columns: ["Datum", "Ereignis", "Status", "Bereich"],
        rows: [...spec.data.events]
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((e) => [e.date, e.label, e.status, e.tag ?? null]),
      };
    case "iceberg":
      return {
        columns: ["Maß", "Wert"],
        rows: [
          [spec.data.visible.label, spec.data.visible.value],
          [spec.data.total.label, spec.data.total.value],
        ],
      };
  }
}

function csvCell(cell: Cell): string {
  if (cell === null) return "";
  const text = String(cell);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV with a trailing newline; header first. */
export function figureCsv(spec: FigureSpec): string {
  const { columns, rows } = figureTable(spec);
  return `${[columns, ...rows].map((r) => r.map(csvCell).join(",")).join("\n")}\n`;
}
