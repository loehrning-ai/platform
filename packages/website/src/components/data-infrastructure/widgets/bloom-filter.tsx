"use client";

// Ported from data-infrastructure/js/data-widgets.js's BloomFilter (lines
// 1675-1914) — plan 010 stage 8.

import { useCallback, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useCanvasRAF } from "../canvas/use-canvas-raf";
import { useCanvasAutoSize } from "../canvas/use-canvas-size";
import { CanvasFallbackNotice } from "../canvas/canvas-fallback";
import { cn } from "@/lib/utils";

interface BloomFilterProps {
  readonly lessonId: string;
  readonly cpId: string;
}

const N_BITS = 32;
const N_HASHES = 3;
const COLS = 16;

function hashes(s: string): [number, number, number] {
  let h1 = 2166136261;
  let h2 = 5381;
  for (let i = 0; i < s.length; i++) {
    h1 ^= s.charCodeAt(i);
    h1 = Math.imul(h1, 16777619);
    h2 = ((h2 << 5) + h2 + s.charCodeAt(i)) | 0;
  }
  return [Math.abs(h1) % N_BITS, Math.abs(h2) % N_BITS, Math.abs(h1 + h2) % N_BITS];
}

function bitPos(i: number, w: number, h: number) {
  const padX = 16;
  const padY = 30;
  const cellW = (w - 2 * padX) / COLS;
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return { x: padX + c * cellW + cellW / 2, y: padY + r * (h - padY - 10) / 2, w: cellW - 3, h: 16 };
}

export function BloomFilter({ lessonId, cpId }: BloomFilterProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextUnavailable, setContextUnavailable] = useState(false);
  const [addValue, setAddValue] = useState("user_42");
  const [checkValue, setCheckValue] = useState("user_99");
  const [outcome, setOutcome] = useState<{ kind: "add" | "maybe" | "no"; key: string } | null>(null);
  const [added, setAdded] = useState(0);
  const [bitsSet, setBitsSet] = useState(0);

  const bitsRef = useRef<number[]>(new Array(N_BITS).fill(0));
  const committedRef = useRef<number[]>(new Array(N_BITS).fill(0));

  useCanvasAutoSize(canvasRef, wrapRef, { minHeight: 200 });

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
    ctx.fillStyle = "#5b8a8f";
    ctx.font = "bold 11px monospace";
    ctx.fillText(`BLOOM FILTER · ${N_BITS} bits · ${N_HASHES} hash functions`, 12, 16);
    for (let i = 0; i < N_BITS; i++) {
      const p = bitPos(i, w, h);
      const set = bitsRef.current[i] === 1;
      ctx.fillStyle = set ? "#5b8a8f" : "#ffffff";
      ctx.strokeStyle = set ? "#3a6b70" : "rgba(91,138,143,0.3)";
      ctx.lineWidth = 1;
      ctx.fillRect(p.x - p.w / 2, p.y, p.w, p.h);
      ctx.strokeRect(p.x - p.w / 2, p.y, p.w, p.h);
      ctx.fillStyle = set ? "#fff" : "rgba(91,138,143,0.5)";
      ctx.font = "9px monospace";
      ctx.fillText(String(bitsRef.current[i]), p.x - 3, p.y + p.h / 2 + 3);
    }
    return false;
  }, []);

  const { wake } = useCanvasRAF(draw);

  const add = useCallback(() => {
    const v = addValue.trim();
    if (!v) return;
    const hs = hashes(v);
    for (const h of hs) {
      bitsRef.current[h] = 1;
      committedRef.current[h] = 1;
    }
    setAdded((a) => a + 1);
    setBitsSet(bitsRef.current.reduce((a, b) => a + b, 0));
    setOutcome({ kind: "add", key: v });
    wake();
    complete();
  }, [addValue, complete, wake]);

  const check = useCallback(() => {
    const v = checkValue.trim();
    if (!v) return;
    const hs = hashes(v);
    const allSet = hs.every((h) => committedRef.current[h] === 1);
    setOutcome({ kind: allSet ? "maybe" : "no", key: v });
    wake();
  }, [checkValue, wake]);

  const resetAll = useCallback(() => {
    bitsRef.current = new Array(N_BITS).fill(0);
    committedRef.current = new Array(N_BITS).fill(0);
    setAdded(0);
    setBitsSet(0);
    setOutcome(null);
    wake();
  }, [wake]);

  const fpr = Math.pow(bitsSet / N_BITS, N_HASHES);

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        Sim · Bloom filter — fast &quot;definitely no&quot; checks {done ? "✓" : ""}
      </p>

      {contextUnavailable ? (
        <CanvasFallbackNotice
          title="Bloom filter"
          summary={`${bitsSet} of ${N_BITS} bits set after ${added} additions, ${N_HASHES} hash functions per key.`}
        />
      ) : (
        <div ref={wrapRef} className="h-[200px] w-full">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Bloom filter visualization showing how membership tests can return false positives but never false negatives."
            className="h-full w-full"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          aria-label="key to add"
          value={addValue}
          onChange={(e) => setAddValue(e.target.value)}
          className="border-2 border-border bg-background px-2 py-1.5 font-mono text-[12px]"
        />
        <button
          type="button"
          onClick={add}
          className="border-2 border-border bg-background px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-foreground hover:border-brand-orange/60"
        >
          + add
        </button>
        <input
          aria-label="key to check"
          value={checkValue}
          onChange={(e) => setCheckValue(e.target.value)}
          className="border-2 border-border bg-background px-2 py-1.5 font-mono text-[12px]"
        />
        <button
          type="button"
          onClick={check}
          className="border-2 border-foreground bg-brand-orange px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-white hover:opacity-90"
        >
          ? check
        </button>
        <button
          type="button"
          onClick={resetAll}
          className={cn(
            "border-2 border-border bg-background px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-foreground hover:border-brand-orange/60",
          )}
        >
          reset
        </button>
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
        added <b className="text-foreground">{added}</b> · bits set <b className="text-foreground">{bitsSet}</b>/
        <b className="text-foreground">{N_BITS}</b> · est FPR <b className="text-foreground">{(fpr * 100).toFixed(1)}%</b>
      </p>
      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground" role="status">
        {outcome == null && (
          <>
            Try adding a few keys and then checking new ones. Bloom can say{" "}
            <b className="text-[#3f8264]">&quot;definitely no&quot;</b> instantly, or{" "}
            <b className="text-brand-orange">&quot;maybe&quot;</b> — never a false negative, only false positives.
          </>
        )}
        {outcome?.kind === "add" && (
          <>
            added &quot;{outcome.key}&quot; · 3 hashes set the corresponding bits to 1
          </>
        )}
        {outcome?.kind === "maybe" && (
          <>
            <b className="text-brand-orange">&quot;maybe&quot;</b> · all 3 bits set. Real hit or false positive — go check
            the actual file.
          </>
        )}
        {outcome?.kind === "no" && (
          <>
            <b className="text-[#3f8264]">&quot;definitely not&quot;</b> · at least one bit was 0. Skip the file entirely.
          </>
        )}
      </p>
    </div>
  );
}

export default BloomFilter;
