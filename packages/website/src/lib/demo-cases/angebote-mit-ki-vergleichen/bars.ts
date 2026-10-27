/**
 * The Rangliste's bars as data: one row per offer, its positive cost lines as segments in the model's
 * line order, the discount as the cut-out at the bar's end, the paper surcharge split off the goods
 * line (with the part a cap removes as a ghost), and every missing line as an open segment. Pure, so
 * the widths the stage draws are the engine's numbers and nothing else.
 */
import type { StackModel } from "./stack";

export type SegmentKind = "Ware" | "Fracht" | "Lager" | "Einmalig" | "Papier" | "Ghost" | "Other" | "Open";

export interface Segment {
  readonly line: string;
  readonly kind: SegmentKind;
  readonly cents: number;
}

export interface BarRow {
  readonly option: string;
  readonly segments: readonly Segment[];
  /** The discount as a positive amount, drawn as a notch cut from the bar's end. */
  readonly discount: number;
  /** Length of the bar before the notch. */
  readonly gross: number;
  readonly total: number;
  readonly open: boolean;
}

const KNOWN = new Set<SegmentKind>(["Ware", "Fracht", "Lager", "Einmalig"]);

export interface Surcharge {
  /** The offer the paper clause is in. */
  readonly option: string;
  /** The surcharge without the cap, in cents (for the ghost). */
  readonly uncapped: number;
}

export function barRows(model: StackModel, surcharge: Surcharge | null = null): readonly BarRow[] {
  return model.options.map((option) => {
    const segments: Segment[] = [];
    let discount = 0;
    for (const line of model.lines) {
      if (option.missing.includes(line)) {
        segments.push({ line, kind: "Open", cents: 0 });
        continue;
      }
      const value = option.lines[line] ?? 0;
      if (value < 0) {
        discount += -value;
        continue;
      }
      if (value === 0) continue;
      if (line === "Ware" && surcharge && surcharge.option === option.name) {
        const base = option.raw.Ware ?? value;
        segments.push({ line, kind: "Ware", cents: base });
        if (value > base) segments.push({ line: "Papier", kind: "Papier", cents: value - base });
        const ghost = surcharge.uncapped - (value - base);
        if (ghost > 0) segments.push({ line: "Papier", kind: "Ghost", cents: ghost });
        continue;
      }
      segments.push({ line, kind: KNOWN.has(line as SegmentKind) ? (line as SegmentKind) : "Other", cents: value });
    }
    const gross = segments.filter((segment) => segment.kind !== "Ghost").reduce((sum, segment) => sum + segment.cents, 0);
    return { option: option.name, segments, discount, gross, total: option.total, open: option.missing.length > 0 };
  });
}

/** A scale that leaves the bars room and stays put while the visitor adds lines (kit: 30.000 €). */
export function scaleFor(rows: readonly BarRow[], floor = 0): number {
  const widest = Math.max(floor, ...rows.map((row) => row.gross + row.segments.filter((segment) => segment.kind === "Ghost").reduce((sum, segment) => sum + segment.cents, 0)));
  return widest > 0 ? widest * 1.04 : 1;
}

/**
 * Where the bars start: a round amount below 80 % of the smallest first line (the goods, in the kit),
 * so the lines on top of the goods are wide enough to see and to tap on a phone. The Rangliste names
 * this amount ("Balken ab 16.000 €"), because a bar that does not start at 0 must say so.
 */
export function axisFloor(rows: readonly BarRow[]): number {
  const firsts = rows.flatMap((row) => {
    const first = row.segments[0];
    return first && first.kind !== "Open" && first.cents > 0 ? [first.cents] : [];
  });
  if (firsts.length === 0) return 0;
  const raw = Math.min(...firsts) * 0.8;
  const step = 10 ** Math.max(0, Math.floor(Math.log10(raw)) - 1);
  return Math.floor(raw / step) * step;
}

/** One stretch of a bar on a scale that starts at `floor`: left and width as shares of the track. */
export function span(start: number, cents: number, floor: number, scale: number): { readonly left: number; readonly width: number } {
  const range = Math.max(1, scale - floor);
  const from = Math.max(0, start - floor);
  const to = Math.max(0, start + cents - floor);
  return { left: from / range, width: (to - from) / range };
}
