"use client";

// Ported from data-infrastructure/js/data-widgets.js's KafkaTopic (lines
// 920-1194) — structurally the hardest widget. Canvas
// particles fly between real DOM nodes (producer/partition/consumer boxes)
// via their cached `getBoundingClientRect()` rects. `useLayoutEffect`-gated:
// rects are cached synchronously right after the DOM overlay commits, before
// any particle path can be computed from a stale/zero rect.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useCanvasRAF } from "../canvas/use-canvas-raf";
import { useCanvasAutoSize } from "../canvas/use-canvas-size";
import { CanvasFallbackNotice } from "../canvas/canvas-fallback";
import { cn } from "@/lib/utils";

interface KafkaTopicProps {
  readonly lessonId: string;
  readonly cpId: string;
}

const PALETTE = ["#cf8a3f", "#5b8a8f", "#a8632c", "#7a4a8a"];
const PARTITIONS = 4;
const CONSUMERS = 3;
const INITIAL_ASSIGNS: Record<number, number> = { 0: 0, 1: 1, 2: 1, 3: 2 };

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly cx: number;
  readonly cy: number;
}

interface Flight {
  x: number;
  y: number;
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  t: number;
  readonly dur: number;
  readonly born: number;
  readonly color: string;
}

export function KafkaTopic({ lessonId, cpId }: KafkaTopicProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prodRef = useRef<HTMLDivElement>(null);
  const partRefs = useRef<(HTMLDivElement | null)[]>([]);
  const consRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [contextUnavailable, setContextUnavailable] = useState(false);

  const [offsets, setOffsets] = useState<number[]>(() => new Array(PARTITIONS).fill(0));
  const [assigns, setAssigns] = useState<Record<number, number>>(INITIAL_ASSIGNS);
  const [dead, setDead] = useState<ReadonlySet<number>>(() => new Set());
  const [prodCount, setProdCount] = useState(0);
  const [consCount, setConsCount] = useState(0);
  const [totalLag, setTotalLag] = useState(0);

  const offsetsRef = useRef<number[]>(new Array(PARTITIONS).fill(0));
  const cOffsetsRef = useRef<number[]>(new Array(PARTITIONS).fill(0));
  const assignsRef = useRef<Record<number, number>>(INITIAL_ASSIGNS);
  const deadRef = useRef<Set<number>>(new Set());
  const nProdRef = useRef(0);
  const nConsRef = useRef(0);

  const prodRectRef = useRef<Rect | null>(null);
  const partRectsRef = useRef<(Rect | null)[]>(new Array(PARTITIONS).fill(null));
  const consRectsRef = useRef<(Rect | null)[]>(new Array(CONSUMERS).fill(null));
  const produceFlights = useRef<Flight[]>([]);
  const consumeFlights = useRef<Flight[]>([]);
  const rebalanceFlashRef = useRef(0);

  const measureRects = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const toRect = (el: HTMLElement | null): Rect | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: r.left - canvasRect.left,
        y: r.top - canvasRect.top,
        w: r.width,
        h: r.height,
        cx: r.left - canvasRect.left + r.width / 2,
        cy: r.top - canvasRect.top + r.height / 2,
      };
    };
    prodRectRef.current = toRect(prodRef.current);
    partRectsRef.current = partRefs.current.map(toRect);
    consRectsRef.current = consRefs.current.map(toRect);
  }, []);

  useLayoutEffect(() => {
    measureRects();
  }, [measureRects]);

  useCanvasAutoSize(canvasRef, wrapRef, { minHeight: 320, onResize: measureRects });

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

    const prod = prodRectRef.current;
    if (prod) {
      for (let i = 0; i < PARTITIONS; i++) {
        const part = partRectsRef.current[i];
        if (!part) continue;
        ctx.strokeStyle = "rgba(91,138,143,0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(prod.cx, prod.cy + prod.h / 3);
        ctx.lineTo(part.cx, part.cy - part.h / 3);
        ctx.stroke();
      }
      for (let p = 0; p < PARTITIONS; p++) {
        const c = assignsRef.current[p];
        if (deadRef.current.has(c)) continue;
        const part = partRectsRef.current[p];
        const cons = consRectsRef.current[c];
        if (!part || !cons) continue;
        ctx.strokeStyle = "rgba(91,138,143,0.22)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(part.cx, part.cy + part.h / 3);
        ctx.lineTo(cons.cx, cons.cy - cons.h / 3);
        ctx.stroke();
      }
    }

    for (let p = 0; p < PARTITIONS; p++) {
      const part = partRectsRef.current[p];
      if (!part) continue;
      const lag = offsetsRef.current[p] - cOffsetsRef.current[p];
      for (let i = 0; i < Math.min(lag, 16); i++) {
        ctx.fillStyle = PALETTE[p];
        ctx.globalAlpha = 0.3 + 0.5 * (1 - i / 16);
        ctx.fillRect(part.x + part.w * 0.55 + i * 4, part.cy - 2, 2, 5);
      }
      ctx.globalAlpha = 1;
    }

    const stepFlights = (arr: Flight[]) =>
      arr.filter((f) => {
        const dt = now - f.born;
        f.t = Math.min(1, dt / f.dur);
        const e = 1 - Math.pow(1 - f.t, 3);
        f.x = f.x0 + (f.x1 - f.x0) * e;
        f.y = f.y0 + (f.y1 - f.y0) * e;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        return f.t < 1;
      });
    produceFlights.current = stepFlights(produceFlights.current);
    consumeFlights.current = stepFlights(consumeFlights.current);

    if (rebalanceFlashRef.current > 0) {
      ctx.fillStyle = `rgba(207,138,63,${rebalanceFlashRef.current * 0.1})`;
      ctx.fillRect(0, 0, w, h);
      rebalanceFlashRef.current *= 0.92;
    }

    return produceFlights.current.length > 0 || consumeFlights.current.length > 0 || rebalanceFlashRef.current > 0.01;
  }, []);

  const { wake } = useCanvasRAF(draw);

  const send = useCallback(
    (speed = 1) => {
      nProdRef.current += 1;
      const key = ["user", "order", "click"][nProdRef.current % 3] + "_" + nProdRef.current;
      const p = (key.charCodeAt(0) + key.length + nProdRef.current) % PARTITIONS;
      offsetsRef.current = offsetsRef.current.map((v, i) => (i === p ? v + 1 : v));
      setOffsets([...offsetsRef.current]);
      setProdCount(nProdRef.current);

      const prod = prodRectRef.current;
      const part = partRectsRef.current[p];
      if (prod && part) {
        produceFlights.current.push({
          x: prod.cx,
          y: prod.cy,
          x0: prod.cx,
          y0: prod.cy,
          x1: part.cx,
          y1: part.cy,
          t: 0,
          dur: 650 / speed,
          born: performance.now(),
          color: PALETTE[p],
        });
      }
      wake();
      if (nProdRef.current >= 3) complete();
    },
    [complete, wake],
  );

  const burst = useCallback(() => {
    for (let i = 0; i < 15; i++) setTimeout(() => send(1), i * 110);
  }, [send]);

  const storm = useCallback(() => {
    for (let i = 0; i < 40; i++) setTimeout(() => send(1.5), i * 55);
  }, [send]);

  const kill = useCallback(() => {
    if (deadRef.current.has(1)) return;
    deadRef.current = new Set(deadRef.current).add(1);
    setDead(new Set(deadRef.current));
    assignsRef.current = { 0: 0, 1: 0, 2: 0, 3: 2 };
    setAssigns({ ...assignsRef.current });
    rebalanceFlashRef.current = 1;
    wake();
  }, [wake]);

  useEffect(() => {
    const interval = setInterval(() => {
      let consumed = false;
      for (let c = 0; c < CONSUMERS; c++) {
        if (deadRef.current.has(c)) continue;
        let best = -1;
        let bestLag = 0;
        for (let p = 0; p < PARTITIONS; p++) {
          if (assignsRef.current[p] !== c) continue;
          const lag = offsetsRef.current[p] - cOffsetsRef.current[p];
          if (lag > bestLag) {
            bestLag = lag;
            best = p;
          }
        }
        if (best === -1) continue;
        cOffsetsRef.current = cOffsetsRef.current.map((v, i) => (i === best ? v + 1 : v));
        nConsRef.current += 1;
        consumed = true;
        const part = partRectsRef.current[best];
        const cons = consRectsRef.current[c];
        if (part && cons) {
          consumeFlights.current.push({
            x: part.cx,
            y: part.cy,
            x0: part.cx,
            y0: part.cy,
            x1: cons.cx,
            y1: cons.cy,
            t: 0,
            dur: 550,
            born: performance.now(),
            color: PALETTE[best],
          });
        }
      }
      if (consumed) {
        setConsCount(nConsRef.current);
        let lag = 0;
        for (let i = 0; i < PARTITIONS; i++) lag += offsetsRef.current[i] - cOffsetsRef.current[i];
        setTotalLag(lag);
        wake();
      }
    }, 200);
    return () => clearInterval(interval);
  }, [wake]);

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        Sim · Kafka topic · 4 partitions · 3 consumers {done ? "✓" : ""}
      </p>

      {contextUnavailable ? (
        <CanvasFallbackNotice
          title="Kafka topic"
          summary="A producer routes messages by key into 4 ordered partitions; a 3-consumer group pulls from them, and killing a consumer triggers a rebalance."
        />
      ) : (
        <div ref={wrapRef} className="relative h-[320px] w-full">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Animated Kafka topic showing messages routed by key into ordered, partitioned logs consumed by consumer groups."
            className="absolute inset-0 h-full w-full"
          />
          <div className="relative flex h-full flex-col justify-between p-2">
            <div className="flex justify-center">
              <div ref={prodRef} className="border-2 border-brand-orange bg-background px-3 py-1.5 font-mono text-[11px] font-semibold">
                producer · ● live
              </div>
            </div>
            <div className="flex justify-center gap-2">
              {Array.from({ length: PARTITIONS }, (_, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    partRefs.current[i] = el;
                  }}
                  className="border-2 border-border bg-background px-2.5 py-1.5 text-center font-mono text-[10.5px]"
                >
                  <div className="font-semibold text-foreground">p{i}</div>
                  <div className="text-muted-foreground">{offsets[i]}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2">
              {Array.from({ length: CONSUMERS }, (_, c) => {
                const isDead = dead.has(c);
                const assigned = Array.from({ length: PARTITIONS }, (_, p) => p).filter(
                  (p) => assigns[p] === c,
                );
                const lag = isDead
                  ? null
                  : assigned.reduce((sum, p) => sum + (offsets[p] - (cOffsetsRef.current[p] ?? 0)), 0);
                return (
                  <div
                    key={c}
                    ref={(el) => {
                      consRefs.current[c] = el;
                    }}
                    className={cn(
                      "border-2 px-2.5 py-1.5 text-center font-mono text-[10.5px]",
                      isDead ? "border-destructive/50 bg-destructive/10 opacity-60" : "border-border bg-background",
                    )}
                  >
                    <div className="font-semibold text-foreground">c{c}</div>
                    <div className="text-muted-foreground">{isDead ? "dead" : `p${assigned.join(",p")}`}</div>
                    <div className="text-muted-foreground">{isDead ? "," : `${lag} lag`}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => send(1)}
          className="border-2 border-foreground bg-brand-orange px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-white hover:opacity-90"
        >
          ▶ send 1
        </button>
        <button
          type="button"
          onClick={burst}
          className="border-2 border-border bg-background px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-foreground hover:border-brand-orange/60"
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
        <button
          type="button"
          onClick={kill}
          disabled={dead.has(1)}
          className="border-2 border-destructive bg-background px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ⚠ kill c1 (rebalance)
        </button>
        <span className="font-mono text-[11px] text-muted-foreground">
          produced <b className="text-foreground">{prodCount}</b> · consumed <b className="text-foreground">{consCount}</b> ·
          lag <b className="text-foreground">{totalLag}</b>
        </span>
      </div>
    </div>
  );
}

export default KafkaTopic;
