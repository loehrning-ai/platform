"use client";

import { useEffect, useState } from "react";
import { DEMO } from "@/lib/demo-tokens";
import {
  DEMO_HEIGHT,
  usePrefersReducedMotion,
  useVisibleAutoplay,
} from "./demo-utils";
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
  {
    t: "+0.0 s",
    src: "DHL-Webhook",
    msg: "Sendung 42291-A · +31h verspätet",
    lvl: "warn",
  },
  {
    t: "+0.9 s",
    src: "SAP · MM02",
    msg: "Lagerbestand SKU S-2200: 14 Stk · 2 Tage Reichweite",
    lvl: "info",
  },
  {
    t: "+2.3 s",
    src: "Claude · Haiku",
    msg: "Kunden-E-Mail generiert (Beispielwert: ~200 Tokens)",
    lvl: "info",
  },
  {
    t: "+2.9 s",
    src: "SMTP",
    msg: "Mail-Entwurf für einkauf@fiktivwerk.example vorbereitet",
    lvl: "ok",
  },
  {
    t: "+3.1 s",
    src: "Slack",
    msg: "#logistik-warn · @disposition angepingt",
    lvl: "ok",
  },
  {
    t: "+4.0 s",
    src: "SAP · MM-BANF",
    msg: "Bestellanforderung als Review-Vorschlag markiert",
    lvl: "ok",
  },
];

const EVENTS_EN: readonly Omit<LogEvent, "id">[] = [
  {
    t: "+0.0 s",
    src: "DHL webhook",
    msg: "Shipment 42291-A · delayed by 31h",
    lvl: "warn",
  },
  {
    t: "+0.9 s",
    src: "SAP · MM02",
    msg: "Stock for SKU S-2200: 14 units · 2 days cover",
    lvl: "info",
  },
  {
    t: "+2.3 s",
    src: "Claude · Haiku",
    msg: "Customer-email draft generated (sample: about 200 tokens)",
    lvl: "info",
  },
  {
    t: "+2.9 s",
    src: "SMTP",
    msg: "Draft prepared for procurement@example.invalid",
    lvl: "ok",
  },
  {
    t: "+3.1 s",
    src: "Slack",
    msg: "#logistics-alert · dispatcher mentioned",
    lvl: "ok",
  },
  {
    t: "+4.0 s",
    src: "SAP · MM-BANF",
    msg: "Purchase request marked as a review proposal",
    lvl: "ok",
  },
];

type Scenario = "delay" | "lowConfidence";

// The "low confidence" branch stops after step 2 (the LLM brief) instead of
// reaching the three automated actions in step 3 — it replaces those three
// events with this single escalation line.
const LOW_CONFIDENCE_EVENT: Omit<LogEvent, "id"> = {
  t: "+2.6 s",
  src: "IF-Node",
  msg: "Konfidenz < Schwellenwert · manuelle Prüfung erforderlich",
  lvl: "warn",
};

const LOW_CONFIDENCE_EVENT_EN: Omit<LogEvent, "id"> = {
  t: "+2.6 s",
  src: "IF node",
  msg: "Confidence below threshold · manual review required",
  lvl: "warn",
};

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
      {
        id: "trigger",
        t: "DHL / DB Schenker",
        k: "Webhook",
        ic: "◎",
        note: "Sendung 42291-A · +31h Verzug",
        step: 0,
      },
    ],
  },
  {
    label: "② Anreicherung + Logik",
    nodes: [
      {
        id: "enrich",
        t: "SAP-Bestand prüfen",
        k: "HTTP",
        ic: "▦",
        note: "Lager: 14 Stk · 2 Tage Reichweite",
        step: 1,
      },
      {
        id: "delay",
        t: "Verzug klassifizieren",
        k: "IF-Node",
        ic: "△",
        note: "ETA > 24h → Alert-Pfad",
        step: 1,
      },
      {
        id: "llm",
        t: "Claude Haiku · Brief",
        k: "LLM",
        ic: "◈",
        note: "~200 Tokens · DE · Beispielwert",
        step: 2,
      },
    ],
  },
  {
    label: "③ Aktionen",
    nodes: [
      {
        id: "mail",
        t: "Kunde informieren",
        k: "E-Mail",
        ic: "✉",
        note: "einkauf@fiktivwerk.example",
        step: 3,
      },
      {
        id: "slack",
        t: "Disposition pingen",
        k: "Slack",
        ic: "◉",
        note: "#logistik-warn · @disposition",
        step: 3,
      },
      {
        id: "erp",
        t: "Notfall-Bestellung",
        k: "SAP MM",
        ic: "▦",
        note: "BANF 4500-8821 · 20 Stk",
        step: 3,
      },
    ],
  },
];

const COLS_EN: readonly ColSpec[] = [
  {
    label: "① Trigger",
    nodes: [
      {
        id: "trigger",
        t: "DHL / DB Schenker",
        k: "Webhook",
        ic: "◎",
        note: "Shipment 42291-A · 31h delay",
        step: 0,
      },
    ],
  },
  {
    label: "② Enrichment and logic",
    nodes: [
      {
        id: "enrich",
        t: "Check SAP stock",
        k: "HTTP",
        ic: "▦",
        note: "Stock: 14 units · 2 days cover",
        step: 1,
      },
      {
        id: "delay",
        t: "Classify delay",
        k: "IF node",
        ic: "△",
        note: "ETA > 24h → alert path",
        step: 1,
      },
      {
        id: "llm",
        t: "Claude Haiku · draft",
        k: "LLM",
        ic: "◈",
        note: "About 200 tokens · EN · sample",
        step: 2,
      },
    ],
  },
  {
    label: "③ Actions",
    nodes: [
      {
        id: "mail",
        t: "Prepare customer message",
        k: "Email",
        ic: "✉",
        note: "procurement@example.invalid",
        step: 3,
      },
      {
        id: "slack",
        t: "Alert dispatch",
        k: "Slack",
        ic: "◉",
        note: "#logistics-alert · dispatcher",
        step: 3,
      },
      {
        id: "erp",
        t: "Draft emergency order",
        k: "SAP MM",
        ic: "▦",
        note: "BANF 4500-8821 · 20 units",
        step: 3,
      },
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

// Both autoplay and manual step-through derive the visible log from
// (activeStep, scenario) alone, so scrubbing backward/forward always shows
// exactly what that step should reveal — no separate timer-driven event list
// to fall out of sync with the node grid above it.
function eventsForStep(
  step: number,
  scenario: Scenario,
  source: readonly Omit<LogEvent, "id">[],
  lowConfidenceEvent: Omit<LogEvent, "id">,
): readonly LogEvent[] {
  if (step < 0) return [];
  if (step === 0) return source.slice(0, 1).map((e, i) => ({ ...e, id: i }));
  if (step === 1) return source.slice(0, 2).map((e, i) => ({ ...e, id: i }));
  const first3 = source.slice(0, 3).map((e, i) => ({ ...e, id: i }));
  if (scenario === "lowConfidence") {
    return [...first3, { ...lowConfidenceEvent, id: 3 }];
  }
  if (step >= 3) return source.slice(0, 6).map((e, i) => ({ ...e, id: i }));
  return first3;
}

// Graphit frame tokens: Leinen text (11.8:1), control edge (3.5:1) and a
// decorative hairline, as in .dark-section.
const DARK_MUTED = "rgba(243,240,233,0.72)";
const DARK_EDGE = "rgba(243,240,233,0.4)";
const DARK_HAIRLINE = "rgba(243,240,233,0.16)";
// Paper text on the Mennige node: 5.40:1 (#edded4 at 0.9 alpha was 4.4:1).
const ON_MENNIGE = "#f9f7f2";

function StatusPill({ status }: { status: NodeStatus }) {
  const map: Record<NodeStatus, { label: string; color: string; bg: string }> =
    {
      // No pastel pill: a word in the node's own ink. "OK" carries the
      // pass tick, so the state never rests on colour alone.
      pending: { label: "Wait", color: DEMO.schiefer, bg: "transparent" },
      active: { label: "Run", color: ON_MENNIGE, bg: "transparent" },
      done: { label: "✓ OK", color: "#205b46", bg: "transparent" },
    };
  const s = map[status];
  return (
    <span
      style={{
        ...DEMO.label,
        color: s.color,
        background: s.bg,
        padding: "1px 0 1px 5px",
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
  const lowConfidenceEvent =
    locale === "de" ? LOW_CONFIDENCE_EVENT : LOW_CONFIDENCE_EVENT_EN;
  const reduced = usePrefersReducedMotion();
  const { ref, visible } = useVisibleAutoplay<HTMLDivElement>();
  const [scenario, setScenario] = useState<Scenario>("delay");
  // Final state first: the finished run renders on load, and "Neu
  // abspielen" is the only way into a replay.
  const [activeStep, setActiveStep] = useState(3);
  const [autoPlaying, setAutoPlaying] = useState(false);

  // The low-confidence branch never reaches step 3 (the automated actions) —
  // it stops at step 2 and the log shows an escalation line instead.
  const maxStep = scenario === "lowConfidence" ? 2 : 3;
  const events = eventsForStep(activeStep, scenario, sourceEvents, lowConfidenceEvent);
  const totalEvents = scenario === "lowConfidence" ? 4 : sourceEvents.length;
  const allDone = activeStep >= maxStep;

  // Reduced motion: jump straight to the scenario's final state. Deliberately
  // NOT keyed on activeStep, so a manual Zurück/Weiter click after this fires
  // isn't immediately clobbered back to maxStep on the next render.
  useEffect(() => {
    if (!reduced) return;
    setActiveStep(maxStep);
    setAutoPlaying(false);
  }, [reduced, maxStep]);

  // Autoplay: advance one step at a time while visible, not reduced, and not
  // paused by a manual step-through click.
  useEffect(() => {
    if (reduced || !visible || !autoPlaying || activeStep >= maxStep) return;
    const timer = setTimeout(
      () => setActiveStep((s) => Math.min(s + 1, maxStep)),
      650,
    );
    return () => clearTimeout(timer);
  }, [reduced, visible, autoPlaying, activeStep, maxStep]);

  const handleBack = () => {
    setAutoPlaying(false);
    setActiveStep((s) => Math.max(s - 1, 0));
  };
  const handleNext = () => {
    setAutoPlaying(false);
    setActiveStep((s) => Math.min(s + 1, maxStep));
  };
  const handleReplay = () => {
    setAutoPlaying(true);
    setActiveStep(-1);
  };
  // A new scenario opens on its own final state; replay stays separate.
  const handleScenario = (next: Scenario) => {
    setScenario(next);
    setAutoPlaying(false);
    setActiveStep(next === "lowConfidence" ? 2 : 3);
  };

  const stepLabel =
    activeStep < 0
      ? text(`Schritt - / ${maxStep + 1}`, `Step - / ${maxStep + 1}`)
      : text(
          `Schritt ${activeStep + 1} / ${maxStep + 1}`,
          `Step ${activeStep + 1} / ${maxStep + 1}`,
        );

  return (
    <div
      ref={ref}
      data-demo-id="n8n-supply-chain"
      role="region"
      aria-label={text(
        "Simulierter n8n-Lieferkettenablauf",
        "Simulated n8n supply-chain flow",
      )}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: DEMO.font.sans,
        color: DEMO.kalk,
        minHeight: DEMO_HEIGHT,
      }}
    >
      {/* The page H1 and lead name the demo; this heading only gives
          screen-reader users a landmark into the instrument. */}
      <h2 className="sr-only">
        {text("Lieferverzug im n8n-Workflow", "Delivery delay in the n8n workflow")}
      </h2>
      {/* Scope of the timeline, stated where it applies: the stamped
          seconds show the order of the six steps, not a performance figure.
          The shell's evidence line already says the run is simulated. */}
      <p className="text-caption text-muted-foreground" style={{ margin: 0, maxWidth: 720 }}>
        {text(
          "Die Sekundenangaben sind Beispielwerte und zeigen nur die Reihenfolge der sechs Schritte.",
          "The timestamps are sample values and only show the order of the six steps.",
        )}
      </p>

      <div
        className="demo-n8n-controls"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            ...DEMO.label,
            color: DARK_MUTED,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>{stepLabel}</span>
          <button
            type="button"
            onClick={handleBack}
            disabled={activeStep <= 0}
            style={{
              minHeight: 44,
              minWidth: 44,
              padding: "0 12px",
              background: "transparent",
              color: activeStep <= 0 ? "rgba(243,240,233,0.45)" : DEMO.kalk,
              border: `1px solid ${activeStep <= 0 ? DARK_HAIRLINE : DARK_EDGE}`,
              cursor: activeStep <= 0 ? "not-allowed" : "pointer",
              ...DEMO.label,
            }}
          >
            {text("◀ Zurück", "◀ Back")}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={activeStep >= maxStep}
            style={{
              minHeight: 44,
              minWidth: 44,
              padding: "0 12px",
              background: "transparent",
              color: activeStep >= maxStep ? "rgba(243,240,233,0.45)" : DEMO.kalk,
              border: `1px solid ${activeStep >= maxStep ? DARK_HAIRLINE : DARK_EDGE}`,
              cursor: activeStep >= maxStep ? "not-allowed" : "pointer",
              ...DEMO.label,
            }}
          >
            {text("Weiter ▶", "Next ▶")}
          </button>
          <button
            type="button"
            onClick={handleReplay}
            style={{
              minHeight: 44,
              minWidth: 44,
              padding: "0 12px",
              background: "transparent",
              color: DEMO.kalk,
              border: `1px solid ${DARK_EDGE}`,
              cursor: "pointer",
              ...DEMO.label,
            }}
          >
            {text("↻ Neu abspielen", "↻ Replay")}
          </button>
        </div>

        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
          role="group"
          aria-label={text("Szenario wählen", "Choose scenario")}
        >
          {(
            [
              ["delay", text("Verzug erkannt", "Delay detected")],
              ["lowConfidence", text("Konfidenz niedrig", "Low confidence")],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleScenario(key)}
              aria-pressed={scenario === key}
              style={{
                minHeight: 44,
                padding: "0 12px",
                // Selected = filled (paper on graphit), like the site's
                // filter chips; the Mennige mark stays on the current node.
                background: scenario === key ? DEMO.kalk : "transparent",
                color: scenario === key ? "#141414" : DEMO.kalk,
                border: `1px solid ${scenario === key ? DEMO.kalk : DARK_EDGE}`,
                cursor: "pointer",
                ...DEMO.label,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow canvas: horizontal on >=640px, stacked on mobile */}
      <div
        className="demo-n8n-grid"
        style={{
          border: `1px solid ${DARK_HAIRLINE}`,
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {columns.map((col, ci) => (
          <div
            key={col.label}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  ...DEMO.label,
                  color: DARK_MUTED,
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
                      // Constant Mennige: inside the dark frame the accent token
                      // flips to #e07050, where paper text drops to 2.8:1.
                      background: isCurrent
                        ? "var(--color-mennige)"
                        : DEMO.kalk,
                      color: isCurrent ? ON_MENNIGE : DEMO.ink,
                      // Pending nodes are drawn dashed (not yet run), run
                      // nodes solid; no coloured left rule.
                      border: `1px ${isActive ? "solid" : "dashed"} ${isCurrent ? "var(--color-mennige)" : DEMO.ink}`,
                      padding: "9px 10px",
                      transition: reduced
                        ? "none"
                        : "background-color 200ms ease-out, color 200ms ease-out, border-color 200ms ease-out",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          background: DEMO.ink,
                          color: DEMO.kalk,
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
                            fontSize: 13,
                            fontWeight: 700,
                            lineHeight: 1.25,
                            wordBreak: "break-word",
                          }}
                        >
                          {n.t}
                        </div>
                        <div
                          style={{
                            ...DEMO.label,
                            color: isCurrent ? ON_MENNIGE : DEMO.schiefer,
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
                        fontSize: 12,
                        color: isCurrent ? ON_MENNIGE : DEMO.schiefer,
                        marginTop: 5,
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
                  color: activeStep > ci ? DEMO.kalk : DARK_MUTED,
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
          fontSize: 12,
          lineHeight: 1.7,
          minHeight: 150,
          border: `1px solid ${DARK_HAIRLINE}`,
          borderTop: `2px solid ${DARK_EDGE}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${DARK_HAIRLINE}`,
            paddingBottom: 5,
            marginBottom: 7,
            fontSize: 12,
            color: DARK_MUTED,
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span>workflow-sc-042.log</span>
          <span style={{ ...DEMO.label, color: DARK_MUTED, fontVariantNumeric: "tabular-nums" }}>
            {events.length}/{totalEvents} {text("Ereignisse", "events")}
          </span>
        </div>
        {events.length === 0 && (
          <div style={{ color: DARK_MUTED }}>
            {text("Wartet auf das Webhook-Ereignis …", "Waiting for the webhook event …")}
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
                  : DARK_MUTED;
          return (
            <div
              key={e.id}
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "baseline",
              }}
            >
              <span style={{ color: DARK_MUTED, flexShrink: 0 }}>
                {e.t}
              </span>
              <span style={{ color: c, flexShrink: 0 }}>
                [{e.lvl.toUpperCase().padEnd(4)}]
              </span>
              <span style={{ color: DEMO.kalk, fontWeight: 700, flexShrink: 0 }}>
                {e.src}
              </span>
              <span
                style={{
                  color: "rgba(243,240,233,0.9)",
                  minWidth: 0,
                  wordBreak: "break-word",
                }}
              >
                {e.msg}
              </span>
            </div>
          );
        })}
        {allDone && scenario === "delay" && (
          <div
            style={{
              marginTop: 6,
              color: DEMO.statusGreen,
            }}
          >
            {text(
              "✓ Workflow-Simulation abgeschlossen · Beispiel-Laufzeit 4,02 s",
              "✓ Workflow simulation complete · sample runtime 4.02 s",
            )}
          </div>
        )}
        {allDone && scenario === "lowConfidence" && (
          <div
            style={{
              marginTop: 6,
              color: DEMO.statusAmber,
            }}
          >
            {text(
              "⚠ Automatisierter Pfad gestoppt · manuelle Prüfung erforderlich",
              "⚠ Automated path stopped · manual review required",
            )}
          </div>
        )}
      </div>

      {/* One figure only, labelled as a sample. The former tiles added
          invented usage numbers (runs per month, a manual baseline). */}
      <div
        className="demo-n8n-metrics"
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          borderTop: `1px solid ${DARK_HAIRLINE}`,
          borderBottom: `1px solid ${DARK_HAIRLINE}`,
          padding: "8px 0",
        }}
      >
        <span style={{ ...DEMO.label, color: DARK_MUTED }}>
          {text("Beispiel-Reaktionszeit", "Sample response time")}
        </span>
        <span
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 18,
            fontWeight: 700,
            color: DEMO.kalk,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          4 s
        </span>
      </div>

      {/* Failure mode beat: low-confidence branch */}
      <div
        style={{
          // Dashed = the path the run does not take by default.
          border: `1px dashed ${DARK_EDGE}`,
          padding: "10px 14px",
        }}
      >
        <div
          style={{
            ...DEMO.label,
            color: DEMO.kalk,
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
            fontSize: 12,
            lineHeight: 1.5,
            flexWrap: "wrap",
          }}
        >
          {[
            {
              label: "Trigger",
              color: DEMO.kalk,
              sub: text("Verspätung unklar", "Delay unclear"),
            },
            { label: "→", color: DARK_MUTED, sub: "" },
            {
              label: text("IF: Konfidenz niedrig", "IF: low confidence"),
              color: DEMO.kalk,
              sub: text("Score < Schwellenwert", "Score below threshold"),
            },
            { label: "→", color: DARK_MUTED, sub: "" },
            {
              label: text(
                "Manuelle Prüfung erforderlich",
                "Manual review required",
              ),
              color: DEMO.kalk,
              sub: text("Disposition entscheidet", "Dispatcher decides"),
            },
          ].map((n, i) =>
            n.label === "→" ? (
              <span
                key={i}
                style={{ color: n.color, fontSize: 14, fontWeight: 700 }}
              >
                &rarr;
              </span>
            ) : (
              <div
                key={i}
                style={{
                  padding: "5px 10px",
                  border: `1px solid ${DARK_EDGE}`,
                  fontSize: 13,
                  color: n.color,
                  fontWeight: 700,
                }}
              >
                <div>{n.label}</div>
                {n.sub && (
                  <div
                    style={{
                      color: "rgba(243,240,233,0.78)",
                      fontWeight: 400,
                      marginTop: 2,
                      fontSize: 12,
                    }}
                  >
                    {n.sub}
                  </div>
                )}
              </div>
            ),
          )}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: DARK_MUTED,
            lineHeight: 1.5,
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
      `}</style>
    </div>
  );
}
