"use client";

import { useMemo, useState } from "react";
import { DEMO } from "@/lib/demo-tokens";
import {
  DEMO_HEIGHT,
  usePhasedLoop,
  usePrefersReducedMotion,
  useVisibleAutoplay,
} from "./demo-utils";

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
  const reduced = usePrefersReducedMotion();
  const { ref, visible } = useVisibleAutoplay<HTMLDivElement>();

  const phases = useMemo(
    () => [{ duration: 3200 }, { duration: 3200 }, { duration: 3200 }],
    [],
  );
  const autoIdx = usePhasedLoop(phases, visible, reduced);
  const [manual, setManual] = useState<TaskId | null>(null);

  const task: TaskId = manual ?? TASKS[autoIdx].id;
  const isAuto = manual === null;

  return (
    <div
      ref={ref}
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
              fontSize: 10,
              color: DEMO.schiefer,
              letterSpacing: "0.08em",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: isAuto ? DEMO.statusGreen : DEMO.schiefer,
                boxShadow: isAuto
                  ? `0 0 0 3px rgba(34,197,94,0.18)`
                  : "none",
              }}
            />
            {isAuto ? "Auto-Play" : "Manuell"}
          </div>
        </div>
        <h3
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
        </h3>
      </div>

      {/* Main split — stacks on mobile, 2-col from ~560px */}
      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        }}
      >
        <Spreadsheet />
        <TaskPicker
          activeId={task}
          isAuto={isAuto}
          autoIdx={autoIdx}
          onSelect={setManual}
        />
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
          fontSize: 10,
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
            fontSize: 11,
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
        <span style={{ marginLeft: "auto", opacity: 0.7, fontSize: 9 }}>
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
          fontSize: 10,
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
            fontSize: 11,
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
                    fontSize: 9,
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
                  background: i % 3 === 2 ? "rgba(249,115,22,0.04)" : "transparent",
                }}
              >
                <td
                  style={{
                    padding: "4px 8px",
                    background: DEMO.birke,
                    color: DEMO.schiefer,
                    fontSize: 9,
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
          fontSize: 9,
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
  isAuto,
  autoIdx,
  onSelect,
}: {
  activeId: TaskId;
  isAuto: boolean;
  autoIdx: number;
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
            fontSize: 9,
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
        const showProgress = isAuto && active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            aria-pressed={active}
            style={{
              position: "relative",
              textAlign: "left",
              padding: "11px 13px",
              background: active ? DEMO.ink : DEMO.birke,
              color: active ? DEMO.kalk : DEMO.ink,
              border: `1px solid ${
                active ? "var(--color-brand-orange)" : DEMO.leinen
              }`,
              boxShadow: active ? `3px 3px 0 0 var(--color-brand-orange)` : "none",
              transform: active ? "translate(-2px,-2px)" : "translate(0,0)",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "transform 160ms ease, box-shadow 160ms ease, background 160ms ease",
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
                    fontSize: 9,
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
                  fontSize: 9,
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
                fontSize: 11,
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
                fontSize: 9,
                color: "var(--color-brand-orange)",
                letterSpacing: "0.12em",
                fontWeight: 700,
              }}
            >
              {t.action} →
            </div>

            {/* Auto-play progress bar */}
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                height: 2,
                width: showProgress ? "100%" : "0%",
                background: "var(--color-brand-orange)",
                transition: showProgress
                  ? "width 3200ms linear"
                  : "width 200ms ease",
                opacity: showProgress ? 1 : 0,
              }}
              key={`${autoIdx}-${t.id}`}
            />
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
        fontSize: 10,
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
            fontSize: 9,
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
          fontSize: "clamp(10px, 1.6vw, 12px)",
          color: "var(--color-brand-orange)",
          lineHeight: 1.65,
          overflowWrap: "anywhere",
        }}
      >
        ={"WENN(INDIREKT(\"E\"&ZEILE()-3)=0;\"\";(E2-INDIREKT(\"E\"&ZEILE()-3))/INDIREKT(\"E\"&ZEILE()-3))"}
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
          fontSize: 11,
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
        Veränderung. Zieh die Formel herunter, sie läuft für alle
        Regionen.
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
          fontSize: 9,
          color: DEMO.schiefer,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {k}
      </div>
      <div
        style={{
          fontSize: 11,
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
    <OutputShell label="Pivot · nach Region sortiert" caption="absteigend nach Umsatz">
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
                    fontSize: 10,
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
                        fontSize: 9,
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
                    color: i === 0 ? "var(--color-brand-orange)" : DEMO.schiefer,
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
                  fontSize: 10,
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
                  fontSize: 10,
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
          <LegendDot
            color={DEMO.kupferMist}
            label="Konfidenz-Band"
            border
          />
        </div>
        <div
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 10,
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
        fontSize: 10,
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
