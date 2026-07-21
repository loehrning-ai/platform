"use client";

// Ported from data-infrastructure/js/data-widgets.js's PartitionSim (lines
// 704-916) — single-canvas, click-driven, no DOM-overlay coordinate mapping
//.

import { useCallback, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useCanvasRAF } from "../canvas/use-canvas-raf";
import { useCanvasAutoSize } from "../canvas/use-canvas-size";
import { CanvasFallbackNotice } from "../canvas/canvas-fallback";
import { cn } from "@/lib/utils";

interface PartitionSimProps {
  readonly lessonId: string;
  readonly cpId: string;
}

type StrategyKey = "none" | "date" | "user" | "country" | "hour";

interface PartCell {
  readonly label: string;
  readonly bytes: number;
}

interface StrategyMeta {
  readonly bytes: string;
  readonly verdict: string;
  readonly verdictTone: "ok" | "bad" | "warn";
  readonly skew: string;
  readonly parts: readonly PartCell[];
  readonly hit: readonly number[];
}

const COUNTRY_WEIGHTS: readonly [string, number][] = [
  ["US", 62],
  ["UK", 8],
  ["DE", 6],
  ["FR", 5],
  ["JP", 4],
  ["BR", 3.5],
  ["IN", 3],
  ["CA", 2.5],
  ["AU", 2],
  ["MX", 2],
  ["SG", 1],
  ["ES", 1],
];

function buildStrategy(key: StrategyKey): StrategyMeta {
  switch (key) {
    case "none":
      return {
        bytes: "100 GB",
        verdict: "full scan — 30× wasted",
        verdictTone: "bad",
        skew: "n/a",
        parts: [{ label: "all data", bytes: 100 }],
        hit: [0],
      };
    case "date": {
      const parts = Array.from({ length: 30 }, (_, i) => ({
        label: `2026-04-${String(i + 1).padStart(2, "0")}`,
        bytes: 3.3,
      }));
      return {
        bytes: "3.3 GB",
        verdict: "perfect prune (1 of 30)",
        verdictTone: "ok",
        skew: "even",
        parts,
        hit: [14],
      };
    }
    case "user": {
      const parts = Array.from({ length: 24 }, (_, i) => ({ label: `hash_${i}`, bytes: 4.2 }));
      return {
        bytes: "100 GB",
        verdict: "no prune — query doesn't mention user",
        verdictTone: "bad",
        skew: "even",
        parts,
        hit: parts.map((_, i) => i),
      };
    }
    case "country": {
      const parts = COUNTRY_WEIGHTS.map(([label, bytes]) => ({ label, bytes }));
      return {
        bytes: "100 GB",
        verdict: "no prune — also: heavy US skew",
        verdictTone: "bad",
        skew: "⚠ US 62%",
        parts,
        hit: parts.map((_, i) => i),
      };
    }
    case "hour": {
      const parts: PartCell[] = [];
      for (let d = 0; d < 30; d++) {
        for (let h = 0; h < 24; h++) {
          parts.push({ label: `${String(d + 1).padStart(2, "0")}/${String(h).padStart(2, "0")}`, bytes: 0.14 });
        }
      }
      const hit = Array.from({ length: 24 }, (_, h) => 14 * 24 + h);
      return {
        bytes: "3.3 GB",
        verdict: "small-file problem · 720 files for 3.3 GB",
        verdictTone: "warn",
        skew: "over-split",
        parts,
        hit,
      };
    }
  }
}

function gridLayout(parts: readonly PartCell[], w: number, h: number) {
  const pad = 10;
  const n = parts.length;
  const cols = Math.max(1, Math.ceil(Math.sqrt((n * (w - 2 * pad)) / (h - 2 * pad))));
  const rows = Math.ceil(n / cols);
  const cw = (w - 2 * pad) / cols;
  const ch = (h - 2 * pad) / rows;
  return parts.map((p, i) => ({
    ...p,
    idx: i,
    x: pad + (i % cols) * cw + 2,
    y: pad + Math.floor(i / cols) * ch + 2,
    w: cw - 4,
    h: ch - 4,
  }));
}

export function PartitionSim({ lessonId, cpId }: PartitionSimProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextUnavailable, setContextUnavailable] = useState(false);
  const [strategy, setStrategy] = useState<StrategyKey>("date");
  const meta = buildStrategy(strategy);
  const scanningRef = useRef(false);

  useCanvasAutoSize(canvasRef, wrapRef, { minHeight: 300 });

  const draw = useCallback((): boolean => {
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
    const layout = gridLayout(meta.parts, w, h);
    const maxBytes = Math.max(...meta.parts.map((p) => p.bytes), 0.01);
    layout.forEach((p) => {
      const isHit = meta.hit.includes(p.idx);
      const intensity = p.bytes / maxBytes;
      ctx.fillStyle = isHit
        ? meta.parts.length === 12
          ? `rgba(63,130,100,${0.25 + intensity * 0.35})`
          : "rgba(63,130,100,0.18)"
        : "rgba(0,0,0,0.02)";
      ctx.strokeStyle = isHit ? "#3f8264" : "rgba(91,138,143,0.25)";
      ctx.globalAlpha = isHit ? 1 : 0.5;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      ctx.globalAlpha = 1;
      if (p.w > 26 && p.h > 10) {
        ctx.fillStyle = isHit ? "#2a5a45" : "#94a3b8";
        ctx.font = "8px monospace";
        ctx.fillText(p.label.slice(0, 8), p.x + 2, p.y + Math.min(p.h - 3, 11));
      }
    });
    return scanningRef.current;
  }, [meta]);

  const { wake } = useCanvasRAF(draw);

  const scan = useCallback(() => {
    scanningRef.current = true;
    wake();
    complete();
    setTimeout(() => {
      scanningRef.current = false;
      wake();
    }, 700);
  }, [complete, wake]);

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        Sim · Partition the orders table — pick a key {done ? "✓" : ""}
      </p>

      {contextUnavailable ? (
        <CanvasFallbackNotice
          title="Partition pruning"
          summary={`${strategy} strategy: ${meta.hit.length} of ${meta.parts.length} partitions scanned, ${meta.bytes} read. ${meta.verdict}.`}
        />
      ) : (
        <div ref={wrapRef} className="h-[300px] w-full">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Visualization of how a partitioning strategy prunes data files scanned for a query."
            className="h-full w-full"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <code className="border border-border bg-background px-2 py-1 font-mono text-[11px]">
          SELECT * FROM orders WHERE order_date = &apos;2026-04-15&apos;
        </code>
        <label className="ml-auto flex items-center gap-2 text-[12px]">
          <span className="sr-only">Partition strategy</span>
          <select
            aria-label="Partition strategy"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as StrategyKey)}
            className="border-2 border-border bg-background px-2 py-1.5 font-mono text-[12px]"
          >
            <option value="none">— no partition (full scan)</option>
            <option value="date">order_date (daily)</option>
            <option value="user">user_id (hash 24)</option>
            <option value="country">country (skewed)</option>
            <option value="hour">order_hour (over-partitioned)</option>
          </select>
        </label>
        <button
          type="button"
          onClick={scan}
          className="border-2 border-foreground bg-brand-orange px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-white hover:opacity-90"
        >
          ▶ scan
        </button>
      </div>
      <div className={cn("mt-3 grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[12px] sm:grid-cols-4")}>
        <span>
          files scanned <b className="text-foreground">{meta.hit.length} / {meta.parts.length}</b>
        </span>
        <span>
          bytes read <b className="text-foreground">{meta.bytes}</b>
        </span>
        <span>
          verdict{" "}
          <b
            className={cn(
              meta.verdictTone === "ok" && "text-[#3f8264]",
              meta.verdictTone === "bad" && "text-[#b85a4a]",
              meta.verdictTone === "warn" && "text-brand-orange",
            )}
          >
            {meta.verdict}
          </b>
        </span>
        <span>
          skew <b className="text-foreground">{meta.skew}</b>
        </span>
      </div>
    </div>
  );
}

export default PartitionSim;
