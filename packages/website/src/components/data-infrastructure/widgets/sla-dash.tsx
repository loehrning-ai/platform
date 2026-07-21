"use client";

// Ported from data-infrastructure/js/data-widgets.js's SLAdash (lines
// 2259-2470): 4-panel canvas NOC dashboard (freshness, row volume, null
// rate, consumer lag), each against a live SLO threshold (plan 010 stage 9).

import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useCanvasRAF } from "../canvas/use-canvas-raf";
import { useCanvasAutoSize } from "../canvas/use-canvas-size";
import { CanvasFallbackNotice } from "../canvas/canvas-fallback";
import { cn } from "@/lib/utils";

interface SlaDashProps {
  readonly lessonId: string;
  readonly cpId: string;
}

interface Panel {
  readonly key: "fresh" | "vol" | "null" | "lag";
  readonly title: string;
  readonly unit: string;
  readonly slo: number;
  readonly higherWorse: boolean;
  readonly color: string;
  readonly fmt: (v: number) => string;
}

const PANELS: readonly Panel[] = [
  { key: "fresh", title: "freshness", unit: "min", slo: 10, higherWorse: true, color: "#cf8a3f", fmt: (v) => `${v.toFixed(1)} min` },
  { key: "vol", title: "row volume", unit: "rows/min", slo: 80000, higherWorse: false, color: "#3f8264", fmt: (v) => `${Math.round(v).toLocaleString()}` },
  { key: "null", title: "null rate", unit: "%", slo: 1, higherWorse: true, color: "#b85a4a", fmt: (v) => `${v.toFixed(2)}%` },
  { key: "lag", title: "consumer lag", unit: "msgs", slo: 500, higherWorse: true, color: "#7a4a8a", fmt: (v) => `${Math.round(v)} msgs` },
];

interface FeedEntry {
  readonly id: number;
  readonly text: string;
  readonly bad: boolean;
}

let feedSeq = 0;

export function SLAdash({ lessonId, cpId }: SlaDashProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextUnavailable, setContextUnavailable] = useState(false);
  const [clock, setClock] = useState("12:00");
  const [status, setStatus] = useState<"healthy" | "incident">("healthy");
  const [feed, setFeed] = useState<readonly FeedEntry[]>([]);

  const seriesRef = useRef<Record<Panel["key"], number[]>>({ fresh: [], vol: [], null: [], lag: [] });
  const tRef = useRef(0);
  const incidentRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeRef = useRef<() => void>(() => {});

  useCanvasAutoSize(canvasRef, wrapRef, { minHeight: 420 });

  const draw = useCallback((): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setContextUnavailable(true);
      return false;
    }
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.width;
    const h = rect.height || canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cols = 2;
    const rows = 2;
    const padX = 16;
    const padY = 16;
    const gap = 14;
    const cw = (w - 2 * padX - gap) / cols;
    const ch = (h - 2 * padY - gap) / rows;

    PANELS.forEach((p, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = padX + col * (cw + gap);
      const y = padY + row * (ch + gap);
      const series = seriesRef.current[p.key];

      ctx.fillStyle = "oklch(0.985 0.003 240)";
      ctx.strokeStyle = "rgba(91,138,143,0.3)";
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, cw, ch);
      ctx.strokeRect(x, y, cw, ch);

      ctx.fillStyle = p.color;
      ctx.font = "bold 11px monospace";
      ctx.fillText(p.title.toUpperCase(), x + 10, y + 18);
      ctx.fillStyle = "rgba(91,138,143,0.6)";
      ctx.font = "9px monospace";
      ctx.fillText(`SLO ${p.higherWorse ? "<" : ">"} ${p.slo.toLocaleString()} ${p.unit}`, x + 10, y + 32);

      const chartX = x + 10;
      const chartY = y + 42;
      const chartW = cw - 20;
      const chartH = ch - 70;

      let maxV = series.length ? Math.max(...series) : p.slo * 1.5;
      let minV = series.length ? Math.min(...series, 0) : 0;
      if (p.key === "vol") { maxV = Math.max(maxV, 110000); minV = 60000; }
      if (p.key === "fresh") maxV = Math.max(maxV, 16);
      if (p.key === "null") maxV = Math.max(maxV, 2);
      if (p.key === "lag") maxV = Math.max(maxV, 700);
      const range = maxV - minV || 1;

      if (p.slo >= minV && p.slo <= maxV) {
        const ty = chartY + chartH - ((p.slo - minV) / range) * chartH;
        ctx.strokeStyle = "rgba(184,90,74,0.55)";
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(chartX, ty);
        ctx.lineTo(chartX + chartW, ty);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (series.length > 1) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        series.forEach((v, i) => {
          const px = chartX + (i / (series.length - 1)) * chartW;
          const py = chartY + chartH - ((v - minV) / range) * chartH;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }

      const cur = series[series.length - 1];
      const breached = cur != null && (p.higherWorse ? cur > p.slo : cur < p.slo);
      ctx.fillStyle = breached ? "#b85a4a" : p.color;
      ctx.font = "bold 13px monospace";
      ctx.fillText(cur != null ? p.fmt(cur) : "—", x + 10, y + ch - 8);
      if (breached) {
        ctx.fillStyle = "#b85a4a";
        ctx.font = "bold 9px monospace";
        ctx.fillText("▲ BREACH", x + cw - 62, y + ch - 8);
      } else if (cur != null) {
        ctx.fillStyle = "#3f8264";
        ctx.font = "9px monospace";
        ctx.fillText("● OK", x + cw - 40, y + ch - 8);
      }
    });
    return timerRef.current != null;
  }, []);

  const { wake } = useCanvasRAF(draw);
  wakeRef.current = wake;

  const tick = useCallback(() => {
    tRef.current += 1;
    const t = tRef.current;
    const incident = incidentRef.current;
    const series = seriesRef.current;
    const fr = 4 + Math.random() * 2 + (incident && t > 20 ? Math.min(15, (t - 20) * 1.2) : 0);
    const vo = 95000 + Math.random() * 8000 - (incident && t > 22 ? (t - 22) * 4500 : 0);
    const nu = 0.4 + Math.random() * 0.3 + (incident && t > 24 ? (t - 24) * 0.4 : 0);
    const la = 200 + Math.random() * 120 + (incident && t > 20 ? (t - 20) * 40 : 0);

    series.fresh.push(fr);
    series.vol.push(vo);
    series.null.push(nu);
    series.lag.push(la);
    (Object.keys(series) as Panel["key"][]).forEach((k) => {
      if (series[k].length > 60) series[k].shift();
    });

    const mins = 12 * 60 + t;
    setClock(`${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`);
    const anyBreach = fr > 10 || nu > 1 || la > 500 || vo < 80000;
    setStatus(anyBreach ? "incident" : "healthy");

    if (incident && t === 22) {
      feedSeq += 1;
      setFeed((f) => [{ id: feedSeq, text: "[12:22] PAGE · freshness above SLO (10 min) · on-call paged", bad: true }, ...f]);
    }
    if (incident && t === 26) {
      feedSeq += 1;
      setFeed((f) => [{ id: feedSeq, text: "[12:26] PAGE · null_rate(price) > 1% · upstream schema changed", bad: true }, ...f]);
    }
    if (incident && t === 34) {
      feedSeq += 1;
      setFeed((f) => [{ id: feedSeq, text: "[12:34] paused downstream consumers · investigating", bad: false }, ...f]);
    }

    wakeRef.current();

    if (t > 60) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      complete();
    }
  }, [complete]);

  const start = useCallback(
    (withIncident: boolean) => {
      incidentRef.current = withIncident;
      tRef.current = 0;
      seriesRef.current = { fresh: [], vol: [], null: [], lag: [] };
      setFeed([]);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(tick, 200);
      wakeRef.current();
    },
    [tick],
  );

  const pause = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        Sim · Pipeline observability · NOC dashboard {done ? "✓" : ""}
      </p>

      {contextUnavailable ? (
        <CanvasFallbackNotice
          title="SLA dashboard"
          summary="4 SLOs tracked: freshness, row volume, null rate, consumer lag."
        />
      ) : (
        <div ref={wrapRef} className="h-[420px] w-full">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="SLA dashboard showing pipeline freshness against its service-level objective and error budget."
            className="h-full w-full"
          />
        </div>
      )}

      <div className="mt-3 max-h-[120px] overflow-y-auto font-mono text-[11px]" aria-live="polite">
        {feed.map((entry) => (
          <div
            key={entry.id}
            className={cn("border-l-2 py-0.5 pl-2", entry.bad ? "border-destructive text-destructive" : "border-[#22c55e] text-[#22c55e]")}
          >
            {entry.text}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => start(false)}
          className="border-2 border-foreground bg-brand-orange px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-white"
        >
          ▶ play 1 hour
        </button>
        <button
          type="button"
          onClick={() => start(true)}
          className="border-2 border-border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-foreground hover:border-brand-orange/60"
        >
          ⚠ inject incident
        </button>
        <button
          type="button"
          onClick={pause}
          className="border-2 border-border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-foreground hover:border-brand-orange/60"
        >
          ⏸ pause
        </button>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          t = <b className="text-foreground">{clock}</b> · status{" "}
          <b className={status === "incident" ? "text-destructive" : "text-[#22c55e]"}>{status}</b>
        </span>
      </div>
    </div>
  );
}

export default SLAdash;
