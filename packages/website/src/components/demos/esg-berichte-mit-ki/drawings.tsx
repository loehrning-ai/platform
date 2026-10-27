"use client";

import { offsetOf, SLIDER_MAX, TICKS } from "@/lib/demo-cases/esg-berichte-mit-ki/bench";
import { BIO } from "@/lib/demo-cases/esg-berichte-mit-ki/kit";
import type { CalendarDate } from "@/lib/demo-cases/esg-berichte-mit-ki/rules";

/*
 * The two drawings of the shelf card: the 40-hectare field with the claim's
 * outline (Umfang) and the validity ruler with the Stichtag pin (Zeitraum).
 * Drawn in Creme on the field or inside a readout; their meaning is always
 * in the sentence next to them, so the drawings are aria-hidden.
 */

const COLS = 8;
const ROWS = BIO.haTotal / COLS;
const CELL = { w: 26, h: 16, gapX: 4, gapY: 5, x0: 8, y0: 8 };
const cellX = (col: number) => CELL.x0 + col * (CELL.w + CELL.gapX);
const cellY = (row: number) => CELL.y0 + row * (CELL.h + CELL.gapY);
const FIELD_W = cellX(COLS - 1) + CELL.w;
const FIELD_H = cellY(ROWS - 1) + CELL.h;
const CELLAR = { x: FIELD_W + 14, y: CELL.y0, w: 40, h: FIELD_H - CELL.y0 };
export const FIELD_VIEW = { w: CELLAR.x + CELLAR.w + 6, h: FIELD_H + 8 };

/** The 12 certified hectares fill the first cells in reading order. */
const certifiedRows = Math.floor(BIO.haCertified / COLS);
const certifiedRest = BIO.haCertified % COLS;
const M = 4;
const L_SHAPE = [
  `M${CELL.x0 - M} ${CELL.y0 - M}`,
  `H${FIELD_W + M}`,
  `V${cellY(certifiedRows - 1) + CELL.h + CELL.gapY / 2}`,
  `H${cellX(certifiedRest - 1) + CELL.w + M}`,
  `V${cellY(certifiedRows) + CELL.h + M}`,
  `H${CELL.x0 - M}Z`,
].join("");
const ALL = `M${CELL.x0 - M} ${CELL.y0 - M}H${CELLAR.x + CELLAR.w + M}V${FIELD_H + M}H${CELL.x0 - M}Z`;
const CELLAR_RING = `M${CELLAR.x - M} ${CELLAR.y - M}H${CELLAR.x + CELLAR.w + M}V${CELLAR.y + CELLAR.h + M}H${CELLAR.x - M}Z`;

export type FieldOutline = "all" | "part" | "partCellar";

export function FieldDrawing({ outline, cellarLabel, pulse = false }: { readonly outline: FieldOutline; readonly cellarLabel: string; readonly pulse?: boolean }) {
  const cells = Array.from({ length: BIO.haTotal }, (_, index) => ({ index, col: index % COLS, row: Math.floor(index / COLS), on: index < BIO.haCertified }));
  return (
    <svg className="w4-field" viewBox={`0 0 ${FIELD_VIEW.w} ${FIELD_VIEW.h}`} aria-hidden="true" focusable="false" data-outline={outline} data-pulse={pulse ? "" : undefined}>
      {cells.map((cell) => (
        <rect
          key={cell.index}
          x={cellX(cell.col)}
          y={cellY(cell.row)}
          width={CELL.w}
          height={CELL.h}
          rx="4"
          className={cell.on ? "w4-field-on" : "w4-field-off"}
        />
      ))}
      <rect x={CELLAR.x} y={CELLAR.y} width={CELLAR.w} height={CELLAR.h} rx="6" className="w4-field-off w4-field-cellar" />
      <text x={CELLAR.x + CELLAR.w / 2} y={CELLAR.y + CELLAR.h / 2} className="w4-field-cellar-text" textAnchor="middle" dominantBaseline="middle" transform={`rotate(-90 ${CELLAR.x + CELLAR.w / 2} ${CELLAR.y + CELLAR.h / 2})`}>
        {cellarLabel}
      </text>
      <path d={ALL} className="w4-field-outline" data-on={outline === "all" ? "" : undefined} />
      <path d={L_SHAPE} className="w4-field-outline" data-on={outline !== "all" ? "" : undefined} />
      <path d={CELLAR_RING} className="w4-field-outline" data-on={outline === "partCellar" ? "" : undefined} />
    </svg>
  );
}

export const RULER_VIEW = { w: 340, h: 70 };
const R = { x0: 14, x1: 326, bar: 40 };
const rx = (offset: number) => R.x0 + (Math.min(SLIDER_MAX, Math.max(0, offset)) / SLIDER_MAX) * (R.x1 - R.x0);

/**
 * The validity bar from 01.09.2025 to 31.08.2026, the Stichtag pin and the
 * gap between them, labelled with the days (expired) or the days left.
 */
export function RulerDrawing({
  stichtag,
  gapLabel,
  dates,
  showTicks = false,
}: {
  readonly stichtag: CalendarDate;
  readonly gapLabel: string;
  readonly dates: { readonly from: string; readonly until: string; readonly pin: string };
  readonly showTicks?: boolean;
}) {
  const end = rx(TICKS.validUntil);
  const pin = rx(offsetOf(stichtag));
  const expired = pin > end;
  return (
    <svg className="w4-ruler" viewBox={`0 0 ${RULER_VIEW.w} ${RULER_VIEW.h}`} aria-hidden="true" focusable="false" data-expired={expired ? "" : undefined}>
      <line x1={R.x0} x2={R.x1} y1={R.bar} y2={R.bar} className="w4-ruler-axis" />
      <rect x={R.x0} y={R.bar - 5} width={end - R.x0} height="10" rx="5" className="w4-ruler-valid" />
      {showTicks ? (
        <>
          <line x1={rx(TICKS.banDate)} x2={rx(TICKS.banDate)} y1={R.bar - 9} y2={R.bar + 9} className="w4-ruler-tick" />
          <line x1={rx(TICKS.renewal)} x2={rx(TICKS.renewal)} y1={R.bar - 9} y2={R.bar + 9} className="w4-ruler-tick" data-lit={offsetOf(stichtag) > TICKS.renewal ? "" : undefined} />
        </>
      ) : null}
      {expired ? <line x1={end + 3} x2={pin - 3} y1={R.bar} y2={R.bar} className="w4-ruler-gap" /> : null}
      <text x={expired ? (end + pin) / 2 : Math.min(pin, end - 40) + 4} y={R.bar - 12} className="w4-ruler-gap-text" textAnchor={expired ? "middle" : "start"}>
        {gapLabel}
      </text>
      <circle cx={pin} cy={R.bar} r="7" className="w4-ruler-pin" />
      <text x={R.x0} y={R.bar + 24} className="w4-ruler-date">
        {dates.from}
      </text>
      <text x={end} y={R.bar + 24} className="w4-ruler-date" textAnchor={end > R.x1 - 60 ? "end" : "middle"}>
        {dates.until}
      </text>
      <text x={Math.min(Math.max(pin, R.x0 + 30), R.x1 - 30)} y={14} className="w4-ruler-pin-text" textAnchor="middle">
        {dates.pin}
      </text>
    </svg>
  );
}
