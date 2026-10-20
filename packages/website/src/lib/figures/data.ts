/**
 * The plotted numbers of a figure as a table and as CSV: the "Daten & Grenzen"
 * disclosure shows exactly what the SVG draws. Raw numbers with a dot as the
 * decimal separator; a suppressed value is an empty cell with the flag text.
 */

import { SUPPRESSED_LABEL } from "./format.ts";
import { blocksPerBin } from "./kinds/blocks.ts";
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
    case "network": {
      const { nodes, variants } = spec.data;
      const key = (a: number, b: number): string => `${Math.min(a, b)}:${Math.max(a, b)}`;
      const rows = new Map<string, { a: number; b: number; odds: number | null }>();
      for (const v of variants) {
        for (const e of v.edges) {
          const k = key(e[0], e[1]);
          const known = rows.get(k);
          rows.set(k, { a: Math.min(e[0], e[1]), b: Math.max(e[0], e[1]), odds: known?.odds ?? e[2] ?? null });
        }
      }
      const sets = variants.map((v) => new Set(v.edges.map((e) => key(e[0], e[1]))));
      return {
        columns: ["Merkmal A", "Merkmal B", "Odds-Ratio", ...variants.map((v) => `in: ${v.label}`)],
        rows: [...rows.entries()].map(([k, r]) => [
          nodes[r.a]?.label ?? "", nodes[r.b]?.label ?? "", r.odds, ...sets.map((set) => (set.has(k) ? 1 : 0)),
        ] as Cell[]),
      };
    }
    case "blocks": {
      const { bins, variants } = spec.data;
      const perVariant = variants.map((v) => blocksPerBin(spec.data, v));
      return {
        columns: ["Behälter", ...variants.map((v) => `${v.label}: ${spec.data.unit.split("|").pop() ?? ""}`), ...variants.map((v) => `${v.label}: Blöcke`)],
        rows: bins.map((b, i) => [
          b.label, ...variants.map((v) => v.counts[b.id] ?? 0), ...perVariant.map((per) => per[i] ?? 0),
        ] as Cell[]),
      };
    }
    case "strip": {
      const rows: Cell[][] = [];
      const variants = spec.data.variants ?? [{ id: "", label: "" }];
      for (const row of spec.data.rows) {
        for (const mark of row.marks) {
          const layer = spec.data.layers.find((l) => l.id === mark.layer);
          for (const v of variants) {
            const q = (v.id ? mark.by?.[v.id] : undefined) ?? mark;
            rows.push([row.label, layer?.label ?? mark.layer, v.label || null, q.value, q.lo ?? null, q.hi ?? null, q.n ?? null, flag(q.value)]);
          }
        }
      }
      return { columns: ["Zeile", "Ebene", "Lesart", "Wert", "Untergrenze", "Obergrenze", "n", "Hinweis"], rows };
    }
    case "curve":
      return {
        columns: ["Klasse", "Wert", "Untergrenze", "Obergrenze", "n", "Hinweis"],
        rows: [
          ...spec.data.points.map((q) => [q.label, q.value, q.lo ?? null, q.hi ?? null, q.n ?? null, q.frozen ? (spec.data.frozenLabel ?? "eingefroren") : flag(q.value)] as Cell[]),
          ...(spec.data.panel ? spec.data.panel.rows.map((r) => [`${spec.data.panel?.title ?? ""}: ${r.label}`, r.value, null, null, null, ""] as Cell[]) : []),
        ],
      };
    case "slope":
      return {
        columns: ["Teilung", spec.data.aLabel, spec.data.bLabel, "Untergrenze B", "Obergrenze B"],
        rows: [
          ["alle Teilungen", spec.data.pooled.a, spec.data.pooled.b, spec.data.pooled.lo ?? null, spec.data.pooled.hi ?? null] as Cell[],
          ...spec.data.splits.map((s) => [s.label, s.top.a, s.top.b, s.top.lo ?? null, s.top.hi ?? null] as Cell[]),
        ],
      };
    case "nulldist":
      return {
        columns: ["Teil", "Bezeichnung", "von", "bis", "Wert"],
        rows: [
          ...spec.data.variants.flatMap((v) => v.bins.map((b) => ["Ziehungen", v.label, b.lo, b.hi, b.draws] as Cell[])),
          ...spec.data.variants.map((v) => ["Zufallsband", v.label, v.band.lo, v.band.hi, null] as Cell[]),
          ["Beobachtet", spec.data.observed.label, spec.data.observed.lo ?? null, spec.data.observed.hi ?? null, spec.data.observed.value] as Cell[],
          ...spec.data.words.map((w) => ["Verhältnis", w.label, w.lo ?? null, w.hi ?? null, w.ratio] as Cell[]),
        ],
      };
    case "field": {
      const rows: Cell[][] = [];
      const label = new Map(spec.data.classes.map((c) => [c.id, c.label]));
      for (const scene of spec.data.scenes) {
        for (const bin of scene.bins) {
          for (const seg of bin.segments) {
            rows.push([scene.id, bin.label ?? bin.id, label.get(seg.cls) ?? seg.cls, seg.count, scene.base]);
          }
        }
      }
      return { columns: ["Szene", "Bereich", "Klasse", "Anzahl", "von"], rows };
    }
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
