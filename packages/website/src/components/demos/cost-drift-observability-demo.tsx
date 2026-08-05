"use client";

import { useEffect, useState } from "react";
import { DEMO } from "@/lib/demo-tokens";
import { DEMO_HEIGHT, usePrefersReducedMotion, useVisibleAutoplay } from "./demo-utils";
import { SimulationDisclosure } from "./evidence-badge";

interface App {
  readonly id: string;
  readonly n: string;
  readonly model: string;
  readonly calls: number;
  readonly cost: number;
  readonly lat: number;
  readonly err: number;
}

const APPS: readonly App[] = [
  { id: "vertrag", n: "Vertrags-Assistent", model: "Claude Haiku 4.5", calls: 12_840, cost: 186.42, lat: 1.2, err: 0.2 },
  { id: "rechnung", n: "Rechnungs-Extraktion", model: "Claude Opus 4.5", calls: 3_210, cost: 412.08, lat: 2.8, err: 0.4 },
  { id: "agent", n: "Memo-Pipeline", model: "Multi-Model", calls: 842, cost: 298.15, lat: 14.6, err: 1.1 },
  { id: "sales", n: "Anfrage-Klassifikation", model: "Claude Sonnet 4.6", calls: 7_420, cost: 96.33, lat: 0.9, err: 0.3 },
];

function makeSeries(len: number, base: number, amp: number): readonly number[] {
  const arr: number[] = [];
  let v = base;
  for (let i = 0; i < len; i++) {
    v += (Math.random() - 0.5) * amp;
    arr.push(Math.max(0.1, v));
  }
  return arr;
}

export default function CostDriftObservabilityDemo() {
  const reduced = usePrefersReducedMotion();
  const { ref, visible } = useVisibleAutoplay<HTMLDivElement>();
  const [selApp, setSelApp] = useState("vertrag");
  const [tick, setTick] = useState(0);
  const [series, setSeries] = useState<readonly number[]>(() => makeSeries(60, 1.2, 0.4));

  useEffect(() => {
    if (!visible || reduced) return;
    const iv = setInterval(() => {
      setTick((t) => t + 1);
      setSeries((s) => [
        ...s.slice(1),
        Math.max(0.2, s[s.length - 1] + (Math.random() - 0.5) * 0.5),
      ]);
    }, 1200);
    return () => clearInterval(iv);
  }, [visible, reduced]);

  const activeApp = APPS.find((a) => a.id === selApp) ?? APPS[0];
  const total = APPS.reduce((s, a) => s + a.cost, 0);

  const W = 600;
  const H = 100;
  const max = Math.max(...series);
  const min = Math.min(...series);
  const pts = series
    .map(
      (v, i) =>
        `${(i / (series.length - 1)) * W},${H - ((v - min) / (max - min || 1)) * H}`,
    )
    .join(" ");

  return (
    <div
      ref={ref}
      data-demo-id="cost-drift-observability"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: DEMO_HEIGHT,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
      }}
    >
      <style>{`
        .demo-cdo-grid {
          grid-template-columns: 1fr;
        }
        .demo-cdo-apps {
          display: flex;
          flex-direction: row;
          gap: 6px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 2px;
        }
        .demo-cdo-apps > button {
          flex: 0 0 200px;
          scroll-snap-align: start;
        }
        @media (min-width: 768px) {
          .demo-cdo-grid {
            grid-template-columns: 240px 1fr;
          }
          .demo-cdo-apps {
            flex-direction: column;
            overflow-x: visible;
            padding-bottom: 0;
          }
          .demo-cdo-apps > button {
            flex: 0 0 auto;
          }
        }
        @keyframes demoCdoPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.82); }
        }
        .demo-cdo-pulse {
          animation: demoCdoPulse 1.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .demo-cdo-pulse { animation: none; }
        }
      `}</style>
      <div>
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
          Observability & Kosten
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 6 }}>
          LLM-Kosten und Drift:{" "}
          <span style={{ color: "var(--color-brand-orange)" }}>ein Beispiel-Szenario.</span>
        </h2>
      </div>
      <SimulationDisclosure>
        Alle Werte sind festgelegte Beispiel-Szenarien, keine Live-Messwerte. Das Diagramm zeigt eine kontinuierlich fortgeschriebene Beispielkurve, um Drift-Erkennung zu illustrieren.
      </SimulationDisclosure>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(140px, 1fr))",
          gap: 8,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {(
          [
            ["Spend · MTD", `€${total.toFixed(0)}`, "+12 % vs. Vormo.", "var(--color-brand-orange)", true, [3, 4, 3, 5, 6, 7, 8, 9]],
            ["Calls · 24h", "5.284", "+3,2 %", DEMO.ink, false, [5, 6, 5, 7, 6, 8, 7, 9]],
            ["p95 Latenz", "2,4 s", "−8 % verbessert", DEMO.statusGreen, false, [8, 7, 8, 6, 5, 5, 4, 3]],
            ["Fehlerquote", "0,41 %", "innerhalb SLA", DEMO.statusGreen, false, [2, 3, 2, 3, 2, 2, 3, 2]],
          ] as const
        ).map(([l, v, d, c, alerting, spark]) => {
          const smax = Math.max(...spark);
          const smin = Math.min(...spark);
          const sparkPts = spark
            .map(
              (n, i) =>
                `${(i / (spark.length - 1)) * 60},${20 - ((n - smin) / (smax - smin || 1)) * 18}`,
            )
            .join(" ");
          return (
            <div
              key={l}
              style={{
                background: DEMO.kalk,
                borderTop: alerting
                  ? `1px solid var(--color-brand-orange)`
                  : `1px solid ${DEMO.leinen}`,
                borderRight: alerting
                  ? `1px solid var(--color-brand-orange)`
                  : `1px solid ${DEMO.leinen}`,
                borderBottom: alerting
                  ? `1px solid var(--color-brand-orange)`
                  : `1px solid ${DEMO.leinen}`,
                borderLeft: `3px solid ${c}`,
                padding: 12,
                scrollSnapAlign: "start",
                boxShadow: alerting ? "0 0 0 2px rgba(249,115,22,0.08)" : "none",
              }}
            >
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 9,
                  color: DEMO.schiefer,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                {l}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: 6,
                  marginTop: 3,
                }}
              >
                <div
                  style={{
                    fontFamily: DEMO.font.mono,
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {v}
                </div>
                <svg
                  width={60}
                  height={20}
                  viewBox="0 0 60 20"
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden
                  style={{ flex: "0 0 auto" }}
                >
                  <polyline
                    points={sparkPts}
                    fill="none"
                    stroke={c === DEMO.ink ? DEMO.schiefer : c}
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 10,
                  color: DEMO.schiefer,
                  marginTop: 3,
                }}
              >
                {d}
              </div>
            </div>
          );
        })}
      </div>

      <div className="demo-cdo-grid" style={{ display: "grid", gap: 12 }}>
        <div>
          <div
            style={{
              fontFamily: DEMO.font.mono,
              fontSize: 10,
              color: "var(--color-brand-orange)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Anwendungen
          </div>
          <div className="demo-cdo-apps">
            {APPS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelApp(a.id)}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  background: selApp === a.id ? DEMO.ink : DEMO.birke,
                  color: selApp === a.id ? DEMO.kalk : DEMO.ink,
                  border: `1px solid ${selApp === a.id ? "var(--color-brand-orange)" : DEMO.leinen}`,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {a.n}
                </div>
                <div
                  style={{
                    fontFamily: DEMO.font.mono,
                    fontSize: 9,
                    color: selApp === a.id ? "rgba(243,240,233,0.6)" : DEMO.schiefer,
                    letterSpacing: "0.1em",
                    marginTop: 2,
                  }}
                >
                  {a.model.toUpperCase()}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                    fontFamily: DEMO.font.mono,
                    fontSize: 10,
                    color: selApp === a.id ? DEMO.kupferLight : DEMO.schiefer,
                  }}
                >
                  <span>€{a.cost.toFixed(0)}</span>
                  <span>{a.calls.toLocaleString("de-DE")}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            background: DEMO.ink,
            color: DEMO.kalk,
            padding: 14,
            borderTop: `3px solid var(--color-brand-orange)`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>
                {activeApp.n}
              </div>
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 10,
                  color: "rgba(243,240,233,0.55)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginTop: 2,
                }}
              >
                Latenz · Seed-Szenario (simuliert)
              </div>
            </div>
            <span
              role="note"
              title="Alle Werte sind festgelegte Beispiel-Szenarien, keine Live-Messwerte."
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 11,
                padding: "3px 10px",
                background: "#1e40af",
                color: "#bfdbfe",
                border: "1px solid #3b82f6",
                letterSpacing: "0.14em",
                fontWeight: 700,
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ◎ SEED-SZENARIO
            </span>
          </div>
          <svg
            width="100%"
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ display: "block" }}
            aria-label="Latenz-Verlauf, letzte 60 Minuten"
          >
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand-orange)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--color-brand-orange)" stopOpacity="0" />
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
            <polyline points={`0,${H} ${pts} ${W},${H}`} fill="url(#area)" stroke="none" />
            <polyline
              points={pts}
              fill="none"
              stroke="var(--color-brand-orange)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 10,
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid rgba(243,240,233,0.12)",
            }}
          >
            {(
              [
                ["Calls", activeApp.calls.toLocaleString("de-DE")],
                ["Kosten", `€${activeApp.cost.toFixed(2)}`],
                ["Avg Latenz", `${activeApp.lat} s`],
                ["Fehler", `${activeApp.err} %`],
              ] as const
            ).map(([l, v]) => (
              <div key={l}>
                <div
                  style={{
                    fontFamily: DEMO.font.mono,
                    fontSize: 9,
                    color: "rgba(243,240,233,0.5)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  {l}
                </div>
                <div
                  style={{
                    fontFamily: DEMO.font.mono,
                    fontSize: 16,
                    fontWeight: 700,
                    marginTop: 2,
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 10,
            color: "var(--color-brand-orange)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          Log-Stream
        </div>
        <div
          style={{
            background: DEMO.ink,
            color: DEMO.kalk,
            padding: "10px 12px",
            fontFamily: DEMO.font.mono,
            fontSize: 10,
            lineHeight: 1.7,
            maxHeight: 140,
            overflowY: "auto",
          }}
        >
          {(
            [
              [`${tick}s`, "info", "haiku·42ms", "Abfrage: 'Kündigungsfrist Q3'", DEMO.statusGreen],
              [`${tick - 2}s`, "info", "haiku·38ms", "Abfrage: 'Haftungsgrenze'", DEMO.statusGreen],
              [`${tick - 4}s`, "warn", "opus·3.2s", "Retry nach Timeout", DEMO.statusAmber],
              [`${tick - 7}s`, "info", "sonnet·1.8s", "Pipeline: Anfrage-Klassifikation", DEMO.statusGreen],
              [`${tick - 9}s`, "error", "opus·0ms", "Rate-Limit (org-1)", DEMO.statusRed],
              [`${tick - 12}s`, "info", "haiku·29ms", "Cache-Hit", DEMO.statusGreen],
            ] as const
          ).map(([t, lvl, tag, msg, c], i) => (
            <div key={i}>
              <span style={{ color: "rgba(243,240,233,0.4)" }}>{String(t).padStart(4)} </span>
              <span style={{ color: c, letterSpacing: "0.1em" }}>
                [{lvl.toUpperCase().padEnd(5)}]
              </span>
              <span style={{ color: "var(--color-brand-orange)" }}>
                {" "}
                {tag.padEnd(14)}
              </span>
              <span style={{ color: "rgba(243,240,233,0.85)" }}> {msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
