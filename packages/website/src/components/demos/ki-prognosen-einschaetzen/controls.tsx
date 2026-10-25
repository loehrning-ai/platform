"use client";

import {
  useId,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import {
  fill,
  formatNumber,
} from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";

const PRESETS = [1, 3, 9] as const;

export function captionFor(short: number, copy: DemoPack): string {
  const captions = copy.chart.captions;
  if (short >= 70) return captions.threeQuarters;
  if (short >= 56) return captions.moreThanHalf;
  if (short >= 45) return captions.half;
  if (short > 10) return captions.lessThanHalf;
  return captions.rare;
}

export interface StatsValues {
  readonly avgShort: number;
  readonly avgLeft: number;
}

/**
 * The two averages. On a wide screen they sit under the count (reserved from
 * the start, so nothing moves when layer 2 arrives); on a phone the count
 * keeps the chart high, so they sit in the Waage panel instead.
 */
export function Stats({
  copy,
  stats,
  where,
}: {
  readonly copy: DemoPack;
  readonly stats: StatsValues | null;
  readonly where: "rail" | "waage";
}) {
  const n = (value: number) => formatNumber(value, copy.locale);
  return (
    <dl
      className={`hw-stats hw-stats-${where}`}
      aria-hidden="true"
      data-on={stats ? "" : undefined}
    >
      <div>
        <dd>{stats ? n(stats.avgShort) : "\u00a0"}</dd>
        <dt>{copy.chart.statShort}</dt>
      </div>
      <div>
        <dd>{stats ? n(stats.avgLeft) : "\u00a0"}</dd>
        <dt>{copy.chart.statLeft}</dt>
      </div>
    </dl>
  );
}

export function Counter({
  copy,
  short,
  own,
  stats,
  settled,
}: {
  readonly copy: DemoPack;
  readonly short: number;
  /** False while the staircase is still growing: no verdict yet. */
  readonly settled: boolean;
  readonly own: boolean;
  /** Present from layer 2 on. */
  readonly stats: {
    readonly avgShort: number;
    readonly avgLeft: number;
  } | null;
}) {
  return (
    <div className="hw-counter" data-hw-counter="">
      <div className="hw-counter-row" aria-hidden="true">
        <p className="hw-big">
          <span
            className="hw-count"
            data-hw-count=""
            data-low={short < 10 ? "" : undefined}
          >
            {short}
          </span>
          <span className="hw-count-of">/ 100</span>
        </p>
        <div className="hw-count-text">
          <p className="hw-count-label">{copy.chart.counterLabel}</p>
          <p className="hw-caption">
            <span style={settled ? undefined : { visibility: "hidden" }}>
              {captionFor(short, copy)}
            </span>
            {own ? (
              <span className="hw-badge">{copy.chart.badgeOwn}</span>
            ) : null}
          </p>
        </div>
      </div>
      <Stats copy={copy} stats={stats} where="rail" />
    </div>
  );
}

export interface Chip {
  readonly id: string;
  readonly name: string;
  readonly value: number;
  readonly short: number;
}

export function SnapChips({
  copy,
  chips,
  cap,
  onPick,
}: {
  readonly copy: DemoPack;
  readonly chips: readonly Chip[];
  readonly cap: number;
  readonly onPick: (chip: Chip) => void;
}) {
  const n = (value: number) => formatNumber(value, copy.locale);
  return (
    <div
      className="hw-chips"
      role="group"
      aria-label={copy.controls.chipsLabel}
      style={{ "--hw-chips": chips.length } as CSSProperties}
    >
      {chips.map((chip) => {
        const active = Math.abs(chip.value - cap) < 0.5;
        return (
          <button
            key={chip.id}
            type="button"
            className="hw-chip"
            data-hw-chip={chip.id}
            aria-pressed={active}
            onClick={() => onPick(chip)}
          >
            <span className="hw-chip-name">{chip.name}</span>
            <span className="hw-chip-value">{n(chip.value)}</span>
            <span className="hw-chip-count">
              {fill(copy.controls.chipCount, { n: chip.short })}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Waage({
  copy,
  ratio,
  optimum,
  stats,
  onPick,
}: {
  readonly copy: DemoPack;
  readonly stats: StatsValues;
  readonly ratio: number;
  readonly optimum: number;
  readonly onPick: (ratio: number) => void;
}) {
  const titleId = useId().replace(/:/g, "");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = PRESETS.findIndex((preset) => preset === ratio);
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = (index + delta + PRESETS.length) % PRESETS.length;
    refs.current[next]?.focus();
    onPick(PRESETS[next] as number);
  };
  return (
    <section
      className="hw-waage hw-reveal"
      data-hw-waage=""
      aria-labelledby={`${titleId}-t`}
    >
      <h2 id={`${titleId}-t`} className="hw-h3">
        {copy.controls.waageTitle}
      </h2>
      <p className="hw-waage-lead">{copy.controls.waageLead}</p>
      <div
        className="hw-seg"
        role="radiogroup"
        aria-label={copy.controls.waageLabel}
      >
        {PRESETS.map((preset, index) => (
          <button
            key={preset}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={preset === ratio}
            tabIndex={
              preset === ratio || (selected === -1 && index === 0) ? 0 : -1
            }
            className="hw-seg-btn"
            onClick={() => onPick(preset)}
            onKeyDown={(event) => move(event, index)}
          >
            {preset}x
          </button>
        ))}
      </div>
      <p className="hw-waage-tail">{copy.controls.waageTail}</p>
      <Stats copy={copy} stats={stats} where="waage" />
      <p className="hw-waage-best">
        {fill(copy.controls.waageDiamond, {
          opt: formatNumber(Math.round(optimum), copy.locale),
          r: formatNumber(ratio, copy.locale, 1),
        })}
      </p>
    </section>
  );
}

export interface StripCell {
  readonly label: string;
  readonly short: number;
}

export function WeekStrip({
  copy,
  cells,
  w,
  onScrub,
  onPick,
  onRelease,
}: {
  readonly copy: DemoPack;
  readonly cells: readonly StripCell[];
  /** Continuous week position 0..6. */
  readonly w: number;
  readonly onScrub: (w: number) => void;
  readonly onPick: (index: number) => void;
  readonly onRelease: (w: number) => void;
}) {
  const down = useRef(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const at = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const raw = ((event.clientX - box.left) / box.width) * cells.length - 0.5;
    return Math.min(cells.length - 1, Math.max(0, raw));
  };
  const selected = Math.round(w);
  const key = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = Math.min(cells.length - 1, Math.max(0, index + delta));
    refs.current[next]?.focus();
    onPick(next);
  };
  return (
    <section className="hw-strip-wrap hw-reveal" data-hw-strip="">
      <p className="hw-strip-label">{copy.controls.stripLabel}</p>
      <div
        className="hw-strip"
        role="radiogroup"
        aria-label={copy.controls.stripLabel}
        onPointerDown={(event) => {
          down.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          onScrub(at(event));
        }}
        onPointerMove={(event) => down.current && onScrub(at(event))}
        onPointerUp={(event) => {
          if (!down.current) return;
          down.current = false;
          onRelease(at(event));
        }}
        onPointerCancel={() => {
          down.current = false;
        }}
      >
        {cells.map((cell, index) => (
          <button
            key={cell.label}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={index === selected}
            tabIndex={index === selected ? 0 : -1}
            aria-label={fill(copy.controls.stripCell, {
              week: cell.label,
              n: cell.short,
            })}
            className="hw-cell"
            onKeyDown={(event) => key(event, index)}
            onClick={(event) => {
              if (event.detail === 0) onPick(index);
            }}
          >
            <span className="hw-cell-label">{cell.label}</span>
            <span className="hw-cell-bar" aria-hidden="true">
              <span style={{ height: `${cell.short}%` }} />
            </span>
            <span className="hw-cell-count">{cell.short}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
