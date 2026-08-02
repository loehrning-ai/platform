"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { m, AnimatePresence } from "framer-motion";
import { DemoOverline } from "./_shared";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";

/**
 * ExcelDemo — Claude ↔ Microsoft Excel via add-in. Three task modes:
 *   - formula: generate a Wachstum calculation formula
 *   - pivot: region-level rollup with insight paragraph
 *   - forecast: 4-week projection with confidence band
 *
 * Provenance: first-party loehrning.ai implementation by Tim Löhr.
 * Ported 2026-04-21. See AI-native demo gallery implementation.
 */

interface ExcelRow {
  readonly week: string;
  readonly region: string;
  readonly sku: string;
  readonly stk: number;
  readonly umsatz: number;
}

const EXCEL_ROWS: readonly ExcelRow[] = [
  { week: "KW 14", region: "Nord", sku: "S-2200", stk: 142, umsatz: 688700 },
  { week: "KW 14", region: "Süd", sku: "S-2200", stk: 98, umsatz: 475300 },
  { week: "KW 14", region: "West", sku: "S-2200", stk: 174, umsatz: 843900 },
  { week: "KW 15", region: "Nord", sku: "S-2200", stk: 156, umsatz: 756600 },
  { week: "KW 15", region: "Süd", sku: "S-2200", stk: 82, umsatz: 397700 },
  { week: "KW 15", region: "West", sku: "S-2200", stk: 188, umsatz: 911800 },
  { week: "KW 16", region: "Nord", sku: "S-2200", stk: 161, umsatz: 780850 },
  { week: "KW 16", region: "Süd", sku: "S-2200", stk: 94, umsatz: 455900 },
  { week: "KW 16", region: "West", sku: "S-2200", stk: 203, umsatz: 984550 },
];

type TaskId = "formula" | "pivot" | "forecast";

interface TaskSpec {
  readonly id: TaskId;
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
}

const TASKS: readonly TaskSpec[] = [
  {
    id: "formula",
    title: "Formel für Wachstum",
    description: "Prozentuale Abweichung Woche / Woche, pro Region",
    actionLabel: "Formel generieren",
  },
  {
    id: "pivot",
    title: "Pivot nach Region",
    description: "Summen & Durchschnitt Stück / Umsatz, sortiert",
    actionLabel: "Pivot erstellen",
  },
  {
    id: "forecast",
    title: "Forecast KW 17–20",
    description: "Lineare Projektion + Saisonalität, mit Konfidenz",
    actionLabel: "Prognose rechnen",
  },
];

type Output =
  | {
      readonly kind: "formula";
      readonly cell: string;
      readonly formula: string;
      readonly explain: string;
      readonly preview: readonly {
        readonly w: string;
        readonly region: string;
        readonly wachstum: string;
      }[];
    }
  | {
      readonly kind: "pivot";
      readonly rows: readonly {
        readonly region: string;
        readonly stk: number;
        readonly umsatz: string;
        readonly anteil: string;
      }[];
      readonly explain: string;
    }
  | {
      readonly kind: "forecast";
      readonly rows: readonly {
        readonly w: string;
        readonly pred: number;
        readonly lo: number;
        readonly hi: number;
      }[];
      readonly explain: string;
    };

function outputFor(taskId: TaskId): Output {
  if (taskId === "formula") {
    return {
      kind: "formula",
      cell: "F2",
      formula:
        '=WENN(INDIREKT("E"&ZEILE()-3)=0;"";(E2-INDIREKT("E"&ZEILE()-3))/INDIREKT("E"&ZEILE()-3))',
      explain:
        "Greift auf die Vorwoche derselben Region zu (−3 Zeilen, da 3 Regionen pro KW) und berechnet die relative Veränderung. Division-by-Zero abgefangen.",
      preview: [
        { w: "KW 15", region: "Nord", wachstum: "+9,9 %" },
        { w: "KW 15", region: "Süd", wachstum: "−16,3 %" },
        { w: "KW 15", region: "West", wachstum: "+8,0 %" },
        { w: "KW 16", region: "Nord", wachstum: "+3,2 %" },
        { w: "KW 16", region: "Süd", wachstum: "+14,6 %" },
        { w: "KW 16", region: "West", wachstum: "+8,0 %" },
      ],
    };
  }
  if (taskId === "pivot") {
    return {
      kind: "pivot",
      rows: [
        { region: "West", stk: 565, umsatz: "2.740.250 €", anteil: "41 %" },
        { region: "Nord", stk: 459, umsatz: "2.226.150 €", anteil: "33 %" },
        { region: "Süd", stk: 274, umsatz: "1.328.900 €", anteil: "20 %" },
      ],
      explain:
        "West führt mit 41 % Umsatz-Anteil bei nur 33 % der Regionen. Süd schwächelt strukturell. Dort Preisdruck prüfen.",
    };
  }
  return {
    kind: "forecast",
    rows: [
      { w: "KW 17", pred: 492, lo: 458, hi: 526 },
      { w: "KW 18", pred: 548, lo: 498, hi: 598 },
      { w: "KW 19", pred: 612, lo: 544, hi: 680 },
      { w: "KW 20", pred: 684, lo: 590, hi: 778 },
    ],
    explain:
      "Trend +7,9 % pro Woche mit leichter Quartals-Saisonalität (Sommer-Peak in KW 20). Konfidenz-Bereich (Beispiel, nicht gemessen). Unsicherheit wächst sichtbar mit Horizont: +/-7 % in KW 17, +/-14 % in KW 20. Empfehlung: Lagerbestand West ab KW 19 verdoppeln.",
  };
}

export function ExcelDemo(): JSX.Element {
  const [task, setTask] = useState<TaskSpec | null>(null);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<Output | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function run(t: TaskSpec) {
    if (timer.current) clearTimeout(timer.current);
    setTask(t);
    setLoading(true);
    setOutput(null);
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reducedMotion ? 50 : 850;
    timer.current = setTimeout(() => {
      setLoading(false);
      setOutput(outputFor(t.id));
    }, delay);
  }

  return (
    <div
      className="flex flex-col gap-4 overflow-hidden"
      role="region"
      aria-label="Praxisbeispiel: Excel"
    >
      <div>
        <DemoOverline>Excel-Lab mit KI-Assistent</DemoOverline>
        <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-foreground md:text-[26px]">
          Tabellenlogik,{" "}
          <span className="text-brand-orange">als Beispiel-Lab.</span>
        </h3>
        <p className="mt-1.5 max-w-[620px] text-[13px] leading-[1.55] text-muted-foreground">
          Kein Microsoft-365-Zugriff. Das Praxisbeispiel nutzt Beispieldaten und
          zeigt, wie Formeln, Pivots und Prognosen fachlich geprüft werden.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_1fr]">
        {/* Spreadsheet */}
        <div className="border border-foreground bg-background">
          <div
            className="flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white"
            style={{ backgroundColor: "#107C41" }}
          >
            <div
              className="flex h-4 w-4 items-center justify-center text-[11px] font-black"
              style={{ backgroundColor: "white", color: "#107C41" }}
            >
              X
            </div>
            Absatz-KW14-16.xlsx · Mappe1
          </div>
          <div className="border-b border-border bg-card/60 px-3 py-1 font-mono text-[10px] text-muted-foreground">
            A1:E10 · 9 Zeilen · 5 Spalten
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono text-[11px]">
              <thead>
                <tr className="bg-card/60">
                  {["", "Woche", "Region", "SKU", "Stück", "Umsatz"].map(
                    (h, i) => (
                      <th
                        key={i}
                        className={cn(
                          "border-b border-foreground border-r border-r-border px-2 py-1.5 text-[9px] tracking-[0.06em]",
                          i === 0
                            ? "text-muted-foreground font-normal"
                            : "font-bold text-foreground",
                          i > 3 ? "text-right" : "text-left",
                        )}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {EXCEL_ROWS.map((r, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="w-6 bg-card/60 px-2 py-1 text-center text-[9px] text-muted-foreground">
                      {i + 2}
                    </td>
                    <td className="border-r border-border px-2 py-1">
                      {r.week}
                    </td>
                    <td className="border-r border-border px-2 py-1">
                      {r.region}
                    </td>
                    <td className="border-r border-border px-2 py-1">
                      {r.sku}
                    </td>
                    <td className="border-r border-border px-2 py-1 text-right font-mono">
                      {r.stk}
                    </td>
                    <td className="px-2 py-1 text-right font-mono font-semibold">
                      {r.umsatz.toLocaleString("de-DE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border bg-card/60 px-3 py-2 font-mono text-[9px] tracking-[0.1em] text-muted-foreground">
            <span>Blatt1 · 9 Zeilen</span>
            <span className="font-bold text-brand-orange">
              ◆ Claude-Add-In aktiv
            </span>
          </div>
        </div>

        {/* Task picker */}
        <div className="flex flex-col gap-2.5">
          <DemoOverline>Aufgabe an Claude</DemoOverline>
          {TASKS.map((t) => {
            const active = task?.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => run(t)}
                disabled={loading}
                aria-pressed={active}
                className={cn(
                  "border p-3.5 text-left transition-[background-color,border-color,color,opacity,transform,box-shadow]",
                  active
                    ? "border-brand-orange bg-foreground text-background shadow-[3px_3px_0_0_var(--color-foreground)]"
                    : "border-border bg-card/60 text-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-foreground hover:shadow-[3px_3px_0_0_var(--color-foreground)]",
                  loading && "cursor-wait",
                )}
              >
                <div className="text-[14px] font-bold tracking-[-0.02em]">
                  {t.title}
                </div>
                <div
                  className={cn(
                    "mt-1 text-[12px]",
                    active ? "text-background/75" : "text-muted-foreground",
                  )}
                >
                  {t.description}
                </div>
                <div className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brand-orange">
                  {t.actionLabel} →
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="border-l-[3px] border-brand-orange bg-card/60 px-4 py-3.5 font-mono text-[12px] text-muted-foreground">
          <span
            className="mr-2 inline-block h-2 w-2 animate-pulse bg-brand-orange"
            aria-hidden="true"
          />
          Claude analysiert Zellbereich A1:E10…
        </div>
      )}

      <AnimatePresence mode="wait">
        {output?.kind === "formula" && (
          <m.div
            key="f"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="dark-section border-t-[3px] border-brand-orange bg-[var(--color-dark-bg)] p-4 text-[var(--color-dark-fg)]"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <DemoOverline>◆ Formel · Zelle {output.cell}</DemoOverline>
              <span className="inline-flex items-center gap-1 bg-brand-orange px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.12em] text-[var(--color-dark-bg)]">
                Formel kopieren
              </span>
            </div>
            <pre className="break-all bg-[rgba(243,240,233,0.06)] p-3 font-mono text-[12px] leading-[1.6] text-[var(--color-kupfer-light)]">
              {output.formula}
            </pre>
            <p className="mt-3 text-[12px] leading-[1.55] text-[var(--color-dark-fg)]/75">
              {output.explain}
            </p>
            <div className="mt-3 grid grid-cols-3 border-t border-[var(--color-dark-border)] pt-3 font-mono text-[11px] md:grid-cols-6">
              {output.preview.map((r, i) => {
                const negative = r.wachstum.startsWith("−");
                return (
                  <div
                    key={i}
                    className={cn(
                      "px-1 py-1",
                      i < output.preview.length - 1 &&
                        "border-r border-[var(--color-dark-border)]",
                    )}
                  >
                    <div className="font-mono text-[9px] tracking-[0.08em] text-[var(--color-dark-muted)]">
                      {r.w} · {r.region}
                    </div>
                    <div
                      className={cn(
                        "mt-0.5 font-bold",
                        negative ? "text-destructive" : "text-risk-green",
                      )}
                    >
                      {r.wachstum}
                    </div>
                  </div>
                );
              })}
            </div>
          </m.div>
        )}

        {output?.kind === "pivot" && (
          <m.div
            key="p"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="border border-brand-orange border-t-[3px] border-t-brand-orange bg-background p-4 shadow-[3px_3px_0_0_var(--color-foreground)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <DemoOverline>◆ Pivot · nach Region sortiert</DemoOverline>
              <span className="inline-flex items-center gap-1 bg-brand-orange px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.12em] text-white">
                Als Blatt einfügen →
              </span>
            </div>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b-2 border-foreground">
                  {["Region", "Stück (Σ)", "Umsatz (Σ)", "Anteil"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-1.5 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground",
                          i === 0 ? "text-left" : "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {output.rows.map((r, i) => (
                  <tr
                    key={r.region}
                    className={cn(
                      "border-b border-border",
                      i === 0 && "bg-[var(--color-kupfer-mist)]",
                    )}
                  >
                    <td
                      className={cn(
                        "px-1.5 py-2.5 font-bold",
                        i === 0 ? "text-brand-orange" : "text-foreground",
                      )}
                    >
                      {r.region}
                    </td>
                    <td className="px-1.5 py-2.5 text-right font-mono">
                      {r.stk}
                    </td>
                    <td className="px-1.5 py-2.5 text-right font-mono font-bold">
                      {r.umsatz}
                    </td>
                    <td
                      className={cn(
                        "px-1.5 py-2.5 text-right font-mono font-bold",
                        i === 0 ? "text-brand-orange" : "text-muted-foreground",
                      )}
                    >
                      {r.anteil}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 border-l-2 border-brand-orange pl-2.5 text-[12px] italic leading-[1.55] text-muted-foreground">
              {output.explain}
            </p>
          </m.div>
        )}

        {output?.kind === "forecast" && (
          <m.div
            key="fc"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="border border-brand-orange border-t-[3px] border-t-brand-orange bg-background p-4 shadow-[3px_3px_0_0_var(--color-foreground)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <DemoOverline>◆ Forecast · KW 17–20</DemoOverline>
              <span className="inline-flex items-center gap-1 bg-brand-orange px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.12em] text-white">
                Als Diagramm einfügen →
              </span>
            </div>
            <div
              className="flex items-end gap-4 border-b border-border pb-6 pt-6"
              style={{ height: 160 }}
            >
              {output.rows.map((r) => {
                const max = 820;
                const predH = (r.pred / max) * 100;
                const loH = (r.lo / max) * 100;
                const hiH = (r.hi / max) * 100;
                return (
                  <div
                    key={r.w}
                    className="relative flex h-full flex-1 flex-col items-center"
                  >
                    <div
                      className="absolute font-mono text-[10px] font-bold tracking-[-0.02em] text-foreground"
                      style={{ bottom: `${predH}%`, marginBottom: 4 }}
                    >
                      {r.pred}
                    </div>
                    <div
                      className="absolute font-mono text-[8px] tracking-[0.05em] text-muted-foreground"
                      style={{ bottom: `${hiH}%`, marginBottom: 2 }}
                    >
                      {r.lo}-{r.hi}
                    </div>
                    <div
                      className="absolute w-[38px] border border-dashed border-brand-orange bg-[var(--color-kupfer-mist)]"
                      style={{ height: `${hiH - loH}%`, bottom: `${loH}%` }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute bottom-0 w-[38px] bg-brand-orange shadow-[2px_2px_0_0_var(--color-foreground)]"
                      style={{ height: `${predH}%` }}
                      aria-hidden="true"
                    />
                    <div className="absolute -bottom-5 font-mono text-[11px] font-bold tracking-[0.06em] text-foreground">
                      {r.w}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-7 border-l-2 border-brand-orange pl-2.5 text-[12px] italic leading-[1.55] text-muted-foreground">
              {output.explain}
            </p>
          </m.div>
        )}
      </AnimatePresence>

      {!output && !loading && (
        <div className="border border-dashed border-border bg-card/60 p-5 text-center text-[13px] text-muted-foreground">
          → Wählen Sie eine Aufgabe. Der Assistent nutzt den sichtbaren
          Beispielbereich und liefert Formel, Pivot oder Prognosevorschlag.
        </div>
      )}
    </div>
  );
}

export default ExcelDemo;
