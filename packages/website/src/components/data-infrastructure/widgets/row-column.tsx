"use client";

// Ported from data-infrastructure/js/data-widgets.js's RowColumn (lines
// 475-699) — single-canvas, click-driven, no DOM-overlay coordinate mapping
//.

import { useCallback, useMemo, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useCanvasRAF } from "../canvas/use-canvas-raf";
import { useCanvasAutoSize } from "../canvas/use-canvas-size";
import { CanvasFallbackNotice } from "../canvas/canvas-fallback";
import { cn } from "@/lib/utils";
import { useDataInfraWidgetLocale } from "../widget-locale-context";

interface RowColumnProps {
  readonly lessonId: string;
  readonly cpId: string;
}

const ROWS = 12;
const HEADERS = ["id", "user", "country", "amount"] as const;
const COUNTRIES = ["US", "UK", "JP", "BR", "DE", "FR"];
const NAMES = [
  "alice",
  "bob",
  "cara",
  "dan",
  "eve",
  "finn",
  "gabe",
  "hana",
  "ivy",
  "jon",
  "kim",
  "leo",
];

function buildData(): (string | number)[][] {
  return Array.from({ length: ROWS }, (_, i) => [
    1000 + i,
    NAMES[i],
    COUNTRIES[i % 6],
    (5 + ((i * 37) % 90)).toFixed(2),
  ]);
}

export function RowColumn({ lessonId, cpId }: RowColumnProps): JSX.Element {
  const { locale } = useDataInfraWidgetLocale();
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const data = useMemo(buildData, []);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextUnavailable, setContextUnavailable] = useState(false);
  const [stats, setStats] = useState<{ rb: string; cb: string; sv: string }>({
    rb: "—",
    cb: "—",
    sv: "—",
  });

  const sweepRowRef = useRef(-1);
  const sweepColRef = useRef(-1);
  const activeRef = useRef(false);

  useCanvasAutoSize(canvasRef, wrapRef, { minHeight: 340 });

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

    const padX = 12;
    const padY = 40;
    const halfW = w / 2 - padX * 1.5;
    const colW = halfW / 4;
    const rowH = (h - padY * 2 - 20) / (ROWS + 1);

    ctx.fillStyle = "#5b8a8f";
    ctx.font = "bold 12px monospace";
    ctx.fillText(
      locale === "de" ? "Zeilenspeicher · Postgres" : "row store · Postgres",
      padX,
      16,
    );
    ctx.fillText(
      locale === "de" ? "Spaltenspeicher · Parquet" : "column store · Parquet",
      w / 2 + padX,
      16,
    );

    const rx = padX;
    const ry = padY;
    ctx.fillStyle = "rgba(91,138,143,0.12)";
    ctx.fillRect(rx, ry, colW * 4, rowH);
    HEADERS.forEach((hd, c) => {
      ctx.fillStyle = "#334155";
      ctx.font = "bold 10px monospace";
      ctx.fillText(hd, rx + c * colW + 4, ry + rowH / 2 + 3);
    });
    data.forEach((row, r) => {
      const y = ry + rowH + r * rowH;
      const swept = r <= sweepRowRef.current && sweepRowRef.current >= 0;
      ctx.fillStyle = swept ? "rgba(207,138,63,0.18)" : "rgba(0,0,0,0.015)";
      ctx.fillRect(rx, y, colW * 4, rowH - 1);
      ctx.strokeStyle = swept ? "#cf8a3f" : "rgba(91,138,143,0.2)";
      ctx.strokeRect(rx, y, colW * 4, rowH - 1);
      row.forEach((cell, c) => {
        ctx.fillStyle =
          swept && row[2] === "US" && (c === 2 || c === 3)
            ? "#2a5a45"
            : "#334155";
        ctx.font = "9px monospace";
        ctx.fillText(String(cell), rx + c * colW + 4, y + rowH / 2 + 3);
      });
    });
    ctx.fillStyle = "rgba(184,90,74,0.12)";
    ctx.fillRect(rx, ry, colW * 2, rowH * (ROWS + 1));
    ctx.fillStyle = "#b85a4a";
    ctx.font = "9px monospace";
    ctx.fillText(
      locale === "de" ? "gelesen, aber nicht genutzt" : "read but unused",
      rx,
      ry + rowH * (ROWS + 1) + 12,
    );

    const cx = w / 2 + padX / 2;
    const cy = padY;
    ctx.fillStyle = "rgba(91,138,143,0.12)";
    ctx.fillRect(cx, cy, colW * 4, rowH);
    HEADERS.forEach((hd, c) => {
      const used = c === 2 || c === 3;
      ctx.fillStyle = used ? "#2a5a45" : "#94a3b8";
      ctx.font = "bold 10px monospace";
      ctx.fillText(hd, cx + c * colW + 4, cy + rowH / 2 + 3);
    });
    for (let c = 0; c < 4; c++) {
      const x = cx + c * colW;
      const used = c === 2 || c === 3;
      ctx.fillStyle = used ? "rgba(63,130,100,0.1)" : "rgba(0,0,0,0.015)";
      ctx.fillRect(x, cy + rowH, colW - 2, rowH * ROWS);
      ctx.strokeStyle = used ? "#3f8264" : "rgba(91,138,143,0.2)";
      ctx.strokeRect(x, cy + rowH, colW - 2, rowH * ROWS);
      if (used && sweepColRef.current >= 0) {
        ctx.fillStyle = "rgba(207,138,63,0.18)";
        ctx.fillRect(x, cy + rowH, colW - 2, (sweepColRef.current + 1) * rowH);
      }
      data.forEach((row, r) => {
        const y = cy + rowH + r * rowH;
        const isHit = used && row[2] === "US";
        ctx.fillStyle = isHit ? "#2a5a45" : used ? "#334155" : "#94a3b8";
        ctx.font = "9px monospace";
        ctx.fillText(String(row[c]), x + 4, y + rowH / 2 + 3);
      });
    }

    if (stats.rb !== ",") {
      ctx.fillStyle = "#2a5a45";
      ctx.font = "bold 13px monospace";
      ctx.fillText("SUM →", w - 60, 16);
    }

    return activeRef.current;
  }, [data, locale, stats.rb]);

  const { wake } = useCanvasRAF(draw);

  const run = useCallback(() => {
    sweepRowRef.current = -1;
    sweepColRef.current = -1;
    activeRef.current = true;
    for (let r = 0; r < ROWS; r++) {
      setTimeout(() => {
        sweepRowRef.current = r;
        wake();
      }, r * 100);
    }
    setTimeout(() => {
      for (let r = 0; r < ROWS; r++) {
        setTimeout(() => {
          sweepColRef.current = r;
          wake();
        }, r * 60);
      }
    }, 200);

    const rowBytes = ROWS * 4 * 8;
    const colBytes = ROWS * 2 * 8;
    setStats({
      rb: `${rowBytes}B (4 cols)`,
      cb: `${colBytes}B (2 cols)`,
      sv: `${Math.round((1 - colBytes / rowBytes) * 100)}% ${locale === "de" ? "weniger" : "less"}`,
    });

    setTimeout(
      () => {
        activeRef.current = false;
        wake();
        complete();
      },
      ROWS * 100 + 900,
    );
  }, [complete, locale, wake]);

  const reset = useCallback(() => {
    sweepRowRef.current = -1;
    sweepColRef.current = -1;
    activeRef.current = false;
    setStats({ rb: "—", cb: "—", sv: "—" });
    wake();
  }, [wake]);

  return (
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-3 sm:p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        {locale === "de"
          ? "Modell · Zeilen- und Spaltenspeicher"
          : "Model · Row and column storage"}{" "}
        {done ? "✓" : ""}
      </p>

      {contextUnavailable ? (
        <CanvasFallbackNotice
          title={
            locale === "de"
              ? "Zeilen- und Spaltenspeicher"
              : "Row vs column storage"
          }
          summary={
            locale === "de"
              ? "Der Zeilenspeicher liest vier Spalten jeder Zeile. Der Spaltenspeicher liest nur country und amount."
              : "A row-store scans all 4 columns of every row; a column-store touches only the 2 columns the query needs, country and amount."
          }
        />
      ) : (
        <div ref={wrapRef} className="h-[340px] w-full">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={
              locale === "de"
                ? "Diagramm zum Vergleich von Zeilen- und Spaltenspeicherung und den von einer Abfrage gelesenen Spalten."
                : "Diagram comparing row-oriented and column-oriented storage layouts and which columns a query reads."
            }
            className="h-full w-full"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={run}
          className="border-2 border-foreground bg-brand-orange px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-white hover:opacity-90"
        >
          {locale === "de" ? "Abfrage ausführen" : "▶ run query"}
        </button>
        <button
          type="button"
          onClick={reset}
          className={cn(
            "border-2 border-border bg-background px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-foreground hover:border-brand-orange/60",
          )}
        >
          {locale === "de" ? "Zurücksetzen" : "reset"}
        </button>
        <span className="font-mono text-[11px] text-muted-foreground">
          {locale === "de" ? "Zeilenspeicher" : "row store"}{" "}
          <b className="text-foreground">{stats.rb}</b> ·{" "}
          {locale === "de" ? "Spaltenspeicher" : "column store"}{" "}
          <b className="text-foreground">{stats.cb}</b> ·{" "}
          {locale === "de" ? "Einsparung" : "saved"}{" "}
          <b className="text-foreground">{stats.sv}</b>
        </span>
      </div>
    </div>
  );
}

export default RowColumn;
