"use client";

// Ported from data-infrastructure/js/data-widgets.js's PartitionSim (lines
// 704-916) — single-canvas, click-driven, no DOM-overlay coordinate mapping
//.

import { useCallback, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useAutoSizedCanvasRAF } from "../canvas/use-auto-sized-canvas-raf";
import { CanvasFallbackNotice } from "../canvas/canvas-fallback";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locale";
import { useDataInfraWidgetLocale } from "../widget-locale-context";

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

function buildStrategy(key: StrategyKey, locale: Locale): StrategyMeta {
  switch (key) {
    case "none":
      return {
        bytes: "100 GB",
        verdict:
          locale === "de"
            ? "vollständiger Scan, 30-facher Aufwand"
            : "full scan, 30× wasted",
        verdictTone: "bad",
        skew: locale === "de" ? "entfällt" : "n/a",
        parts: [
          { label: locale === "de" ? "alle Daten" : "all data", bytes: 100 },
        ],
        hit: [0],
      };
    case "date": {
      const parts = Array.from({ length: 30 }, (_, i) => ({
        label: `2026-04-${String(i + 1).padStart(2, "0")}`,
        bytes: 3.3,
      }));
      return {
        bytes: "3.3 GB",
        verdict:
          locale === "de"
            ? "wirksames Pruning (1 von 30)"
            : "perfect prune (1 of 30)",
        verdictTone: "ok",
        skew: locale === "de" ? "gleichmäßig" : "even",
        parts,
        hit: [14],
      };
    }
    case "user": {
      const parts = Array.from({ length: 24 }, (_, i) => ({
        label: `hash_${i}`,
        bytes: 4.2,
      }));
      return {
        bytes: "100 GB",
        verdict:
          locale === "de"
            ? "kein Pruning: Abfrage enthält user_id nicht"
            : "no prune, query doesn't mention user",
        verdictTone: "bad",
        skew: locale === "de" ? "gleichmäßig" : "even",
        parts,
        hit: parts.map((_, i) => i),
      };
    }
    case "country": {
      const parts = COUNTRY_WEIGHTS.map(([label, bytes]) => ({ label, bytes }));
      return {
        bytes: "100 GB",
        verdict:
          locale === "de"
            ? "kein Pruning; starke Schieflage für US"
            : "no prune, also: heavy US skew",
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
          parts.push({
            label: `${String(d + 1).padStart(2, "0")}/${String(h).padStart(2, "0")}`,
            bytes: 0.14,
          });
        }
      }
      const hit = Array.from({ length: 24 }, (_, h) => 14 * 24 + h);
      return {
        bytes: "3.3 GB",
        verdict:
          locale === "de"
            ? "Small-File-Problem · 720 Dateien für 3,3 GB"
            : "small-file problem · 720 files for 3.3 GB",
        verdictTone: "warn",
        skew: locale === "de" ? "zu fein geteilt" : "over-split",
        parts,
        hit,
      };
    }
  }
}

function gridLayout(parts: readonly PartCell[], w: number, h: number) {
  const pad = 10;
  const n = parts.length;
  const cols = Math.max(
    1,
    Math.ceil(Math.sqrt((n * (w - 2 * pad)) / (h - 2 * pad))),
  );
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

export function PartitionSim({
  lessonId,
  cpId,
}: PartitionSimProps): JSX.Element {
  const { locale } = useDataInfraWidgetLocale();
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextUnavailable, setContextUnavailable] = useState(false);
  const [strategy, setStrategy] = useState<StrategyKey>("date");
  const meta = buildStrategy(strategy, locale);
  const scanningRef = useRef(false);

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

  const { wake } = useAutoSizedCanvasRAF(canvasRef, wrapRef, draw, {
    minHeight: 300,
  });

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
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-4 sm:p-5 md:p-6">
      <p className="mb-4 break-words font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange [overflow-wrap:anywhere]">
        {locale === "de"
          ? "Modell · Partitionierung wählen"
          : "Model · Choose a partition strategy"}{" "}
        {done ? "✓" : ""}
      </p>

      {contextUnavailable ? (
        <CanvasFallbackNotice
          title={locale === "de" ? "Partition Pruning" : "Partition pruning"}
          summary={
            locale === "de"
              ? `Strategie ${strategy}: ${meta.hit.length} von ${meta.parts.length} Partitionen gelesen, ${meta.bytes}. ${meta.verdict}.`
              : `${strategy} strategy: ${meta.hit.length} of ${meta.parts.length} partitions read, ${meta.bytes}. ${meta.verdict}.`
          }
        />
      ) : (
        <div ref={wrapRef} className="h-[300px] min-w-0 w-full">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={
              locale === "de"
                ? "Darstellung, welche Datenpartitionen eine Abfrage bei der gewählten Strategie liest oder auslässt."
                : "Visualization of how a partitioning strategy prunes data files scanned for a query."
            }
            className="h-full w-full"
          />
        </div>
      )}

      <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
        <code className="max-w-full min-w-0 overflow-x-auto border border-border bg-background px-2 py-1 font-mono text-xs">
          SELECT * FROM orders WHERE order_date = &apos;2026-04-15&apos;
        </code>
        <label className="flex w-full min-w-0 max-w-full items-center gap-2 text-[12px] sm:ml-auto sm:w-auto">
          <span className="sr-only">
            {locale === "de"
              ? "Partitionierungsstrategie"
              : "Partition strategy"}
          </span>
          <select
            aria-label={
              locale === "de"
                ? "Partitionierungsstrategie"
                : "Partition strategy"
            }
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as StrategyKey)}
            className="min-h-11 w-full min-w-0 max-w-full border-2 border-border bg-background px-2 py-1.5 font-mono text-[12px] sm:w-auto"
          >
            <option value="none">
              {locale === "de"
                ? "keine Partitionierung (vollständiger Scan)"
                : ", no partition (full scan)"}
            </option>
            <option value="date">
              order_date ({locale === "de" ? "täglich" : "daily"})
            </option>
            <option value="user">user_id (hash 24)</option>
            <option value="country">
              country ({locale === "de" ? "ungleich verteilt" : "skewed"})
            </option>
            <option value="hour">
              order_hour (
              {locale === "de" ? "zu fein partitioniert" : "over-partitioned"})
            </option>
          </select>
        </label>
        <button
          type="button"
          onClick={scan}
          className="min-h-11 max-w-full break-words border-2 border-foreground bg-brand-orange px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide text-white hover:opacity-90"
        >
          {locale === "de" ? "Scan ausführen" : "▶ scan"}
        </button>
      </div>
      <div
        className={cn(
          "mt-3 grid min-w-0 grid-cols-1 gap-x-6 gap-y-1 font-mono text-[12px] min-[360px]:grid-cols-2 sm:grid-cols-4",
        )}
      >
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">
          {locale === "de" ? "gelesene Dateien" : "files read"}{" "}
          <b className="text-foreground">
            {meta.hit.length} / {meta.parts.length}
          </b>
        </span>
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">
          {locale === "de" ? "gelesene Daten" : "data read"}{" "}
          <b className="text-foreground">{meta.bytes}</b>
        </span>
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">
          {locale === "de" ? "Bewertung" : "verdict"}{" "}
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
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">
          {locale === "de" ? "Verteilung" : "skew"}{" "}
          <b className="text-foreground">{meta.skew}</b>
        </span>
      </div>
    </div>
  );
}

export default PartitionSim;
