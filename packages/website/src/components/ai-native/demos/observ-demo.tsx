"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { DemoOverline } from "./_shared";
import { cn } from "@/lib/utils";

/**
 * ObservDemo — simulated LLM observability dashboard.
 *
 * 4 headline KPIs + per-application sparkline + scrolling log stream.
 * Ticks every 1.2s (respects prefers-reduced-motion → static values only).
 * Randomness is intentional cosmetic noise, NOT grading logic, so use of
 * Math.random in the series generator is allowed here (demos vs. exercises).
 *
 * Provenance: first-party loehrning.ai implementation by Tim Löhr.
 * Ported 2026-04-21. See AI-native demo gallery implementation.
 */

interface AppRow {
  readonly id: string;
  readonly name: string;
  readonly model: string;
  readonly calls: number;
  readonly cost: number;
  readonly latencyS: number;
  readonly errorPct: number;
}

const APPS: readonly AppRow[] = [
  {
    id: "vertrag",
    name: "Vertrags-Assistent",
    model: "Claude Haiku 4.5",
    calls: 12840,
    cost: 186.42,
    latencyS: 1.2,
    errorPct: 0.2,
  },
  {
    id: "rechnung",
    name: "Rechnungs-Extraktion",
    model: "Claude Opus 4.5",
    calls: 3210,
    cost: 412.08,
    latencyS: 2.8,
    errorPct: 0.4,
  },
  {
    id: "agent",
    name: "Memo-Pipeline",
    model: "Multi-Model",
    calls: 842,
    cost: 298.15,
    latencyS: 14.6,
    errorPct: 1.1,
  },
  {
    id: "sales",
    name: "Anfrage-Klassifikation",
    model: "Claude Sonnet 4.5",
    calls: 7420,
    cost: 96.33,
    latencyS: 0.9,
    errorPct: 0.3,
  },
];

const SERIES_LENGTH = 60;

function makeSeedSeries(
  length: number,
  base: number,
  amplitude: number,
): number[] {
  const arr: number[] = [];
  let v = base;
  for (let i = 0; i < length; i++) {
    v += (Math.random() - 0.5) * amplitude;
    arr.push(Math.max(0.1, v));
  }
  return arr;
}

export function ObservDemo(): JSX.Element {
  const [selectedAppId, setSelectedAppId] = useState<string>(APPS[0].id);
  const [tick, setTick] = useState(0);
  const [series, setSeries] = useState<number[]>(() =>
    makeSeedSeries(SERIES_LENGTH, 1.2, 0.4),
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    intervalRef.current = setInterval(() => {
      setTick((t) => t + 1);
      setSeries((prev) => [
        ...prev.slice(1),
        Math.max(0.2, prev[prev.length - 1] + (Math.random() - 0.5) * 0.5),
      ]);
    }, 1200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const activeApp = APPS.find((a) => a.id === selectedAppId) ?? APPS[0];
  const total = APPS.reduce((s, a) => s + a.cost, 0);

  const W = 600;
  const H = 120;
  const max = Math.max(...series);
  const min = Math.min(...series);
  const denom = max - min || 1;
  const points = series
    .map(
      (v, i) =>
        `${(i / (series.length - 1)) * W},${H - ((v - min) / denom) * H}`,
    )
    .join(" ");

  const kpis: readonly [string, string, string, string][] = [
    [
      "Verbrauch · MTD",
      `€${total.toFixed(0)}`,
      "+12% vs letztes Mo.",
      "text-brand-orange",
    ],
    ["Calls · 24h", "5,284", "+3.2 %", "text-foreground"],
    ["p95 Latenz", "2,4 s", "−8 % verbessert", "text-risk-green"],
    ["Fehlerquote", "0,41 %", "innerhalb SLA", "text-risk-green"],
  ];

  const logLines: readonly [
    string,
    "info" | "warn" | "error",
    string,
    string,
  ][] = [
    [`${tick}s`, "info", "haiku·42ms", "Abfrage: 'Kündigungsfrist Q3'"],
    [`${tick - 2}s`, "info", "haiku·38ms", "Abfrage: 'Haftungsgrenze'"],
    [`${tick - 4}s`, "warn", "opus·3.2s", "Retry nach Timeout"],
    [`${tick - 7}s`, "info", "sonnet·1.8s", "Pipeline: Anfrage-Klassif."],
    [`${tick - 9}s`, "error", "opus·0ms", "Rate-Limit (org-1)"],
    [`${tick - 12}s`, "info", "haiku·29ms", "Cache-Hit"],
  ];

  const lvlColor: Record<"info" | "warn" | "error", string> = {
    info: "text-risk-green",
    warn: "text-brand-amber",
    error: "text-destructive",
  };

  return (
    <div
      className="flex flex-col gap-4 overflow-hidden"
      role="region"
      aria-label="Observability Dashboard"
    >
      <div>
        <DemoOverline>Observability &amp; Kosten</DemoOverline>
        <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-foreground md:text-[26px]">
          LLM-Kosten und Drift:{" "}
          <span className="text-brand-orange">ein Beispiel-Szenario.</span>
        </h3>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Alle Werte sind Beispiel-Szenarien, keine Live-Messwerte. Illustriert,
          wie Drift, Halluzinations-Indikatoren und Kostenspitzen erkannt werden
          können.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {kpis.map(([label, val, delta, color]) => (
          <div
            key={label}
            className={cn(
              "border border-l-[3px] border-border bg-background p-3.5",
              color === "text-brand-orange" && "border-l-brand-orange",
              color === "text-foreground" && "border-l-foreground",
              color === "text-risk-green" && "border-l-risk-green",
            )}
          >
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {label}
            </div>
            <div className="mt-1 font-mono text-[22px] font-bold tracking-[-0.02em] text-foreground md:text-[24px]">
              {val}
            </div>
            <div className={cn("mt-1 font-mono text-[10px]", color)}>
              {delta}
            </div>
          </div>
        ))}
      </div>

      {/* App picker + live chart */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-[260px_1fr]">
        <div>
          <div className="mb-2">
            <DemoOverline>Anwendungen</DemoOverline>
          </div>
          <div className="flex flex-col gap-1.5">
            {APPS.map((a) => {
              const active = selectedAppId === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAppId(a.id)}
                  aria-pressed={active}
                  className={cn(
                    "border p-3 text-left transition-colors",
                    active
                      ? "border-brand-orange bg-foreground text-background"
                      : "border-border bg-card/60 text-foreground hover:border-foreground",
                  )}
                >
                  <div className="text-[13px] font-bold tracking-[-0.02em]">
                    {a.name}
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em]",
                      active ? "text-background/60" : "text-muted-foreground",
                    )}
                  >
                    {a.model.toUpperCase()}
                  </div>
                  <div
                    className={cn(
                      "mt-1.5 flex justify-between font-mono text-[10px]",
                      active
                        ? "text-[var(--color-kupfer-light)]"
                        : "text-muted-foreground",
                    )}
                  >
                    <span>€{a.cost.toFixed(0)}</span>
                    <span>{a.calls.toLocaleString("de-DE")}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="dark-section border-t-[3px] border-brand-orange bg-[var(--color-dark-bg)] p-4">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="text-[15px] font-bold tracking-[-0.02em] text-[var(--color-dark-fg)]">
                {activeApp.name}
              </div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-dark-muted)]">
                Latenz · letzte 60 Min · tick {tick}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 self-start bg-brand-orange px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.14em] text-[var(--color-dark-bg)]">
              SIM
            </span>
          </div>
          <svg
            width="100%"
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="obs-area" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-brand-orange)"
                  stopOpacity="0.4"
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-brand-orange)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((g) => (
              <line
                key={g}
                x1={0}
                x2={W}
                y1={H * g}
                y2={H * g}
                stroke="rgba(243,240,233,0.08)"
              />
            ))}
            <polyline
              points={`0,${H} ${points} ${W},${H}`}
              fill="url(#obs-area)"
              stroke="none"
            />
            <polyline
              points={points}
              fill="none"
              stroke="var(--color-brand-orange)"
              strokeWidth="1.5"
            />
          </svg>
          <div className="mt-3.5 grid grid-cols-2 gap-2.5 border-t border-[var(--color-dark-border)] pt-3 md:grid-cols-4">
            {[
              ["Calls", activeApp.calls.toLocaleString("de-DE")],
              ["Verbrauch", `€${activeApp.cost.toFixed(2)}`],
              ["Avg Latenz (Beispiel)", `${activeApp.latencyS}s`],
              ["Fehler", `${activeApp.errorPct}%`],
            ].map(([label, val]) => (
              <div key={label}>
                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--color-dark-muted)]">
                  {label}
                </div>
                <div className="mt-0.5 font-mono text-[16px] font-bold text-[var(--color-dark-fg)] md:text-[18px]">
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Log stream */}
      <div>
        <div className="mb-2">
          <DemoOverline>Log-Stream</DemoOverline>
        </div>
        <div className="dark-section max-h-[150px] overflow-y-auto bg-[var(--color-dark-bg)] px-3.5 py-3 font-mono text-[11px] leading-[1.7] text-[var(--color-dark-fg)]">
          {logLines.map(([t, lvl, tag, msg], i) => (
            <div key={i}>
              <span className="text-muted-foreground">
                {t.padStart(4)}{" "}
              </span>
              <span className={cn("tracking-[0.1em]", lvlColor[lvl])}>
                [{lvl.toUpperCase().padEnd(5)}]
              </span>
              <span className="text-brand-orange"> {tag.padEnd(14)}</span>
              <span className="text-[var(--color-dark-fg)]/85"> {msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ObservDemo;
