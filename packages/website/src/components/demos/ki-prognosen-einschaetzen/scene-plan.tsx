"use client";

import { DataHandle, SvgLens } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { bufferCost } from "@/lib/demo-cases/ki-prognosen-einschaetzen/derive";
import { fill, formatDay } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import type { Costs, PlanModel } from "@/lib/demo-cases/ki-prognosen-einschaetzen/model";
import { euro2, jars } from "./helpers";
import { linear, linePath, Readline, SceneFrame, usePlotSize } from "./plot";

const JAR_W = 7;
const JAR_H = 9;
const EDGE = 6;

/** The whole-jar buffers the line can take: a little past the smallest and the largest error. */
export function bufferDomain(plan: PlanModel): readonly [number, number] {
  const errors = plan.errors;
  return [Math.floor(errors[0] ?? 0) - EDGE, Math.ceil(errors[errors.length - 1] ?? 0) + EDGE];
}

/** The cost curve's y range, shared by both cost settings so the curve morphs instead of rescaling. */
export function curveMax(plan: PlanModel, costs: readonly Costs[]): number {
  const [lo, hi] = bufferDomain(plan);
  let max = 1;
  for (const c of costs) max = Math.max(max, bufferCost(plan.errors, c.cu, c.co, lo), bufferCost(plan.errors, c.cu, c.co, hi));
  return max;
}

function curvePath(plan: PlanModel, costs: Costs, from: number, to: number, x: (b: number) => number, y: (v: number) => number): string {
  const points: (readonly [number, number])[] = [];
  for (let b = from; b <= to; b += 1) points.push([x(b), y(bufferCost(plan.errors, costs.cu, costs.co, b))]);
  return linePath(points);
}

/**
 * Scene 4, "Die Planzahl": the 26 errors before the plan week as jars, from
 * the biggest leftover on the left to the biggest shortfall on the right.
 * The visitor drags the order line along them: jars right of it would not
 * have been enough (hollow), jars left of it are left over (filled). Under
 * the row, the cost of each buffer over those 26 weeks draws itself where
 * the finger went; after the first release the whole curve fills in, with
 * its lowest point. The line is a lens while held.
 */
export function ScenePlan({
  copy,
  plan,
  costs,
  yMax,
  buffer,
  visited,
  full,
  onBuffer,
  onCommit,
  onActive,
  active,
  costNote,
}: {
  readonly copy: DemoPack;
  readonly plan: PlanModel;
  readonly costs: Costs;
  readonly yMax: number;
  readonly buffer: number;
  readonly visited: readonly [number, number];
  readonly full: boolean;
  readonly onBuffer: (buffer: number) => void;
  readonly onCommit: (share: number) => void;
  /** Stable (a state setter). */
  readonly onActive: (active: boolean) => void;
  readonly active: boolean;
  /** What one missing and one leftover jar cost, and why: the two numbers the curve is made of. */
  readonly costNote: string;
}) {
  const locale = copy.locale;
  const [plotRef, { width, height }] = usePlotSize();
  const [lo, hi] = bufferDomain(plan);
  const x = linear(lo, hi, 16, width - 16);
  const jarsBottom = Math.round(height * 0.42);
  const curveTop = jarsBottom + 22;
  const curveBottom = height - 18;
  const y = linear(0, yMax, curveBottom, curveTop);
  const cost = bufferCost(plan.errors, costs.cu, costs.co, buffer);
  const q = plan.forecast + buffer;

  // Jars stacked per pixel bin, so equal errors sit on top of each other.
  const bins = new Map<number, number>();
  const jarsAt = plan.errors.map((error) => {
    const bin = Math.round(x(error) / (JAR_W + 1));
    const level = bins.get(bin) ?? 0;
    bins.set(bin, level + 1);
    return { error, cx: bin * (JAR_W + 1), level };
  });
  const lineX = x(buffer);
  const handleY = y(cost);
  const readout = fill(copy.s4.readout, { q: jars(q, locale), cost: euro2(cost, locale) });
  const from = full ? lo : Math.max(lo, Math.min(visited[0], buffer));
  const to = full ? hi : Math.min(hi, Math.max(visited[1], buffer));

  return (
    <SceneFrame
      head={
        <>
          <Readline className="w01-costs">{costNote}</Readline>
          <Readline live className="w01-tabular">
            {readout}
          </Readline>
        </>
      }
      plotRef={plotRef}
    >
      <svg width={width} height={height} className="w01-svg" role="img" aria-label={copy.s4.term}>
        <text x={4} y={12} className="w01-label">
          {copy.s4.left}
        </text>
        <text x={width - 4} y={12} textAnchor="end" className="w01-label">
          {copy.s4.short}
        </text>
        <g id="w01-jars">
          {jarsAt.map((jar, index) => (
            <rect
              key={index}
              x={jar.cx - JAR_W / 2}
              y={jarsBottom - (jar.level + 1) * (JAR_H + 1)}
              width={JAR_W}
              height={JAR_H}
              rx={2}
              className={jar.error > buffer ? "w01-jar is-short" : "w01-jar"}
            />
          ))}
        </g>
        <path className="w01-zero" d={`M${x(0).toFixed(1)} 18V${curveBottom}`} strokeDasharray="3 3" />
        <text x={x(0)} y={12} textAnchor="middle" className="w01-label is-tick">
          {`${jars(plan.forecast, locale)}`}
        </text>
        <path className="w01-curve" d={curvePath(plan, costs, from, to, x, y)} />
        {full ? (
          <g className="w01-lowest" aria-hidden="true">
            <circle cx={x(plan.argmin)} cy={y(plan.argminCost)} r={5} />
            <text x={x(plan.argmin)} y={y(plan.argminCost) + 18} textAnchor="middle" className="w01-label is-strong">
              {`${copy.s4.lowest}: ${jars(plan.forecast + plan.argmin, locale)}, ${euro2(plan.argminCost, locale)}`}
            </text>
          </g>
        ) : null}
        <DataHandle
          x={lineX}
          y={handleY}
          label={fill(copy.s4.handleLabel, { date: formatDay(plan.week, locale, true) })}
          valueText={fill(copy.s4.handleValue, { q: jars(q, locale), cost: euro2(cost, locale) })}
          fill="#fceeaf"
          onMove={(point) => onBuffer(Math.min(hi, Math.max(lo, Math.round(lo + ((point.x - 16) / Math.max(1, width - 32)) * (hi - lo)))))}
          onStep={(dx, dy, big) => onBuffer(Math.min(hi, Math.max(lo, buffer + (dx || dy) * (big ? 10 : 1))))}
          onActiveChange={onActive}
          onCommit={() => onCommit(lineX / width)}
        >
          <path className="w01-orderline" d={`M${lineX.toFixed(1)} 16V${curveBottom}`} />
        </DataHandle>
        <SvgLens contentId="w01-jars" cx={lineX} cy={jarsBottom - 14} r={36} visible={active} />
      </svg>
      {active ? (
        <div className="w01-float" style={{ left: `${Math.min(width - 90, Math.max(90, lineX))}px` }} aria-hidden="true">
          {readout}
        </div>
      ) : null}
    </SceneFrame>
  );
}
