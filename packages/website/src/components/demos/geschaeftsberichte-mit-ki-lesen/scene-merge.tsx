"use client";

import { useId, useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import type { NcrRow, WeekStart } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { machines, mergeRecords, recordsOf, weeksOf } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import { cellKey, mergesLeft, type DemoState } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/demo-state";
import type { Rect } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/treemap";
import { lerpRect } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/treemap";
import type { Fmt } from "./fmt";
import { GlassPebble, PebbleDefs } from "./pebble";
import { useMorph } from "./use-morph";

const VIEW = { w: 360, h: 132 } as const;
/** The grid's drawing size, for the FitBox around it. */
export const MERGE_VIEW = VIEW;
const LABEL_W = 46;
const HEAD_H = 17;
const ROW_H = 23;
const SIDE = 13;
const GAP = 3;
const MERGE_REACH = 18;

interface Slot {
  readonly row: NcrRow;
  readonly cell: string;
  readonly rect: Rect;
  /** 1 while the record stands alone, 0 once it is merged into its twin. */
  readonly alive: number;
}

const SEP_WEEKS = weeksOf("sep");
const MACHINES = machines();
const colX = (machine: string) => LABEL_W + MACHINES.indexOf(machine) * ((VIEW.w - LABEL_W) / MACHINES.length);
const rowY = (week: WeekStart) => HEAD_H + SEP_WEEKS.indexOf(week) * ROW_H;
const CELLS = mergeRecords(recordsOf("sep"));

/** Pebble rects for a merge state: merged records slide onto the last record still standing in their cell. */
function slotsFor(merged: Readonly<Record<string, number>>): readonly Slot[] {
  return CELLS.flatMap((cell) => {
    const key = cellKey(cell.machine, cell.date);
    const standing = cell.rows.length - (merged[key] ?? 0);
    const x0 = colX(cell.machine) + 4;
    const y0 = rowY(cell.date) + (ROW_H - SIDE) / 2;
    return cell.rows.map((row, index) => {
      const at = Math.min(index, standing - 1);
      return {
        row,
        cell: key,
        rect: { x: x0 + at * (SIDE + GAP), y: y0, w: SIDE, h: SIDE },
        alive: index < standing ? 1 : 0,
      };
    });
  });
}

const lerpSlots = (a: readonly Slot[], b: readonly Slot[], t: number): readonly Slot[] =>
  b.map((slot, index) => {
    const from = a[index] ?? slot;
    return {
      ...slot,
      rect: lerpRect(from.rect, slot.rect, t),
      alive: from.alive + (slot.alive - from.alive) * t,
    };
  });

/**
 * Scene 3: September by machine and week. Press a record in a cell with
 * twins, drag it onto a twin and the two fuse (a goo filter on that one cell,
 * only while it merges); a tap or Enter on the cell merges one record.
 */
export function MergeGrid({
  pack,
  fmt,
  state,
  reducedMotion,
  flat,
  onMerge,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly state: DemoState;
  readonly reducedMotion: boolean;
  readonly flat: boolean;
  readonly onMerge: (cell: string) => void;
}) {
  const ids = useId().replace(/:/g, "");
  const target = useMemo(() => slotsFor(state.merged), [state.merged]);
  const shown = useMorph(target, String(state.mergeLog.length), lerpSlots, reducedMotion);
  const moving = shown !== target;
  const [drag, setDrag] = useState<{
    readonly id: string;
    readonly cell: string;
    readonly dx: number;
    readonly dy: number;
    readonly pointer: number;
  } | null>(null);
  const m = pack.merge;
  const lastCell = state.mergeLog[state.mergeLog.length - 1];

  const point = (event: PointerEvent<SVGElement>) => {
    const matrix = (event.currentTarget.ownerSVGElement ?? (event.currentTarget as SVGSVGElement)).getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const inverse = matrix.inverse();
    return {
      x: inverse.a * event.clientX + inverse.c * event.clientY + inverse.e,
      y: inverse.b * event.clientX + inverse.d * event.clientY + inverse.f,
    };
  };

  const startDrag = (slot: Slot) => (event: PointerEvent<SVGRectElement>) => {
    if (event.button !== 0 || slot.alive < 1 || mergesLeft(state, slot.cell) <= 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const p = point(event);
    setDrag({
      id: slot.row.id,
      cell: slot.cell,
      dx: p.x - (slot.rect.x + SIDE / 2),
      dy: p.y - (slot.rect.y + SIDE / 2),
      pointer: event.pointerId,
    });
  };
  const moveDrag = (event: PointerEvent<SVGRectElement>) => {
    if (!drag || drag.pointer !== event.pointerId) return;
    const p = point(event);
    const slot = target.find((item) => item.row.id === drag.id);
    if (!slot) return;
    setDrag({
      ...drag,
      dx: p.x - (slot.rect.x + SIDE / 2),
      dy: p.y - (slot.rect.y + SIDE / 2),
    });
  };
  const endDrag = (event: PointerEvent<SVGRectElement>) => {
    if (!drag || drag.pointer !== event.pointerId) return;
    const slot = target.find((item) => item.row.id === drag.id);
    setDrag(null);
    if (!slot) return;
    const cx = slot.rect.x + SIDE / 2 + drag.dx;
    const cy = slot.rect.y + SIDE / 2 + drag.dy;
    const moved = Math.hypot(drag.dx, drag.dy) > 4;
    const twin = target.find(
      (item) => item.cell === slot.cell && item.row.id !== slot.row.id && item.alive >= 1 && Math.hypot(item.rect.x + SIDE / 2 - cx, item.rect.y + SIDE / 2 - cy) < MERGE_REACH,
    );
    if (twin || !moved) onMerge(slot.cell);
  };

  const cellKeyDown = (cell: string) => (event: KeyboardEvent<SVGGElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onMerge(cell);
  };

  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="w02-merge" data-flat={flat ? "" : undefined} role="group" aria-label={m.grid}>
      <defs>
        <filter id={`goo-${ids}`} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -6" />
        </filter>
        <PebbleDefs ids={ids} />
      </defs>
      {MACHINES.map((machine) => (
        <text key={machine} x={colX(machine) + 4} y={12} className="w02-merge-head">
          {machine.replace("M-", "M")}
        </text>
      ))}
      {SEP_WEEKS.map((week) => (
        <g key={week}>
          <line x1={LABEL_W - 4} x2={VIEW.w} y1={rowY(week)} y2={rowY(week)} className="w02-merge-rule" />
          <text x={0} y={rowY(week) + ROW_H / 2 + 4} className="w02-merge-week">
            {fmt.n(Number(week.slice(8, 10)))}.{fmt.n(Number(week.slice(5, 7)))}.
          </text>
        </g>
      ))}
      {CELLS.map((cell) => {
        const key = cellKey(cell.machine, cell.date);
        const left = mergesLeft(state, key);
        const merged = state.merged[key] ?? 0;
        const slots = shown.filter((slot) => slot.cell === key);
        const twins = cell.rows.length > 1;
        const gooing = !reducedMotion && !flat && moving && lastCell === key;
        const label = fmt.t(left > 0 ? m.mergeCell : merged > 0 ? m.cellMerged : m.cell, {
          machine: cell.machine,
          date: fmt.date(cell.date),
          n: cell.rows.length,
        });
        return (
          <g
            key={key}
            className="w02-cell"
            data-twins={twins ? "" : undefined}
            data-cell={key}
            data-lifted={drag?.cell === key ? "" : undefined}
            role={twins ? "button" : undefined}
            tabIndex={twins ? 0 : undefined}
            aria-label={twins ? label : undefined}
            aria-disabled={twins && left === 0 ? true : undefined}
            onKeyDown={twins ? cellKeyDown(key) : undefined}
          >
            {twins ? (
              <rect
                x={colX(cell.machine) + 1}
                y={rowY(cell.date) + 2}
                width={(VIEW.w - LABEL_W) / MACHINES.length - 2}
                height={ROW_H - 4}
                rx={8}
                className="w02-cell-plate"
                onPointerUp={() => (left > 0 ? onMerge(key) : undefined)}
              />
            ) : null}
            <g filter={gooing ? `url(#goo-${ids})` : undefined}>
              {slots.map((slot) => {
                const lifted = drag?.id === slot.row.id;
                const x = slot.rect.x + (lifted ? drag.dx : 0);
                const y = slot.rect.y + (lifted ? drag.dy : 0);
                return (
                  <GlassPebble
                    key={slot.row.id}
                    rect={{ x, y, w: slot.rect.w, h: slot.rect.h }}
                    scrap={slot.row.scrap}
                    ids={ids}
                    flat={flat}
                    lifted={lifted}
                    style={{ opacity: slot.alive }}
                    onPointerDown={startDrag(slot)}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={() => setDrag(null)}
                  />
                );
              })}
            </g>
            {merged > 0 ? (
              <text x={colX(cell.machine) + 4 + (cell.rows.length - merged) * (SIDE + GAP)} y={rowY(cell.date) + ROW_H / 2 + 4} className="w02-cell-mark">
                {fmt.t(m.merged, { n: merged + 1 })}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
