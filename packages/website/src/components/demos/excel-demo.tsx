"use client";

import { useState } from "react";
import { DEMO } from "@/lib/demo-tokens";
import { DEMO_HEIGHT } from "./demo-utils";
import { useDemoLocale } from "./demo-locale";

const ROWS = [
  { w: "KW 14", region: "Nord", stk: 142, umsatz: 688_700 },
  { w: "KW 14", region: "Süd", stk: 98, umsatz: 475_300 },
  { w: "KW 14", region: "West", stk: 174, umsatz: 843_900 },
  { w: "KW 15", region: "Nord", stk: 156, umsatz: 756_600 },
  { w: "KW 15", region: "Süd", stk: 82, umsatz: 397_700 },
  { w: "KW 15", region: "West", stk: 188, umsatz: 911_800 },
  { w: "KW 16", region: "Nord", stk: 161, umsatz: 780_850 },
  { w: "KW 16", region: "Süd", stk: 94, umsatz: 455_900 },
  { w: "KW 16", region: "West", stk: 203, umsatz: 984_550 },
] as const;

type TaskId = "formula" | "pivot" | "forecast";

interface Task {
  readonly id: TaskId;
  readonly t: string;
  readonly d: string;
  readonly action: string;
  readonly time: string;
}

const TASKS: readonly Task[] = [
  {
    id: "formula",
    t: "Formel für Wachstum",
    d: "Prozentuale Abweichung Woche / Woche, pro Region",
    action: "Formel generieren",
    time: "12 Sek.",
  },
  {
    id: "pivot",
    t: "Pivot nach Region",
    d: "Summen & Anteile, sortiert nach Umsatz",
    action: "Pivot erstellen",
    time: "9 Sek.",
  },
  {
    id: "forecast",
    t: "Forecast KW 17–20",
    d: "Lineare Projektion mit 90 %-Konfidenz",
    action: "Prognose rechnen",
    time: "18 Sek.",
  },
];

const PIVOT_ROWS = [
  { region: "West", stk: 565, umsatz: "2.740.250 €", anteil: "41%" },
  { region: "Nord", stk: 459, umsatz: "2.226.150 €", anteil: "33%" },
  { region: "Süd", stk: 274, umsatz: "1.328.900 €", anteil: "20%" },
] as const;

const FORECAST_ROWS = [
  { w: "KW 17", pred: 492, lo: 458, hi: 526 },
  { w: "KW 18", pred: 548, lo: 498, hi: 598 },
  { w: "KW 19", pred: 612, lo: 544, hi: 680 },
  { w: "KW 20", pred: 684, lo: 590, hi: 778 },
] as const;

export default function ExcelDemo() {
  const { locale } = useDemoLocale();
  return locale === "en" ? <ExcelDemoEnglish /> : <ExcelDemoGerman />;
}

function ExcelDemoGerman() {
  const [task, setTask] = useState<TaskId>(TASKS[0].id);

  return (
    <div
      data-demo-id="excel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
        minHeight: DEMO_HEIGHT,
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Overline>Excel-Lab mit KI-Assistent</Overline>
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
            Manuell
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
          Formeln, Pivots und Forecasts im Beispiel-Lab,{" "}
          <span style={{ color: "var(--color-brand-orange)" }}>
            ohne Microsoft-365-Verbindung.
          </span>
        </h2>
      </div>

      {/* Main split — stacks on mobile, 2-col from ~560px */}
      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        }}
      >
        <Spreadsheet />
        <TaskPicker activeId={task} onSelect={setTask} />
      </div>

      {/* Output */}
      <div style={{ minHeight: 220 }}>
        {task === "formula" && <FormulaOutput />}
        {task === "pivot" && <PivotOutput />}
        {task === "forecast" && <ForecastOutput />}
      </div>
    </div>
  );
}

const TASKS_EN = [
  {
    id: "formula" as const,
    title: "Week-over-week growth",
    detail: "Calculate the percentage change for each region.",
    output: "=(D5-D2)/D2",
    result: "North: +9.9% · South: −16.3% · West: +8.0%",
  },
  {
    id: "pivot" as const,
    title: "Revenue by region",
    detail: "Group the sample rows and sort by total revenue.",
    output: "West · €2,740,250 · 41%",
    result: "North · €2,226,150 · 33%  |  South · €1,328,900 · 20%",
  },
  {
    id: "forecast" as const,
    title: "Forecast weeks 17–20",
    detail: "Extend the sample series with a linear projection.",
    output: "Week 17: 492 units · 90% interval: 458–526",
    result:
      "Illustrative projection only; validate against held-out data before use.",
  },
] as const;

function ExcelDemoEnglish() {
  const [task, setTask] = useState<TaskId>("formula");
  const active = TASKS_EN.find((item) => item.id === task) ?? TASKS_EN[0];

  return (
    <div
      data-demo-id="excel"
      role="region"
      aria-label="Spreadsheet analysis example"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: DEMO_HEIGHT,
        width: "100%",
        minWidth: 0,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
      }}
    >
      <div>
        <Overline>Spreadsheet lab · fixed sample data</Overline>
        <h2
          style={{
            margin: "6px 0 0",
            fontSize: "clamp(20px, 4vw, 28px)",
            lineHeight: 1.08,
          }}
        >
          Inspect the calculation.{" "}
          <span style={{ color: "var(--color-brand-orange)" }}>
            Then challenge it.
          </span>
        </h2>
        <p
          style={{
            margin: "8px 0 0",
            maxWidth: 720,
            color: DEMO.schiefer,
            fontSize: 12,
            lineHeight: 1.55,
          }}
        >
          This browser-only example uses nine fictional sales rows. It does not
          connect to Excel, Microsoft 365, or an AI provider.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          width: "100%",
          minWidth: 0,
          maxWidth: "100%",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: 14,
        }}
      >
        <section
          style={{
            width: "100%",
            minWidth: 0,
            maxWidth: "100%",
            border: `1px solid ${DEMO.ink}`,
            background: DEMO.kalk,
          }}
          aria-label="Sample worksheet"
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              background: "#107C41",
              color: "white",
              fontFamily: DEMO.font.mono,
              fontSize: 12,
            }}
          >
            <strong style={{ border: "1px solid white", padding: "1px 5px" }}>
              X
            </strong>
            <span style={{ overflowWrap: "anywhere" }}>
              sales-weeks-14-16.xlsx
            </span>
            <span style={{ marginLeft: "auto", opacity: 0.8 }}>
              local sample
            </span>
          </div>
          <div
            data-course-horizontal-scroll
            role="region"
            aria-label="Sample worksheet data"
            tabIndex={0}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
            style={{
              width: "100%",
              minWidth: 0,
              maxWidth: "100%",
              overflowX: "auto",
              overscrollBehaviorX: "contain",
            }}
          >
            <div
              style={{
                minWidth: 430,
                display: "grid",
                gridTemplateColumns: "42px 1fr 1fr 0.75fr 1.15fr",
                fontFamily: DEMO.font.mono,
                fontSize: 12,
              }}
            >
              {(["", "Week", "Region", "Units", "Revenue"] as const).map(
                (label) => (
                  <div
                    key={label || "row"}
                    style={{
                      padding: "7px 8px",
                      borderBottom: `1px solid ${DEMO.leinen}`,
                      background: DEMO.birke,
                      fontWeight: 700,
                    }}
                  >
                    {label}
                  </div>
                ),
              )}
              {ROWS.map((row, index) => (
                <div
                  key={`${row.w}-${row.region}`}
                  style={{ display: "contents" }}
                >
                  <div
                    style={{
                      padding: "6px 8px",
                      color: DEMO.schiefer,
                      borderBottom: `1px solid ${DEMO.leinen}`,
                    }}
                  >
                    {index + 2}
                  </div>
                  <div
                    style={{
                      padding: "6px 8px",
                      borderBottom: `1px solid ${DEMO.leinen}`,
                    }}
                  >
                    {row.w.replace("KW", "Wk")}
                  </div>
                  <div
                    style={{
                      padding: "6px 8px",
                      borderBottom: `1px solid ${DEMO.leinen}`,
                    }}
                  >
                    {
                      ({ Nord: "North", Süd: "South", West: "West" } as const)[
                        row.region
                      ]
                    }
                  </div>
                  <div
                    style={{
                      padding: "6px 8px",
                      textAlign: "right",
                      borderBottom: `1px solid ${DEMO.leinen}`,
                    }}
                  >
                    {row.stk}
                  </div>
                  <div
                    style={{
                      padding: "6px 8px",
                      textAlign: "right",
                      borderBottom: `1px solid ${DEMO.leinen}`,
                    }}
                  >
                    €{row.umsatz.toLocaleString("en-GB")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          style={{
            minWidth: 0,
            border: `1px solid ${DEMO.leinen}`,
            background: DEMO.birke,
            padding: 12,
          }}
          aria-label="Analysis tasks"
        >
          <Overline>Choose an analysis</Overline>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {TASKS_EN.map((item, index) => {
              const selected = item.id === task;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTask(item.id)}
                  style={{
                    minHeight: 58,
                    width: "100%",
                    minWidth: 0,
                    padding: "10px 12px",
                    textAlign: "left",
                    background: selected ? DEMO.ink : DEMO.kalk,
                    color: selected ? DEMO.kalk : DEMO.ink,
                    border: `1px solid ${DEMO.ink}`,
                    boxShadow: selected
                      ? `3px 3px 0 var(--color-brand-orange)`
                      : "none",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      fontFamily: DEMO.font.mono,
                      fontSize: 12,
                      color: selected
                        ? "var(--color-brand-orange)"
                        : DEMO.schiefer,
                    }}
                  >
                    0{index + 1}
                  </span>
                  <strong
                    style={{
                      display: "block",
                      marginTop: 3,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {item.title}
                  </strong>
                  <span
                    style={{
                      display: "block",
                      marginTop: 3,
                      fontSize: 12,
                      lineHeight: 1.4,
                      opacity: 0.75,
                    }}
                  >
                    {item.detail}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <section
        aria-live="polite"
        style={{
          minWidth: 0,
          borderLeft: "4px solid var(--color-brand-orange)",
          background: DEMO.ink,
          color: DEMO.kalk,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            letterSpacing: "0.13em",
            color: "var(--color-brand-orange)",
            textTransform: "uppercase",
          }}
        >
          Deterministic sample output
        </div>
        <code
          style={{
            display: "block",
            marginTop: 9,
            overflowWrap: "anywhere",
            whiteSpace: "pre-wrap",
            fontSize: 13,
          }}
        >
          {active.output}
        </code>
        <p
          style={{
            margin: "9px 0 0",
            color: "rgba(243,240,233,0.76)",
            fontSize: 12,
            lineHeight: 1.55,
          }}
        >
          {active.result}
        </p>
      </section>
    </div>
  );
}

/* ------------------------------ Spreadsheet ------------------------------ */

function Spreadsheet() {
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
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Absatz-KW14-16.xlsx
        </span>
        <span style={{ marginLeft: "auto", opacity: 0.7, fontSize: 12 }}>
          · gespeichert
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
          Wachstum W/W
        </span>
      </div>

      {/* Data table — scroll-lock prevented via table-layout fixed */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
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
              {["", "Woche", "Region", "Stk", "Umsatz"].map((h, i) => (
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
                key={i}
                style={{
                  borderBottom: `1px solid ${DEMO.leinen}`,
                  background:
                    i % 3 === 2 ? "rgba(249,115,22,0.04)" : "transparent",
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
                <td style={{ padding: "4px 8px" }}>{r.w}</td>
                <td style={{ padding: "4px 8px" }}>{r.region}</td>
                <td style={{ padding: "4px 8px", textAlign: "right" }}>
                  {r.stk}
                </td>
                <td
                  style={{
                    padding: "4px 8px",
                    textAlign: "right",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.umsatz.toLocaleString("de-DE")}
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
        <span>Blatt1 · 9 Zeilen</span>
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
}: {
  activeId: TaskId;
  onSelect: (id: TaskId) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minWidth: 0,
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
        <Overline>Aufgabe an Claude</Overline>
        <span
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            color: DEMO.schiefer,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {TASKS.length} Aufgaben
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
              textAlign: "left",
              padding: "11px 13px",
              background: active ? DEMO.ink : DEMO.birke,
              color: active ? DEMO.kalk : DEMO.ink,
              border: `1px solid ${
                active ? "var(--color-brand-orange)" : DEMO.leinen
              }`,
              boxShadow: active
                ? `3px 3px 0 0 var(--color-brand-orange)`
                : "none",
              transform: active ? "translate(-2px,-2px)" : "translate(0,0)",
              cursor: "pointer",
              fontFamily: "inherit",
              transition:
                "transform 160ms ease, box-shadow 160ms ease, background 160ms ease",
              overflow: "hidden",
              minWidth: 0,
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 0,
                }}
              >
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
                  {t.t}
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
                ⟶ {t.time}
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
              {t.d}
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
              {t.action} →
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- Overline ------------------------------- */

function Overline({ children }: { children: React.ReactNode }) {
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
  label: string;
  caption: string;
  children: React.ReactNode;
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

function FormulaOutput() {
  return (
    <OutputShell label="Formel · Zelle F2" caption="Ergebnis eingefügt">
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
        {
          'WENN(INDIREKT("E"&ZEILE()-3)=0;"";(E2-INDIREKT("E"&ZEILE()-3))/INDIREKT("E"&ZEILE()-3))'
        }
      </div>
      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          marginTop: 12,
        }}
      >
        <FormulaNote k="Region-Bezug" v="−3 Zeilen = Vorwoche" />
        <FormulaNote k="Absicherung" v="÷0 abgefangen" />
        <FormulaNote k="Format" v="Prozent, 1 Nachk." />
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
        Greift auf die Vorwoche derselben Region zu und berechnet die relative
        Veränderung. Zieh die Formel herunter, sie läuft für alle Regionen.
      </p>
    </OutputShell>
  );
}

function FormulaNote({ k, v }: { k: string; v: string }) {
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
      <div
        style={{
          fontSize: 12,
          color: DEMO.ink,
          fontWeight: 700,
          marginTop: 2,
        }}
      >
        {v}
      </div>
    </div>
  );
}

function PivotOutput() {
  return (
    <OutputShell
      label="Pivot · nach Region sortiert"
      caption="absteigend nach Umsatz"
    >
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
              {["Region", "Stück (Σ)", "Umsatz (Σ)", "Anteil"].map((h, i) => (
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
                  {r.region}
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
                  {r.umsatz}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "right",
                    fontFamily: DEMO.font.mono,
                    color:
                      i === 0 ? "var(--color-brand-orange)" : DEMO.schiefer,
                    fontWeight: 700,
                  }}
                >
                  {r.anteil}
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
          marginTop: 14,
          lineHeight: 1.55,
          fontStyle: "italic",
          borderLeft: `2px solid var(--color-brand-orange)`,
          paddingLeft: 10,
          margin: "14px 0 0",
        }}
      >
        West führt mit 41 % Umsatz-Anteil bei 40 % der Stückzahl, also höhere
        Preisrealisierung. Süd schwächelt strukturell.
      </p>
    </OutputShell>
  );
}

function ForecastOutput() {
  const max = 820;
  return (
    <OutputShell label="Forecast · KW 17–20" caption="Konfidenz 90 %">
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
                {r.w}
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
          <LegendDot color="var(--color-brand-orange)" label="Prognose" />
          <LegendDot color={DEMO.kupferMist} label="Konfidenz-Band" border />
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
          Trend{" "}
          <span style={{ color: "var(--color-brand-orange)" }}>+7,9 %</span>/
          Woche
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
        Lineare Projektion mit leichter Quartals-Saisonalität. Die Konfidenz
        weitet sich mit jeder Woche, realistisch, nicht geschönt.
      </p>
    </OutputShell>
  );
}

function LegendDot({
  color,
  label,
  border,
}: {
  color: string;
  label: string;
  border?: boolean;
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
