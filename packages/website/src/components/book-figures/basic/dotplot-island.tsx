"use client";

import { useMemo, useState } from "react";
import { formatDecimal, type DotItem, type FigureSpecOf } from "@/lib/figures";
import { Controls, Segmented, Toggle } from "./controls";
import { HINT, SORT_LABEL } from "./copy";
import { describeValue } from "./describe";
import { byValueDesc } from "./bars-island";
import { FigureCanvas } from "./figure-canvas";
import type { CanvasItem } from "./types";

type Order = "value" | "register";

const ORDERS = [
  { value: "value", label: "Nach Anteil" },
  { value: "register", label: "Nach Branchennummer" },
] as const;

/** The highest and the lowest `count` rows that have a value; suppressed rows stay behind the toggle. */
export function extremeIds(items: readonly DotItem[], count: number): ReadonlySet<string> {
  const known = byValueDesc(items.filter((item) => item.value !== null));
  if (known.length <= count * 2) return new Set(known.map((item) => item.id));
  return new Set([...known.slice(0, count), ...known.slice(-count)].map((item) => item.id));
}

function rowItem(spec: FigureSpecOf<"dotplot">, row: DotItem): CanvasItem {
  const described = describeValue(spec.data.fmt, row.label, row.value, {
    lo: row.lo,
    hi: row.hi,
    n: row.n,
    note:
      row.hits !== undefined && row.hits !== null && row.n !== undefined
        ? `${formatDecimal(row.hits, 0)} Treffer.`
        : undefined,
  });
  return { id: row.id, label: described.label, detail: described.detail };
}

/** C6: industries with Wilson intervals; sort toggle, rows glide; spitze und Schluss or all. */
export function DotplotIsland({
  spec,
  extremes = 6,
}: {
  readonly spec: FigureSpecOf<"dotplot">;
  /** Rows shown at each end while collapsed. */
  readonly extremes?: number;
}) {
  const [order, setOrder] = useState<Order>("value");
  const [all, setAll] = useState(false);
  const total = spec.data.items.length;

  const rows = useMemo(() => {
    const keep = all ? null : extremeIds(spec.data.items, extremes);
    const picked = keep ? spec.data.items.filter((item) => keep.has(item.id)) : spec.data.items;
    return order === "value" ? byValueDesc(picked) : picked;
  }, [spec, order, all, extremes]);

  const shown = useMemo<FigureSpecOf<"dotplot">>(
    () => ({ ...spec, data: { ...spec.data, items: rows, sort: "none" } }),
    [spec, rows],
  );
  const items = useMemo(() => rows.map((row) => rowItem(spec, row)), [spec, rows]);

  return (
    <>
      <Controls>
        <Segmented label={SORT_LABEL} value={order} options={ORDERS} onChange={setOrder} />
        <Toggle
          label={`Alle ${total} Branchen zeigen`}
          pressedLabel="Nur Spitze und Schluss zeigen"
          expanded={all}
          onChange={setAll}
        />
      </Controls>
      <FigureCanvas
        spec={shown}
        items={items}
        summary={
          all ? HINT.row : `${rows.length} von ${total} Branchen: die mit dem höchsten und dem niedrigsten Anteil. ${HINT.row}`
        }
        layoutKey={`${order}:${all}`}
        groupLabel="Einzelne Branchen"
      />
    </>
  );
}
