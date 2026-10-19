import type { FigureBase, NumFmt } from "@/lib/figures";

/** The part of a spec the frame needs: title, caption and the "Daten & Grenzen" facts. */
export type FigureMeta = Pick<
  FigureBase,
  "id" | "title" | "caption" | "n" | "nNote" | "source" | "asOf" | "limitation"
>;

/** A big number that counts up once (chapter openers). Aggregate only, never a firm count. */
export interface TickerSpec {
  readonly id: string;
  readonly title: string;
  readonly value: number;
  readonly fmt: NumFmt;
  /** Text after the number: "der Firmen mit auffindbarer Website schreiben KI." */
  readonly tail: string;
  /** 95 % interval in the same unit as `value`. */
  readonly interval?: readonly [number, number];
  readonly n: number;
  readonly nNote?: string;
  readonly source: string;
  readonly asOf: string;
  readonly limitation: string;
}

/** One chip of the waffle. Evidence types overlap, so each chip is its own share of the 100. */
export interface WaffleChip {
  readonly id: string;
  readonly label: string;
  /** Dots of 100. Not a firm count. */
  readonly dots: number;
  /** Firms behind the chip. Must be 0 or at least 5. */
  readonly hits: number;
}

/** East or West as a group, for the Länder tile map. Raw shares, not adjusted. */
export interface RegionSummary {
  readonly id: "ost" | "west";
  readonly label: string;
  readonly value: number;
  readonly lo: number;
  readonly hi: number;
  readonly n: number;
}

/** One thing a reader can point at in a figure. */
export interface CanvasItem {
  /** The data-id of the element in the SVG. */
  readonly id: string;
  /** Accessible name of the hit area: short, with the value. */
  readonly label: string;
  /** Sentence shown under the figure while the item is hovered, focused or pinned. */
  readonly detail: string;
}
