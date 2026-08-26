"use client";

// Ported from data-infrastructure/js/data-widgets.js's Watermark (lines
// 1199-1429) —.

import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useAutoSizedCanvasRAF } from "../canvas/use-auto-sized-canvas-raf";
import { CanvasFallbackNotice } from "../canvas/canvas-fallback";
import { cn } from "@/lib/utils";
import { useDataInfraWidgetLocale } from "../widget-locale-context";

interface WatermarkProps {
  readonly lessonId: string;
  readonly cpId: string;
}

type EventKind = "ok" | "late" | "drop";

interface StreamEvent {
  readonly pt: number;
  readonly et: number;
  processed: boolean;
  kind?: EventKind;
}

interface StreamCounts {
  readonly ok: number;
  readonly late: number;
  readonly drop: number;
  readonly watermark: number;
}

const KIND_COLOR: Record<EventKind, string> = {
  ok: "#3f8264",
  late: "#cf8a3f",
  drop: "#b85a4a",
};
const T_MAX = 24;
const ET_MAX = 22;

function processAvailableEvents(
  events: StreamEvent[],
  processTime: number,
): StreamCounts {
  let ok = 0;
  let late = 0;
  let drop = 0;

  for (const event of events) {
    if (!event.processed && event.pt <= processTime) {
      event.processed = true;
      const lateness = event.pt - event.et;
      event.kind = lateness > 4 ? "drop" : lateness > 1 ? "late" : "ok";
    }

    if (event.kind === "ok") ok += 1;
    else if (event.kind === "late") late += 1;
    else if (event.kind === "drop") drop += 1;
  }

  const seen = events.filter((event) => event.processed);
  const watermark = seen.length
    ? Math.max(0, Math.max(...seen.map((event) => event.et)) - 1)
    : 0;
  return { ok, late, drop, watermark };
}

export function Watermark({ lessonId, cpId }: WatermarkProps): JSX.Element {
  const { locale } = useDataInfraWidgetLocale();
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextUnavailable, setContextUnavailable] = useState(false);
  const [allowLate, setAllowLate] = useState(true);
  const [counts, setCounts] = useState({
    ok: 0,
    late: 0,
    drop: 0,
    watermark: 0,
  });
  const [running, setRunning] = useState(false);

  const eventsRef = useRef<StreamEvent[]>([]);
  const ptRef = useRef(0);
  const watermarkRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    const padL = 46;
    const padR = 16;
    const padT = 16;
    const padB = 30;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const tx = (t: number) => padL + (t / T_MAX) * plotW;
    const ty = (t: number) => padT + (1 - t / ET_MAX) * plotH;

    ctx.strokeStyle = "rgba(91,138,143,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, plotW, plotH);
    ctx.strokeStyle = "rgba(91,138,143,0.4)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(tx(0), ty(0));
    ctx.lineTo(tx(T_MAX), ty(T_MAX));
    ctx.stroke();
    ctx.setLineDash([]);

    const yWm = ty(watermarkRef.current);
    ctx.strokeStyle = "#5b8a8f";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(padL, yWm);
    ctx.lineTo(padL + plotW, yWm);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const e of eventsRef.current) {
      if (!e.processed || !e.kind) continue;
      ctx.fillStyle = KIND_COLOR[e.kind];
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(
        tx(Math.min(T_MAX, e.pt)),
        ty(Math.max(0, Math.min(ET_MAX, e.et))),
        4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    return false;
  }, []);

  const { wake, isReducedMotion } = useAutoSizedCanvasRAF(
    canvasRef,
    wrapRef,
    draw,
    {
      minHeight: 340,
    },
  );

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    eventsRef.current = [];
    ptRef.current = 0;
    watermarkRef.current = 0;
    setRunning(false);
    setCounts({ ok: 0, late: 0, drop: 0, watermark: 0 });
    wake();
  }, [wake]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, []);

  const run = useCallback(
    (chaos: boolean) => {
      reset();
      setRunning(true);
      const events: StreamEvent[] = [];
      for (let i = 0; i < 28; i++) {
        const ptT = i * 0.7 + Math.random() * 0.3;
        let et = ptT - Math.random() * 1.5;
        const lateChance = chaos ? 0.55 : 0.32;
        if (allowLate && Math.random() < lateChance)
          et = ptT - 2.5 - Math.random() * (chaos ? 5 : 3);
        events.push({ pt: ptT, et, processed: false });
      }
      eventsRef.current = events;

      if (isReducedMotion()) {
        ptRef.current = 22.05;
        const nextCounts = processAvailableEvents(
          eventsRef.current,
          ptRef.current,
        );
        watermarkRef.current = nextCounts.watermark;
        setCounts(nextCounts);
        setRunning(false);
        complete();
        wake();
        return;
      }

      timerRef.current = setInterval(() => {
        ptRef.current += 0.35;
        const nextCounts = processAvailableEvents(
          eventsRef.current,
          ptRef.current,
        );
        watermarkRef.current = nextCounts.watermark;
        setCounts(nextCounts);
        wake();
        if (ptRef.current > 22) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setRunning(false);
          complete();
        }
      }, 150);
    },
    [allowLate, complete, isReducedMotion, reset, wake],
  );

  return (
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-3 sm:p-5 md:p-6">
      <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
        {locale === "de"
          ? "Modell · Ereigniszeit, Verarbeitungszeit und Watermark"
          : "Model · Event time, processing time, and watermark"}{" "}
        {done ? "✓" : ""}
      </p>

      {contextUnavailable ? (
        <CanvasFallbackNotice
          title="Watermark"
          summary={
            locale === "de"
              ? "Ereignisse werden nach Verarbeitungszeit und Ereigniszeit eingezeichnet. Zu späte Ereignisse unterhalb des Vier-Sekunden-Budgets werden verworfen."
              : "Events plotted by processing time (x) vs event time (y): on-time events land near the diagonal, late events fall below it, and events past a 4-second budget are dropped."
          }
        />
      ) : (
        <div ref={wrapRef} className="h-[340px] w-full">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={
              locale === "de"
                ? "Watermark-Darstellung für Ereigniszeit, Verarbeitungszeit und verworfene verspätete Ereignisse."
                : "Stream-processing watermark visualization showing event time versus processing time and which late events are dropped."
            }
            className="h-full w-full"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => run(false)}
          disabled={running}
          className="min-h-11 border-2 border-foreground bg-brand-orange px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locale === "de" ? "Stream ausführen" : "▶ run stream"}
        </button>
        <button
          type="button"
          onClick={() => run(true)}
          disabled={running}
          className="min-h-11 border-2 border-border bg-background px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-foreground hover:border-brand-orange/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locale === "de"
            ? "Viele verspätete Ereignisse"
            : "⚡ chaos (lots late)"}
        </button>
        <button
          type="button"
          onClick={reset}
          className={cn(
            "min-h-11 border-2 border-border bg-background px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-foreground hover:border-brand-orange/60",
          )}
        >
          {locale === "de" ? "zurücksetzen" : "reset"}
        </button>
        <label className="flex min-h-11 items-center gap-1.5 text-[12px]">
          <input
            type="checkbox"
            checked={allowLate}
            onChange={(e) => setAllowLate(e.target.checked)}
          />
          {locale === "de" ? "verspätete Ereignisse zulassen" : "allow late"}
        </label>
        <span className="font-mono text-xs text-muted-foreground">
          {locale === "de" ? "pünktlich" : "on-time"}{" "}
          <b className="text-foreground">{counts.ok}</b> ·{" "}
          {locale === "de" ? "verspätet" : "late"}{" "}
          <b className="text-foreground">{counts.late}</b> ·{" "}
          {locale === "de" ? "verworfen" : "dropped"}{" "}
          <b className="text-foreground">{counts.drop}</b> · watermark{" "}
          <b className="text-foreground">t={counts.watermark.toFixed(1)}</b>
        </span>
      </div>
    </div>
  );
}

export default Watermark;
