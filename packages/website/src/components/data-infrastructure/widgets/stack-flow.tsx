"use client";

// Ported from data-infrastructure/js/data-widgets.js's StackFlow (lines
// 47-223) — the fidelity template for the remaining canvas widgets (plan
// 010 stage 5). Canvas particles fly left-to-right through each stack
// layer's lane, whose horizontal span is read from a real DOM overlay
// element's getBoundingClientRect(). `useLayoutEffect`-gated: the lane rects
// are cached synchronously right after the DOM overlay commits (layout
// effects always run before any passive effect in the same commit), so the
// very first draw can never read a zero/stale rect.

import { useCallback, useLayoutEffect, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useCanvasRAF } from "../canvas/use-canvas-raf";
import { useCanvasAutoSize } from "../canvas/use-canvas-size";
import { CanvasFallbackNotice } from "../canvas/canvas-fallback";
import { cn } from "@/lib/utils";

interface StackFlowProps {
  readonly lessonId: string;
  readonly cpId: string;
}

interface StackLayer {
  readonly name: string;
  readonly tools: readonly string[];
}

const LAYERS: readonly StackLayer[] = [
  { name: "source", tools: ["Postgres", "iOS SDK", "Stripe"] },
  { name: "log", tools: ["Kafka", "Kinesis"] },
  { name: "processing", tools: ["Flink", "Spark", "dbt"] },
  { name: "storage", tools: ["S3", "Iceberg", "Parquet"] },
  { name: "serving", tools: ["Snowflake", "Trino", "DynamoDB"] },
  { name: "consume", tools: ["Looker", "API", "Feature store"] },
];

const PALETTE = ["#cf8a3f", "#5b8a8f", "#a8632c", "#7a4a8a", "#3f8264", "#b85a4a", "#3a6b8c"];

interface Trail {
  readonly x: number;
  readonly y: number;
  readonly a: number;
}

interface Particle {
  x: number;
  y: number;
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  t: number;
  readonly dur: number;
  readonly born: number;
  readonly size: number;
  readonly alpha: number;
  readonly color: string;
  readonly trail: Trail[];
}

interface Pulse {
  readonly lane: number;
  t: number;
}

interface LaneRect {
  readonly x0: number;
  readonly x1: number;
  readonly y: number;
  readonly h: number;
}

export function StackFlow({ lessonId, cpId }: StackFlowProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const laneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const laneRectsRef = useRef<(LaneRect | null)[]>(LAYERS.map(() => null));
  const [contextUnavailable, setContextUnavailable] = useState(false);
  const [counts, setCounts] = useState({ n: 0, live: 0, tps: "0.0" });

  const particlesRef = useRef<Particle[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const ticksRef = useRef<number[]>([]);
  const nRef = useRef(0);

  const measureLanes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    laneRectsRef.current = laneRefs.current.map((el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x0: 6,
        x1: Math.max(6, canvasRect.width - 6),
        y: r.top - canvasRect.top + r.height / 2,
        h: r.height,
      };
    });
  }, []);

  useLayoutEffect(() => {
    measureLanes();
  }, [measureLanes]);

  useCanvasAutoSize(canvasRef, wrapRef, {
    minHeight: 260,
    onResize: measureLanes,
  });

  const draw = useCallback((now: number): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setContextUnavailable(true);
      return false;
    }
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    ctx.clearRect(0, 0, w, h);

    LAYERS.forEach((_, i) => {
      const lane = laneRectsRef.current[i];
      if (!lane) return;
      ctx.strokeStyle = "rgba(91,138,143,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lane.x0, lane.y);
      ctx.lineTo(lane.x1, lane.y);
      ctx.stroke();
    });

    pulsesRef.current = pulsesRef.current.filter((pu) => {
      pu.t += 0.05;
      if (pu.t >= 1) return false;
      const lane = laneRectsRef.current[pu.lane];
      if (!lane) return false;
      ctx.fillStyle = "#cf8a3f";
      ctx.globalAlpha = (1 - pu.t) * 0.18;
      ctx.fillRect(lane.x0, lane.y - lane.h * 0.4, lane.x1 - lane.x0, lane.h * 0.8);
      ctx.globalAlpha = 1;
      return true;
    });

    particlesRef.current = particlesRef.current.filter((pt) => {
      const dt = now - pt.born;
      pt.t = Math.min(1, dt / pt.dur);
      const e = 1 - Math.pow(1 - pt.t, 3);
      pt.x = pt.x0 + (pt.x1 - pt.x0) * e;
      pt.trail.push({ x: pt.x, y: pt.y, a: pt.alpha });
      if (pt.trail.length > 14) pt.trail.shift();
      pt.trail.forEach((tr, i) => {
        const f = i / pt.trail.length;
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = f * tr.a * 0.5;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, pt.size * (0.3 + f * 0.7), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return pt.t < 1;
    });

    const cutoff = now - 2000;
    ticksRef.current = ticksRef.current.filter((t) => t > cutoff);
    setCounts({
      n: nRef.current,
      live: Math.ceil(particlesRef.current.length / 3),
      tps: (ticksRef.current.length / 2).toFixed(1),
    });

    return particlesRef.current.length > 0 || pulsesRef.current.length > 0;
  }, []);

  const { wake } = useCanvasRAF(draw);

  const fire = useCallback(
    (speedMul = 1) => {
      nRef.current += 1;
      ticksRef.current.push(performance.now());
      const color = PALETTE[nRef.current % PALETTE.length];
      const baseDelay = 140 / speedMul;
      const travel = 620 / speedMul;
      LAYERS.forEach((_, i) => {
        setTimeout(() => {
          const lane = laneRectsRef.current[i];
          if (!lane) return;
          for (let k = 0; k < 3; k++) {
            particlesRef.current.push({
              x: lane.x0,
              y: lane.y + (k - 1) * 3 + (Math.random() - 0.5) * 2,
              x0: lane.x0,
              x1: lane.x1,
              y0: lane.y,
              t: 0,
              dur: travel * (0.85 + Math.random() * 0.3),
              size: k === 1 ? 4 : 2.5,
              color,
              alpha: k === 1 ? 1 : 0.55,
              trail: [],
              born: performance.now(),
            });
          }
          pulsesRef.current.push({ lane: i, t: 0 });
          wake();
        }, i * baseDelay);
      });
      wake();
      if (nRef.current >= 3) complete();
    },
    [complete, wake],
  );

  const burst = useCallback(() => {
    for (let i = 0; i < 10; i++) setTimeout(() => fire(1), i * 160);
  }, [fire]);

  const storm = useCallback(() => {
    for (let i = 0; i < 40; i++) setTimeout(() => fire(1.6), i * 55);
  }, [fire]);

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        Sim · The stack, in motion {done ? "✓" : ""}
      </p>

      {contextUnavailable ? (
        <CanvasFallbackNotice
          title="The stack, in motion"
          summary="An event flows source → log → processing → storage → serving → consume, one lane per layer."
        />
      ) : (
        <div ref={wrapRef} className="flex h-[280px] w-full gap-2">
          <div className="flex w-[180px] shrink-0 flex-col justify-between gap-1.5 py-1">
            {LAYERS.map((layer, i) => (
              <div
                key={layer.name}
                ref={(el) => {
                  laneRefs.current[i] = el;
                }}
                className="flex flex-1 flex-col justify-center gap-0.5 rounded-sm border border-border bg-background px-2 py-1"
              >
                <span className="font-mono text-[9px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="truncate text-[11px] font-semibold text-foreground">{layer.name}</span>
              </div>
            ))}
          </div>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Animated diagram of an event flowing left to right through the data stack: source, log, process, store, serve, consume."
            className="h-full flex-1"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fire(1)}
          className="border-2 border-foreground bg-brand-orange px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-white hover:opacity-90"
        >
          ▶ trace 1 event
        </button>
        <button
          type="button"
          onClick={burst}
          className={cn(
            "border-2 border-border bg-background px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-foreground hover:border-brand-orange/60",
          )}
        >
          ▶▶ burst
        </button>
        <button
          type="button"
          onClick={storm}
          className="border-2 border-border bg-background px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-foreground hover:border-brand-orange/60"
        >
          ⚡ storm
        </button>
        <span className="font-mono text-[11px] text-muted-foreground">
          processed <b className="text-foreground">{counts.n}</b> · flowing <b className="text-foreground">{counts.live}</b> ·
          throughput <b className="text-foreground">{counts.tps}</b>/s
        </span>
      </div>
    </div>
  );
}

export default StackFlow;
