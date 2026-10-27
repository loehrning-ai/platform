"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { GlasReadout, pushEscapeLayer, ESCAPE_PRIORITY, SvgLens, useGlas, useSpringValue } from "@/components/demos/glas";
import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { EXPORT_ROWS } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import { OPENING_BIG_STEP, OPENING_MAX, OPENING_STEP } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/demo-state";
import { EDGE_STARTS, monthlyTotals } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/logic";
import type { Fmt } from "./fmt";
import { columns, ghostLevels, levelsFor, MONTHS_2026, PLOT, QUARTER_MONTHS, surfacePath, valueAt, VIEW, waterPath, y, Y_MAX, type Column } from "./tub-geometry";

/** Height of the two file strips under the vessel, in SVG units. */
const STRIP = { exportTop: 218, exportH: 30, lowerTop: 252, lowerH: 18 } as const;
export const TUB_VIEW = { w: VIEW.w, h: 274 } as const;
/** The view box height without the file strips: the vessel and its month labels only. */
const BARE_H = 216;
/** A touch area is never smaller than this, in screen pixels (Apple HIG). */
const MIN_TOUCH = 44;
const MONTH_CHANGES = [...monthlyTotals(EXPORT_ROWS).values()];
const GRID = [100_000, 200_000, 300_000, 400_000];

export interface TubGeometry {
  readonly cols: readonly Column[];
  readonly col: (month: string) => Column | undefined;
  readonly levels: ReadonlyMap<string, number | null>;
  /** A screen point in the SVG's own units. */
  readonly toSvg: (clientX: number, clientY: number) => { readonly x: number; readonly y: number };
  /**
   * An HTML box over an SVG rectangle, in pixels inside the tub, at least
   * MIN_TOUCH on each side. Touch areas are HTML because Chrome ignores
   * touch-action on SVG children, so a drag there would scroll the page.
   */
  readonly box: (x: number, y: number, w: number, h: number) => CSSProperties;
  /** True on a phone: larger labels, fewer pills. */
  readonly phone: boolean;
}

export interface TubProps {
  readonly pack: Pack;
  readonly fmt: Fmt;
  /** The level at the end of December 2025. */
  readonly opening: number;
  /** How far the file's left edge is pulled back: 0 (January 2026) to 12 (January 2025). */
  readonly edge: number;
  /** Show the wide axis (2025 included). */
  readonly wide: boolean;
  /** Claude's table as a dashed ghost line. */
  readonly ghost: boolean;
  /** Hides the quarter's level pills and band name (a stacked pour draws its own sum there). */
  readonly hidePills?: boolean;
  /** The brackets between the ghost and the water in the quarter. */
  readonly brackets?: boolean;
  /** Read amount as a level (scene 2, "Mehr dazu"): the water becomes each month's change. */
  readonly asLevel?: boolean;
  /** Water line handle (scene 2 move 1, free play); `snap` is true for a drag, false for a key. */
  readonly onOpening?: (value: number, snap: boolean) => void;
  /** File edge handle (scene 2 move 2, free play). */
  readonly onEdge?: (edge: number) => void;
  /** The handle the computation has taken over: the readout says so. */
  readonly computed?: boolean;
  /** The datum held right now, as a share of the tub (for the field's Mennige pool). */
  readonly onHold?: (point: { readonly x: number; readonly y: number } | null) => void;
  readonly reducedMotion: boolean;
  /** Extra marks drawn with the tub's geometry (the pour, the test marks). */
  readonly layer?: (geometry: TubGeometry) => ReactNode;
  /** HTML over the drawing (the touch areas of the pour). */
  readonly overlay?: (geometry: TubGeometry) => ReactNode;
  /** Hide the strips (scenes that only need the vessel). */
  readonly strips?: boolean;
  readonly label: string;
}

function share(x: number, yy: number) {
  return { x: x / TUB_VIEW.w, y: yy / TUB_VIEW.h };
}

/** Pointer position in the SVG's own units. */
function svgPoint(svg: SVGSVGElement | null | undefined, clientX: number, clientY: number) {
  const matrix = svg?.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const inverse = matrix.inverse();
  return { x: inverse.a * clientX + inverse.c * clientY + inverse.e, y: inverse.b * clientX + inverse.d * clientY + inverse.f };
}

/** The keys of a vertical slider: arrows one step, Page keys a big step, Home to zero, End to the top. */
function sliderKey(key: string, shift: boolean): number | "home" | "end" | null {
  if (key === "Home") return "home";
  if (key === "End") return "end";
  if (key === "PageUp") return OPENING_BIG_STEP;
  if (key === "PageDown") return -OPENING_BIG_STEP;
  if (key === "ArrowUp" || key === "ArrowRight") return shift ? OPENING_BIG_STEP : OPENING_STEP;
  if (key === "ArrowDown" || key === "ArrowLeft") return shift ? -OPENING_BIG_STEP : -OPENING_STEP;
  return null;
}

/**
 * Where each level pill sits. A pill wants to sit just above its water line,
 * never above the rim. Narrow quarter columns (the wide view, or any phone)
 * overlap side by side, so from June backwards each quarter pill moves down
 * until it clears the pill of the month after it: none hides another, even
 * when the rim pushes them all to the top.
 */
export function stackPills(entries: readonly { readonly month: string; readonly level: number | null | undefined }[], height: number, narrow: boolean): Map<string, number> {
  const tops = new Map<string, number>();
  const ceiling = PLOT.t + 12;
  for (const { month, level } of entries) if (level != null) tops.set(month, Math.max(ceiling, y(level) - height - 2));
  if (!narrow) return tops;
  let below: number | null = null;
  for (const month of [...QUARTER_MONTHS].reverse()) {
    const top = tops.get(month);
    if (top == null) continue;
    const placed: number = below === null ? top : Math.max(top, below + height + 2);
    tops.set(month, placed);
    below = placed;
  }
  return tops;
}

/** The keys of the file edge: left pulls it back one month, right forward. */
function edgeKey(key: string): number | "home" | "end" | null {
  if (key === "Home") return "home";
  if (key === "End") return "end";
  if (key === "ArrowLeft" || key === "ArrowDown" || key === "PageDown") return 1;
  if (key === "ArrowRight" || key === "ArrowUp" || key === "PageUp") return -1;
  return null;
}

export function Tub({
  pack,
  fmt,
  opening,
  edge,
  wide,
  ghost,
  hidePills = false,
  brackets = false,
  asLevel = false,
  onOpening,
  onEdge,
  computed = false,
  onHold,
  reducedMotion,
  layer,
  overlay,
  strips = true,
  label,
}: TubProps) {
  const glas = useGlas();
  const flat = glas.mode === "solid";
  const ids = useId().replace(/:/g, "");
  const contentId = `w03-tub-${ids}`;
  const svg = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<null | { kind: "water" | "edge"; x: number; startValue: number }>(null);
  const [chip, setChip] = useState<string | null>(null);
  const [flow, setFlow] = useState<string | null>(null);
  const [desktop, setDesktop] = useState(false);
  const w = { w: TUB_VIEW.w, h: strips ? TUB_VIEW.h : BARE_H };
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(min-width: 64rem)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  // The drawn box of the SVG (it may be letterboxed by max-height), so HTML touch areas sit on the drawing.
  useLayoutEffect(() => {
    const element = svg.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setSize((previous) => (previous.w === rect.width && previous.h === rect.height ? previous : { w: rect.width, h: rect.height }));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const scale = size.w > 0 && size.h > 0 ? Math.min(size.w / w.w, size.h / w.h) : 0;
  const offsetX = (size.w - w.w * scale) / 2;
  const offsetY = (size.h - w.h * scale) / 2;
  const box = (x: number, yy: number, bw: number, bh: number): CSSProperties => {
    const width = Math.max(MIN_TOUCH, bw * scale);
    const height = Math.max(MIN_TOUCH, bh * scale);
    return { left: offsetX + x * scale + (bw * scale - width) / 2, top: offsetY + yy * scale + (bh * scale - height) / 2, width, height };
  };
  const phone = !desktop;

  const wideShare = useSpringValue(wide ? 1 : 0, "smooth", reducedMotion);
  const shown = useSpringValue(opening, "smooth", reducedMotion || drag?.kind === "water");
  const cols = columns(wideShare);
  const col = (month: string) => cols.find((entry) => entry.month === month);
  const start = EDGE_STARTS[edge] ?? "2026-01";
  const levels = asLevel ? asLevelSeries() : levelsFor(shown, start);
  const ghostSeries = ghostLevels();
  const water = waterPath(cols, levels);
  const surface = surfacePath(cols, levels);
  const ghostLine = surfacePath(cols, ghostSeries);
  const refract = desktop && !reducedMotion && !flat;
  const openingY = y(Math.max(0, shown));

  useEffect(() => {
    if (!drag) return;
    return pushEscapeLayer(ESCAPE_PRIORITY.drag, () => {
      if (drag.kind === "water") onOpening?.(drag.startValue, false);
      else onEdge?.(drag.startValue);
      setDrag(null);
      onHold?.(null);
    });
  }, [drag, onEdge, onHold, onOpening]);

  const startDrag = (kind: "water" | "edge") => (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = svgPoint(svg.current, event.clientX, event.clientY);
    setDrag({ kind, x: point.x, startValue: kind === "water" ? opening : edge });
    glas.noteDrag();
    moveDrag(kind, point);
  };

  const moveDrag = (kind: "water" | "edge", point: { x: number; y: number }) => {
    if (kind === "water") {
      const value = Math.min(OPENING_MAX, Math.max(0, valueAt(point.y)));
      onOpening?.(value, true);
      onHold?.(share(point.x, y(value)));
    } else {
      const index = nearestEdge(cols, point.x);
      onEdge?.(index);
      onHold?.(share(point.x, STRIP.exportTop));
    }
  };

  const onMove = (event: PointerEvent<HTMLElement>) => {
    if (!drag) return;
    const point = svgPoint(svg.current, event.clientX, event.clientY);
    setDrag({ ...drag, x: point.x });
    moveDrag(drag.kind, point);
  };

  const endDrag = () => {
    setDrag(null);
    onHold?.(null);
  };

  const onWaterKey = (event: KeyboardEvent<SVGGElement>) => {
    const step = sliderKey(event.key, event.shiftKey);
    if (step === null || !onOpening) return;
    event.preventDefault();
    if (step === "home") onOpening(0, false);
    else if (step === "end") onOpening(OPENING_MAX, false);
    else onOpening(Math.min(OPENING_MAX, Math.max(0, opening + step)), false);
  };

  const onEdgeKey = (event: KeyboardEvent<SVGGElement>) => {
    const step = edgeKey(event.key);
    if (step === null || !onEdge) return;
    event.preventDefault();
    if (step === "home") onEdge(0);
    else if (step === "end") onEdge(EDGE_STARTS.length - 1);
    else onEdge(Math.min(EDGE_STARTS.length - 1, Math.max(0, edge + step)));
  };

  const june = levels.get("2026-06") ?? 0;
  const valueText = fmt.t(pack.wanne.handleText, { opening: fmt.n(Math.round(opening)), june: fmt.n(Math.round(opening + (june - shown))) });
  const edgeText = fmt.t(pack.wanne.edgeText, { month: fmt.month(start), opening: fmt.n(opening) });
  const startCol = col(start);
  const edgeX = startCol ? startCol.x0 : PLOT.l;
  // A phone shows December and the quarter only, so every pill stays readable at its larger size.
  const labelMonths = wideShare > 0.5 || phone ? ["2025-12", ...QUARTER_MONTHS] : ["2025-12", ...MONTHS_2026];
  const pill = phone ? { char: 7.1, h: 18 } : { char: 5.4, h: 13 };
  const pillTops = stackPills(
    labelMonths.map((month) => ({ month, level: levels.get(month) })),
    pill.h,
    wideShare > 0.5 || phone,
  );
  const notchShown = Boolean(onOpening) && !computed && !asLevel && shown < 4_000 && drag === null;
  // The notch label sits over December and January; where January shows its pill, it rises above it.
  const janTop = labelMonths.includes("2026-01") ? pillTops.get("2026-01") : undefined;
  const notchY = janTop == null ? openingY - 15 : Math.min(openingY - 15, janTop - 4);
  const toSvg = (clientX: number, clientY: number) => svgPoint(svg.current, clientX, clientY);
  const geometry: TubGeometry = { cols, col, levels, toSvg, box, phone };
  const chipMonth = chip ? MONTHS_2026.indexOf(chip) : -1;
  const lensX = drag?.kind === "water" ? Math.min(PLOT.r - 20, Math.max(PLOT.l + 20, drag.x)) : 0;

  return (
    <div className="w03-tub" data-flat={flat ? "" : undefined} data-phone={phone ? "" : undefined} data-dragging={drag ? "" : undefined} onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
      <svg ref={svg} viewBox={`0 0 ${w.w} ${w.h}`} className="w03-tub-svg" role="group" aria-label={label}>
        <defs>
          <linearGradient id={`${ids}-rim`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="0.12" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${ids}-wall`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="0.06" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="0.94" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.4" />
          </linearGradient>
          <pattern id={`${ids}-hatch`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" className="w03-hatch-ground" />
            <line x1="0" y1="0" x2="0" y2="5" className="w03-hatch-line" />
          </pattern>
          <clipPath id={`${ids}-water`}>
            <path d={water} />
          </clipPath>
          {refract ? (
            <filter id={`${ids}-refract`} x="0" y="0" width="1" height="1">
              <feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="1" seed="3" />
              <feDisplacementMap in="SourceGraphic" scale="3" />
            </filter>
          ) : null}
        </defs>

        <g id={contentId}>
          <rect x={PLOT.l - 6} y={PLOT.t - 4} width={PLOT.r - PLOT.l + 12} height={PLOT.b - PLOT.t + 8} rx="12" className="w03-vessel" />
          {QUARTER_MONTHS.map((month) => {
            const c = col(month);
            return c ? <rect key={month} x={c.x0} y={PLOT.t} width={c.x1 - c.x0} height={PLOT.b - PLOT.t} className="w03-quarter" /> : null;
          })}
          {GRID.map((value) => (
            <line key={value} x1={PLOT.l} x2={PLOT.r} y1={y(value)} y2={y(value)} className="w03-grid" />
          ))}
          <path d={water} className="w03-water" data-as-level={asLevel ? "" : undefined} />
          {refract ? (
            <g clipPath={`url(#${ids}-water)`} filter={`url(#${ids}-refract)`}>
              {GRID.map((value) => (
                <line key={value} x1={PLOT.l} x2={PLOT.r} y1={y(value)} y2={y(value)} className="w03-grid-water" />
              ))}
            </g>
          ) : null}
          {asLevel ? <BelowFloor cols={cols} levels={levels} hatch={`url(#${ids}-hatch)`} /> : null}
          <path d={surface} className="w03-meniscus" />
          {ghost ? <path d={ghostLine} className="w03-ghost" /> : null}
          <line x1={PLOT.l - 6} x2={PLOT.r + 6} y1={PLOT.b} y2={PLOT.b} className="w03-floor" />
          <rect x={PLOT.l - 6} y={PLOT.t - 4} width={PLOT.r - PLOT.l + 12} height={PLOT.b - PLOT.t + 8} rx="12" fill={`url(#${ids}-wall)`} className="w03-vessel-wall" />
          <rect x={PLOT.l - 6} y={PLOT.t - 4} width={PLOT.r - PLOT.l + 12} height="16" rx="12" fill={`url(#${ids}-rim)`} className="w03-vessel-rim" />
          <text x={PLOT.l - 7} y={y(Y_MAX) + 4} textAnchor="end" className="w03-axis w03-axis-y">
            {fmt.compact(Y_MAX)}
          </text>
          <text x={PLOT.l - 7} y={PLOT.b + 3} textAnchor="end" className="w03-axis w03-axis-y">
            0
          </text>
          {cols.map((c) =>
            c.x1 - c.x0 > 6 && (wideShare < 0.5 || c.month.endsWith("-12") || c.month.endsWith("-06") || c.month === "2025-03" || c.month === "2025-09") ? (
              <text key={c.month} x={(c.x0 + c.x1) / 2} y={PLOT.b + 13} textAnchor="middle" className="w03-axis">
                {wideShare < 0.5 || c.month === "2026-06" || c.month === "2025-06" ? fmt.monthShort(c.month) : `${fmt.monthShort(c.month)} ${c.month.slice(2, 4)}`}
              </text>
            ) : null,
          )}
        </g>

        {(() => {
          const band = col("2026-04");
          const end = col("2026-06");
          // Right-aligned to the vessel's inner edge: in the wide view the band is narrower than its name.
          return band && end && !hidePills ? (
            <text x={PLOT.r - 3} y={PLOT.t + 11} textAnchor="end" className="w03-band-label">
              {pack.wanne.quarterBand}
            </text>
          ) : null;
        })()}

        {brackets && shown >= 15_000 && !asLevel
          ? QUARTER_MONTHS.map((month) => {
              const c = col(month);
              const top = levels.get(month);
              const low = ghostSeries.get(month);
              if (!c || top == null || low == null) return null;
              const x = c.x1 - 5;
              return (
                <g key={month} className="w03-bracket" aria-hidden="true">
                  <path d={`M${x - 3},${y(top)}h3V${y(low)}h-3`} />
                  {month === "2026-05" && wideShare < 0.5 ? (
                    <text x={x - 5} y={(y(top) + y(low)) / 2 + 3} textAnchor="end" className="w03-bracket-label">
                      {fmt.n(Math.round(shown))}
                    </text>
                  ) : null}
                </g>
              );
            })
          : null}

        {!asLevel
          ? labelMonths.map((month) => {
              const c = col(month);
              const level = levels.get(month);
              if (!c || level == null || c.x1 - c.x0 < 8) return null;
              const cx = (c.x0 + c.x1) / 2;
              if (month === "2025-12" && notchShown) return null;
              if (hidePills && QUARTER_MONTHS.includes(month)) return null;
              const text = fmt.n(Math.round(level));
              const width = Math.max(30, text.length * pill.char + 10);
              const top = pillTops.get(month) ?? PLOT.t + 12;
              return (
                <g key={month} className="w03-pill" aria-hidden="true">
                  <rect x={cx - width / 2} y={top} width={width} height={pill.h} rx={pill.h / 2} />
                  <text x={cx} y={top + pill.h * 0.72} textAnchor="middle">
                    {text}
                  </text>
                </g>
              );
            })
          : null}

        {!asLevel && wideShare < 0.5
          ? MONTHS_2026.map((month, index) => {
              const c = col(month);
              const change = MONTH_CHANGES[index] ?? 0;
              const level = levels.get(month);
              if (!c || level == null) return null;
              const x = c.x0 + 4;
              const yy = y(level) + (change < 0 ? -7 : 8);
              return (
                <g
                  key={month}
                  className="w03-flow"
                  data-down={change < 0 ? "" : undefined}
                  role="button"
                  tabIndex={-1}
                  aria-label={fmt.t(pack.wanne.flowLabel, { month: fmt.month(month), change: fmt.eur(change) })}
                  onClick={() => setFlow(flow === month ? null : month)}
                >
                  <rect x={x - 7} y={yy - 9} width="14" height="16" className="w03-hit" />
                  <path d={change < 0 ? `M${x - 3},${yy - 3}l3,4l3,-4` : `M${x - 3},${yy + 1}l3,-4l3,4`} />
                  {flow === month ? (
                    <text x={x + 6} y={yy + 2} className="w03-flow-label">
                      {fmt.eur(change)}
                    </text>
                  ) : null}
                </g>
              );
            })
          : null}

        {layer ? layer(geometry) : null}

        {strips ? (
          <g className="w03-strips">
            {MONTHS_2026.map((month, index) => {
              const c = col(month);
              if (!c) return null;
              const sum = MONTH_CHANGES[index] ?? 0;
              return (
                <g
                  key={month}
                  className="w03-chip"
                  data-pulse={drag?.kind === "water" ? "" : undefined}
                  data-open={chip === month ? "" : undefined}
                  role="button"
                  tabIndex={0}
                  aria-label={fmt.t(pack.wanne.chipLabel, { month: fmt.month(month), sum: fmt.eur(sum) })}
                  aria-pressed={chip === month}
                  onClick={() => setChip(chip === month ? null : month)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setChip(chip === month ? null : month);
                    }
                  }}
                >
                  <rect x={c.x0 + 1.5} y={STRIP.exportTop} width={Math.max(2, c.x1 - c.x0 - 3)} height={STRIP.exportH} rx="7" />
                  {c.x1 - c.x0 > 22 ? (
                    <>
                      <text x={(c.x0 + c.x1) / 2} y={STRIP.exportTop + 12} textAnchor="middle" className="w03-chip-month">
                        {fmt.monthShort(month)}
                      </text>
                      <text x={(c.x0 + c.x1) / 2} y={STRIP.exportTop + 24} textAnchor="middle" className="w03-chip-sum">
                        {sum > 0 ? "+" : ""}
                        {fmt.compact(sum)}
                      </text>
                    </>
                  ) : null}
                </g>
              );
            })}
            {wideShare > 0.02
              ? cols
                  .filter((c) => c.month >= start && c.month < "2026-01" && c.month !== "2024-12")
                  .map((c) => (
                    <rect key={c.month} x={c.x0 + 0.75} y={STRIP.lowerTop} width={Math.max(1, c.x1 - c.x0 - 1.5)} height={STRIP.lowerH} rx="4" fill={`url(#${ids}-hatch)`} className="w03-lower" />
                  ))
              : null}
          </g>
        ) : null}

        {onOpening && !computed && !asLevel ? (
          <g
            className="w03-water-handle"
            role="slider"
            tabIndex={0}
            aria-label={pack.wanne.handleLabel}
            aria-valuemin={0}
            aria-valuemax={OPENING_MAX}
            aria-valuenow={Math.round(opening)}
            aria-valuetext={valueText}
            aria-orientation="vertical"
            data-active={drag?.kind === "water" ? "" : undefined}
            onKeyDown={onWaterKey}
          >
            <rect x={PLOT.l} y={openingY - 22} width={PLOT.r - PLOT.l + 44} height="44" className="w03-band" />
            <line x1={PLOT.l} x2={PLOT.r} y1={openingY} y2={openingY} className="w03-opening-line" />
            <g transform={`translate(${PLOT.r + 22}, ${openingY})`}>
              <rect x="-20" y="-13" width="40" height="26" rx="13" className="w03-grip" />
              <path d="M-6,-4h12M-6,0h12M-6,4h12" className="w03-grip-lines" />
            </g>
          </g>
        ) : null}

        {onEdge && wideShare > 0.5 ? (
          <g
            className="w03-edge-handle"
            role="slider"
            tabIndex={0}
            aria-label={pack.wanne.edgeLabel}
            aria-valuemin={0}
            aria-valuemax={EDGE_STARTS.length - 1}
            aria-valuenow={edge}
            aria-valuetext={edgeText}
            data-active={drag?.kind === "edge" ? "" : undefined}
            onKeyDown={onEdgeKey}
          >
            <rect x={edgeX - 22} y={PLOT.t} width="44" height={STRIP.lowerTop + STRIP.lowerH - PLOT.t} className="w03-band" />
            <line x1={edgeX} x2={edgeX} y1={PLOT.t} y2={STRIP.lowerTop + STRIP.lowerH} className="w03-edge-line" />
            <rect x={edgeX - 7} y={STRIP.exportTop - 4} width="14" height={STRIP.exportH + 8} rx="7" className="w03-grip" />
            <path d={`M${edgeX - 2},${STRIP.exportTop + 8}v14M${edgeX + 2},${STRIP.exportTop + 8}v14`} className="w03-grip-lines" />
          </g>
        ) : null}

        <SvgLens contentId={contentId} cx={lensX} cy={openingY} r={36} scale={1.25} visible={drag?.kind === "water" && !reducedMotion} />
      </svg>

      {scale > 0 && onOpening && !computed && !asLevel ? (
        <span className="w03-grab" data-kind="water" aria-hidden="true" style={box(PLOT.l, openingY - 24, PLOT.r - PLOT.l + 44, 48)} onPointerDown={startDrag("water")} data-w03-grab="water" />
      ) : null}
      {scale > 0 && onEdge && wideShare > 0.5 ? (
        <span className="w03-grab" data-kind="edge" aria-hidden="true" style={box(edgeX - 22, PLOT.t, 44, STRIP.lowerTop + STRIP.lowerH - PLOT.t)} onPointerDown={startDrag("edge")} data-w03-grab="edge" />
      ) : null}
      {scale > 0 && overlay ? overlay(geometry) : null}
      {scale > 0 && notchShown ? (
        <span className="w03-notch" style={{ left: offsetX + (PLOT.l + 4) * scale, bottom: size.h - (offsetY + notchY * scale) }}>
          {pack.wanne.notch}
        </span>
      ) : null}
      {drag?.kind === "water" ? (
        <span className="w03-readout-anchor" style={{ left: offsetX + lensX * scale, top: offsetY + Math.max(PLOT.t + 40, openingY) * scale }}>
          <GlasReadout hidden>{fmt.t(pack.wanne.readout, { opening: fmt.eur(Math.round(opening)) })}</GlasReadout>
        </span>
      ) : null}
      {computed && edge > 0 ? <span className="w03-tub-note">{pack.wanne.readoutComputed}</span> : null}
      {chipMonth >= 0 && chip ? (
        <div className="w03-chip-rows" role="status">
          <strong>{fmt.month(chip)}</strong>
          {EXPORT_ROWS.filter((row) => row.dt.startsWith(chip)).map((row) => (
            <span key={row.segment}>{fmt.t(pack.wanne.chipRows, { segment: row.segment, amount: fmt.eur(row.amount) })}</span>
          ))}
        </div>
      ) : null}

      <table className="sr-only">
        <caption>{pack.wanne.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{pack.wanne.tableMonth}</th>
            <th scope="col">{pack.wanne.tableLevel}</th>
          </tr>
        </thead>
        <tbody>
          {[...levels.entries()]
            .filter(([, level]) => level !== null)
            .map(([month, level]) => (
              <tr key={month}>
                <th scope="row">{fmt.month(month)}</th>
                <td>{fmt.eur(Math.round(level as number))}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

/** "amount" read as a level: the water at each month end is that month's change (scene 2, Mehr dazu). */
function asLevelSeries(): ReadonlyMap<string, number | null> {
  const levels = new Map<string, number | null>([["2025-12", null]]);
  MONTHS_2026.forEach((month, index) => levels.set(month, MONTH_CHANGES[index] ?? 0));
  return levels;
}

/** A negative level drawn below the floor, hatched in Mennige (the month a level cannot be). */
function BelowFloor({ cols, levels, hatch }: { readonly cols: readonly Column[]; readonly levels: ReadonlyMap<string, number | null>; readonly hatch: string }) {
  return (
    <g className="w03-below">
      {cols.map((c) => {
        const level = levels.get(c.month);
        if (level == null || level >= 0) return null;
        const depth = Math.min(16, ((-level / Y_MAX) * (PLOT.b - PLOT.t)) * 4);
        return <rect key={c.month} x={c.x0 + 1} y={PLOT.b} width={c.x1 - c.x0 - 2} height={depth} fill={hatch} className="w03-below-rect" />;
      })}
    </g>
  );
}

function nearestEdge(cols: readonly Column[], x: number): number {
  let best = 0;
  let distance = Number.POSITIVE_INFINITY;
  EDGE_STARTS.forEach((start, index) => {
    const c = cols.find((entry) => entry.month === start);
    if (!c) return;
    const d = Math.abs(c.x0 - x);
    if (d < distance) {
      distance = d;
      best = index;
    }
  });
  return best;
}

