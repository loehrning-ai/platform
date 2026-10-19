"use client";

import { useMemo, useState } from "react";
import type { FigureSpecOf } from "@/lib/figures";
import { Controls, Segmented } from "./controls";
import { HINT, SORT_LABEL } from "./copy";
import { describeValue } from "./describe";
import { FigureCanvas } from "./figure-canvas";
import type { CanvasItem } from "./types";

type Order = "source" | "value";

const ORDERS = [
  { value: "source", label: "Wie im Text" },
  { value: "value", label: "Nach Wert" },
] as const;

/** Value order, highest first, suppressed last; the same order the engine draws. */
export function byValueDesc<T extends { readonly value: number | null }>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.value === null && b.value === null) return 0;
    if (a.value === null) return 1;
    if (b.value === null) return -1;
    return b.value - a.value;
  });
}

export function barItems(spec: FigureSpecOf<"bars">, order: Order): CanvasItem[] {
  const rows = order === "value" ? byValueDesc(spec.data.items) : spec.data.items;
  return rows.map((row) => {
    const described = describeValue(spec.data.fmt, row.label, row.value, {
      lo: row.lo,
      hi: row.hi,
      n: row.n,
    });
    return { id: row.id, label: described.label, detail: described.detail };
  });
}

/** Horizontal bars (C5, C9): hover, tap or arrow keys read a bar; an optional sort toggle. */
export function BarsIsland({
  spec,
  sortable = false,
}: {
  readonly spec: FigureSpecOf<"bars">;
  readonly sortable?: boolean;
}) {
  const [order, setOrder] = useState<Order>("source");
  const shown = useMemo<FigureSpecOf<"bars">>(
    () => ({ ...spec, data: { ...spec.data, sort: order === "value" ? "desc" : "none" } }),
    [spec, order],
  );
  const items = useMemo(() => barItems(spec, order), [spec, order]);
  return (
    <>
      {sortable ? (
        <Controls>
          <Segmented label={SORT_LABEL} value={order} options={ORDERS} onChange={setOrder} />
        </Controls>
      ) : null}
      <FigureCanvas
        spec={shown}
        items={items}
        summary={HINT.row}
        layoutKey={order}
        groupLabel="Einzelne Balken"
      />
    </>
  );
}
