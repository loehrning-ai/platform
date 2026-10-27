"use client";

import { useState, type DragEvent } from "react";
import { readCsv } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/counts";
import type { Evaluation } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import type { Fmt } from "./fmt";

interface Tile {
  readonly id: string;
  /** 1-based line of the row in the file. */
  readonly line: number;
}

/** The staff IDs of the training list, one tile per row, with its line in the file. IDs only, never a name. */
export function staffTiles(text: string): readonly Tile[] {
  const lines = text.split("\n");
  const header = lines.findIndex((line) => line.startsWith("staff_id"));
  const ids = readCsv(text).rows.map((row) => row.staff_id ?? "");
  return ids.map((id, index) => ({ id, line: header + index + 2 }));
}

/**
 * R5 counted by hand: 26 tiles with staff IDs, one ID twice. Dragging one
 * twin onto the other (or tapping both) merges them, the count drops to the
 * number of people, and a grid of every seat fills with the trained ones
 * against a fixed mark for the share the customer asks for.
 */
export function R5View({
  fmt,
  evaluation,
  percent,
  merged,
  onMerge,
}: {
  readonly fmt: Fmt;
  readonly evaluation: Evaluation;
  /** The share the customer asks for, in percent (from the request). */
  readonly percent: number;
  readonly merged: boolean;
  readonly onMerge: () => void;
}) {
  const { copy } = fmt;
  const figures = evaluation.tests.quote.figures;
  const tiles = staffTiles(evaluation.doc.text);
  const twin = figures.duplicateId ?? "";
  const [picked, setPicked] = useState<number | null>(null);
  const staff = figures.staff ?? 0;
  const unique = figures.unique ?? 0;
  const needed = figures.needed ?? 0;
  const shown = merged ? tiles.filter((tile, index) => tiles.findIndex((other) => other.id === tile.id) === index) : tiles;
  const tap = (index: number) => {
    const tile = shown[index];
    if (!tile || merged) return;
    if (picked === null) {
      setPicked(index);
      return;
    }
    const first = shown[picked];
    setPicked(null);
    if (first && first.id === tile.id && picked !== index) onMerge();
  };
  const drop = (event: DragEvent<HTMLElement>, index: number) => {
    event.preventDefault();
    const from = Number(event.dataTransfer.getData("text/plain"));
    const a = shown[from];
    const b = shown[index];
    if (a && b && a.id === b.id && from !== index) onMerge();
  };
  return (
    <div className="w05-r5" data-w05-r5={merged ? "merged" : "open"}>
      <p className="w05-sheet-lead">{copy.r5.instruction}</p>
      <p className="w05-r5-count" aria-live="polite">
        <span>{fmt.t(copy.r5.rows, { n: shown.length })}</span>
        {merged ? <span>{fmt.t(copy.r5.people, { n: unique })}</span> : null}
      </p>
      <ul className="w05-r5-tiles" aria-label={copy.r5.title}>
        {shown.map((tile, index) => (
          <li key={`${tile.id}-${tile.line}`}>
            <button
              type="button"
              className="w05-r5-tile"
              draggable={!merged && tile.id === twin}
              onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => drop(event, index)}
              onClick={() => tap(index)}
              aria-pressed={picked === index}
              data-twin={tile.id === twin ? "" : undefined}
              data-w05-tile={tile.id}
              aria-label={fmt.t(copy.r5.tile, { n: tile.line, id: tile.id })}
            >
              {tile.id}
            </button>
          </li>
        ))}
      </ul>
      <div className="w05-seats" role="img" aria-label={merged ? `${fmt.t(copy.r5.seats, { unique, staff })}. ${fmt.t(copy.r5.needed, { needed })}` : fmt.t(copy.r5.rows, { n: shown.length })}>
        {Array.from({ length: staff }, (_, seat) => (
          <span key={seat} data-on={seat < (merged ? unique : shown.length) ? "" : undefined} data-needed={seat === needed - 1 ? "" : undefined} />
        ))}
      </div>
      {merged ? (
        <div className="w05-r5-caption">
          {fmt
            .ts(copy.r5.caption, { unique, staff, id: twin, percent, needed })
            .map((sentence) => (
              <p key={sentence}>{sentence}</p>
            ))}
        </div>
      ) : null}
    </div>
  );
}
