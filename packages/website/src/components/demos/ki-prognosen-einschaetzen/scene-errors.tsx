"use client";

import { useRef, type PointerEvent } from "react";
import { SvgLens } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { runningMeans } from "@/lib/demo-cases/ki-prognosen-einschaetzen/derive";
import { fill } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import { scoredUpTo, type Model } from "@/lib/demo-cases/ki-prognosen-einschaetzen/model";
import { jars } from "./helpers";
import { linear, Readline, SceneFrame, usePlotSize, useScrub } from "./plot";
import { ForecastLine, Playhead, RuleLine, SalesBars, seriesGeometry } from "./series";

const STRIP_GAP = 8;
const LABEL_H = 15;

/** The largest miss of either strip, so both share one scale. */
function maxMiss(model: Model): number {
  const { check } = model;
  let max = 1;
  for (const t of check.wochen) {
    const ist = check.rows[t]!.ist as number;
    const forecast = check.forecast(t);
    const rule = check.rule(t);
    if (forecast !== null) max = Math.max(max, Math.abs(ist - forecast));
    if (rule !== null) max = Math.max(max, Math.abs(ist - rule));
  }
  return max;
}

/**
 * Scene 2, "Die Fehlerliste": the visitor drags time through 2025 and each
 * week's miss drops out of the chart into two strips, the tool's (filled
 * Kalkweiß) and the rule's (Butter outline), signed from a zero line. Weeks
 * after the playhead hang in the chart, invisible, so scrubbing back lifts
 * them back (object constancy). A scrub of more than two weeks per frame
 * places them at once. A tap on a dropped bar opens its CSV line.
 */
export function SceneErrors({
  copy,
  model,
  playhead,
  selected,
  onPlayhead,
  onCommit,
  onSelect,
}: {
  readonly copy: DemoPack;
  readonly model: Model;
  readonly playhead: number;
  readonly selected: number | null;
  readonly onPlayhead: (t: number) => void;
  readonly onCommit: (t: number, share: number) => void;
  readonly onSelect: (t: number) => void;
}) {
  const { check, span } = model;
  const locale = copy.locale;
  const [plotRef, { width, height }] = usePlotSize();
  const last = useRef(playhead);
  const fast = Math.abs(playhead - last.current) > 2;
  last.current = playhead;

  const chartBottom = Math.round(height * 0.44);
  const geometry = seriesGeometry(model, width, 6, chartBottom);
  const { scale } = geometry;
  const scrub = useScrub(scale, onPlayhead, (t) => onCommit(t, scale.x(t) / width));
  const stripH = Math.max(24, (height - chartBottom - STRIP_GAP * 2 - LABEL_H * 2) / 2);
  const toolTop = chartBottom + STRIP_GAP + LABEL_H;
  const ruleTop = toolTop + stripH + STRIP_GAP + LABEL_H;
  const miss = maxMiss(model);
  const toolY = linear(-miss, miss, toolTop + stripH, toolTop);
  const ruleY = linear(-miss, miss, ruleTop + stripH, ruleTop);
  const bar = Math.max(1.5, scale.step * 0.6);
  const scored = new Set(check.wochen);
  const hasForecast = check.hasForecast;

  const n = scoredUpTo(check, playhead);
  const means = runningMeans(check, n);
  const head = (
    <Readline live className="w01-tabular">
      {n > 0 && hasForecast ? fill(copy.s2.counters, { mae: jars(means.forecast, locale), maeRule: jars(means.rule, locale) }) : copy.s2.term}
    </Readline>
  );

  const onStripTap = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box) return;
    const t = scale.at(event.clientX - box.left);
    if (t <= playhead && scored.has(t)) {
      onSelect(t);
      return;
    }
    onPlayhead(t);
    onCommit(t, scale.x(t) / width);
  };
  const ist = check.rows[playhead]?.ist;
  const from = check.rows[span[0] ?? 0]?.woche ?? "";
  const to = check.rows[span[span.length - 1] ?? 0]?.woche ?? "";

  return (
    <SceneFrame head={head} plotRef={plotRef}>
      <svg width={width} height={height} className="w01-svg" role="img" aria-label={fill(copy.chart.label, { from, to })}>
        <g id="w01-chart">
          <SalesBars check={check} weeks={span} geometry={geometry} />
          <RuleLine check={check} weeks={span} geometry={geometry} />
          {hasForecast ? <ForecastLine check={check} weeks={span} geometry={geometry} /> : null}
          <Playhead check={check} t={playhead} geometry={geometry} />
        </g>
        <rect x={0} y={0} width={width} height={chartBottom + 4} className="w01-hit" {...scrub.handlers} />
        <text x={2} y={toolTop - 4} className="w01-label">
          {copy.chart.toolStrip}
        </text>
        <text x={2} y={ruleTop - 4} className="w01-label">
          {copy.chart.ruleStrip}
        </text>
        <path className="w01-zero" d={`M0 ${toolY(0).toFixed(1)}H${width}M0 ${ruleY(0).toFixed(1)}H${width}`} />
        <g className="w01-strip" data-fast={fast ? "" : undefined}>
          {span.map((t) => {
            const down = t <= playhead;
            if (!scored.has(t)) {
              return <circle key={`gap-${t}`} cx={scale.x(t)} cy={toolY(0)} r={2.2} className="w01-skip" style={{ opacity: down ? 1 : 0 }} />;
            }
            const actual = check.rows[t]!.ist as number;
            const forecast = check.forecast(t);
            const rule = check.rule(t) as number;
            const x = scale.x(t) - bar / 2;
            const lift = Math.max(0, toolTop - geometry.y(actual));
            const marks = [
              forecast === null ? null : { key: "tool", y0: toolY(0), y1: toolY(actual - forecast), cls: "w01-ebar is-tool", lift },
              { key: "rule", y0: ruleY(0), y1: ruleY(actual - rule), cls: "w01-ebar is-rule", lift: lift + (ruleTop - toolTop) },
            ];
            return marks.map((mark) =>
              mark ? (
                <rect
                  key={`${mark.key}-${t}`}
                  x={x}
                  y={Math.min(mark.y0, mark.y1)}
                  width={bar}
                  height={Math.max(1, Math.abs(mark.y1 - mark.y0))}
                  className={mark.cls}
                  data-selected={selected === t ? "" : undefined}
                  style={{ transform: down ? "none" : `translateY(${-mark.lift}px)`, opacity: down ? 1 : 0 }}
                />
              ) : null,
            );
          })}
        </g>
        <rect x={0} y={chartBottom + 4} width={width} height={Math.max(0, height - chartBottom - 4)} className="w01-hit is-tap" onPointerUp={onStripTap} />
        <SvgLens
          contentId="w01-chart"
          cx={scale.x(playhead)}
          cy={ist !== null && ist !== undefined ? geometry.y(ist) : chartBottom / 2}
          r={34}
          visible={scrub.active}
        />
      </svg>
    </SceneFrame>
  );
}
