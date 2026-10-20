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
  "network",
  "blocks",
  "strip",
  "curve",
  "slope",
  "nulldist",
  "field",
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
  /** Locale of the strings the kinds write themselves and of the number format; default "de". */
  readonly lang?: "de" | "en";
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

/* ------------------------------------------------------------ hero kinds
 *
 * The hero kinds draw one finding each (INSIGHT-SPEC section 4, DIRECTION.md).
 * Every one is a pure function of progress and, where the reader holds a
 * control with real detents, of a variant: the options `variant`, `from` and
 * `shift` select and blend baked variants, never interpolated values.
 * `claim` is the stage sentence (at most 12 words, with the direct labels).
 */

export type HeroTone = "ink" | "accent" | "grey" | "ring";

/* --------------------------------------------------------------- network */

export interface NetworkNode {
  readonly id: string;
  readonly label: string;
  /** Position in a 0 to 100 square; fixed, never simulated. */
  readonly x: number;
  readonly y: number;
  readonly module: string;
  /** The node the story is about (drawn in the accent). */
  readonly ki?: boolean;
}

export interface NetworkModule {
  readonly id: string;
  readonly label: string;
}

/** [node index, node index] or [node index, node index, odds ratio]. */
export type NetworkEdge = readonly [number, number] | readonly [number, number, number];

export interface NetworkVariant {
  readonly id: string;
  /** Detent label: "roh", "10 Stufen". */
  readonly label: string;
  readonly edges: readonly NetworkEdge[];
  /** Edges as a share of all node pairs, in percent. */
  readonly share?: number;
  readonly modularity?: number;
}

export interface NetworkNeighbour {
  /** Node id. */
  readonly node: string;
  readonly odds: number;
  readonly lo: number;
  readonly hi: number;
}

export interface NetworkData {
  readonly claim?: string;
  readonly nodes: readonly NetworkNode[];
  readonly modules: readonly NetworkModule[];
  readonly variants: readonly NetworkVariant[];
  /** Variant of the finished figure; default the last one. */
  readonly defaultVariant?: string;
  /** Variant that holds all edges before the control is applied; default the first. */
  readonly baseline?: string;
  readonly neighbours?: readonly NetworkNeighbour[];
  /** Word for the nodes in the numeral line: "Verbindungen". */
  readonly edgeWord?: string;
}

/* ---------------------------------------------------------------- blocks */

export interface BlocksBin {
  readonly id: string;
  readonly label: string;
  /** Ink by default; grey for what is taken out. The finding bin is always the accent. */
  readonly tone?: "ink" | "grey";
}

export interface BlocksVariant {
  readonly id: string;
  readonly label: string;
  /** Things per bin (bin id to count); adds up to `total`. */
  readonly counts: Readonly<Record<string, number>>;
}

export interface BlocksData {
  readonly claim?: string;
  /** Things the blocks stand for (10.088 ads). */
  readonly total: number;
  /** Blocks drawn, usually 100. */
  readonly blocks: number;
  /** "Anzeige|Anzeigen". */
  readonly unit: string;
  readonly bins: readonly BlocksBin[];
  /** Bin drawn in the accent. */
  readonly finding: string;
  readonly variants: readonly BlocksVariant[];
  readonly defaultVariant?: string;
}

/* ----------------------------------------------------------------- strip */

export type StripShape = "square" | "diamond" | "ring" | "bar";

export interface StripLayer {
  readonly id: string;
  readonly label: string;
  readonly shape: StripShape;
  readonly tone: "ink" | "accent" | "grey";
}

export interface StripValue {
  readonly value: number | null;
  readonly lo?: number;
  readonly hi?: number;
  readonly n?: number;
  readonly hits?: number | null;
}

export interface StripMark extends StripValue {
  readonly layer: string;
  /** The same mark under another reading of the base (variant id to value). */
  readonly by?: Readonly<Record<string, StripValue>>;
}

export interface StripRow {
  readonly id: string;
  readonly label: string;
  readonly marks: readonly StripMark[];
}

export interface StripVariant {
  readonly id: string;
  readonly label: string;
}

export interface StripData {
  readonly claim?: string;
  readonly rows: readonly StripRow[];
  readonly layers: readonly StripLayer[];
  readonly fmt: NumFmt;
  readonly scale: "linear" | "log";
  readonly min?: number;
  readonly max?: number;
  readonly reference?: { readonly value: number; readonly label: string };
  readonly variants?: readonly StripVariant[];
  readonly defaultVariant?: string;
  /** Layer that carries the finding; it lands last. */
  readonly finding?: string;
}

/* ----------------------------------------------------------------- curve */

export interface CurvePoint {
  readonly id: string;
  readonly label: string;
  readonly value: number | null;
  readonly lo?: number;
  readonly hi?: number;
  readonly n?: number;
  /** Part of the frozen stretch (drawn hatched). */
  readonly frozen?: boolean;
}

export interface CurvePanelRow {
  readonly id: string;
  readonly label: string;
  readonly value: number;
}

export interface CurveData {
  readonly claim?: string;
  readonly points: readonly CurvePoint[];
  readonly fmt: NumFmt;
  readonly min?: number;
  readonly max?: number;
  /** Point the reader's marker sits on; the variant of the figure. Default the last. */
  readonly defaultVariant?: string;
  readonly frozenLabel?: string;
  readonly panel?: { readonly title: string; readonly fmt: NumFmt; readonly rows: readonly CurvePanelRow[] };
}

/* ----------------------------------------------------------------- slope */

export interface SlopeTop {
  /** Rate of the group in half A and in half B, as a multiple of the overall rate. */
  readonly a: number;
  readonly b: number;
  readonly lo?: number;
  readonly hi?: number;
}

export interface SlopeSplit {
  readonly id: string;
  readonly label: string;
  /** For the i-th item of half A (best first): its position in half B (1 = best). A permutation of 1 to `items`. */
  readonly rankB: readonly number[];
  readonly top: SlopeTop;
}

export interface SlopeData {
  readonly claim?: string;
  /** Items ranked in each half. */
  readonly items: number;
  /** Size of the group that is followed (the top ten). */
  readonly top: number;
  readonly splits: readonly SlopeSplit[];
  readonly defaultVariant?: string;
  /** Pooled over all splits. */
  readonly pooled: SlopeTop;
  /** Mean position of a random group of the same size, with its band (positions 1 to `items`). */
  readonly chance: { readonly mean: number; readonly lo: number; readonly hi: number };
  readonly aLabel: string;
  readonly bLabel: string;
  readonly fmt: NumFmt;
}

/* -------------------------------------------------------------- nulldist */

export interface NullBin {
  /** Bin edges in the unit of `fmt`. */
  readonly lo: number;
  readonly hi: number;
  /** Randomisation draws in the bin (draws, not firms). */
  readonly draws: number;
}

export interface NullVariant {
  readonly id: string;
  readonly label: string;
  /** Firms in the group at this detent. */
  readonly n: number;
  readonly bins: readonly NullBin[];
  /** Interval that holds the draws. */
  readonly band: { readonly lo: number; readonly hi: number };
}

export interface NullWord {
  readonly id: string;
  readonly label: string;
  /** Observed divided by expected. */
  readonly ratio: number;
  readonly lo?: number;
  readonly hi?: number;
}

export interface NulldistData {
  readonly claim?: string;
  readonly fmt: NumFmt;
  /** Draws behind every histogram. */
  readonly draws: number;
  readonly observed: { readonly value: number; readonly lo?: number; readonly hi?: number; readonly label: string };
  readonly variants: readonly NullVariant[];
  readonly defaultVariant?: string;
  readonly words: readonly NullWord[];
  /** Word that the observed value is about (the one of the numeral). */
  readonly focusWord?: string;
}

/* ----------------------------------------------------------------- field
 *
 * Das Feld: one canvas of unit squares that re-forms from scene to scene.
 * A scene is one population (Startseiten, Anzeigen, Kreise, Ziehungen) cut
 * into classes. Squares keep their identity inside a population; a change of
 * population drains the field out of the bottom and pours the next one in.
 */

export type FieldTone = "ink" | "accent" | "leinen" | "ghost";

export interface FieldClass {
  readonly id: string;
  readonly label: string;
  readonly tone: FieldTone;
}

export interface FieldSegment {
  readonly cls: string;
  /** Things of the base in this class (not squares). */
  readonly count: number;
  /** Draw as whole squares plus one partial square instead of rounding. */
  readonly partial?: boolean;
}

export interface FieldBin {
  readonly id: string;
  readonly label?: string;
  /** Stacked bottom up in this order. */
  readonly segments: readonly FieldSegment[];
  /** Grid cell [column, row] for tile layouts. */
  readonly cell?: readonly [number, number];
}

export interface FieldNumeral {
  readonly value: number;
  readonly fmt: NumFmt;
  /** Written tight after the number: "x" gives "62x". */
  readonly suffix?: string;
}

export interface FieldScene {
  readonly id: string;
  /** Squares keep their identity inside one population. */
  readonly population: string;
  /** Things the whole field stands for in this scene. */
  readonly base: number;
  /** Squares drawn (at most 1.100); with base <= squares the unit is exact. */
  readonly squares: number;
  /** "Startseite|Startseiten". */
  readonly unit: string;
  readonly layout: "grid" | "bins";
  /** Columns of a grid layout. */
  readonly cols?: number;
  /** Bins per row of a bins layout. */
  readonly perRow?: number;
  /** Bins touch (a histogram). */
  readonly adjacent?: boolean;
  readonly bins: readonly FieldBin[];
  /** The class table holds the joint distribution: squares keep their class across this change. */
  readonly joint?: boolean;
  /** First scene only: start settled instead of pouring in. */
  readonly enter?: "pour" | "none";
  /** Share of the timeline, default 1. */
  readonly weight?: number;
  readonly numeral?: FieldNumeral;
  readonly claim?: string;
  /** Direct labels of the classes, in the order of `labelClasses`. */
  readonly labelClasses?: readonly string[];
}

export interface FieldData {
  readonly classes: readonly FieldClass[];
  readonly scenes: readonly FieldScene[];
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
  network: NetworkData;
  blocks: BlocksData;
  strip: StripData;
  curve: CurveData;
  slope: SlopeData;
  nulldist: NulldistData;
  field: FieldData;
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
  /** Variant (detent) of the hero kinds that have one; default is the spec's `defaultVariant`. */
  readonly variant?: string;
  /** Variant the figure is leaving while a control change runs. */
  readonly from?: string;
  /** 0 to 1 of the way from `from` to `variant`; 1 or undefined means settled on `variant`. */
  readonly shift?: number;
  /** Leave out numeral, claim and unit line (the stage draws them in the page). */
  readonly bare?: boolean;
  /**
   * Height the figure should fill, in view units, when it sits in a box of
   * fixed height (the pinned stage). Hero kinds shrink their flexible
   * dimension to it; without it they use their natural height.
   */
  readonly height?: number;
}
