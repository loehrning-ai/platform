"use client";

import { useId, useState, type PointerEvent } from "react";
import { DataHandle, GlasReadout, SvgLens } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { SAME_BAND, type Verdict } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import { nearestChange, SCALE_DOMAIN, SCALE_VIEW, scaleX } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/trays";
import type { Fmt } from "./fmt";
import { lerpNumber, useMorph } from "./use-morph";

export interface ScaleTick {
  readonly id: string;
  readonly change: number;
  readonly verdict: Verdict;
  /** "Bericht" or "ohne Nenner". */
  readonly tag?: string;
  readonly ghost?: boolean;
}

/** The glyph of a verdict (never colour alone): a down triangle, an equals sign, an up triangle. */
export function VerdictGlyph({ verdict, x, y, size = 6 }: { readonly verdict: Verdict; readonly x: number; readonly y: number; readonly size?: number }) {
  if (verdict === "same") {
    return (
      <g className="w02-glyph" data-verdict={verdict}>
        <rect x={x - size} y={y - size * 0.55} width={size * 2} height={size * 0.38} />
        <rect x={x - size} y={y + size * 0.17} width={size * 2} height={size * 0.38} />
      </g>
    );
  }
  const d = verdict === "better" ? `M${x - size} ${y - size * 0.7}h${size * 2}L${x} ${y + size * 0.8}z` : `M${x - size} ${y + size * 0.7}h${size * 2}L${x} ${y - size * 0.8}z`;
  return <path className="w02-glyph" data-verdict={verdict} d={d} />;
}

/**
 * The Antwortskala: change from August to September, zones besser, gleich
 * and schlechter, a tick (with glyph) for every reading the visitor has seen,
 * and the current reading as a lens (DataHandle) that snaps from option to
 * option. Tap anywhere on the band under the axis to pick the nearest option.
 */
export function ScaleView({
  pack,
  fmt,
  options,
  current,
  ticks,
  onPick,
  reducedMotion,
  valueText,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  /** The readings the lens can snap to (their changes), in control order. */
  readonly options: readonly number[];
  /** Index into options. */
  readonly current: number;
  readonly ticks: readonly ScaleTick[];
  readonly onPick: (index: number) => void;
  readonly reducedMotion: boolean;
  /** The lens value as a phrase for screen readers. */
  readonly valueText: string;
}) {
  const contentId = `w02-scale-${useId().replace(/:/g, "")}`;
  const [active, setActive] = useState(false);
  const target = options[current] ?? 0;
  const shown = useMorph(target, String(current), lerpNumber, reducedMotion);
  const x = scaleX(shown);
  const { axis, left, right } = SCALE_VIEW;
  const bandLeft = scaleX(-SAME_BAND.value);
  const bandRight = scaleX(SAME_BAND.value);
  const s = pack.scale;

  const pickAt = (event: PointerEvent<SVGRectElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    const matrix = svg?.getScreenCTM();
    if (!matrix) return;
    const px = matrix.inverse().a * event.clientX + matrix.inverse().c * event.clientY + matrix.inverse().e;
    onPick(nearestChange(options, px));
  };

  return (
    <div className="w02-scale">
      <p className="w02-scale-title" aria-hidden="true">
        {s.title}
      </p>
      <svg viewBox={`0 0 ${SCALE_VIEW.w} ${SCALE_VIEW.h}`} className="w02-scale-svg" role="group" aria-label={s.title}>
        <g id={contentId}>
          <rect x={left} y={axis - 10} width={bandLeft - left} height={20} rx={10} className="w02-zone" data-zone="better" />
          <rect x={bandLeft} y={axis - 10} width={bandRight - bandLeft} height={20} className="w02-zone" data-zone="same" />
          <rect x={bandRight} y={axis - 10} width={right - bandRight} height={20} rx={10} className="w02-zone" data-zone="worse" />
          <text x={left + 4} y={12} className="w02-zone-label">
            {s.zones.better}
          </text>
          <text x={(bandLeft + bandRight) / 2} y={12} className="w02-zone-label" textAnchor="middle">
            {s.zones.same}
          </text>
          <text x={right - 4} y={12} className="w02-zone-label" textAnchor="end">
            {s.zones.worse}
          </text>
          <line x1={left} x2={right} y1={axis} y2={axis} className="w02-axis" />
          <line x1={scaleX(0)} x2={scaleX(0)} y1={axis - 12} y2={axis + 12} className="w02-axis-zero" />
          {ticks.map((tick) => {
            const tx = scaleX(tick.change);
            return (
              <g key={tick.id} className="w02-tick" data-ghost={tick.ghost ? "" : undefined} data-tick={tick.id}>
                <line x1={tx} x2={tx} y1={axis - 8} y2={axis + 8} />
                <VerdictGlyph verdict={tick.verdict} x={tx} y={axis + 17} size={4.5} />
                {tick.tag ? (
                  <text x={tx} y={axis - 13} textAnchor="middle" className="w02-tick-tag">
                    {tick.tag}
                  </text>
                ) : null}
              </g>
            );
          })}
          <text x={left} y={SCALE_VIEW.h - 4} className="w02-axis-label">
            {fmt.pct(SCALE_DOMAIN.min, 0)}
          </text>
          <text x={scaleX(0)} y={SCALE_VIEW.h - 4} className="w02-axis-label" textAnchor="middle">
            {fmt.pct(0, 0).replace(/^[+]/, "")}
          </text>
          <text x={right} y={SCALE_VIEW.h - 4} className="w02-axis-label" textAnchor="end">
            {fmt.pct(SCALE_DOMAIN.max, 0)}
          </text>
        </g>
        <rect x={left - 8} y={axis + 6} width={right - left + 16} height={SCALE_VIEW.h - axis - 6} className="w02-tapband" onPointerUp={pickAt} aria-hidden="true" />
        <SvgLens contentId={contentId} cx={x} cy={axis} r={20} visible={active} />
        <DataHandle
          x={x}
          y={axis}
          label={s.lensLabel}
          valueText={valueText}
          onActiveChange={setActive}
          onMove={(point) => onPick(nearestChange(options, point.x))}
          onStep={(dx, dy) => {
            const step = dx !== 0 ? dx : dy;
            const next = Math.max(0, Math.min(options.length - 1, current + step));
            if (next !== current) onPick(next);
          }}
        >
          <circle cx={x} cy={axis} r={active ? 0 : 9} className="w02-lens-ring" />
        </DataHandle>
      </svg>
      {active ? (
        <div className="w02-scale-readout" style={{ left: `${(x / SCALE_VIEW.w) * 100}%` }}>
          <GlasReadout hidden popKey={current}>
            {fmt.pct(target)}
          </GlasReadout>
        </div>
      ) : null}
    </div>
  );
}
