/**
 * Figure engine types. One FigureSpec describes one chart of the book. The
 * same spec feeds the server render, the client island and the static SVG
 * written for the PDF (see render.ts and scripts/render-figures.mjs).
 *
 * Privacy contract: a spec holds aggregates only. A count of 1 to 4 is never
 * stored; the value becomes null and the figure prints "weniger als 5".
 */

export const FIGURE_KINDS = [
  "waffle",
  "bars",
  "dotplot",
  "tilemap",
  "funnel",
  "dumbbell",
  "lorenz",
  "waterfall",
  "ladder",
  "timeline",
  "iceberg",
] as const;

export type FigureKind = (typeof FIGURE_KINDS)[number];

/** How a plotted number is written. Percent values are percentage points (4.0 means 4,0 %). */
export interface NumFmt {
  readonly style: "percent" | "number" | "decimal";
  /** Decimals; default 1 for percent and decimal, 0 for number. */
  readonly digits?: number;
  /** Optional unit appended after the number, for example "pro Mio.". */
  readonly unit?: string;
}

/** One step of a stepped figure. Step k covers progress k/S to (k+1)/S. */
export interface FigureStep {
  readonly id: string;
  /** Short label for the step button and the step text ("Schritt 2 von 4"). */
  readonly label: string;
  /** Element ids that first appear in this step (item, group, tile, event ids). */
  readonly reveal?: readonly string[];
  /** Element ids emphasised while this step is the active one (not at progress 1). */
  readonly focus?: readonly string[];
}

/**
 * What the export adds to a frozen spec (written by the analysis step, read by
 * the reader). `values` and `aliases` are the number tokens of the prose:
 * `{{c4.weighted_share}}` resolves from here. A value with `ref` takes its
 * number from the element of that id, so a restated number cannot drift from
 * the chart.
 */
export interface FigureMetaValue {
  readonly value?: number;
  /** Element id whose number this value restates. */
  readonly ref?: string;
  readonly lo?: number;
  readonly hi?: number;
  readonly n?: number;
  readonly fmt?: NumFmt;
}

export interface FigureExportMeta {
  /** "v0-pre-rescan" until the one-method rescan replaces the aggregates. */
  readonly methodVersion?: string;
  /** ISO date of the frozen export. */
  readonly frozenOn?: string;
  readonly values?: Readonly<Record<string, FigureMetaValue>>;
  /** Readable token name to element id: `raw_share` -> `raw`. */
  readonly aliases?: Readonly<Record<string, string>>;
}

/** One note on the single most telling mark of a figure. */
export interface FigureAnnotation {
  /** Element id (data-id) the note points at. */
  readonly id: string;
  readonly text: string;
}

export interface FigureBase {
  readonly id: string;
  /** Short title, also the accessible name of the SVG. */
  readonly title: string;
  /** Long text alternative: what the figure shows, in two or three sentences. */
  readonly alt: string;
  readonly caption: string;
  /** Primary sample size behind the figure. */
  readonly n: number;
  /** Further sample sizes when one number is not enough ("37.429 / 25.581 / 24.944"). */
  readonly nNote?: string;
  readonly source: string;
  /** ISO date (YYYY-MM-DD) of the data. */
  readonly asOf: string;
  readonly limitation: string;
  readonly steps?: readonly FigureStep[];
  /** Seed for jitter; defaults to a hash of the id. */
  readonly seed?: number;
  readonly meta?: FigureExportMeta;
  /** Drawn at progress 1 as a direct label with a leader to the marked element. */
  readonly annotation?: FigureAnnotation;
}

/* ---------------------------------------------------------------- waffle */

export type WaffleTone = "accent" | "ink" | "ring" | "light";

export interface WaffleGroup {
  readonly id: string;
  readonly label: string;
  /** Dots, one dot is one of `total`. Not a firm count. */
  readonly dots: number;
  readonly tone: WaffleTone;
}

export interface WaffleData {
  readonly total: number;
  readonly columns?: number;
  readonly groups: readonly WaffleGroup[];
  /** Label of the dots that belong to no group. */
  readonly restLabel?: string;
  /** Big line above the grid, for example "21 von 100". */
  readonly headline?: string;
}

/* ------------------------------------------------------------------ bars */

export interface BarItem {
  readonly id: string;
  readonly label: string;
  /** null means suppressed (fewer than 5 cases). */
  readonly value: number | null;
  readonly lo?: number;
  readonly hi?: number;
  readonly n?: number;
}

export interface BarsData {
  readonly orientation?: "horizontal" | "vertical";
  readonly items: readonly BarItem[];
  readonly fmt: NumFmt;
  readonly max?: number;
  readonly baseline?: number;
  readonly baselineLabel?: string;
  readonly sort?: "none" | "desc" | "asc";
}

/* --------------------------------------------------------------- dotplot */

export interface DotItem {
  readonly id: string;
  readonly label: string;
  readonly value: number | null;
  readonly lo?: number;
  readonly hi?: number;
  readonly n?: number;
  readonly hits?: number | null;
}

export interface DotplotData {
  readonly items: readonly DotItem[];
  readonly fmt: NumFmt;
  readonly min?: number;
  readonly max?: number;
  readonly reference?: { readonly value: number; readonly label: string };
  readonly sort?: "none" | "value" | "label";
}

/* --------------------------------------------------------------- tilemap */

export interface TileItem {
  /** Two-letter Land code (BW, BY, BE, BB, HB, HH, HE, MV, NI, NW, RP, SL, SN, ST, SH, TH). */
  readonly id: string;
  readonly value: number | null;
  readonly lo?: number;
  readonly hi?: number;
  readonly n?: number;
}

export interface TilemapData {
  readonly tiles: readonly TileItem[];
  readonly fmt: NumFmt;
  readonly emphasis?: "ost" | "west";
  /** Upper end of the colour ramp; default is the largest value. */
  readonly max?: number;
}

/* ---------------------------------------------------------------- funnel */

export interface FunnelPoint {
  readonly id: string;
  readonly label?: string;
  readonly n: number;
  /** Rate in percentage points. */
  readonly value: number;
}

export interface FunnelData {
  readonly points: readonly FunnelPoint[];
  /** Overall rate in percentage points; the centre line. */
  readonly overall: number;
  readonly fmt: NumFmt;
  /** Coverage of the control limits in percent, from 90, 95, 99, 99.8. Default [95, 99.8]. */
  readonly limits?: readonly number[];
  readonly xLabel?: string;
  readonly yLabel?: string;
}

/* -------------------------------------------------------------- dumbbell */

export interface DumbbellRow {
  readonly id: string;
  readonly label: string;
  readonly a: number | null;
  readonly b: number | null;
}

export interface DumbbellData {
  readonly rows: readonly DumbbellRow[];
  readonly aLabel: string;
  readonly bLabel: string;
  readonly fmt: NumFmt;
  readonly scale?: "linear" | "log";
  readonly reference?: { readonly value: number; readonly label: string };
  readonly sort?: "none" | "a" | "b" | "gap";
}

/* ---------------------------------------------------------------- lorenz */

export interface LorenzMark {
  /** Share of the group (0 to 100) at which the curve is read. */
  readonly x: number;
  readonly label: string;
}

export interface LorenzData {
  /** Cumulative shares in percent: x = share of employers, y = share of postings. */
  readonly points: readonly (readonly [number, number])[];
  readonly xLabel: string;
  readonly yLabel: string;
  readonly marks?: readonly LorenzMark[];
  readonly gini?: number;
}

/* -------------------------------------------------------------- waterfall */

export interface WaterfallItem {
  readonly id: string;
  readonly label: string;
  /** total: a level from zero. delta: a signed change from the running level. */
  readonly kind: "total" | "delta";
  readonly value: number;
  readonly n?: number;
  /** Start a new group before this item (draws a separator). */
  readonly gapBefore?: boolean;
}

export interface WaterfallData {
  readonly items: readonly WaterfallItem[];
  readonly fmt: NumFmt;
  readonly orientation?: "auto" | "vertical" | "horizontal";
  /** Legend words that replace the defaults (Messwert, Rückgang, Anstieg), for figures that do not show measurements. */
  readonly legend?: { readonly total?: string; readonly down?: string; readonly up?: string };
}

/* ---------------------------------------------------------------- ladder */

export interface LadderRung {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  /** Earlier value of the same measure; drawn as a hollow dot. */
  readonly from?: number;
  /** Wording of the question or the definition, shown under the rung. */
  readonly definition: string;
  readonly year?: string;
}

export interface LadderOurs {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly lo: number;
  readonly hi: number;
  readonly axisMax: number;
  readonly note: string;
  /** Format of the own measure; defaults to the ladder's. Our rates need a decimal. */
  readonly fmt?: NumFmt;
}

export interface LadderData {
  readonly rungs: readonly LadderRung[];
  readonly fmt: NumFmt;
  readonly axisMax?: number;
  readonly ours?: LadderOurs;
}

/* -------------------------------------------------------------- timeline */

export type TimelineStatus = "gilt" | "kommt" | "offen";

export interface TimelineEvent {
  readonly id: string;
  /** ISO date. */
  readonly date: string;
  readonly label: string;
  readonly detail?: string;
  readonly tag?: string;
  readonly status: TimelineStatus;
}

export interface TimelineData {
  readonly events: readonly TimelineEvent[];
}

/* --------------------------------------------------------------- iceberg */

export interface IcebergData {
  readonly visible: { readonly value: number; readonly label: string };
  readonly total: { readonly value: number; readonly label: string };
  readonly fmt: NumFmt;
  readonly waterlineLabel: string;
  readonly hiddenLabel: string;
}

/* ------------------------------------------------------------------ union */

export interface KindMap {
  waffle: WaffleData;
  bars: BarsData;
  dotplot: DotplotData;
  tilemap: TilemapData;
  funnel: FunnelData;
  dumbbell: DumbbellData;
  lorenz: LorenzData;
  waterfall: WaterfallData;
  ladder: LadderData;
  timeline: TimelineData;
  iceberg: IcebergData;
}

export type FigureSpecOf<K extends FigureKind> = FigureBase & {
  readonly kind: K;
  readonly data: KindMap[K];
};

export type FigureSpec = {
  [K in FigureKind]: FigureSpecOf<K>;
}[FigureKind];

/* ---------------------------------------------------------------- options */

export interface RenderOptions {
  /** Width of the viewBox in user units. 390 and below lays out for phones. Default 560. */
  readonly width?: number;
  /** web: page Kalkweiss, no background rect. print: CI v5.3 Kalkweiss with a background rect. */
  readonly theme?: "web" | "print";
  /** Write width and height attributes (standalone SVG files for the PDF). */
  readonly intrinsic?: boolean;
  /** Element id the reader points at; the rest is dimmed. */
  readonly highlight?: string;
}
