"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { DEMO } from "@/lib/demo-tokens";
import { DEMO_HEIGHT } from "./demo-utils";
import { useDemoLocale } from "./demo-locale";
import { DisclosureGlyph } from "./evidence-badge";

/** Sheet rows a phone shows before "Alle 9 Zeilen" opens the rest. */
const PHONE_SHEET_ROWS = 5;

type RegionKey = "Nord" | "Süd" | "West";

const REGION_EN: Record<RegionKey, string> = {
  Nord: "North",
  Süd: "South",
  West: "West",
};

const ROWS: readonly {
  readonly w: string;
  readonly region: RegionKey;
  readonly stk: number;
  readonly umsatz: number;
}[] = [
  { w: "KW 14", region: "Nord", stk: 142, umsatz: 688_700 },
  { w: "KW 14", region: "Süd", stk: 98, umsatz: 475_300 },
  { w: "KW 14", region: "West", stk: 174, umsatz: 843_900 },
  { w: "KW 15", region: "Nord", stk: 156, umsatz: 756_600 },
  { w: "KW 15", region: "Süd", stk: 82, umsatz: 397_700 },
  { w: "KW 15", region: "West", stk: 188, umsatz: 911_800 },
  { w: "KW 16", region: "Nord", stk: 161, umsatz: 780_850 },
  { w: "KW 16", region: "Süd", stk: 94, umsatz: 455_900 },
  { w: "KW 16", region: "West", stk: 203, umsatz: 984_550 },
];

type TaskId = "formula" | "pivot" | "forecast";

interface Task {
  readonly id: TaskId;
  readonly title: { readonly de: string; readonly en: string };
  readonly detail: { readonly de: string; readonly en: string };
  readonly action: { readonly de: string; readonly en: string };
  readonly time: { readonly de: string; readonly en: string };
}

const TASKS: readonly Task[] = [
  {
    id: "formula",
    title: {
      de: "Formel für Wachstum",
      en: "Week-over-week growth",
    },
    detail: {
      de: "Prozentuale Abweichung Woche / Woche, pro Region",
      en: "Percentage change week over week, per region",
    },
    action: { de: "Formel generieren", en: "Generate formula" },
    time: { de: "12 Sek.", en: "12 sec." },
  },
  {
    id: "pivot",
    title: { de: "Pivot nach Region", en: "Revenue by region" },
    detail: {
      de: "Summen & Anteile, sortiert nach Umsatz",
      en: "Totals & share, sorted by revenue",
    },
    action: { de: "Pivot erstellen", en: "Build pivot" },
    time: { de: "9 Sek.", en: "9 sec." },
  },
  {
    id: "forecast",
    title: { de: "Forecast KW 17 bis 20", en: "Forecast, weeks 17 to 20" },
    detail: {
      de: "Lineare Projektion mit 90 %-Konfidenz",
      en: "Linear projection with a 90% confidence band",
    },
    action: { de: "Prognose rechnen", en: "Calculate forecast" },
    time: { de: "18 Sek.", en: "18 sec." },
  },
];

const PIVOT_ROWS: readonly {
  readonly region: RegionKey;
  readonly stk: number;
  readonly umsatz: number;
  readonly anteil: number;
}[] = [
  { region: "West", stk: 565, umsatz: 2_740_250, anteil: 41 },
  { region: "Nord", stk: 459, umsatz: 2_226_150, anteil: 33 },
  { region: "Süd", stk: 274, umsatz: 1_328_900, anteil: 20 },
];

const FORECAST_WEEKS = ["KW 17", "KW 18", "KW 19", "KW 20"] as const;
const FORECAST_BASE = 492;
const FORECAST_DEFAULT_RATE = 8;
const FORECAST_CHART_MAX = 820;

interface ForecastRow {
  readonly w: (typeof FORECAST_WEEKS)[number];
  readonly pred: number;
  readonly lo: number;
  readonly hi: number;
}

function computeForecast(growthRatePercent: number): readonly ForecastRow[] {
  const rate = growthRatePercent / 100;
  let pred = FORECAST_BASE;
  return FORECAST_WEEKS.map((w, i) => {
    if (i > 0) pred *= 1 + rate;
    // Uncertainty compounds with both elapsed weeks and the assumed rate
    // itself — a higher growth assumption is not just a higher forecast, it
    // is a less certain one.
    const uncertainty = pred * (0.05 + i * 0.02 + rate * 0.35);
    return {
      w,
      pred: Math.round(pred),
      lo: Math.round(Math.max(0, pred - uncertainty)),
      hi: Math.round(pred + uncertainty),
    };
  });
}

function formatCurrency(value: number, locale: Locale): string {
  const formatted = value.toLocaleString(locale === "de" ? "de-DE" : "en-GB");
  return locale === "de" ? `${formatted} €` : `€${formatted}`;
}

function weekLabel(week: string, locale: Locale): string {
  return locale === "de" ? week : week.replace("KW", "Wk");
}

export default function ExcelDemo() {
  const { locale, text } = useDemoLocale();
  const [task, setTask] = useState<TaskId>(TASKS[0].id);

  return (
    <div
      data-demo-id="excel"
      role="region"
      aria-label={text(
        "Excel-Lab mit KI-Assistent",
        "Spreadsheet analysis example",
      )}
      // Tighter rhythm below sm so the first task reaches the first screen.
      className="gap-3 sm:gap-[18px]"
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
        minHeight: DEMO_HEIGHT,
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* Header: the page H1 and lead name the demo, so the engine keeps
          only an sr-only landmark heading and its one-line scope note. */}
      {/* display:contents below sm: with the note hidden the wrapper would
          only add an empty flex gap above the sheet. */}
      <div className="flex flex-col gap-1.5 max-sm:contents">
        <h2 className="sr-only">
          {text("Excel-Beispiel mit KI-Assistent", "Spreadsheet example with an AI assistant")}
        </h2>
        {/* Below sm the evidence line above ("Synthetisch · Was heißt das?")
            and the run table's data row carry this, so the note hides. */}
        <p className="text-caption text-muted-foreground max-sm:hidden" style={{ margin: 0, maxWidth: 720 }}>
          {text(
            "Neun fiktive Verkaufszeilen, rein im Browser. Keine Verbindung zu Excel, Microsoft 365 oder einem KI-Anbieter.",
            "This browser-only example uses nine fictional sales rows. It does not connect to Excel, Microsoft 365, or an AI provider.",
          )}
        </p>
      </div>

      {/* Main split — stacks on mobile, 2-col from ~560px */}
      <div
        style={{
          display: "grid",
          width: "100%",
          minWidth: 0,
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        }}
      >
        <Spreadsheet locale={locale} />
        <TaskPicker activeId={task} onSelect={setTask} locale={locale} text={text} />
      </div>

      {/* Output */}
      <div style={{ minHeight: 220 }}>
        {task === "formula" && <FormulaOutput locale={locale} text={text} />}
        {task === "pivot" && <PivotOutput locale={locale} text={text} />}
        {task === "forecast" && <ForecastOutput locale={locale} text={text} />}
      </div>
    </div>
  );
}

/* ------------------------------ Spreadsheet ------------------------------ */

function Spreadsheet({ locale }: { readonly locale: Locale }) {
  const isDe = locale === "de";
  // Below sm the sheet shows its first five rows; the status bar's button
  // opens the other four. From sm up every row always shows.
  const [allRows, setAllRows] = useState(false);
  const tableId = useId();
  return (
    <div
      style={{
        background: DEMO.kalk,
        border: `1px solid ${DEMO.ink}`,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      {/* File bar: ink band with the file name as data; no product
          colours or logo. Below sm it merges with the formula bar into one
          light 32px row ("Absatz-KW14-16.xlsx · F2 = Wachstum W/W"). */}
      <div
        data-excel-file-bar
        className="min-h-8 bg-[#0B0908] px-2.5 py-[7px] text-[12px] text-[#F3F0E9] max-sm:bg-[#F7F4ED] max-sm:py-1 max-sm:text-[13px] max-sm:text-[#0B0908]"
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          borderBottom: `1px solid ${DEMO.leinen}`,
          fontFamily: DEMO.font.mono,
          minWidth: 0,
        }}
      >
        <span
          style={{
            overflowWrap: "anywhere",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {isDe ? "Absatz-KW14-16.xlsx" : "sales-weeks-14-16.xlsx"}
          <span className="sm:hidden" style={{ color: DEMO.schiefer }}>
            {isDe ? " · F2 = Wachstum W/W" : " · F2 = Growth W/W"}
          </span>
        </span>
        <span className="max-sm:hidden" style={{ marginLeft: "auto", fontSize: 12 }}>
          {isDe ? "· gespeichert" : "· local sample"}
        </span>
      </div>

      {/* Formula bar (from sm up; below sm it joins the file bar) */}
      <div
        className="flex max-sm:hidden"
        style={{
          alignItems: "center",
          gap: 8,
          padding: "5px 10px",
          borderBottom: `1px solid ${DEMO.leinen}`,
          background: DEMO.birke,
          fontFamily: DEMO.font.mono,
          fontSize: 12,
          color: DEMO.schiefer,
        }}
      >
        <span
          style={{
            padding: "1px 6px",
            border: `1px solid ${DEMO.leinen}`,
            background: DEMO.kalk,
            color: DEMO.ink,
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}
        >
          F2
        </span>
        <span style={{ color: DEMO.schiefer }}>ƒx</span>
        <span style={{ color: DEMO.ink, fontWeight: 600 }}>
          {isDe ? "Wachstum W/W" : "Growth W/W"}
        </span>
      </div>

      {/* Data table — horizontally scrollable, keyboard-reachable. The
          data-course-horizontal-scroll marker is asserted by
          route-ai-native-locales.spec.ts, which checks that every horizontally
          scrolling region stays contained inside the lesson column. */}
      <div
        id={tableId}
        data-course-horizontal-scroll
        role="region"
        aria-label={isDe ? "Beispiel-Arbeitsblatt" : "Sample worksheet data"}
        tabIndex={0}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
        style={{ overflowX: "auto", overscrollBehaviorX: "contain" }}
      >
        {/* Below sm the five columns fit a 320px screen (no hidden
            "Umsatz" column) and the data reads at 13px; from sm up the
            desktop sheet returns: 12px, 430px minimum, wider cell padding. */}
        <table
          className="min-w-[280px] text-[13px] leading-[1.35] sm:min-w-[430px] sm:text-[12px] sm:leading-[inherit] [&_td]:px-1.5 [&_td]:py-[3px] [&_th]:px-1.5 [&_th]:py-1 sm:[&_td]:px-2 sm:[&_td]:py-1 sm:[&_th]:px-2 sm:[&_th]:py-[5px]"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: DEMO.font.mono,
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col className="w-[26px] sm:w-[28px]" />
            <col className="w-[20%] sm:w-[22%]" />
            <col className="w-[24%] sm:w-[22%]" />
            <col className="w-[14%] sm:w-[16%]" />
            <col />
          </colgroup>
          <thead>
            <tr style={{ background: DEMO.birke }}>
              {(isDe
                ? ["", "Woche", "Region", "Stk", "Umsatz"]
                : ["", "Week", "Region", "Units", "Revenue"]
              ).map((h, i) => (
                <th
                  key={h + i}
                  style={{
                    borderBottom: `1px solid ${DEMO.ink}`,
                    textAlign: i > 2 ? "right" : "left",
                    fontWeight: i === 0 ? 400 : 700,
                    letterSpacing: "0.06em",
                    color: i === 0 ? DEMO.schiefer : DEMO.ink,
                  }}
                >
                  {h || (
                    <span className="sr-only">{isDe ? "Zeile" : "Row"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr
                key={`${r.w}-${r.region}`}
                className={
                  i >= PHONE_SHEET_ROWS && !allRows ? "max-sm:hidden" : undefined
                }
                style={{
                  borderBottom: `1px solid ${DEMO.leinen}`,
                  background: "transparent",
                }}
              >
                <td
                  className="px-1!"
                  style={{
                    background: DEMO.birke,
                    color: DEMO.schiefer,
                    textAlign: "center",
                    borderRight: `1px solid ${DEMO.leinen}`,
                  }}
                >
                  {i + 2}
                </td>
                <td>{weekLabel(r.w, locale)}</td>
                <td>{isDe ? r.region : REGION_EN[r.region]}</td>
                <td style={{ textAlign: "right" }}>{r.stk}</td>
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.umsatz.toLocaleString(isDe ? "de-DE" : "en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status bar */}
      <div
        style={{
          padding: "7px 10px",
          background: DEMO.birke,
          borderTop: `1px solid ${DEMO.leinen}`,
          fontFamily: DEMO.font.mono,
          fontSize: 12,
          color: DEMO.schiefer,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginTop: "auto",
        }}
      >
        <span className="max-sm:hidden">
          {isDe ? "Blatt1 · 9 Zeilen" : "Sheet1 · 9 rows"}
        </span>
        <button
          type="button"
          onClick={() => setAllRows((open) => !open)}
          aria-expanded={allRows}
          aria-controls={tableId}
          className="-my-[7px] inline-flex min-h-11 items-center gap-1.5 text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground sm:hidden"
          style={{ ...DEMO.label, background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
        >
          {isDe ? `Alle ${ROWS.length} Zeilen` : `All ${ROWS.length} rows`}
          <DisclosureGlyph open={allRows} />
        </button>
        <span
          style={{
            color: DEMO.ink,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            aria-hidden
            style={{ width: 6, height: 6, background: DEMO.ink }}
          />
          Claude-Add-In
        </span>
      </div>
    </div>
  );
}

/* ------------------------------ Task picker ------------------------------ */

function TaskPicker({
  activeId,
  onSelect,
  locale,
  text,
}: {
  readonly activeId: TaskId;
  readonly onSelect: (id: TaskId) => void;
  readonly locale: Locale;
  readonly text: (de: string, en: string) => string;
}) {
  const isDe = locale === "de";
  // From sm up each task is a bordered card and the selected one is ink
  // filled, as before. Below sm the tasks are hairline ledger rows: the
  // selected row carries a 2px ink tick on the left instead of a black
  // fill, and the "Formel generieren" line drops because the whole row is
  // the button.
  return (
    <div
      className="gap-0 sm:gap-2.5"
      style={{ display: "flex", flexDirection: "column", minWidth: 0 }}
    >
      <div
        className="max-sm:border-b max-sm:border-[#0B0908] max-sm:pb-1.5"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <Overline>{text("Aufgabe an Claude", "Task for Claude")}</Overline>
        <span
          style={{
            ...DEMO.label,
            color: DEMO.schiefer,
          }}
        >
          {TASKS.length} {text("Aufgaben", "tasks")}
        </span>
      </div>

      {TASKS.map((t, i) => {
        const active = activeId === t.id;
        const muted = active
          ? "text-[rgba(11,9,8,0.62)] sm:text-[rgba(243,240,233,0.75)]"
          : "text-[rgba(11,9,8,0.62)]";
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            aria-pressed={active}
            data-excel-task={t.id}
            className={[
              "relative min-h-11 w-full min-w-0 cursor-pointer overflow-hidden text-left transition-colors duration-[120ms] motion-reduce:transition-none",
              "max-sm:border-b max-sm:border-l-2 max-sm:border-b-[#E3DFD6] max-sm:bg-transparent max-sm:py-2.5 max-sm:pl-3 max-sm:pr-0",
              "sm:border sm:px-[13px] sm:py-[11px]",
              active
                ? "text-[#0B0908] max-sm:border-l-[#0B0908] sm:border-[#0B0908] sm:bg-[#0B0908] sm:text-[#F3F0E9]"
                : "text-[#0B0908] max-sm:border-l-transparent sm:border-[#E3DFD6] sm:bg-[#F7F4ED] sm:hover:border-[#0B0908] sm:hover:bg-[#F3F0E9]",
            ].join(" ")}
            style={{ fontFamily: "inherit" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span
                  className={`text-[13px] sm:text-[12px] ${muted}`}
                  style={{
                    fontFamily: DEMO.font.mono,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  0{i + 1}
                </span>
                <span
                  className="text-[14px] sm:text-[13px]"
                  style={{
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isDe ? t.title.de : t.title.en}
                </span>
              </div>
              <span
                className={`text-[13px] sm:text-[12px] ${muted}`}
                style={{
                  fontFamily: DEMO.font.mono,
                  flexShrink: 0,
                }}
              >
                ⟶ {isDe ? t.time.de : t.time.en}
              </span>
            </div>
            <div
              className={`text-[13px] sm:text-[12px] ${muted}`}
              style={{
                marginTop: 4,
                lineHeight: 1.45,
              }}
            >
              {isDe ? t.detail.de : t.detail.en}
            </div>
            <div
              className="max-sm:hidden"
              style={{
                marginTop: 7,
                ...DEMO.label,
              }}
            >
              {(isDe ? t.action.de : t.action.en)} →
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- Overline ------------------------------- */

function Overline({ children }: { readonly children: ReactNode }) {
  return (
    <div style={{ ...DEMO.label, color: DEMO.ink }}>
      {children}
    </div>
  );
}

/* --------------------------------- Outputs -------------------------------- */

function OutputShell({
  label,
  caption,
  children,
}: {
  readonly label: string;
  readonly caption: string;
  readonly children: ReactNode;
}) {
  // An open section under a 2px ink rule, not a framed panel: the demo
  // shell is already the frame, and a box never sits inside another box.
  // Inside it only the code line (Beton fill) and tables carry a surface.
  return (
    <div
      style={{
        borderTop: `2px solid ${DEMO.ink}`,
        padding: "14px 0 0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 10,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <Overline>{label}</Overline>
        <span className="text-caption" style={{ color: DEMO.schiefer }}>
          {caption}
        </span>
      </div>
      {children}
    </div>
  );
}

interface OutputProps {
  readonly locale: Locale;
  readonly text: (de: string, en: string) => string;
}

function FormulaOutput({ text }: OutputProps) {
  return (
    <OutputShell
      label={text("Formel · Zelle F2", "Formula · cell F2")}
      caption={text("Ergebnis eingefügt", "Result inserted")}
    >
      <div
        style={{
          background: "rgba(11,9,8,0.04)",
          padding: "12px 14px",
          fontFamily: DEMO.font.mono,
          fontSize: 12,
          color: DEMO.ink,
          lineHeight: 1.65,
          overflowWrap: "anywhere",
        }}
      >
        =
        {text(
          'WENN(INDIREKT("E"&ZEILE()-3)=0;"";(E2-INDIREKT("E"&ZEILE()-3))/INDIREKT("E"&ZEILE()-3))',
          'IF(INDIRECT("E"&ROW()-3)=0,"",(E2-INDIRECT("E"&ROW()-3))/INDIRECT("E"&ROW()-3))',
        )}
      </div>
      <dl
        className="grid gap-0 sm:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] sm:gap-x-4"
        style={{ marginTop: 12, marginBottom: 0 }}
      >
        <FormulaNote
          k={text("Region-Bezug", "Region reference")}
          v={text("−3 Zeilen = Vorwoche", "−3 rows = prior week")}
        />
        <FormulaNote
          k={text("Absicherung", "Guard")}
          v={text("÷0 abgefangen", "Divide-by-zero caught")}
        />
        <FormulaNote
          k={text("Format", "Format")}
          v={text("Prozent, 1 Nachk.", "Percent, 1 decimal")}
        />
      </dl>
      <p
        style={{
          fontSize: 12,
          color: DEMO.schiefer,
          lineHeight: 1.55,
          margin: "12px 0 0",
        }}
      >
        {text(
          "Greift auf die Vorwoche derselben Region zu und berechnet die relative Veränderung. Zieh die Formel herunter, sie läuft für alle Regionen.",
          "Reaches back to the prior week for the same region and computes the relative change. Fill the formula down; it works for every region.",
        )}
      </p>
    </OutputShell>
  );
}

function FormulaNote({ k, v }: { readonly k: string; readonly v: string }) {
  // A hairline-ruled row below sm, a hairline-topped column from sm up:
  // never a box, so the result section holds no nested frames.
  return (
    <div
      className="flex items-baseline justify-between gap-3 border-b border-[#E3DFD6] py-2 first:border-t sm:block sm:border-b-0 sm:border-t sm:pb-0"
      style={{ minWidth: 0 }}
    >
      <dt
        style={{
          ...DEMO.label,
          color: DEMO.schiefer,
        }}
      >
        {k}
      </dt>
      <dd
        className="m-0 text-right text-[13px] sm:mt-0.5 sm:text-left sm:text-[12px]"
        style={{ color: DEMO.ink, fontWeight: 700 }}
      >
        {v}
      </dd>
    </div>
  );
}

function PivotOutput({ locale, text }: OutputProps) {
  const isDe = locale === "de";
  return (
    <OutputShell
      label={text("Pivot · nach Region sortiert", "Pivot · sorted by region")}
      caption={text("absteigend nach Umsatz", "descending by revenue")}
    >
      <div
        style={{
          ...DEMO.label,
          color: DEMO.ink,
          marginBottom: 10,
        }}
      >
        {text("Spitzenreiter", "Top region")}:{" "}
        {isDe ? PIVOT_ROWS[0].region : REGION_EN[PIVOT_ROWS[0].region]} ·{" "}
        {formatCurrency(PIVOT_ROWS[0].umsatz, locale)}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
            minWidth: 320,
          }}
        >
          <thead>
            <tr style={{ borderBottom: `2px solid ${DEMO.ink}` }}>
              {(isDe
                ? ["Region", "Stück (Σ)", "Umsatz (Σ)", "Anteil"]
                : ["Region", "Units (Σ)", "Revenue (Σ)", "Share"]
              ).map((h, i) => (
                <th
                  key={h}
                  style={{
                    ...DEMO.label,
                    textAlign: i > 0 ? "right" : "left",
                    padding: "8px 8px",
                    color: DEMO.schiefer,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PIVOT_ROWS.map((r, i) => (
              <tr
                key={r.region}
                style={{
                  borderBottom: `1px solid ${DEMO.leinen}`,
                  background: "transparent",
                }}
              >
                <td
                  style={{
                    padding: "10px 8px",
                    fontWeight: 700,
                    color: DEMO.ink,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {i === 0 && (
                    <span
                      style={{
                        fontFamily: DEMO.font.mono,
                        fontSize: 12,
                        // The pivot's one Mennige mark: paper on Mennige, 5.4:1.
                        background: "var(--color-brand-orange)",
                        color: "#f9f7f2",
                        padding: "1px 5px",
                        fontWeight: 700,
                      }}
                    >
                      #1
                    </span>
                  )}
                  {isDe ? r.region : REGION_EN[r.region]}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "right",
                    fontFamily: DEMO.font.mono,
                  }}
                >
                  {r.stk}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "right",
                    fontFamily: DEMO.font.mono,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatCurrency(r.umsatz, locale)}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "right",
                    fontFamily: DEMO.font.mono,
                    color: i === 0 ? DEMO.ink : DEMO.schiefer,
                    fontWeight: 700,
                  }}
                >
                  {r.anteil}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p
        style={{
          fontSize: 12,
          color: DEMO.schiefer,
          lineHeight: 1.55,
          margin: "14px 0 0",
        }}
      >
        {text(
          "West führt mit 41 % Umsatz-Anteil bei 40 % der Stückzahl, also höhere Preisrealisierung. Süd schwächelt strukturell.",
          "West leads with a 41% revenue share on 40% of units, so it realizes a higher average price. South is structurally weak.",
        )}
      </p>
    </OutputShell>
  );
}

function ForecastOutput({ locale, text }: OutputProps) {
  const [growthRate, setGrowthRate] = useState(FORECAST_DEFAULT_RATE);
  const max = FORECAST_CHART_MAX;
  const rows = useMemo(() => computeForecast(growthRate), [growthRate]);
  const exceedsRange = rows.some((r) => r.hi > max);

  return (
    <OutputShell
      label={text("Forecast · KW 17 bis 20", "Forecast · weeks 17 to 20")}
      caption={text("Konfidenz 90 %", "90% confidence")}
    >
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <span
            style={{
              ...DEMO.label,
              color: DEMO.schiefer,
            }}
          >
            {text("Angenommenes Wachstum / Woche", "Assumed growth / week")}
          </span>
          <span
            style={{
              fontFamily: DEMO.font.mono,
              fontSize: 13,
              fontWeight: 800,
              color: exceedsRange ? "var(--color-destructive)" : DEMO.ink,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {locale === "de"
              ? `+${growthRate} %`
              : `+${growthRate}%`}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={25}
          step={1}
          value={growthRate}
          onChange={(e) => setGrowthRate(Number(e.target.value))}
          aria-label={text(
            "Angenommenes wöchentliches Wachstum in Prozent",
            "Assumed weekly growth in percent",
          )}
          aria-valuemin={0}
          aria-valuemax={25}
          aria-valuenow={growthRate}
          style={{
            minHeight: 44,
            width: "100%",
            accentColor: DEMO.ink,
          }}
        />
      </label>

      {exceedsRange ? (
        <p
          role="alert"
          style={{
            margin: "0 0 14px",
            padding: "8px 10px",
            fontSize: 12,
            lineHeight: 1.5,
            fontWeight: 700,
            color: "var(--color-destructive)",
            background: "rgba(153,27,27,0.08)",
            border: "1px solid var(--color-destructive)",
          }}
        >
          {text(
            `Bei +${growthRate} % pro Woche übersteigt die obere Schätzung für KW 20 den sinnvollen Darstellungsbereich. Eine lineare Fortschreibung wird bei diesem Wachstum unzuverlässig.`,
            `At +${growthRate}% per week the upper estimate for week 20 exceeds a sensible display range. A linear extrapolation stops being trustworthy at this rate.`,
          )}
        </p>
      ) : null}

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          gap: "clamp(8px, 2vw, 20px)",
          height: 170,
          paddingTop: 30,
          paddingBottom: 28,
          paddingLeft: 4,
          paddingRight: 4,
          borderBottom: `1px solid ${DEMO.leinen}`,
        }}
      >
        {/* Grid guides */}
        {[0.25, 0.5, 0.75].map((g) => (
          <div
            key={g}
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: `calc(${g * 100}% - 28px + ${g * 28}px)`,
              height: 1,
              background: DEMO.leinen,
              opacity: 0.5,
              pointerEvents: "none",
            }}
          />
        ))}

        {rows.map((r) => {
          const predH = Math.min(100, (r.pred / max) * 100);
          const loH = Math.min(100, (r.lo / max) * 100);
          const hiH = Math.min(100, (r.hi / max) * 100);
          return (
            <div
              key={r.w}
              style={{
                flex: 1,
                position: "relative",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 0,
              }}
            >
              {/* Confidence band */}
              <div
                style={{
                  width: "62%",
                  maxWidth: 40,
                  height: `${hiH - loH}%`,
                  // Dashed = an estimate (deck grammar); no tint.
                  background: "transparent",
                  position: "absolute",
                  bottom: `${loH}%`,
                  border: `1px dashed ${DEMO.ink}`,
                }}
              />
              {/* Prediction bar */}
              <div
                style={{
                  width: "62%",
                  maxWidth: 40,
                  height: `${predH}%`,
                  background: "var(--color-brand-orange)",
                  position: "absolute",
                  bottom: 0,
                }}
              />
              {/* Value label */}
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  color: DEMO.ink,
                  fontWeight: 700,
                  position: "absolute",
                  bottom: `${predH}%`,
                  marginBottom: 6,
                  whiteSpace: "nowrap",
                }}
              >
                {r.pred}
              </div>
              {/* Week label */}
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  fontWeight: 700,
                  color: DEMO.ink,
                  position: "absolute",
                  bottom: -22,
                  whiteSpace: "nowrap",
                }}
              >
                {weekLabel(r.w, locale)}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginTop: 18,
          paddingTop: 10,
          borderTop: `1px solid ${DEMO.leinen}`,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <LegendDot
            color="var(--color-brand-orange)"
            label={text("Prognose", "Forecast")}
          />
          <LegendDot
            color="transparent"
            label={text("Konfidenz-Band", "Confidence band")}
            border
          />
        </div>
        <div
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            color: DEMO.ink,
            fontWeight: 700,
          }}
        >
          {text("Trend", "Trend")}{" "}
          <span
            style={{
              color: exceedsRange ? "var(--color-destructive)" : DEMO.ink,
            }}
          >
            {locale === "de" ? `+${growthRate} %` : `+${growthRate}%`}
          </span>
          /{text("Woche", "week")}
        </div>
      </div>

      <p
        style={{
          fontSize: 12,
          color: DEMO.schiefer,
          marginTop: 12,
          lineHeight: 1.55,
          margin: "12px 0 0",
        }}
      >
        {text(
          "Lineare Projektion mit leichter Quartals-Saisonalität. Das Konfidenzband wird mit jeder Woche breiter.",
          "A linear projection with light quarterly seasonality. The confidence band widens with each week.",
        )}
      </p>
    </OutputShell>
  );
}

function LegendDot({
  color,
  label,
  border,
}: {
  readonly color: string;
  readonly label: string;
  readonly border?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: DEMO.font.mono,
        fontSize: 12,
        color: DEMO.schiefer,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          background: color,
          border: border ? `1px dashed ${DEMO.ink}` : "none",
        }}
      />
      {label}
    </span>
  );
}
