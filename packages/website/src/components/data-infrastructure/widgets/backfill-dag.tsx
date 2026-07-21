"use client";

// Ported from data-infrastructure/js/data-widgets.js's BackfillDAG (lines
// 2114-2253). Real JSX <svg> rendering, not the source's innerHTML
// string-building. Not canvas: no RAF loop, no
// getContext null-check. The 30-day/1-4-10-worker schedules are
// deterministic, computed at render time from the ported `schedule()`
// algorithm — never persisted as per-user progress (they are shared static
// content, not per-learner state; only the "claimed" checkpoint boolean is).

import { useMemo, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";

interface BackfillDagProps {
  readonly lessonId: string;
  readonly cpId: string;
}

interface BackfillRetry {
  readonly start: number;
  readonly end: number;
}

interface BackfillTask {
  readonly day: number;
  readonly worker: number;
  readonly start: number;
  readonly end: number;
  readonly retries: readonly BackfillRetry[];
}

interface Schedule {
  readonly tasks: readonly BackfillTask[];
  readonly total: number;
  readonly workers: number;
}

const N_DAYS = 30;
const RETRY_DAYS = new Set([6, 14, 22]);
const BASE_DUR = 60;

function computeSchedule(workers: number): Schedule {
  const free = new Array<number>(workers).fill(0);
  const tasks: BackfillTask[] = [];
  for (let day = 1; day <= N_DAYS; day++) {
    let w = 0;
    for (let j = 1; j < workers; j++) if (free[j] < free[w]) w = j;
    let cursor = free[w];
    const retries: BackfillRetry[] = [];
    if (RETRY_DAYS.has(day)) {
      const failDur = Math.round(BASE_DUR * 0.55);
      retries.push({ start: cursor, end: cursor + failDur });
      cursor += failDur + 8;
    }
    const start = cursor;
    const end = start + BASE_DUR;
    free[w] = end;
    tasks.push({ day, worker: w, start, end, retries });
  }
  return { tasks, total: Math.max(...free), workers };
}

const ROW_H: Record<number, number> = { 1: 36, 4: 22, 10: 18 };

function xScale(t: number, maxTotal: number, titleW: number, innerW: number): number {
  return titleW + (t / maxTotal) * innerW;
}

function Band({
  schedule,
  speedupOf1,
  yTop,
  maxTotal,
  titleW,
  innerW,
  svgWidth,
}: {
  readonly schedule: Schedule;
  readonly speedupOf1: number;
  readonly yTop: number;
  readonly maxTotal: number;
  readonly titleW: number;
  readonly innerW: number;
  readonly svgWidth: number;
}): { element: JSX.Element; height: number } {
  const rowH = ROW_H[schedule.workers] ?? 18;
  const bandPad = 12;
  const bandH = schedule.workers * rowH + 2 * bandPad;
  const speedup = (speedupOf1 / schedule.total).toFixed(1);
  const taskH = Math.max(11, rowH - 6);
  const xs = (t: number) => xScale(t, maxTotal, titleW, innerW);

  const element = (
    <g key={schedule.workers}>
      <rect x={0} y={yTop} width={svgWidth} height={bandH} className="fill-card stroke-border" strokeWidth={0.6} />
      <rect x={0} y={yTop} width={titleW} height={bandH} className="fill-card/70" />
      <text x={16} y={yTop + 24} className="fill-foreground text-[11px] font-bold">
        {schedule.workers} worker{schedule.workers > 1 ? "s" : ""}
      </text>
      <text x={16} y={yTop + 42} className="fill-muted-foreground text-[9.5px]">
        elapsed {schedule.total}
      </text>
      <text x={16} y={yTop + 58} className="fill-brand-orange text-[9.5px] font-semibold">
        {speedup}× speedup
      </text>
      {Array.from({ length: schedule.workers }, (_, i) => {
        const yRow = yTop + bandPad + i * rowH;
        const yMid = yRow + rowH / 2;
        return (
          <g key={i}>
            <line
              x1={titleW}
              y1={yMid}
              x2={titleW + innerW}
              y2={yMid}
              className="stroke-border"
              strokeWidth={0.4}
              strokeDasharray="1 3"
            />
            {(schedule.workers <= 4 || i % 2 === 0 || i === schedule.workers - 1) && (
              <text x={titleW - 6} y={yMid + 3.5} textAnchor="end" className="fill-muted-foreground text-[8.5px]">
                w{i}
              </text>
            )}
          </g>
        );
      })}
      {schedule.tasks.map((t) => {
        const yRow = yTop + bandPad + t.worker * rowH;
        const yBar = yRow + rowH / 2 - taskH / 2;
        return (
          <g key={t.day}>
            {t.retries.map((r, ri) => {
              const rx = xs(r.start);
              const rw = Math.max(2, xs(r.end) - xs(r.start));
              return (
                <g key={ri}>
                  <rect x={rx} y={yBar} width={rw} height={taskH} rx={2} className="fill-[#e5a49a] stroke-[#b85a4a]" strokeWidth={0.7} />
                  {rw > 10 && (
                    <text x={rx + rw / 2} y={yBar + taskH / 2 + 3.5} textAnchor="middle" className="fill-[#8a3f30] text-[8px]">
                      ✗
                    </text>
                  )}
                </g>
              );
            })}
            {(() => {
              const sx = xs(t.start);
              const sw = Math.max(3, xs(t.end) - xs(t.start));
              const showLabel = (sw > 14 && taskH >= 12) || (sw > 8 && schedule.workers === 10 && t.day % 5 === 0);
              return (
                <g>
                  <rect x={sx} y={yBar} width={sw} height={taskH} rx={2} className="fill-[#bfe3cf] stroke-[#3f8264]" strokeWidth={0.7} />
                  {showLabel && (
                    <text x={sx + sw / 2} y={yBar + taskH / 2 + 3.5} textAnchor="middle" className="fill-[#2a5a45] text-[8px]">
                      {t.day}
                    </text>
                  )}
                </g>
              );
            })()}
          </g>
        );
      })}
    </g>
  );

  return { element, height: bandH };
}

export function BackfillDag({ lessonId, cpId }: BackfillDagProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [claimed, setClaimed] = useState(false);

  const claim = () => {
    if (claimed || done) return;
    setClaimed(true);
    complete();
  };

  const { svg, totalH } = useMemo(() => {
    const s1 = computeSchedule(1);
    const s4 = computeSchedule(4);
    const s10 = computeSchedule(10);
    const maxTotal = Math.max(s1.total, s4.total, s10.total);
    const svgWidth = 1100;
    const titleW = 130;
    const padR = 24;
    const innerW = svgWidth - titleW - padR;

    let y = 38;
    const b1 = Band({ schedule: s1, speedupOf1: s1.total, yTop: y, maxTotal, titleW, innerW, svgWidth });
    y += b1.height + 4;
    const b4 = Band({ schedule: s4, speedupOf1: s1.total, yTop: y, maxTotal, titleW, innerW, svgWidth });
    y += b4.height + 4;
    const b10 = Band({ schedule: s10, speedupOf1: s1.total, yTop: y, maxTotal, titleW, innerW, svgWidth });
    y += b10.height;

    const axisY = y + 16;
    const tickStep = 240;
    const ticks: number[] = [];
    for (let t = 0; t <= maxTotal; t += tickStep) ticks.push(t);
    const totalHeight = axisY + 44;

    const svgEl = (
      <svg viewBox={`0 0 ${svgWidth} ${totalHeight}`} role="img" className="min-w-[900px]" aria-label="Backfill of 30 daily partitions run with 1, 4, and 10 workers, showing wall-time scaling and retries.">
        <text x={0} y={22} className="fill-foreground text-[12px] font-bold">
          Backfill of 30 daily partitions · same workload, different worker counts
        </text>
        {b1.element}
        {b4.element}
        {b10.element}
        <line x1={titleW} y1={axisY} x2={titleW + innerW} y2={axisY} className="stroke-muted-foreground" strokeWidth={1} />
        {ticks.map((t) => {
          const x = xScale(t, maxTotal, titleW, innerW);
          return (
            <g key={t}>
              <line x1={x} y1={axisY} x2={x} y2={axisY + 5} className="stroke-muted-foreground" strokeWidth={1} />
              <text x={x} y={axisY + 18} textAnchor="middle" className="fill-muted-foreground text-[9px]">
                {t}
              </text>
            </g>
          );
        })}
        <text x={titleW + innerW / 2} y={axisY + 34} textAnchor="middle" className="fill-muted-foreground text-[10px]">
          wall time →
        </text>
      </svg>
    );

    return { svg: svgEl, totalH: totalHeight };
  }, []);

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        Diagram · Backfill 30 days · workers vs. wall time
      </p>
      <div className="overflow-x-auto" style={{ minHeight: Math.min(totalH, 320) }}>
        {svg}
      </div>
      <div className="mt-4 grid gap-2 text-[12.5px] text-muted-foreground sm:grid-cols-2">
        <div>
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#bfe3cf] align-middle" /> green bar ·
          successful run of one day
        </div>
        <div>
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#e5a49a] align-middle" /> red ✗ bar ·
          first-attempt failure, then retry
        </div>
        <div>
          3 retries on days <code>06</code>, <code>14</code>, <code>22</code> — typical flake rate
        </div>
        <div>Independent per day: any worker can take any day, so wall time scales near-linearly with worker count.</div>
      </div>
      <button
        type="button"
        onClick={claim}
        disabled={claimed || done}
        className={cn(
          "mt-4 inline-flex items-center gap-2 border-2 border-foreground px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-wide transition-colors",
          claimed || done
            ? "cursor-default border-border bg-border text-muted-foreground"
            : "bg-brand-orange text-white hover:opacity-90",
        )}
      >
        {claimed || done ? "✓ claimed" : "Got it · claim XP"}
      </button>
    </div>
  );
}

export default BackfillDag;
