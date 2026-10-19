import {
  figureTable,
  type FigureSpecOf,
  type FigureTable,
} from "@/lib/figures";
import { BarsIsland } from "./bars-island";
import { DotplotIsland } from "./dotplot-island";
import { DumbbellIsland } from "./dumbbell-island";
import { FigureFrame, type DataTableSpec } from "./figure-frame";
import { FunnelIsland } from "./funnel-island";
import { LorenzIsland } from "./lorenz-island";
import { TickerIsland } from "./ticker";
import { TilemapIsland } from "./tilemap-island";
import type { RegionSummary, TickerSpec, WaffleChip } from "./types";
import { WaffleIsland } from "./waffle-island";

/**
 * Server components: caption, "Daten & Grenzen" and the table are plain
 * markup; only the stage inside is a client island. Chapters import these.
 */

interface Common {
  /** Marks preview data. Leave off for the book's frozen aggregates. */
  readonly provisional?: boolean;
}

const one = (spec: Parameters<typeof figureTable>[0]): readonly DataTableSpec[] => [
  { title: spec.title, table: figureTable(spec), fileStem: spec.id },
];

export function BarsFigure({
  spec,
  sortable = false,
  provisional,
}: Common & { readonly spec: FigureSpecOf<"bars">; readonly sortable?: boolean }) {
  return (
    <FigureFrame meta={spec} kind="bars" tables={one(spec)} provisional={provisional}>
      <BarsIsland spec={spec} sortable={sortable} />
    </FigureFrame>
  );
}

export function WaffleFigure({
  spec,
  chips,
  provisional,
}: Common & { readonly spec: FigureSpecOf<"waffle">; readonly chips: readonly WaffleChip[] }) {
  const base = figureTable(spec);
  const table: FigureTable = {
    columns: [...base.columns, "Firmen"],
    rows: [
      ...base.rows.map((row) => [...row, null] as const),
      ...chips.map((chip) => [`Beleg: ${chip.label}`, chip.dots, spec.data.total, chip.hits] as const),
    ],
  };
  return (
    <FigureFrame
      meta={spec}
      kind="waffle"
      tables={[{ title: spec.title, table, fileStem: spec.id }]}
      provisional={provisional}
    >
      <WaffleIsland spec={spec} chips={chips} />
    </FigureFrame>
  );
}

export function DotplotFigure({
  spec,
  provisional,
}: Common & { readonly spec: FigureSpecOf<"dotplot"> }) {
  return (
    <FigureFrame meta={spec} kind="dotplot" tables={one(spec)} provisional={provisional}>
      <DotplotIsland spec={spec} />
    </FigureFrame>
  );
}

export function TilemapFigure({
  spec,
  regions,
  provisional,
}: Common & { readonly spec: FigureSpecOf<"tilemap">; readonly regions: readonly RegionSummary[] }) {
  return (
    <FigureFrame meta={spec} kind="tilemap" tables={one(spec)} provisional={provisional}>
      <TilemapIsland spec={spec} regions={regions} />
    </FigureFrame>
  );
}

export function FunnelFigure({
  spec,
  provisional,
}: Common & { readonly spec: FigureSpecOf<"funnel"> }) {
  return (
    <FigureFrame meta={spec} kind="funnel" tables={one(spec)} provisional={provisional}>
      <FunnelIsland spec={spec} />
    </FigureFrame>
  );
}

export function DumbbellFigure({
  spec,
  details,
  provisional,
}: Common & {
  readonly spec: FigureSpecOf<"dumbbell">;
  readonly details: Readonly<Record<string, string>>;
}) {
  return (
    <FigureFrame meta={spec} kind="dumbbell" tables={one(spec)} provisional={provisional}>
      <DumbbellIsland spec={spec} details={details} />
    </FigureFrame>
  );
}

export function LorenzFigure({
  spec,
  bars,
  provisional,
}: Common & {
  readonly spec: FigureSpecOf<"lorenz">;
  readonly bars: FigureSpecOf<"bars">;
}) {
  return (
    <FigureFrame
      meta={spec}
      kind="lorenz"
      tables={[...one(spec), ...one(bars)]}
      provisional={provisional}
    >
      <LorenzIsland spec={spec} bars={bars} />
    </FigureFrame>
  );
}

export function TickerFigure({
  spec,
  provisional,
}: Common & { readonly spec: TickerSpec }) {
  const table: FigureTable = {
    columns: ["Maß", "Wert", "Untergrenze", "Obergrenze", "n"],
    rows: [
      [
        spec.title,
        spec.value,
        spec.interval?.[0] ?? null,
        spec.interval?.[1] ?? null,
        spec.n,
      ],
    ],
  };
  return (
    <FigureFrame
      meta={{ ...spec, caption: "" }}
      kind="ticker"
      tables={[{ title: spec.title, table, fileStem: spec.id }]}
      provisional={provisional}
    >
      <TickerIsland spec={spec} />
    </FigureFrame>
  );
}
