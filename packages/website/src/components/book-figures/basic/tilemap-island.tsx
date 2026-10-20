"use client";

import { useMemo, useState } from "react";
import {
  formatDecimal,
  formatInterval,
  formatValue,
  TILE_LAYOUT,
  type FigureSpecOf,
} from "@/lib/figures";
import { Controls, Segmented } from "./controls";
import { HINT } from "./copy";
import { describeValue } from "./describe";
import { FigureCanvas } from "./figure-canvas";
import type { CanvasItem, RegionSummary } from "./types";

type Emphasis = "none" | "ost" | "west";

const OPTIONS = [
  { value: "none", label: "Keine" },
  { value: "ost", label: "Osten" },
  { value: "west", label: "Westen" },
] as const;

const PLACE = new Map(TILE_LAYOUT.map((place) => [place.id, place]));

/** Arrow keys follow the 4 x 4 grid; Home and End jump to the corners. */
export function tileNavigate(ids: readonly string[]) {
  const at = (col: number, row: number): string | null =>
    TILE_LAYOUT.find((p) => p.col === col && p.row === row && ids.includes(p.id))?.id ?? null;
  return (from: string, key: string): string | null => {
    const here = PLACE.get(from);
    if (!here) return null;
    switch (key) {
      case "ArrowRight":
        return at(here.col + 1, here.row);
      case "ArrowLeft":
        return at(here.col - 1, here.row);
      case "ArrowDown":
        return at(here.col, here.row + 1);
      case "ArrowUp":
        return at(here.col, here.row - 1);
      case "Home":
        return ids[0] ?? null;
      case "End":
        return ids[ids.length - 1] ?? null;
      default:
        return null;
    }
  };
}

export function tileItems(spec: FigureSpecOf<"tilemap">): CanvasItem[] {
  return TILE_LAYOUT.filter((place) => spec.data.tiles.some((t) => t.id === place.id)).map((place) => {
    const tile = spec.data.tiles.find((t) => t.id === place.id);
    const described = describeValue(spec.data.fmt, place.name, tile?.value ?? null, {
      lo: tile?.lo,
      hi: tile?.hi,
      n: tile?.n,
    });
    return { id: place.id, label: described.label, detail: described.detail };
  });
}

function regionText(region: RegionSummary): string {
  return `${region.label}: ${formatValue({ style: "percent", digits: 1 }, region.value)} der Firmen (95-%-Intervall ${formatInterval({ style: "percent", digits: 1 }, region.lo, region.hi)}, n\u00a0=\u00a0${formatDecimal(region.n, 0)}).`;
}

/** C7: 16 tiles, pin a Land, mark the East or the West. */
export function TilemapIsland({
  spec,
  regions,
}: {
  readonly spec: FigureSpecOf<"tilemap">;
  /** Raw East and West shares, shown while a region is marked. */
  readonly regions: readonly RegionSummary[];
}) {
  const [emphasis, setEmphasis] = useState<Emphasis>("none");
  const shown = useMemo<FigureSpecOf<"tilemap">>(
    () => ({
      ...spec,
      data: { ...spec.data, emphasis: emphasis === "none" ? undefined : emphasis },
    }),
    [spec, emphasis],
  );
  const items = useMemo(() => tileItems(spec), [spec]);
  const navigate = useMemo(() => tileNavigate(items.map((i) => i.id)), [items]);
  const region = regions.find((r) => r.id === emphasis);
  const other = regions.find((r) => r.id !== emphasis && emphasis !== "none");
  const summary =
    region && other
      ? `Rohe Anteile, nicht bereinigt. ${regionText(region)} ${regionText(other)}`
      : HINT.tile;
  return (
    <>
      <Controls>
        <Segmented label="Hervorheben" value={emphasis} options={OPTIONS} onChange={setEmphasis} />
      </Controls>
      <FigureCanvas
        spec={shown}
        items={items}
        summary={summary}
        groupLabel="Einzelne Bundesländer"
        navigate={navigate}
      />
    </>
  );
}
