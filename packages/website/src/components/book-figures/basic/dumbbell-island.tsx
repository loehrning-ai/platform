"use client";

import { useMemo, useState } from "react";
import { formatValue, type DumbbellRow, type FigureSpecOf } from "@/lib/figures";
import { Controls, Segmented } from "./controls";
import { HINT } from "./copy";
import { FigureCanvas } from "./figure-canvas";
import type { CanvasItem } from "./types";

type Metric = "a" | "b" | "gap";

/** Order of the engine's dumbbell sort: highest first, missing values last. */
export function dumbbellOrder(rows: readonly DumbbellRow[], metric: Metric): DumbbellRow[] {
  const key = (r: DumbbellRow): number => {
    if (metric === "a") return r.a ?? -Infinity;
    if (metric === "b") return r.b ?? -Infinity;
    return r.a !== null && r.b !== null ? Math.abs(r.a - r.b) : -Infinity;
  };
  return [...rows].sort((x, y) => key(y) - key(x));
}

/** C11: two measures per row on one axis; the toggle picks the measure that ranks the rows. */
export function DumbbellIsland({
  spec,
  details,
}: {
  readonly spec: FigureSpecOf<"dumbbell">;
  /** Sentence per row id: both raw values with units. */
  readonly details: Readonly<Record<string, string>>;
}) {
  const [metric, setMetric] = useState<Metric>("a");
  const shown = useMemo<FigureSpecOf<"dumbbell">>(
    () => ({ ...spec, data: { ...spec.data, sort: metric } }),
    [spec, metric],
  );
  const items = useMemo<CanvasItem[]>(
    () =>
      dumbbellOrder(spec.data.rows, metric).map((row) => ({
        id: row.id,
        label: `${row.label}: ${formatValue(spec.data.fmt, row.a)} und ${formatValue(spec.data.fmt, row.b)}`,
        detail: details[row.id] ?? `${row.label}.`,
      })),
    [spec, metric, details],
  );
  const options = [
    { value: "a", label: "KI-Stellen" },
    { value: "b", label: "KI-Wort auf Websites" },
    { value: "gap", label: "Abstand" },
  ] as const;
  return (
    <>
      <Controls>
        <Segmented label="Rangfolge nach" value={metric} options={options} onChange={setMetric} />
      </Controls>
      <FigureCanvas
        spec={shown}
        items={items}
        summary={HINT.row}
        layoutKey={metric}
        groupLabel="Einzelne Bundesländer"
      />
    </>
  );
}
