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

// Light sheet tokens, never graphit: ink text, Schiefer for secondary text
// (8.08:1 on Kalkweiß, 7.2:1 on Beton), the Kante control edge (3.75:1) and
// the Leinen hairline for decoration. The log is a recessed Beton pane with
// ink type; a selected scenario takes the pastel Himmel-Blatt.
const INK = "var(--color-foreground)";
const MUTED = "var(--color-muted-foreground)";
const EDGE = "var(--color-border)";
const HAIRLINE = "var(--color-hairline)";
const LOG_GROUND = "var(--color-inset)";
const SELECTED = "var(--color-sky-sheet)";
// Log levels on Beton, AA as text: Befund grün, Rost-Gelb, Mennige tief.
const LOG_OK = "var(--color-pass)";
const LOG_WARN = "var(--color-risk-yellow)";
const LOG_ERR = "var(--color-destructive)";
// Paper text on the Mennige node: 5.40:1 (#edded4 at 0.9 alpha was 4.4:1).
const ON_MENNIGE = "#f9f7f2";

function StatusPill({
  status,
  settled = false,
}: {
  status: NodeStatus;
  /** A finished run: the node is paper, so "Run" takes the Mennige ink. */
  settled?: boolean;
}) {
  const map: Record<NodeStatus, { label: string; color: string; bg: string }> =
    {
      // No pastel pill: a word in the node's own ink. "OK" carries the
      // pass tick, so the state never rests on colour alone.
      pending: { label: "Wait", color: DEMO.schiefer, bg: "transparent" },
      active: { label: "Run", color: ON_MENNIGE, bg: "transparent" },
      done: { label: "✓ OK", color: DEMO.ink, bg: "transparent" },
    };
  const s =
    status === "active" && settled
      ? { ...map.active, color: "var(--color-mennige)" }
      : map[status];
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
  // Below sm the log folds to its last line behind "Protokoll".
  const [logOpen, setLogOpen] = useState(false);

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
      className="gap-3 sm:gap-3.5"
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: DEMO.font.sans,
        color: INK,
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
            color: MUTED,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {/* "Schritt 4 / 4" from sm up; below sm the count alone, so the
              step and the three icon buttons share one 44px row. */}
          <span>
            <span className="max-sm:hidden">
              {stepLabel.replace(/\s\S+ \/ \d+$/, " ")}
            </span>
            {stepLabel.replace(/^\S+\s/, "")}
          </span>
          <button
            type="button"
            onClick={handleBack}
            className="px-3 max-sm:px-0"
            disabled={activeStep <= 0}
            style={{
              minHeight: 44,
              minWidth: 44,
              background: "transparent",
              color: activeStep <= 0 ? MUTED : INK,
              border: `1px solid ${activeStep <= 0 ? HAIRLINE : EDGE}`,
              cursor: activeStep <= 0 ? "not-allowed" : "pointer",
              ...DEMO.label,
            }}
          >
            <span aria-hidden="true">◀</span>
            <span className="max-sm:sr-only">{text(" Zurück", " Back")}</span>
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-3 max-sm:px-0"
            disabled={activeStep >= maxStep}
            style={{
              minHeight: 44,
              minWidth: 44,
              background: "transparent",
              color: activeStep >= maxStep ? MUTED : INK,
              border: `1px solid ${activeStep >= maxStep ? HAIRLINE : EDGE}`,
              cursor: activeStep >= maxStep ? "not-allowed" : "pointer",
              ...DEMO.label,
            }}
          >
            <span className="max-sm:sr-only">{text("Weiter ", "Next ")}</span>
            <span aria-hidden="true">▶</span>
          </button>
          <button
            type="button"
            onClick={handleReplay}
            className="px-3 max-sm:px-0"
            style={{
              minHeight: 44,
              minWidth: 44,
              background: "transparent",
              color: INK,
              border: `1px solid ${EDGE}`,
              cursor: "pointer",
              ...DEMO.label,
            }}
          >
            <span aria-hidden="true">↻</span>
            <span className="max-sm:sr-only">{text(" Neu abspielen", " Replay")}</span>
          </button>
        </div>

        <div
          className="flex flex-wrap gap-1.5 max-sm:grid max-sm:w-full max-sm:grid-cols-2 max-sm:gap-0"
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
                // Selected = the pastel sheet with an ink edge and a 3px ink
                // foot, like the site's filter chips; never a black fill. The
                // Mennige mark stays on the current node.
                background: scenario === key ? SELECTED : "transparent",
                color: INK,
                border: `1px solid ${scenario === key ? INK : EDGE}`,
                borderBottomWidth: scenario === key ? 3 : 1,
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
          border: `1px solid ${HAIRLINE}`,
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
              className="gap-1.5 sm:gap-2"
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  ...DEMO.label,
                  color: MUTED,
                }}
              >
                {col.label}
              </div>
              {col.nodes.map((n) => {
                const status = statusFor(n.step, activeStep);
                const isActive = status !== "pending";
                // A finished run draws its last step as run nodes (paper,
                // solid ink) with only "Run" in Mennige; the Mennige fill
                // marks the one step that is animating.
                const settled = allDone;
                const isCurrent = status === "active" && !settled;
                return (
                  <div
                    key={n.id}
                    className="px-2.5 py-[9px] max-sm:py-[7px]"
                    style={{
                      // Constant Mennige with paper text (5.40:1), unscoped, so
                      // a poster scene never swaps it.
                      background: isCurrent
                        ? "var(--color-mennige)"
                        : DEMO.kalk,
                      color: isCurrent ? ON_MENNIGE : DEMO.ink,
                      // Pending nodes are drawn dashed (not yet run), run
                      // nodes solid; no coloured left rule.
                      border: `1px ${isActive ? "solid" : "dashed"} ${isCurrent ? "var(--color-mennige)" : DEMO.ink}`,

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
                          // A pastel icon tile with an ink edge, never a
                          // black square.
                          background: SELECTED,
                          color: INK,
                          border: `1px solid ${INK}`,
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
                        {/* Below sm the node kind leads the note line, so a
                            node is two lines instead of three. */}
                        <div
                          className="max-sm:hidden"
                          style={{
                            ...DEMO.label,
                            color: isCurrent ? ON_MENNIGE : DEMO.schiefer,
                            marginTop: 1,
                          }}
                        >
                          {n.k}
                        </div>
                      </div>
                      <StatusPill status={status} settled={settled} />
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
                      <span className="sm:hidden">{n.k} · </span>
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
                  color: activeStep > ci ? INK : MUTED,
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

      {/* Terminal-style log. Below sm it folds to its last line behind a
          44px "Protokoll · 6 Ereignisse" button; the nodes above already
          show each step. From sm up it reads in full, as before. */}
      <div
        className="sm:min-h-[150px]"
        data-n8n-log
        style={{
          background: LOG_GROUND,
          color: INK,
          padding: "10px 14px 12px",
          fontFamily: DEMO.font.mono,
          fontSize: 12,
          lineHeight: 1.7,
          border: `1px solid ${HAIRLINE}`,
          borderTop: `2px solid ${INK}`,
        }}
      >
        <button
          type="button"
          onClick={() => setLogOpen((open) => !open)}
          aria-expanded={logOpen}
          className="-mt-2.5 flex min-h-11 w-full items-center justify-between gap-2 text-left sm:hidden"
          style={{
            ...DEMO.label,
            background: "transparent",
            border: 0,
            padding: 0,
            color: INK,
            cursor: "pointer",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {text("Protokoll", "Log")} · {events.length}{" "}
          {text("Ereignisse", "events")}
          <span aria-hidden="true" style={{ fontSize: 16 }}>
            {logOpen ? "−" : "+"}
          </span>
        </button>
        <div
          className="flex max-sm:hidden"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${EDGE}`,
            paddingBottom: 5,
            marginBottom: 7,
            fontSize: 12,
            color: MUTED,
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span>workflow-sc-042.log</span>
          <span style={{ ...DEMO.label, color: MUTED, fontVariantNumeric: "tabular-nums" }}>
            {events.length}/{totalEvents} {text("Ereignisse", "events")}
          </span>
        </div>
        {events.length === 0 && (
          <div className={logOpen ? undefined : "max-sm:hidden"} style={{ color: MUTED }}>
            {text("Wartet auf das Webhook-Ereignis …", "Waiting for the webhook event …")}
          </div>
        )}
        {events.map((e) => {
          const c =
            e.lvl === "warn"
              ? LOG_WARN
              : e.lvl === "err"
                ? LOG_ERR
                : e.lvl === "ok"
                  ? LOG_OK
                  : MUTED;
          return (
            <div
              key={e.id}
              className={
                logOpen || (!allDone && e.id === events.length - 1)
                  ? "flex"
                  : "flex max-sm:hidden"
              }
              style={{
                gap: 8,
                flexWrap: "wrap",
                alignItems: "baseline",
              }}
            >
              <span style={{ color: MUTED, flexShrink: 0 }}>
                {e.t}
              </span>
              <span style={{ color: c, flexShrink: 0 }}>
                [{e.lvl.toUpperCase().padEnd(4)}]
              </span>
              <span style={{ color: INK, fontWeight: 700, flexShrink: 0 }}>
                {e.src}
              </span>
              <span
                style={{
                  color: INK,
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
              color: LOG_OK,
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
              color: LOG_WARN,
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
          borderTop: `1px solid ${HAIRLINE}`,
          borderBottom: `1px solid ${HAIRLINE}`,
          padding: "8px 0",
        }}
      >
        <span style={{ ...DEMO.label, color: MUTED }}>
          {text("Beispiel-Reaktionszeit", "Sample response time")}
        </span>
        <span
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 18,
            fontWeight: 700,
            color: INK,
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
          border: `1px dashed ${EDGE}`,
          padding: "10px 14px",
        }}
      >
        <div
          style={{
            ...DEMO.label,
            color: INK,
            marginBottom: 6,
          }}
        >
          {text(
            "Alternativer Pfad: Konfidenz niedrig → Mensch übernimmt",
            "Alternate path: low confidence → human review",
          )}
        </div>
        {/* The chain is what the "Konfidenz niedrig" scenario above already
            draws, so below sm only the heading and the sentence stay. */}
        <div
          className="flex max-sm:hidden"
          style={{
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
              color: INK,
              sub: text("Verspätung unklar", "Delay unclear"),
            },
            { label: "→", color: MUTED, sub: "" },
            {
              label: text("IF: Konfidenz niedrig", "IF: low confidence"),
              color: INK,
              sub: text("Score < Schwellenwert", "Score below threshold"),
            },
            { label: "→", color: MUTED, sub: "" },
            {
              label: text(
                "Manuelle Prüfung erforderlich",
                "Manual review required",
              ),
              color: INK,
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
                  border: `1px solid ${EDGE}`,
                  fontSize: 13,
                  color: n.color,
                  fontWeight: 700,
                }}
              >
                <div>{n.label}</div>
                {n.sub && (
                  <div
                    style={{
                      color: MUTED,
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
            color: MUTED,
            lineHeight: 1.5,
          }}
        >
          {text(
            "Wenn das Modell unsicher ist, stoppt der automatisierte Pfad. Ein Mensch prüft und entscheidet.",
            "When the model is uncertain, the automated path stops. A person reviews and decides.",
          )}
        </div>
      </div>

      {/* Below sm the canvas drops its own frame and inset: the shell sheet
          already frames it, so the nodes are the first box. */}
      <style>{`
        [data-demo-id="n8n-supply-chain"] .demo-n8n-arrow-h { display: none; }
        [data-demo-id="n8n-supply-chain"] .demo-n8n-arrow-v { display: inline; }
        @media (max-width: 639.98px) {
          [data-demo-id="n8n-supply-chain"] .demo-n8n-grid {
            border: 0 !important;
            padding: 0 !important;
            gap: 16px !important;
          }
          /* The stacked columns read top to bottom; a 16px gap replaces
             the down arrows. */
          [data-demo-id="n8n-supply-chain"] .demo-n8n-arrow { display: none !important; }
        }
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
