"use client";

import { useId, useMemo, type KeyboardEvent, type PointerEvent } from "react";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import type { NcrRow } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { numerator, unitsShipped, type Counter, type Denom, type Month } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import { lerpRect, type Rect } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/treemap";
import { nearestPebble, TRAY_VIEW, trayLayout, type Pebble, type TrayLayout } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/trays";
import type { Fmt } from "./fmt";
import { GlassPebble, PebbleDefs } from "./pebble";
import { useMorph } from "./use-morph";

interface Shown {
  readonly trays: Readonly<Record<Month, Rect>>;
  readonly fill: Readonly<Record<Month, number>>;
  readonly rects: readonly Rect[];
  readonly ghost: readonly number[];
}

const MONTHS: readonly Month[] = ["aug", "sep"];

function toShown(layout: TrayLayout): Shown {
  return {
    trays: layout.trays,
    fill: layout.fill,
    rects: layout.pebbles.map((pebble) => pebble.rect),
    ghost: layout.pebbles.map((pebble) => (pebble.ghost ? 1 : 0)),
  };
}

function lerpShown(a: Shown, b: Shown, t: number): Shown {
  return {
    trays: {
      aug: lerpRect(a.trays.aug, b.trays.aug, t),
      sep: lerpRect(a.trays.sep, b.trays.sep, t),
    },
    fill: {
      aug: a.fill.aug + (b.fill.aug - a.fill.aug) * t,
      sep: a.fill.sep + (b.fill.sep - a.fill.sep) * t,
    },
    rects: b.rects.map((rect, index) => lerpRect(a.rects[index] ?? rect, rect, t)),
    ghost: b.ghost.map((value, index) => (a.ghost[index] ?? value) + (value - (a.ghost[index] ?? value)) * t),
  };
}

function svgPoint(event: PointerEvent<SVGSVGElement>): { x: number; y: number } | null {
  const matrix = event.currentTarget.getScreenCTM();
  if (!matrix) return null;
  const inverse = matrix.inverse();
  return {
    x: inverse.a * event.clientX + inverse.c * event.clientY + inverse.e,
    y: inverse.b * event.clientX + inverse.d * event.clientY + inverse.f,
  };
}

/**
 * The two month trays with one glass pebble per record. A tap opens the
 * record's row (nearest pebble within 22 units); each tray is one focusable
 * button for the keyboard. Counter and Nenner morph the layout with the
 * smooth spring (reduced motion: a jump).
 */
export function TraysView({
  pack,
  fmt,
  counter,
  denom,
  reducedMotion,
  flat,
  resting,
  selected,
  onSelect,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly counter: Counter;
  readonly denom: Denom;
  readonly reducedMotion: boolean;
  /** Solid mode (reduced transparency, more contrast): flat fills, no rim. */
  readonly flat: boolean;
  /** Before the guess: the pebbles rest low and faint. */
  readonly resting?: boolean;
  readonly selected?: string | null;
  readonly onSelect: (row: NcrRow) => void;
}) {
  const ids = useId().replace(/:/g, "");
  const layout = useMemo(() => trayLayout(counter, denom), [counter, denom]);
  const target = useMemo(() => toShown(layout), [layout]);
  const shown = useMorph(target, `${counter}/${denom}`, lerpShown, reducedMotion);
  const t = pack.trays;

  const onPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    const point = svgPoint(event);
    if (!point) return;
    const pebbles: Pebble[] = layout.pebbles.map((pebble, index) => ({
      ...pebble,
      rect: shown.rects[index] ?? pebble.rect,
    }));
    const hit = nearestPebble(pebbles, point.x, point.y);
    if (hit) onSelect(hit.row);
  };
  const onTrayKey = (month: Month) => (event: KeyboardEvent<SVGGElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const first = layout.pebbles.find((pebble) => pebble.month === month);
    if (first) onSelect(first.row);
  };

  return (
    <svg
      viewBox={`0 0 ${TRAY_VIEW.w} ${TRAY_VIEW.h}`}
      className="w02-trays"
      data-flat={flat ? "" : undefined}
      data-resting={resting ? "" : undefined}
      onPointerUp={onPointerUp}
      role="group"
      aria-label={fmt.t(pack.stageLabel)}
    >
      <defs>
        <PebbleDefs ids={ids} />
      </defs>
      {MONTHS.map((month) => {
        const tray = shown.trays[month];
        const units = unitsShipped(month);
        return (
          <g
            key={month}
            className="w02-tray"
            data-month={month}
            role="button"
            tabIndex={0}
            aria-label={`${fmt.t(t.month, { month: pack.monthOf[month], units: fmt.n(units) })}. ${fmt.t(t.records, { n: numerator("records", month) })}`}
            onKeyDown={onTrayKey(month)}
          >
            <text x={tray.x + 2} y={12} className="w02-tray-month">
              {fmt.t(t.month, {
                month: pack.monthOf[month],
                units: fmt.n(units),
              })}
            </text>
            <text x={tray.x + 2} y={25} className="w02-tray-units">
              {fmt.t(t.records, { n: numerator("records", month) })}
            </text>
            <rect x={tray.x} y={tray.y} width={tray.w} height={tray.h} rx={12} className="w02-tray-glass" />
            {layout.grid[month].map((x, index) => (
              <line key={index} x1={x} x2={x} y1={tray.y + 4} y2={tray.y + tray.h - 4} className="w02-tray-grid" />
            ))}
            <line x1={tray.x + 6} x2={tray.x + tray.w - 6} y1={tray.y + tray.h - 4 - shown.fill[month]} y2={tray.y + tray.h - 4 - shown.fill[month]} className="w02-tray-level" />
            <rect x={tray.x + 0.5} y={tray.y + 0.5} width={tray.w - 1} height={tray.h - 1} rx={11.5} fill="none" stroke={`url(#rim-${ids})`} className="w02-tray-rim" />
          </g>
        );
      })}
      <g className="w02-pebbles" aria-hidden="true">
        {layout.pebbles.map((pebble, index) => {
          const rect = shown.rects[index] ?? pebble.rect;
          const ghost = shown.ghost[index] ?? 0;
          const isSelected = selected === pebble.row.id;
          return (
            <g
              key={pebble.row.id}
              className="w02-pebble"
              data-scrap={pebble.row.scrap ? "" : undefined}
              data-selected={isSelected ? "" : undefined}
              style={{ opacity: 1 - ghost * 0.82 }}
            >
              <GlassPebble rect={rect} scrap={pebble.row.scrap} ids={ids} flat={flat} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
