"use client";

import { useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { DEMO } from "@/lib/demo-tokens";
import { DEMO_HEIGHT } from "./demo-utils";
import { useDemoLocale } from "./demo-locale";

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
    title: { de: "Forecast KW 17–20", en: "Forecast, weeks 17–20" },
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

const FORECAST_ROWS = [
  { w: "KW 17", pred: 492, lo: 458, hi: 526 },
  { w: "KW 18", pred: 548, lo: 498, hi: 598 },
  { w: "KW 19", pred: 612, lo: 544, hi: 680 },
  { w: "KW 20", pred: 684, lo: 590, hi: 778 },
] as const;

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
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
        minHeight: DEMO_HEIGHT,
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Overline>
            {text("Excel-Lab mit KI-Assistent", "Spreadsheet lab · fixed sample data")}
          </Overline>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              color: DEMO.schiefer,
              letterSpacing: "0.08em",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: DEMO.schiefer,
              }}
            />
            {text("Manuell", "Manual")}
          </div>
        </div>
        <h2
          style={{
            fontSize: "clamp(18px, 2.6vw, 22px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {text("Formeln, Pivots und Forecasts im Beispiel-Lab,", "Inspect the calculation,")}{" "}
          <span style={{ color: "var(--color-brand-orange)" }}>
            {text("ohne Microsoft-365-Verbindung.", "then challenge it.")}
          </span>
        </h2>
        <p
          style={{
            margin: 0,
            maxWidth: 720,
            color: DEMO.schiefer,
            fontSize: 12,
            lineHeight: 1.55,
          }}
        >
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
  return (
    <div
      style={{
        background: DEMO.kalk,
        border: `1px solid ${DEMO.ink}`,
        boxShadow: `2px 2px 0 0 ${DEMO.leinen}`,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      {/* File bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          padding: "7px 10px",
          background: "#107C41",
          color: "white",
          fontFamily: DEMO.font.mono,
          fontSize: 12,
          letterSpacing: "0.1em",
          fontWeight: 700,
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            background: "white",
            color: "#107C41",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          X
        </div>
        <span
          style={{
            overflowWrap: "anywhere",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {isDe ? "Absatz-KW14-16.xlsx" : "sales-weeks-14-16.xlsx"}
        </span>
        <span style={{ marginLeft: "auto", opacity: 0.7, fontSize: 12 }}>
          {isDe ? "· gespeichert" : "· local sample"}
        </span>
      </div>

      {/* Formula bar */}
      <div
        style={{
          display: "flex",
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
        <span style={{ opacity: 0.6 }}>ƒx</span>
        <span style={{ color: "var(--color-brand-orange)", fontWeight: 600 }}>
          {isDe ? "Wachstum W/W" : "Growth W/W"}
        </span>
      </div>

      {/* Data table — horizontally scrollable, keyboard-reachable */}
      <div
        role="region"
        aria-label={isDe ? "Beispiel-Arbeitsblatt" : "Sample worksheet data"}
        tabIndex={0}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
        style={{ overflowX: "auto", overscrollBehaviorX: "contain" }}
      >
        <table
          style={{
            width: "100%",
            minWidth: 430,
            borderCollapse: "collapse",
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: 28 }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "16%" }} />
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
                    padding: "5px 8px",
                    borderBottom: `1px solid ${DEMO.ink}`,
                    fontSize: 12,
                    textAlign: i > 2 ? "right" : "left",
                    fontWeight: i === 0 ? 400 : 700,
                    letterSpacing: "0.06em",
                    color: i === 0 ? DEMO.schiefer : DEMO.ink,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr
                key={`${r.w}-${r.region}`}
                style={{
                  borderBottom: `1px solid ${DEMO.leinen}`,
                  background: i % 3 === 2 ? "rgba(249,115,22,0.04)" : "transparent",
                }}
              >
                <td
                  style={{
                    padding: "4px 8px",
                    background: DEMO.birke,
                    color: DEMO.schiefer,
                    fontSize: 12,
                    textAlign: "center",
                    borderRight: `1px solid ${DEMO.leinen}`,
                  }}
                >
                  {i + 2}
                </td>
                <td style={{ padding: "4px 8px" }}>{weekLabel(r.w, locale)}</td>
                <td style={{ padding: "4px 8px" }}>
                  {isDe ? r.region : REGION_EN[r.region]}
                </td>
                <td style={{ padding: "4px 8px", textAlign: "right" }}>{r.stk}</td>
                <td
                  style={{
                    padding: "4px 8px",
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
          letterSpacing: "0.08em",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginTop: "auto",
        }}
      >
        <span>{isDe ? "Blatt1 · 9 Zeilen" : "Sheet1 · 9 rows"}</span>
        <span
          style={{
            color: "var(--color-brand-orange)",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              background: "var(--color-brand-orange)",
              borderRadius: 999,
              boxShadow: "0 0 0 3px rgba(249,115,22,0.18)",
            }}
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      <div
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
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            color: DEMO.schiefer,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {TASKS.length} {text("Aufgaben", "tasks")}
        </span>
      </div>

      {TASKS.map((t, i) => {
        const active = activeId === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            aria-pressed={active}
            style={{
              position: "relative",
              minHeight: 44,
              width: "100%",
              minWidth: 0,
              textAlign: "left",
              padding: "11px 13px",
              background: active ? DEMO.ink : DEMO.birke,
              color: active ? DEMO.kalk : DEMO.ink,
              border: `1px solid ${active ? "var(--color-brand-orange)" : DEMO.leinen}`,
              boxShadow: active ? `3px 3px 0 0 var(--color-brand-orange)` : "none",
              transform: active ? "translate(-2px,-2px)" : "translate(0,0)",
              cursor: "pointer",
              fontFamily: "inherit",
              transition:
                "transform 160ms ease, box-shadow 160ms ease, background 160ms ease",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.borderColor = "var(--color-brand-orange)";
                e.currentTarget.style.background = DEMO.kalk;
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.borderColor = DEMO.leinen;
                e.currentTarget.style.background = DEMO.birke;
              }
            }}
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
                  style={{
                    fontFamily: DEMO.font.mono,
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    color: active ? "var(--color-brand-orange)" : DEMO.schiefer,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  0{i + 1}
                </span>
                <span
                  style={{
                    fontSize: 13,
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
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  color: active ? "rgba(243,240,233,0.7)" : DEMO.schiefer,
                  letterSpacing: "0.06em",
                  flexShrink: 0,
                }}
              >
                ⟶ {isDe ? t.time.de : t.time.en}
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                marginTop: 4,
                lineHeight: 1.45,
                color: active ? "rgba(243,240,233,0.75)" : DEMO.schiefer,
              }}
            >
              {isDe ? t.detail.de : t.detail.en}
            </div>
            <div
              style={{
                marginTop: 7,
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: "var(--color-brand-orange)",
                letterSpacing: "0.12em",
                fontWeight: 700,
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
    <div
      style={{
        fontFamily: DEMO.font.mono,
        fontSize: 12,
        color: "var(--color-brand-orange)",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        fontWeight: 700,
      }}
    >
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
  return (
    <div
      style={{
        background: DEMO.kalk,
        borderTop: `3px solid var(--color-brand-orange)`,
        borderRight: `1px solid ${DEMO.ink}`,
        borderBottom: `1px solid ${DEMO.ink}`,
        borderLeft: `1px solid ${DEMO.ink}`,
        boxShadow: `3px 3px 0 0 ${DEMO.ink}`,
        padding: "14px 16px 16px",
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
        <Overline>◆ {label}</Overline>
        <span
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            color: DEMO.schiefer,
            letterSpacing: "0.08em",
          }}
        >
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
          border: `1px solid ${DEMO.leinen}`,
          padding: "12px 14px",
          fontFamily: DEMO.font.mono,
          fontSize: "clamp(12px, 1.6vw, 12px)",
          color: "var(--color-brand-orange)",
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
      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          marginTop: 12,
        }}
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
      </div>
      <p
        style={{
          fontSize: 12,
          color: DEMO.schiefer,
          lineHeight: 1.55,
          fontStyle: "italic",
          borderLeft: `2px solid var(--color-brand-orange)`,
          paddingLeft: 10,
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
  return (
    <div
      style={{
        border: `1px solid ${DEMO.leinen}`,
        background: DEMO.birke,
        padding: "7px 9px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: DEMO.font.mono,
          fontSize: 12,
          color: DEMO.schiefer,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {k}
      </div>
      <div style={{ fontSize: 12, color: DEMO.ink, fontWeight: 700, marginTop: 2 }}>
        {v}
      </div>
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
          fontFamily: DEMO.font.mono,
          fontSize: 12,
          fontWeight: 700,
          color: "var(--color-brand-orange)",
          letterSpacing: "0.06em",
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
                    textAlign: i > 0 ? "right" : "left",
                    padding: "8px 8px",
                    fontFamily: DEMO.font.mono,
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: DEMO.schiefer,
                    fontWeight: 700,
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
                  background: i === 0 ? DEMO.kupferMist : "transparent",
                }}
              >
                <td
                  style={{
                    padding: "10px 8px",
                    fontWeight: 700,
                    color: i === 0 ? "var(--color-brand-orange)" : DEMO.ink,
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
                        background: "var(--color-brand-orange)",
                        color: DEMO.kalk,
                        padding: "1px 5px",
                        letterSpacing: "0.06em",
                        fontWeight: 800,
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
                    color: i === 0 ? "var(--color-brand-orange)" : DEMO.schiefer,
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
          fontStyle: "italic",
          borderLeft: `2px solid var(--color-brand-orange)`,
          paddingLeft: 10,
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
  const max = 820;
  return (
    <OutputShell
      label={text("Forecast · KW 17–20", "Forecast · weeks 17–20")}
      caption={text("Konfidenz 90 %", "90% confidence")}
    >
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

        {FORECAST_ROWS.map((r) => {
          const predH = (r.pred / max) * 100;
          const loH = (r.lo / max) * 100;
          const hiH = (r.hi / max) * 100;
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
                  background: DEMO.kupferMist,
                  position: "absolute",
                  bottom: `${loH}%`,
                  border: `1px dashed var(--color-brand-orange)`,
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
                  boxShadow: `2px 2px 0 0 ${DEMO.ink}`,
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
                  letterSpacing: "0.06em",
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
            color={DEMO.kupferMist}
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
            letterSpacing: "0.08em",
          }}
        >
          {text("Trend", "Trend")}{" "}
          <span style={{ color: "var(--color-brand-orange)" }}>
            {locale === "de" ? "+7,9 %" : "+7.9%"}
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
          fontStyle: "italic",
          borderLeft: `2px solid var(--color-brand-orange)`,
          paddingLeft: 10,
          margin: "12px 0 0",
        }}
      >
        {text(
          "Lineare Projektion mit leichter Quartals-Saisonalität. Die Konfidenz weitet sich mit jeder Woche, realistisch, nicht geschönt.",
          "A linear projection with light quarterly seasonality. The confidence band widens each week: realistic, not flattering.",
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
        letterSpacing: "0.06em",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          background: color,
          border: border ? `1px dashed var(--color-brand-orange)` : "none",
        }}
      />
      {label}
    </span>
  );
}
