/**
 * What a hero figure offers the reader to hold and to point at, as pure data:
 * the detents of its control, the sentence an aria-live region reads after a
 * change, and the things a reader can pin. Every number in a sentence comes
 * from the spec; nothing is computed that the chart does not draw.
 */

import { langOf, strings, tr, type Lang } from "./i18n.ts";
import { blocksPerBin } from "./kinds/blocks.ts";
import { formatDecimal, formatInterval, formatValue } from "./format.ts";
import { stripValue } from "./kinds/strip.ts";
import type { FieldScene, FigureSpec, NumFmt } from "./types.ts";

export interface Detent {
  readonly id: string;
  readonly label: string;
}

/** How the control for the variants looks: a segmented choice, a range with real detents, or one button that cycles. */
export type ControlKind = "none" | "segmented" | "range" | "cycle";

/** The detents of a spec in order; empty when the figure has no control. */
export function detentsOf(spec: FigureSpec): readonly Detent[] {
  switch (spec.kind) {
    case "network":
    case "blocks":
    case "nulldist":
      return spec.data.variants.map((v) => ({ id: v.id, label: tr(langOf(spec), v.label) }));
    case "strip":
      return (spec.data.variants ?? []).map((v) => ({ id: v.id, label: v.label }));
    case "curve":
      return spec.data.points.map((q) => ({ id: q.id, label: q.label }));
    case "slope":
      return spec.data.splits.map((s) => ({ id: s.id, label: tr(langOf(spec), s.label) }));
    default:
      return [];
  }
}

/** The detent a figure shows until the reader moves the control. */
export function defaultDetentOf(spec: FigureSpec): string | undefined {
  const list = detentsOf(spec);
  if (list.length === 0) return undefined;
  const wanted =
    spec.kind === "network" || spec.kind === "blocks" || spec.kind === "strip" || spec.kind === "curve" || spec.kind === "slope" || spec.kind === "nulldist"
      ? spec.data.defaultVariant
      : undefined;
  if (wanted !== undefined && list.some((d) => d.id === wanted)) return wanted;
  // Network and curve finish on their last detent, the others on the first.
  return spec.kind === "network" || spec.kind === "curve" ? list[list.length - 1]?.id : list[0]?.id;
}

export function controlKindOf(spec: FigureSpec): ControlKind {
  const n = detentsOf(spec).length;
  if (n < 2) return "none";
  if (spec.kind === "slope") return "cycle";
  return n <= 3 ? "segmented" : "range";
}

/** Question the control answers, as its accessible name. */
export function controlLabelOf(spec: FigureSpec): string {
  const T = strings(langOf(spec));
  switch (spec.kind) {
    case "network": return T.textAmount;
    case "blocks": return T.sameJob;
    case "strip": return T.base;
    case "curve": return T.latest;
    case "slope": return T.newSplit;
    case "nulldist": return T.howMany;
    default: return T.reading;
  }
}

const withUnit = (fmt: NumFmt, v: number, lang: Lang = "de"): string => formatValue(fmt, v, false, lang);

/** The sentence a screen reader hears when the control lands on a detent. */
export function readoutOf(spec: FigureSpec, variant?: string): string {
  const id = variant ?? defaultDetentOf(spec);
  const L = langOf(spec);
  const T = strings(L);
  const fd = (v: number, d: number): string => formatDecimal(v, d, false, L);
  const fi = (fmt: NumFmt, lo: number, hi: number): string => formatInterval(fmt, lo, hi, L);
  const wu = (fmt: NumFmt, v: number): string => withUnit(fmt, v, L);
  switch (spec.kind) {
    case "network": {
      const v = spec.data.variants.find((q) => q.id === id) ?? spec.data.variants[spec.data.variants.length - 1];
      if (!v) return "";
      const raw = spec.data.variants.find((q) => q.id === spec.data.baseline) ?? spec.data.variants[0];
      const word = tr(L, spec.data.edgeWord ?? "Verbindungen");
      const share = v.share !== undefined ? ` (${fd(v.share, 0)} % ${T.pairs})` : "";
      return v.id === raw?.id
        ? `${tr(L, v.label)}: ${fd(v.edges.length, 0)} ${word}${share}.`
        : `${tr(L, v.label)}: ${fd(v.edges.length, 0)} ${word}${share}, ${tr(L, raw?.label ?? (L === "en" ? "raw" : "roh"))} ${fd(raw?.edges.length ?? 0, 0)}.`;
    }
    case "blocks": {
      const v = spec.data.variants.find((q) => q.id === id) ?? spec.data.variants[0];
      if (!v) return "";
      const per = blocksPerBin(spec.data, v);
      const at = Math.max(0, spec.data.bins.findIndex((b) => b.id === spec.data.finding));
      const bin = spec.data.bins[at];
      return T.blocksIn(tr(L, v.label), fd(per[at] ?? 0, 0), fd(spec.data.blocks, 0), tr(L, bin?.label ?? ""), fd(v.counts[spec.data.finding] ?? 0, 0), fd(spec.data.total, 0));
    }
    case "strip": {
      const v = (spec.data.variants ?? []).find((q) => q.id === id);
      const first = spec.data.rows[0];
      const layer = spec.data.finding ? first?.marks.find((m) => m.layer === spec.data.finding) : first?.marks[0];
      if (!first || !layer) return "";
      const q = stripValue(layer, v?.id);
      const name = spec.data.layers.find((l) => l.id === layer.layer)?.label ?? "";
      return `${v ? `${v.label}: ` : ""}${first.label}, ${name}: ${q.value === null ? T.fewerThan5 : wu(spec.data.fmt, q.value)}${q.lo !== undefined && q.hi !== undefined ? ` (${T.interval95} ${fi(spec.data.fmt, q.lo, q.hi)})` : ""}.`;
    }
    case "curve": {
      const q = spec.data.points.find((p) => p.id === id) ?? spec.data.points[spec.data.points.length - 1];
      if (!q || q.value === null) return "";
      return `${q.label}: ${wu(spec.data.fmt, q.value)}${q.lo !== undefined && q.hi !== undefined ? ` (${T.interval95} ${fi(spec.data.fmt, q.lo, q.hi)})` : ""}${q.frozen && spec.data.frozenLabel ? `, ${spec.data.frozenLabel}` : ""}.`;
    }
    case "slope": {
      const s = spec.data.splits.find((q) => q.id === id) ?? spec.data.splits[0];
      if (!s) return "";
      const f = (v: number): string => `${fd(v, spec.data.fmt.digits ?? 2)}${spec.data.fmt.unit ?? ""}`;
      return `${tr(L, s.label)}: ${T.spike} ${f(s.top.a)}, ${tr(L, spec.data.bLabel)} ${f(s.top.b)}${s.top.lo !== undefined && s.top.hi !== undefined ? ` (${T.interval95} ${fd(s.top.lo, 2)} ${T.to} ${fd(s.top.hi, 2)})` : ""}.`;
    }
    case "nulldist": {
      const v = spec.data.variants.find((q) => q.id === id) ?? spec.data.variants[0];
      if (!v) return "";
      return `${tr(L, v.label)}: ${L === "en" ? "chance band" : "Zufallsband"} ${fi(spec.data.fmt, v.band.lo, v.band.hi)}, ${L === "en" ? "observed" : "beobachtet"} ${wu(spec.data.fmt, spec.data.observed.value)}.`;
    }
    case "field": {
      const scene = spec.data.scenes[spec.data.scenes.length - 1];
      return scene?.claim ?? "";
    }
    default:
      return "";
  }
}

export interface PinItem {
  /** The data-id of the element in the SVG. */
  readonly id: string;
  readonly label: string;
  readonly detail: string;
}

/** The things a reader can pin in an SVG hero figure. Slope has none (its lines are opaque ranks). */
export function pinItemsOf(spec: FigureSpec, variant?: string): readonly PinItem[] {
  switch (spec.kind) {
    case "network": {
      const nb = new Map((spec.data.neighbours ?? []).map((q) => [q.node, q]));
      return spec.data.nodes.map((n) => {
        const q = nb.get(n.id);
        return {
          id: n.id,
          label: q ? `${n.label}: Chancenverhältnis ${formatDecimal(q.odds, 1)}` : n.label,
          detail: q
            ? `${n.label}: Chancenverhältnis zum Wort ${formatDecimal(q.odds, 1)} (95 %-Intervall ${formatDecimal(q.lo, 1)} bis ${formatDecimal(q.hi, 1)}).`
            : `${n.label}.`,
        };
      });
    }
    case "blocks": {
      const v = spec.data.variants.find((q) => q.id === (variant ?? defaultDetentOf(spec))) ?? spec.data.variants[0];
      return spec.data.bins.map((b) => ({
        id: b.id,
        label: `${b.label}: ${formatDecimal(v?.counts[b.id] ?? 0, 0)}`,
        detail: `${b.label}: ${formatDecimal(v?.counts[b.id] ?? 0, 0)} von ${formatDecimal(spec.data.total, 0)}.`,
      }));
    }
    case "strip": {
      const out: PinItem[] = [];
      for (const row of spec.data.rows) {
        for (const mark of row.marks) {
          const q = stripValue(mark, variant ?? defaultDetentOf(spec));
          const layer = spec.data.layers.find((l) => l.id === mark.layer)?.label ?? mark.layer;
          const value = q.value === null ? "weniger als 5" : withUnit(spec.data.fmt, q.value);
          out.push({
            id: `${row.id}:${mark.layer}`,
            label: `${row.label}, ${layer}: ${value}`,
            detail: `${row.label}, ${layer}: ${value}${q.n !== undefined ? `, n = ${formatDecimal(q.n, 0)}` : ""}${q.lo !== undefined && q.hi !== undefined ? ` (95 %-Intervall ${formatInterval(spec.data.fmt, q.lo, q.hi)})` : ""}.`,
          });
        }
      }
      return out;
    }
    case "curve":
      return spec.data.points
        .filter((q) => q.value !== null)
        .map((q) => ({
          id: q.id,
          label: `${q.label}: ${withUnit(spec.data.fmt, q.value as number)}`,
          detail: `${q.label}: ${withUnit(spec.data.fmt, q.value as number)}${q.n !== undefined ? `, n = ${formatDecimal(q.n, 0)}` : ""}${q.lo !== undefined && q.hi !== undefined ? ` (95 %-Intervall ${formatInterval(spec.data.fmt, q.lo, q.hi)})` : ""}.`,
        }));
    case "nulldist":
      return [
        { id: "observed", label: `${spec.data.observed.label}: ${withUnit(spec.data.fmt, spec.data.observed.value)}`, detail: `${spec.data.observed.label}: ${withUnit(spec.data.fmt, spec.data.observed.value)}.` },
        ...spec.data.words.map((w) => ({
          id: w.id,
          label: `${w.label}: ${formatDecimal(w.ratio, 1)}`,
          detail: `${w.label}: beobachtet durch erwartet ${formatDecimal(w.ratio, 1)}${w.lo !== undefined && w.hi !== undefined ? ` (95 %-Intervall ${formatDecimal(w.lo, 1)} bis ${formatDecimal(w.hi, 1)})` : ""}.`,
        })),
      ];
    default:
      return [];
  }
}

/** Direct labels of a field scene: the classes a reader can point at, with their exact counts. */
export function fieldClassItems(spec: FigureSpec, sceneIndex: number): readonly PinItem[] {
  if (spec.kind !== "field") return [];
  const scene: FieldScene | undefined = spec.data.scenes[Math.max(0, Math.min(spec.data.scenes.length - 1, sceneIndex))];
  if (!scene) return [];
  const counts = new Map<string, number>();
  for (const bin of scene.bins) for (const seg of bin.segments) counts.set(seg.cls, (counts.get(seg.cls) ?? 0) + seg.count);
  const ids = scene.labelClasses ?? [];
  return ids.map((cls) => {
    const c = spec.data.classes.find((q) => q.id === cls);
    const n = counts.get(cls) ?? 0;
    return {
      id: cls,
      label: `${c?.label ?? cls}: ${formatDecimal(n, 0)}`,
      detail: `${c?.label ?? cls}: ${formatDecimal(n, 0)} von ${formatDecimal(scene.base, 0)}.`,
    };
  });
}

/** The sentence for any class of a field scene (not only the ones with a direct label), or "" when the scene has none of it. */
export function fieldClassDetail(spec: FigureSpec, sceneIndex: number, classId: string): string {
  if (spec.kind !== "field") return "";
  const scene = spec.data.scenes[Math.max(0, Math.min(spec.data.scenes.length - 1, sceneIndex))];
  const klass = spec.data.classes.find((c) => c.id === classId);
  if (!scene || !klass) return "";
  let n = 0;
  for (const bin of scene.bins) for (const seg of bin.segments) if (seg.cls === classId) n += seg.count;
  return n > 0 ? `${klass.label}: ${formatDecimal(n, 0)} von ${formatDecimal(scene.base, 0)}.` : "";
}
