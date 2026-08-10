"use client";

import { useEffect, useState } from "react";
import { DEMO } from "@/lib/demo-tokens";
import {
  DEMO_HEIGHT,
  usePrefersReducedMotion,
  useVisibleAutoplay,
} from "./demo-utils";
import { SimulationDisclosure } from "./evidence-badge";
import { useDemoLocale } from "./demo-locale";

type Severity = "warn" | "ok" | "info" | "err";

interface LogEvent {
  readonly id: number;
  readonly t: string;
  readonly src: string;
  readonly msg: string;
  readonly lvl: Severity;
}

const EVENTS: readonly Omit<LogEvent, "id">[] = [
  { t: "+0.0 s", src: "DHL-Webhook", msg: "Sendung 42291-A · +31h verspätet", lvl: "warn" },
  { t: "+0.9 s", src: "SAP · MM02", msg: "Lagerbestand SKU S-2200: 14 Stk · 2 Tage Reichweite", lvl: "info" },
  { t: "+2.3 s", src: "Claude · Haiku", msg: "Kunden-E-Mail generiert (Beispielwert: ~200 Tokens)", lvl: "info" },
  { t: "+2.9 s", src: "SMTP", msg: "Mail-Entwurf für einkauf@fiktivwerk.example vorbereitet", lvl: "ok" },
  { t: "+3.1 s", src: "Slack", msg: "#logistik-warn · @disposition angepingt", lvl: "ok" },
  { t: "+4.0 s", src: "SAP · MM-BANF", msg: "Bestellanforderung als Review-Vorschlag markiert", lvl: "ok" },
];

const EVENTS_EN: readonly Omit<LogEvent, "id">[] = [
  { t: "+0.0 s", src: "DHL webhook", msg: "Shipment 42291-A · delayed by 31h", lvl: "warn" },
  { t: "+0.9 s", src: "SAP · MM02", msg: "Stock for SKU S-2200: 14 units · 2 days cover", lvl: "info" },
  { t: "+2.3 s", src: "Claude · Haiku", msg: "Customer-email draft generated (sample: about 200 tokens)", lvl: "info" },
  { t: "+2.9 s", src: "SMTP", msg: "Draft prepared for procurement@example.invalid", lvl: "ok" },
  { t: "+3.1 s", src: "Slack", msg: "#logistics-alert · dispatcher mentioned", lvl: "ok" },
  { t: "+4.0 s", src: "SAP · MM-BANF", msg: "Purchase request marked as a review proposal", lvl: "ok" },
];

interface NodeSpec {
  readonly id: string;
  readonly t: string;
  readonly k: string;
  readonly ic: string;
  readonly note: string;
  readonly step: number;
}

interface ColSpec {
  readonly label: string;
  readonly nodes: readonly NodeSpec[];
}

const COLS: readonly ColSpec[] = [
  {
    label: "① Trigger",
    nodes: [
      { id: "trigger", t: "DHL / DB Schenker", k: "Webhook", ic: "◎", note: "Sendung 42291-A · +31h Verzug", step: 0 },
    ],
  },
  {
    label: "② Anreicherung + Logik",
    nodes: [
      { id: "enrich", t: "SAP-Bestand prüfen", k: "HTTP", ic: "▦", note: "Lager: 14 Stk · 2 Tage Reichweite", step: 1 },
      { id: "delay", t: "Verzug klassifizieren", k: "IF-Node", ic: "△", note: "ETA > 24h → Alert-Pfad", step: 1 },
      { id: "llm", t: "Claude Haiku · Brief", k: "LLM", ic: "◈", note: "~200 Tokens · DE · Beispielwert", step: 2 },
    ],
  },
  {
    label: "③ Aktionen",
    nodes: [
      { id: "mail", t: "Kunde informieren", k: "E-Mail", ic: "✉", note: "einkauf@fiktivwerk.example", step: 3 },
      { id: "slack", t: "Disposition pingen", k: "Slack", ic: "◉", note: "#logistik-warn · @disposition", step: 3 },
      { id: "erp", t: "Notfall-Bestellung", k: "SAP MM", ic: "▦", note: "BANF 4500-8821 · 20 Stk", step: 3 },
    ],
  },
];

const COLS_EN: readonly ColSpec[] = [
  {
    label: "① Trigger",
    nodes: [
      { id: "trigger", t: "DHL / DB Schenker", k: "Webhook", ic: "◎", note: "Shipment 42291-A · 31h delay", step: 0 },
    ],
  },
  {
    label: "② Enrichment and logic",
    nodes: [
      { id: "enrich", t: "Check SAP stock", k: "HTTP", ic: "▦", note: "Stock: 14 units · 2 days cover", step: 1 },
      { id: "delay", t: "Classify delay", k: "IF node", ic: "△", note: "ETA > 24h → alert path", step: 1 },
      { id: "llm", t: "Claude Haiku · draft", k: "LLM", ic: "◈", note: "About 200 tokens · EN · sample", step: 2 },
    ],
  },
  {
    label: "③ Actions",
    nodes: [
      { id: "mail", t: "Prepare customer message", k: "Email", ic: "✉", note: "procurement@example.invalid", step: 3 },
      { id: "slack", t: "Alert dispatch", k: "Slack", ic: "◉", note: "#logistics-alert · dispatcher", step: 3 },
      { id: "erp", t: "Draft emergency order", k: "SAP MM", ic: "▦", note: "BANF 4500-8821 · 20 units", step: 3 },
    ],
  },
];

type NodeStatus = "pending" | "active" | "done";

function statusFor(step: number, activeStep: number): NodeStatus {
  if (activeStep < 0) return "pending";
  if (activeStep === step) return "active";
  if (activeStep > step) return "done";
  return "pending";
}

function StatusPill({ status }: { status: NodeStatus }) {
  const map: Record<NodeStatus, { label: string; color: string; bg: string }> = {
    pending: { label: "WAIT", color: "rgba(243,240,233,0.5)", bg: "rgba(243,240,233,0.08)" },
    active: { label: "RUN", color: DEMO.ink, bg: "var(--color-brand-orange)" },
    done: { label: "OK", color: DEMO.statusGreen, bg: "rgba(34,197,94,0.15)" },
  };
  const s = map[status];
  return (
    <span
      style={{
        fontFamily: DEMO.font.mono,
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: "0.12em",
        color: s.color,
        background: s.bg,
        padding: "1px 5px",
        flexShrink: 0,
      }}
    >
      {s.label}
    </span>
  );
}

export default function N8nSupplyChainDemo() {
  const { locale, text } = useDemoLocale();
  const sourceEvents = locale === "de" ? EVENTS : EVENTS_EN;
  const columns = locale === "de" ? COLS : COLS_EN;
  const reduced = usePrefersReducedMotion();
  const { ref, visible } = useVisibleAutoplay<HTMLDivElement>();
  const [activeStep, setActiveStep] = useState(-1);
  const [events, setEvents] = useState<LogEvent[]>([]);

  useEffect(() => {
    if (reduced) {
      setActiveStep(3);
      setEvents(sourceEvents.map((e, i) => ({ ...e, id: i })));
      return;
    }
    if (!visible) return;

    let mounted = true;
    const run = () => {
      if (!mounted) return;
      setActiveStep(-1);
      setEvents([]);
      [0, 1, 2, 3].forEach((step) => {
        setTimeout(() => mounted && setActiveStep(step), step * 650);
      });
      sourceEvents.forEach((e, i) => {
        setTimeout(() => {
          if (!mounted) return;
          setEvents((arr) => [...arr, { ...e, id: Date.now() + i }]);
        }, 400 + i * 500);
      });
    };
    run();
    const interval = setInterval(run, 9000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [visible, reduced, sourceEvents]);

  const allDone = activeStep >= 3;

  return (
    <div
      ref={ref}
      data-demo-id="n8n-supply-chain"
      role="region"
      aria-label={text("Simulierter n8n-Lieferkettenablauf", "Simulated n8n supply-chain flow")}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: DEMO.font.sans,
        color: DEMO.kalk,
        minHeight: DEMO_HEIGHT,
      }}
    >
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
          {text("n8n · Supply-Chain-Automation", "n8n · supply-chain automation")}
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            marginTop: 6,
            color: DEMO.kalk,
          }}
        >
          {text("Lieferverzug erkannt.", "Delivery delay detected.")}{" "}
          <span style={{ color: "var(--color-brand-orange)" }}>
            {text("Entwurf vorbereitet. Laufzeit simuliert.", "Draft prepared. Runtime simulated.")}
          </span>
        </h2>
      </div>

      <SimulationDisclosure>
        {text(
          "Alle Zeitstempel und Tokenwerte sind Beispieldaten. Die Simulation zeigt die Reihenfolge; kein echter Workflow und keine Außenaktion werden ausgeführt.",
          "All timestamps and token counts are sample data. The simulation shows sequence only; no real workflow or external action runs.",
        )}
      </SimulationDisclosure>

      {/* Workflow canvas: horizontal on >=640px, stacked on mobile */}
      <div
        className="demo-n8n-grid"
        style={{
          background: "rgba(243,240,233,0.03)",
          backgroundImage: "radial-gradient(rgba(243,240,233,0.08) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          border: `1px solid rgba(243,240,233,0.12)`,
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {columns.map((col, ci) => (
          <div key={col.label} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 9,
                  color: "rgba(243,240,233,0.55)",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                {col.label}
              </div>
              {col.nodes.map((n) => {
                const status = statusFor(n.step, activeStep);
                const isActive = status !== "pending";
                const isCurrent = status === "active";
                return (
                  <div
                    key={n.id}
                    style={{
                      background: isCurrent ? "var(--color-brand-orange)" : DEMO.kalk,
                      color: isCurrent ? DEMO.kalk : DEMO.ink,
                      borderTop: `1px solid ${isActive ? "var(--color-brand-orange)" : DEMO.ink}`,
                      borderRight: `1px solid ${isActive ? "var(--color-brand-orange)" : DEMO.ink}`,
                      borderBottom: `1px solid ${isActive ? "var(--color-brand-orange)" : DEMO.ink}`,
                      borderLeft: `3px solid var(--color-brand-orange)`,
                      padding: "9px 10px",
                      boxShadow: isActive
                        ? `3px 3px 0 0 var(--color-brand-orange)`
                        : `3px 3px 0 0 ${DEMO.ink}`,
                      transition: "all 200ms ease-out",
                      transform: isCurrent ? "translate(-1px,-1px)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          background: DEMO.ink,
                          color: "var(--color-brand-orange)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        {n.ic}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                            lineHeight: 1.25,
                            wordBreak: "break-word",
                          }}
                        >
                          {n.t}
                        </div>
                        <div
                          style={{
                            fontFamily: DEMO.font.mono,
                            fontSize: 8,
                            color: isCurrent ? "rgba(243,240,233,0.7)" : DEMO.schiefer,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            marginTop: 1,
                          }}
                        >
                          {n.k}
                        </div>
                      </div>
                      <StatusPill status={status} />
                    </div>
                    <div
                      style={{
                        fontFamily: DEMO.font.mono,
                        fontSize: 9,
                        color: isCurrent ? "rgba(243,240,233,0.9)" : DEMO.schiefer,
                        marginTop: 5,
                        letterSpacing: "0.04em",
                        lineHeight: 1.45,
                        wordBreak: "break-word",
                      }}
                    >
                      {n.note}
                    </div>
                  </div>
                );
              })}
            </div>
            {ci < columns.length - 1 && (
              <div
                className="demo-n8n-arrow"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color:
                    activeStep > ci
                      ? "var(--color-brand-orange)"
                      : "rgba(243,240,233,0.35)",
                  transition: "color 200ms",
                  fontFamily: DEMO.font.mono,
                  fontSize: 16,
                  fontWeight: 700,
                }}
                aria-hidden
              >
                <span className="demo-n8n-arrow-v">↓</span>
                <span className="demo-n8n-arrow-h">→</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Terminal-style log */}
      <div
        style={{
          background: DEMO.ink,
          color: DEMO.kalk,
          padding: "10px 14px 12px",
          fontFamily: DEMO.font.mono,
          fontSize: 10,
          lineHeight: 1.7,
          minHeight: 150,
          borderTop: "1px solid rgba(243,240,233,0.14)",
          borderRight: "1px solid rgba(243,240,233,0.14)",
          borderBottom: "1px solid rgba(243,240,233,0.14)",
          borderLeft: `3px solid var(--color-brand-orange)`,
        }}
      >
        {/* Terminal chrome */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(243,240,233,0.1)",
            paddingBottom: 5,
            marginBottom: 7,
            fontSize: 9,
            color: "rgba(243,240,233,0.55)",
            letterSpacing: "0.14em",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-flex", gap: 4 }}>
              <span style={{ width: 7, height: 7, background: DEMO.statusRed, borderRadius: "50%", display: "inline-block" }} />
              <span style={{ width: 7, height: 7, background: DEMO.statusAmber, borderRadius: "50%", display: "inline-block" }} />
              <span style={{ width: 7, height: 7, background: DEMO.statusGreen, borderRadius: "50%", display: "inline-block" }} />
            </span>
            <span>› DEMO-LOG · WORKFLOW SC-042</span>
          </span>
          <span>{events.length}/{sourceEvents.length} {text("EREIGNISSE", "EVENTS")}</span>
        </div>
        {events.length === 0 && (
          <div style={{ color: "rgba(243,240,233,0.5)" }}>
            // {text("warte auf Webhook-Ereignis…", "waiting for webhook event…")}
          </div>
        )}
        {events.map((e) => {
          const c =
            e.lvl === "warn"
              ? DEMO.statusAmber
              : e.lvl === "err"
                ? DEMO.statusRed
                : e.lvl === "ok"
                  ? DEMO.statusGreen
                  : DEMO.kupferLight;
          return (
            <div key={e.id} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "baseline" }}>
              <span style={{ color: "rgba(243,240,233,0.45)", flexShrink: 0 }}>{e.t}</span>
              <span style={{ color: c, letterSpacing: "0.08em", flexShrink: 0 }}>
                [{e.lvl.toUpperCase().padEnd(4)}]
              </span>
              <span style={{ color: "var(--color-brand-orange)", flexShrink: 0 }}>
                {e.src}
              </span>
              <span style={{ color: "rgba(243,240,233,0.9)", minWidth: 0, wordBreak: "break-word" }}>
                {e.msg}
              </span>
            </div>
          );
        })}
        {allDone && events.length === sourceEvents.length && (
          <div style={{ marginTop: 6, color: DEMO.statusGreen, letterSpacing: "0.08em" }}>
            {text(
              "✓ Workflow-Simulation abgeschlossen · Beispiel-Laufzeit 4,02 s",
              "✓ Workflow simulation complete · sample runtime 4.02 s",
            )}
          </div>
        )}
      </div>

      <div className="demo-n8n-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8 }}>
        {(
          [
            [text("Beispiel-Reaktionszeit", "Sample response time"), "4 s", true],
            [text("Manuelle Annahme", "Manual assumption"), "≈ 45 min", false],
            [text("Beispiel-Läufe / Monat", "Sample runs / month"), text("1.240", "1,240"), false],
            [text("Hosting", "Hosting"), "Self-hosted", false],
          ] as const
        ).map(([l, v, hero]) => (
          <div
            key={l}
            style={{
              background: hero ? "rgba(249,115,22,0.12)" : "rgba(243,240,233,0.05)",
              border: `1px solid ${hero ? "var(--color-brand-orange)" : "rgba(243,240,233,0.15)"}`,
              padding: 10,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 9,
                color: hero ? "var(--color-brand-orange)" : "rgba(243,240,233,0.55)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              {l}
            </div>
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: hero ? 22 : 18,
                fontWeight: 700,
                color: hero ? "var(--color-brand-orange)" : DEMO.kalk,
                marginTop: 3,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>

      {/* Failure mode beat: low-confidence branch */}
      <div
        style={{
          border: "1px solid rgba(217,119,6,0.3)",
          background: "rgba(217,119,6,0.05)",
          padding: "10px 14px",
        }}
      >
        <div
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: "#d97706",
            marginBottom: 6,
          }}
        >
          {text(
            "Alternativer Pfad: Konfidenz niedrig → Mensch übernimmt",
            "Alternate path: low confidence → human review",
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            lineHeight: 1.5,
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "Trigger", color: "#d97706", sub: text("Verspätung unklar", "Delay unclear") },
            { label: "→", color: "rgba(243,240,233,0.4)", sub: "" },
            { label: text("IF: Konfidenz niedrig", "IF: low confidence"), color: "#d97706", sub: text("Score < Schwellenwert", "Score below threshold") },
            { label: "→", color: "rgba(243,240,233,0.4)", sub: "" },
            { label: text("Manuelle Prüfung erforderlich", "Manual review required"), color: "#f59e0b", sub: text("Disposition entscheidet", "Dispatcher decides") },
          ].map((n, i) =>
            n.label === "→" ? (
              <span key={i} style={{ color: n.color, fontSize: 14, fontWeight: 700 }}>&rarr;</span>
            ) : (
              <div
                key={i}
                style={{
                  padding: "5px 10px",
                  background: "rgba(217,119,6,0.1)",
                  border: `1px solid rgba(217,119,6,0.4)`,
                  borderLeft: `3px solid ${n.color}`,
                  fontFamily: DEMO.font.mono,
                  fontSize: 10,
                  color: n.color,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                <div>{n.label}</div>
                {n.sub && (
                  <div style={{ color: "rgba(243,240,233,0.5)", fontWeight: 400, marginTop: 2, fontSize: 9 }}>
                    {n.sub}
                  </div>
                )}
              </div>
            )
          )}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: "rgba(243,240,233,0.6)",
            lineHeight: 1.5,
            fontFamily: DEMO.font.mono,
          }}
        >
          {text(
            "Wenn das Modell unsicher ist, stoppt der automatisierte Pfad. Ein Mensch prüft und entscheidet.",
            "When the model is uncertain, the automated path stops. A person reviews and decides.",
          )}
        </div>
      </div>

      <style>{`
        [data-demo-id="n8n-supply-chain"] .demo-n8n-arrow-h { display: none; }
        [data-demo-id="n8n-supply-chain"] .demo-n8n-arrow-v { display: inline; }
        @media (min-width: 640px) {
          [data-demo-id="n8n-supply-chain"] .demo-n8n-grid {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) auto minmax(0, 1.15fr) auto minmax(0, 1.15fr) !important;
            flex-direction: row !important;
            gap: 0 !important;
            align-items: start !important;
          }
          [data-demo-id="n8n-supply-chain"] .demo-n8n-arrow {
            padding: 28px 10px 0 !important;
          }
          [data-demo-id="n8n-supply-chain"] .demo-n8n-arrow-h { display: inline; }
          [data-demo-id="n8n-supply-chain"] .demo-n8n-arrow-v { display: none; }
        }
        @media (max-width: 480px) {
          [data-demo-id="n8n-supply-chain"] .demo-n8n-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}
