"use client";

import { useEffect, useState } from "react";
import { DEMO } from "@/lib/demo-tokens";
import {
  DEMO_HEIGHT,
  usePrefersReducedMotion,
  useVisibleAutoplay,
} from "./demo-utils";
import { useDemoLocale } from "./demo-locale";

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
  {
    id: "vertrag",
    n: "Vertrags-Assistent",
    model: "Claude Haiku 4.5",
    calls: 12_840,
    cost: 186.42,
    lat: 1.2,
    err: 0.2,
  },
  {
    id: "rechnung",
    n: "Rechnungs-Extraktion",
    model: "Claude Opus 4.5",
    calls: 3_210,
    cost: 412.08,
    lat: 2.8,
    err: 0.4,
  },
  {
    id: "agent",
    n: "Memo-Pipeline",
    model: "Multi-Model",
    calls: 842,
    cost: 298.15,
    lat: 14.6,
    err: 1.1,
  },
  {
    id: "sales",
    n: "Anfrage-Klassifikation",
    model: "Claude Sonnet 4.6",
    calls: 7_420,
    cost: 96.33,
    lat: 0.9,
    err: 0.3,
  },
];

const APP_NAMES_EN: Readonly<Record<string, string>> = {
  vertrag: "Contract assistant",
  rechnung: "Invoice extraction",
  agent: "Memo pipeline",
  sales: "Request classification",
};

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
  const { locale, text } = useDemoLocale();
  const reduced = usePrefersReducedMotion();
  const { ref, visible } = useVisibleAutoplay<HTMLDivElement>();
  const [selApp, setSelApp] = useState("vertrag");
  const [tick, setTick] = useState(0);
  const [series, setSeries] = useState<readonly number[]>(() =>
    makeSeries(60, 1.2, 0.4),
  );
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!visible || reduced) return;
    setLive(true);
    let updates = 0;
    let timer: ReturnType<typeof setTimeout>;
    const advance = () => {
      setTick((t) => t + 1);
      setSeries((s) => [
        ...s.slice(1),
        Math.max(0.2, s[s.length - 1] + (Math.random() - 0.5) * 0.5),
      ]);
      updates += 1;
      if (updates < 5) {
        timer = setTimeout(advance, 1200);
      } else {
        setLive(false);
      }
    };
    timer = setTimeout(advance, 1200);
    return () => clearTimeout(timer);
  }, [visible, reduced]);

  const activeApp = APPS.find((a) => a.id === selApp) ?? APPS[0];
  const total = APPS.reduce((s, a) => s + a.cost, 0);
  const appName = (app: App) =>
    locale === "de" ? app.n : (APP_NAMES_EN[app.id] ?? app.n);

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
      role="region"
      aria-label={text("Kosten- und Drift-Beispiel", "Cost and drift example")}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        width: "100%",
        minWidth: 0,
        minHeight: DEMO_HEIGHT,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
      }}
    >
      <style>{`
        [data-demo-id="cost-drift-observability"] .demo-cdo-kpis {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        [data-demo-id="cost-drift-observability"] .demo-cdo-kpis > *,
        [data-demo-id="cost-drift-observability"] .demo-cdo-grid,
        [data-demo-id="cost-drift-observability"] .demo-cdo-grid > * {
          min-width: 0;
        }
        [data-demo-id="cost-drift-observability"] .demo-cdo-grid {
          grid-template-columns: 1fr;
        }
        [data-demo-id="cost-drift-observability"] .demo-cdo-apps {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
        }
        [data-demo-id="cost-drift-observability"] .demo-cdo-apps > button {
          min-width: 0;
          width: 100%;
          overflow-wrap: anywhere;
        }
        [data-demo-id="cost-drift-observability"] .demo-cdo-chart-header {
          flex-wrap: wrap;
          gap: 8px;
        }
        [data-demo-id="cost-drift-observability"] .demo-cdo-chart-metrics {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (min-width: 768px) {
          [data-demo-id="cost-drift-observability"] .demo-cdo-kpis {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          [data-demo-id="cost-drift-observability"] .demo-cdo-grid {
            grid-template-columns: 240px 1fr;
          }
          [data-demo-id="cost-drift-observability"] .demo-cdo-apps {
            grid-template-columns: 1fr;
          }
          [data-demo-id="cost-drift-observability"] .demo-cdo-chart-metrics {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
      `}</style>
      <div>
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
          {text("Observability & Kosten", "Observability and cost")}
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            marginTop: 6,
          }}
        >
          {text("LLM-Kosten und Drift:", "LLM cost and drift:")}{" "}
          <span style={{ color: "var(--color-brand-orange)" }}>
            {text("ein Beispiel-Szenario.", "a seeded scenario.")}
          </span>
        </h2>
      </div>

      <div
        className="demo-cdo-kpis"
        style={{
          display: "grid",
          gap: 8,
        }}
      >
        {(
          [
            [
              text("Spend · MTD", "Spend · month to date"),
              `€${total.toFixed(0)}`,
              text("+12 % vs. Vormo.", "+12% versus prior month"),
              "var(--color-brand-orange)",
              true,
              [3, 4, 3, 5, 6, 7, 8, 9],
            ],
            [
              text("Aufrufe · 24 h", "Calls · 24h"),
              text("5.284", "5,284"),
              text("+3,2 %", "+3.2%"),
              DEMO.ink,
              false,
              [5, 6, 5, 7, 6, 8, 7, 9],
            ],
            [
              text("p95-Latenz", "p95 latency"),
              text("2,4 s", "2.4 s"),
              text("−8 % verbessert", "8% lower"),
              DEMO.statusGreen,
              false,
              [8, 7, 8, 6, 5, 5, 4, 3],
            ],
            [
              text("Fehlerquote", "Error rate"),
              text("0,41 %", "0.41%"),
              text("innerhalb SLA", "within SLA"),
              DEMO.statusGreen,
              false,
              [2, 3, 2, 3, 2, 2, 3, 2],
            ],
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
                minWidth: 0,
                boxShadow: alerting
                  ? "0 0 0 2px rgba(249,115,22,0.08)"
                  : "none",
              }}
            >
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
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
                  fontSize: 12,
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
              fontSize: 12,
              color: "var(--color-brand-orange)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            {text("Anwendungen", "Applications")}
          </div>
          <div className="demo-cdo-apps">
            {APPS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelApp(a.id)}
                style={{
                  minHeight: 44,
                  textAlign: "left",
                  padding: "8px 10px",
                  background: selApp === a.id ? DEMO.ink : DEMO.birke,
                  color: selApp === a.id ? DEMO.kalk : DEMO.ink,
                  border: `1px solid ${selApp === a.id ? "var(--color-brand-orange)" : DEMO.leinen}`,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {appName(a)}
                </div>
                <div
                  style={{
                    fontFamily: DEMO.font.mono,
                    fontSize: 12,
                    color:
                      selApp === a.id ? "rgba(243,240,233,0.6)" : DEMO.schiefer,
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
                    fontSize: 12,
                    color: selApp === a.id ? DEMO.kupferLight : DEMO.schiefer,
                  }}
                >
                  <span>€{a.cost.toFixed(0)}</span>
                  <span>
                    {a.calls.toLocaleString(
                      locale === "de" ? "de-DE" : "en-GB",
                    )}
                  </span>
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
            className="demo-cdo-chart-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {appName(activeApp)}
              </div>
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  color: "rgba(243,240,233,0.55)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginTop: 2,
                }}
              >
                {/* Names the extrapolation, not just the mode: the shell's
                    EvidenceBadge already states that the data is simulated,
                    but nothing else tells the reader that this curve MOVES at
                    runtime and that the motion is generated locally rather
                    than streamed. That fact belongs next to the moving line
                    and the LIVE/Angehalten indicator. */}
                {text(
                  "Latenz · Seed-Kurve, fortgeschrieben zur Drift-Erklärung",
                  "Latency · seeded series, extrapolated to explain drift",
                )}
              </div>
            </div>
            {/* A two-word status chip, so neither role="note" nor a title
                belongs here. The title restated the mode a third time (badge,
                SIMULIERT pill, here); role="note" marks parenthetic sections,
                not labels, and its visible text is already in reading order.
                Both removed; the chip stays as a visual marker. */}
            <span
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
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
              {text("◎ SEED-SZENARIO", "◎ SEEDED SCENARIO")}
            </span>
          </div>
          <svg
            width="100%"
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ display: "block" }}
            aria-label={text(
              "Latenz-Verlauf, letzte 60 Minuten",
              "Latency series, last 60 minutes",
            )}
          >
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
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
              points={`0,${H} ${pts} ${W},${H}`}
              fill="url(#area)"
              stroke="none"
            />
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
            className="demo-cdo-chart-metrics"
            style={{
              display: "grid",
              gap: 10,
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid rgba(243,240,233,0.12)",
            }}
          >
            {(
              [
                [
                  text("Aufrufe", "Calls"),
                  activeApp.calls.toLocaleString(
                    locale === "de" ? "de-DE" : "en-GB",
                  ),
                ],
                [text("Kosten", "Cost"), `€${activeApp.cost.toFixed(2)}`],
                [text("Ø Latenz", "Average latency"), `${activeApp.lat} s`],
                [text("Fehler", "Errors"), `${activeApp.err} %`],
              ] as const
            ).map(([l, v]) => (
              <div key={l}>
                <div
                  style={{
                    fontFamily: DEMO.font.mono,
                    fontSize: 12,
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 6,
          }}
        >
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
            {text("Log-Stream · Alter", "Event log · age")}
          </div>
          {!reduced ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                letterSpacing: "0.1em",
                fontWeight: 700,
                color: live ? DEMO.statusGreen : DEMO.schiefer,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: live ? DEMO.statusGreen : DEMO.schiefer,
                }}
              />
              {live ? text("LIVE", "LIVE") : text("Angehalten", "Paused")}
            </span>
          ) : null}
        </div>
        <div
          style={{
            background: DEMO.ink,
            color: DEMO.kalk,
            padding: "10px 12px",
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            lineHeight: 1.7,
            maxHeight: 140,
            overflowY: "auto",
          }}
        >
          {/* First column is the entry's AGE in seconds, not a clock time:
              newest entry at the top with the smallest age, older entries
              below. Ages are an offset plus `tick`, so every line grows older
              as the walk advances and none can go negative before the first
              tick or under reduced motion, where `tick` stays at 0. */}
          {(
            [
              [
                0,
                "info",
                "haiku·42ms",
                text(
                  "Abfrage: 'Kündigungsfrist Q3'",
                  "Query: 'Q3 cancellation period'",
                ),
                DEMO.statusGreen,
              ],
              [
                2,
                "info",
                "haiku·38ms",
                text("Abfrage: 'Haftungsgrenze'", "Query: 'liability limit'"),
                DEMO.statusGreen,
              ],
              [
                4,
                "warn",
                "opus·3.2s",
                text("Wiederholung nach Timeout", "Retry after timeout"),
                DEMO.statusAmber,
              ],
              [
                7,
                "info",
                "sonnet·1.8s",
                text(
                  "Pipeline: Anfrage-Klassifikation",
                  "Pipeline: request classification",
                ),
                DEMO.statusGreen,
              ],
              [
                9,
                "error",
                "opus·0ms",
                text("Ratenbegrenzung (org-1)", "Rate limit (org-1)"),
                DEMO.statusRed,
              ],
              [
                12,
                "info",
                "haiku·29ms",
                text("Cache-Treffer", "Cache hit"),
                DEMO.statusGreen,
              ],
            ] as const
          ).map(([ageOffset, lvl, tag, msg, c], i) => (
            <div key={i}>
              <span style={{ color: "rgba(243,240,233,0.4)" }}>
                {`${ageOffset + tick}s`.padStart(4)}{" "}
              </span>
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
