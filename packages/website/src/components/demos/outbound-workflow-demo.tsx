"use client";

import { useEffect, useState } from "react";
import { DEMO } from "@/lib/demo-tokens";
import {
  DEMO_HEIGHT,
  usePrefersReducedMotion,
  useVisibleAutoplay,
} from "./demo-utils";
import { useDemoLocale } from "./demo-locale";

interface Lead {
  readonly name: string;
  readonly role: string;
  readonly company: string;
  readonly last: string;
  readonly signal: string;
  readonly score: number;
  readonly subject: string;
  readonly email: string;
  readonly address: string;
}

const LEADS: readonly Lead[] = [
  {
    name: "Fiktivkontakt Alpha",
    role: "Head of Ops",
    company: "Fiktivwerk Alpha (rein fiktiv)",
    last: "412 Tage",
    signal: "Wachstumsphase · 42 Mitarbeitende",
    score: 87,
    subject: "Jahresservice-Check: Auftragsabwicklung",
    email:
      "Hallo,\n\nvor 14 Monaten hatten wir kurz Kontakt wegen eurer Auftragsabwicklung. Ich möchte kurz nachfragen, ob das Thema Automatisierung inzwischen aktueller geworden ist.\n\nBei Unternehmen in eurer Größenordnung lohnt sich oft ein erster Blick auf Routineaufgaben wie Statusmeldungen oder Bestandsabfragen. Der nächste Schritt wäre ein 20-minütiges Gespräch, kein Angebot.\n\nBitte nur antworten, wenn das Thema passt.",
    address: "kontakt-alpha@fiktivwerk.example",
  },
  {
    name: "Fiktivkontakt Beta",
    role: "Geschäftsführung",
    company: "Fiktivwerk Beta (rein fiktiv)",
    last: "228 Tage",
    signal: "Modernisierung Kundendienst 2024",
    score: 74,
    subject: "Kundendienst-Entlastung: Kurze Rückfrage",
    email:
      "Guten Tag,\n\nbeim letzten Kontakt war das Thema KI-Unterstützung im Kundendienst noch verfrüht. Inzwischen gibt es einfachere Einstiegspunkte: Ticket-Clustering, Standardantwort-Vorschläge, manuelle Freigabe vor dem Versand.\n\nKein Projekt-Pitch, nur eine Frage: Ist das Thema für euch aktuell?",
    address: "kontakt-beta@fiktivwerk.example",
  },
  {
    name: "Fiktivkontakt Gamma",
    role: "CTO",
    company: "Fiktivwerk Gamma (rein fiktiv)",
    last: "591 Tage",
    signal: "Maschinenpark modernisiert 2024",
    score: 91,
    subject: "Predictive Maintenance: Stand nach Modernisierung?",
    email:
      "Guten Tag,\n\nvor einiger Zeit sprachen wir über Predictive Maintenance. Damals fehlte die Datengrundlage.\n\nNach einer Maschinenmodernisierung verbessert sich die Sensor-Abdeckung oft deutlich. Bevor man ein Modell baut, braucht es aber: Ausfallhistorie, definierte Verantwortlichkeiten und einen klaren Schwellenwert für Eskalation.\n\nHat sich euer Datenstand verändert?",
    address: "kontakt-gamma@fiktivwerk.example",
  },
];

export default function OutboundWorkflowDemo() {
  const { locale } = useDemoLocale();
  return locale === "en" ? (
    <OutboundWorkflowDemoEnglish />
  ) : (
    <OutboundWorkflowDemoGerman />
  );
}

function OutboundWorkflowDemoGerman() {
  const reduced = usePrefersReducedMotion();
  const { ref, visible } = useVisibleAutoplay<HTMLDivElement>();
  const [stage, setStage] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [showChecklist, setShowChecklist] = useState(false);
  const [leadIndex, setLeadIndex] = useState(0);
  const [minScore, setMinScore] = useState(70);

  useEffect(() => {
    if (reduced) {
      setStage(4);
      return;
    }
    if (!visible) {
      setStage(0);
      return;
    }
    setStage(0);
    const timers = [
      setTimeout(() => setStage(1), 400),
      setTimeout(() => setStage(2), 1100),
      setTimeout(() => setStage(3), 2000),
      setTimeout(() => setStage(4), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [visible, reduced]);

  const lead = LEADS[leadIndex];
  const email = lead.address;
  // The intent score was previously display-only. A real gate compares it
  // against a learner-adjustable threshold: the failure beat is what
  // happens when that threshold is set above every lead's score — a
  // pipeline that reaches "review complete" and sends nothing.
  const gated = lead.score < minScore;

  return (
    <div
      ref={ref}
      data-demo-id="outbound-workflow"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        width: "100%",
        minWidth: 0,
        minHeight: DEMO_HEIGHT,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
      }}
    >
      <style>{`
        @keyframes outbound-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.55); }
          50% { box-shadow: 0 0 0 6px rgba(249,115,22,0); }
        }
        @keyframes outbound-scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes outbound-caret {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        [data-demo-id="outbound-workflow"] [data-outbound-pipeline],
        [data-demo-id="outbound-workflow"] [data-outbound-body],
        [data-demo-id="outbound-workflow"] [data-outbound-body] > *,
        [data-demo-id="outbound-workflow"] [data-outbound-smtp],
        [data-demo-id="outbound-workflow"] [data-outbound-footer] {
          min-width: 0;
        }
        [data-demo-id="outbound-workflow"] [data-outbound-pipeline] > *,
        [data-demo-id="outbound-workflow"] [data-outbound-metrics] > * {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        @media (max-width: 640px) {
          [data-demo-id="outbound-workflow"] [data-outbound-pipeline] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          [data-demo-id="outbound-workflow"] [data-outbound-body] {
            grid-template-columns: 1fr !important;
          }
          [data-demo-id="outbound-workflow"] [data-outbound-metrics] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          [data-demo-id="outbound-workflow"] [data-outbound-smtp] {
            flex-wrap: wrap;
          }
          [data-demo-id="outbound-workflow"] [data-outbound-footer] {
            flex-wrap: wrap;
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
          Signalbasierte Nachricht · Pipeline
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            marginTop: 6,
          }}
        >
          Öffentliche Signale.{" "}
          <span style={{ color: "var(--color-brand-orange)" }}>
            Begründet schreiben. Vor Versand prüfen.
          </span>
        </h2>
      </div>

      {/* Pipeline stages */}
      <div
        data-outbound-pipeline
        style={{
          background: DEMO.birke,
          border: `1px solid ${DEMO.leinen}`,
          padding: "14px 14px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
        }}
      >
        {(
          [
            { label: "DB · Kontakte", sub: "Beispieldaten", s: 1 },
            { label: "Signal-Scan", sub: "LinkedIn · News · CB", s: 2 },
            {
              label: "Text-Generierung",
              sub: "Claude Sonnet · 247 Tokens",
              s: 3,
            },
            {
              label: "Versandfreigabe simuliert",
              sub: "DKIM · Freigabe-Schritt (simuliert) · kein Versand",
              s: 4,
            },
          ] as const
        ).map((n) => {
          const active = stage >= n.s;
          const current = stage === n.s;
          return (
            <div
              key={n.label}
              style={{
                background: current ? "var(--color-brand-orange)" : DEMO.kalk,
                color: current ? DEMO.kalk : DEMO.ink,
                borderTop: `1px solid ${active ? "var(--color-brand-orange)" : DEMO.leinen}`,
                borderRight: `1px solid ${active ? "var(--color-brand-orange)" : DEMO.leinen}`,
                borderBottom: `1px solid ${active ? "var(--color-brand-orange)" : DEMO.leinen}`,
                borderLeft: `3px solid var(--color-brand-orange)`,
                padding: "8px 10px",
                transition: reduced
                  ? "none"
                  : "background-color 200ms ease-out, color 200ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out, transform 200ms ease-out",
                transform: current ? "translate(-1px,-1px)" : "none",
                boxShadow: active
                  ? `3px 3px 0 0 var(--color-brand-orange)`
                  : "3px 3px 0 0 transparent",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {n.label}
              </div>
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  color: current ? "rgba(243,240,233,0.75)" : DEMO.schiefer,
                  marginTop: 3,
                  letterSpacing: "0.04em",
                }}
              >
                {n.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead + email */}
      <div
        data-outbound-body
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(240px, 300px) 1fr",
          gap: 14,
          minWidth: 0,
        }}
      >
        <div
          style={{
            background: DEMO.kalk,
            borderTop: `1px solid ${DEMO.ink}`,
            borderRight: `1px solid ${DEMO.ink}`,
            borderBottom: `1px solid ${DEMO.ink}`,
            borderLeft: `3px solid var(--color-brand-orange)`,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minWidth: 0,
            boxShadow: `3px 3px 0 0 ${DEMO.ink}`,
          }}
        >
          {/* Lead picker — switches which of the 3 fictional contacts is shown */}
          <div
            role="group"
            aria-label="Kontakt wählen"
            style={{ display: "flex", gap: 6 }}
          >
            {LEADS.map((l, i) => {
              const selected = i === leadIndex;
              return (
                <button
                  key={l.address}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setLeadIndex(i)}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    padding: "5px 8px",
                    border: `1px solid ${DEMO.ink}`,
                    background: selected ? DEMO.ink : DEMO.kalk,
                    color: selected ? DEMO.kalk : DEMO.ink,
                    fontFamily: DEMO.font.mono,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                  }}
                >
                  {l.name.split(" ").pop()}
                </button>
              );
            })}
          </div>

          {/* Fictional scenario banner */}
          <div
            style={{
              padding: "5px 10px",
              background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.4)",
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-brand-orange)",
            }}
          >
            FIKTIVES SZENARIO · BEISPIELDATEN
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: "var(--color-brand-orange)",
                letterSpacing: "0.18em",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  background: "var(--color-brand-orange)",
                  borderRadius: "50%",
                }}
              />
              LEAD #0412
            </div>
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: DEMO.schiefer,
                letterSpacing: "0.12em",
              }}
            >
              CRM · ROW {leadIndex + 1}/{LEADS.length}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingBottom: 10,
              borderBottom: `1px dashed ${DEMO.leinen}`,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                flexShrink: 0,
                background: DEMO.birke,
                border: `1px solid ${DEMO.ink}`,
                display: "grid",
                placeItems: "center",
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--color-brand-orange)",
                letterSpacing: "-0.02em",
              }}
            >
              {lead.name
                .replace(/Dr\.\s*/g, "")
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {lead.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: DEMO.schiefer,
                  marginTop: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {lead.role} · {lead.company}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              fontFamily: DEMO.font.mono,
            }}
          >
            <div>
              <div
                style={{
                  color: DEMO.schiefer,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                Last Contact
              </div>
              <div
                style={{
                  color: DEMO.ink,
                  marginTop: 3,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {lead.last}
              </div>
            </div>
            <div>
              <div
                style={{
                  color: DEMO.schiefer,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                Intent-Score
              </div>
              <div
                style={{
                  color: "var(--color-brand-orange)",
                  marginTop: 1,
                  fontWeight: 700,
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                {lead.score}
                <span
                  style={{
                    color: DEMO.schiefer,
                    fontSize: 12,
                    fontWeight: 400,
                  }}
                >
                  /100
                </span>
              </div>
            </div>
          </div>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontFamily: DEMO.font.mono,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span
                style={{
                  color: DEMO.schiefer,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                Score-Schwelle
              </span>
              <span
                style={{
                  color: gated
                    ? "var(--color-destructive)"
                    : "var(--color-brand-orange)",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {minScore}/100
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              aria-label="Minimale Score-Schwelle für den Versand"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={minScore}
              style={{
                minHeight: 44,
                width: "100%",
                accentColor: "var(--color-brand-orange)",
              }}
            />
          </label>
          <div
            style={{
              position: "relative",
              padding: "8px 10px",
              background: stage >= 2 ? "rgba(249,115,22,0.10)" : DEMO.birke,
              border: `1px ${stage >= 2 ? "solid" : "dashed"} var(--color-brand-orange)`,
              overflow: "hidden",
              transition: "background 300ms ease-out",
            }}
          >
            {stage === 1 && visible && !reduced && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.35) 50%, transparent 100%)",
                  animation: "outbound-scan 1.1s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
            )}
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: "var(--color-brand-orange)",
                letterSpacing: "0.14em",
                fontWeight: 700,
                textTransform: "uppercase",
                position: "relative",
              }}
            >
              {stage >= 2 ? "◆ Signal erkannt" : "○ Signal-Scan läuft"}
            </div>
            <div
              style={{
                fontSize: 12,
                color: DEMO.ink,
                marginTop: 3,
                fontWeight: 600,
                lineHeight: 1.35,
                position: "relative",
              }}
            >
              {lead.signal}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 2,
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              letterSpacing: "0.08em",
            }}
          >
            {(
              [
                { key: "signal", label: "Signal", at: 2 },
                { key: "text", label: "Text", at: 3 },
                { key: "versand", label: "Versand", at: 4 },
              ] as const
            ).map((s) => (
              <div
                key={s.key}
                style={{
                  color:
                    stage >= s.at ? "var(--color-brand-orange)" : DEMO.schiefer,
                  fontWeight: stage >= s.at ? 700 : 400,
                  transition: "color 200ms ease-out",
                }}
              >
                {stage >= s.at ? "✓" : "○"} {s.label}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "white",
            border: `1px solid ${DEMO.ink}`,
            display: "flex",
            flexDirection: "column",
            minHeight: 260,
            minWidth: 0,
            boxShadow: `3px 3px 0 0 ${DEMO.ink}`,
          }}
        >
          <div
            data-outbound-smtp
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 14px",
              background: DEMO.ink,
              color: DEMO.kalk,
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              letterSpacing: "0.12em",
              fontWeight: 700,
            }}
          >
            <span style={{ color: "var(--color-brand-orange)" }}>✉ Review</span>
            <span style={{ opacity: 0.5 }}>›</span>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
                flex: 1,
              }}
            >
              an: {email}
            </span>
            <span
              role={stage >= 4 && gated ? "alert" : undefined}
              style={{
                color:
                  stage >= 4 && gated
                    ? "var(--color-destructive)"
                    : stage >= 4
                      ? DEMO.statusGreen
                      : "rgba(243,240,233,0.55)",
                transition: "color 200ms ease-out",
                flexShrink: 0,
              }}
            >
              {stage >= 4
                ? gated
                  ? "⛔ Nicht gesendet: unter Score-Schwelle"
                  : "● Versand simuliert 09:14"
                : stage >= 3
                  ? "◆ DRAFT"
                  : "○ WARTE…"}
            </span>
          </div>
          <div
            style={{
              padding: "12px 16px 6px",
              borderBottom: `1px solid ${DEMO.leinen}`,
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              color: DEMO.schiefer,
              letterSpacing: "0.06em",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <div>
              Von:{" "}
              <span
                style={{ color: DEMO.ink, fontWeight: 700, letterSpacing: 0 }}
              >
                vertrieb@fiktivwerk.example
              </span>
            </div>
            <div
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              An:{" "}
              <span
                style={{ color: DEMO.ink, fontWeight: 700, letterSpacing: 0 }}
              >
                {email}
              </span>
            </div>
            <div
              style={{
                marginTop: 2,
                minWidth: 0,
                overflowWrap: "anywhere",
                whiteSpace: "normal",
              }}
            >
              Betreff:{" "}
              <span
                style={{
                  color: DEMO.ink,
                  fontWeight: 700,
                  fontFamily: "Georgia, serif",
                  letterSpacing: 0,
                  fontSize: 12,
                  overflowWrap: "anywhere",
                }}
              >
                {lead.subject}
              </span>
            </div>
          </div>
          <div
            style={{
              padding: "14px 18px 16px",
              fontSize: 12,
              color: "#222",
              lineHeight: 1.55,
              fontFamily: "Georgia, serif",
              flex: 1,
            }}
          >
            {stage < 3 ? (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "32px 0",
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  color: DEMO.schiefer,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    background: "var(--color-brand-orange)",
                    animation:
                      visible && !reduced
                        ? "outbound-pulse 1.2s ease-out infinite"
                        : "none",
                  }}
                />
                <span>
                  {stage === 1
                    ? "// Signal-Scan läuft"
                    : "// Claude Sonnet generiert"}
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 13,
                      marginLeft: 4,
                      background: "var(--color-brand-orange)",
                      verticalAlign: "-2px",
                      animation:
                        visible && !reduced
                          ? "outbound-caret 0.9s step-end infinite"
                          : "none",
                    }}
                  />
                </span>
              </div>
            ) : (
              <div style={{ whiteSpace: "pre-wrap" }}>
                {lead.email}
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 10,
                    borderTop: `1px solid ${DEMO.leinen}`,
                    fontSize: 12,
                    color: DEMO.schiefer,
                    fontFamily: "Georgia, serif",
                  }}
                >
                  Beste Grüße
                  <br />
                  <span style={{ color: "#222", fontWeight: 700 }}>
                    T. Muster
                  </span>{" "}
                  · Muster AG
                </div>
              </div>
            )}
          </div>
          {stage >= 3 && (
            <div
              data-outbound-footer
              style={{
                padding: "6px 14px",
                borderTop: `1px dashed ${DEMO.leinen}`,
                background: DEMO.birke,
                display: "flex",
                gap: 12,
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: DEMO.schiefer,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              <span>◆ 247 Tokens</span>
              <span>◆ Sonnet 4.6</span>
              <span>◆ 1,8 s</span>
              <span>◆ Quelle geprüft</span>
              {stage >= 4 && !gated && (
                <span
                  style={{
                    marginLeft: "auto",
                    color: "var(--color-brand-orange)",
                    fontWeight: 700,
                  }}
                >
                  touched_at = 2026-04-21 09:14:03
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        data-outbound-metrics
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 8,
        }}
      >
        {(
          [
            ["Quellencheck", "Beispiel vollständig"],
            ["PII-Check", "aktiv"],
            ["Entwürfe", "3"],
            ["Review-Status", "offen"],
          ] as const
        ).map(([l, v]) => (
          <div
            key={l}
            style={{
              background: DEMO.kalk,
              borderTop: `1px solid ${DEMO.leinen}`,
              borderRight: `1px solid ${DEMO.leinen}`,
              borderBottom: `1px solid ${DEMO.leinen}`,
              borderLeft: `3px solid var(--color-brand-orange)`,
              padding: 10,
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
                fontFamily: DEMO.font.mono,
                fontSize: 18,
                fontWeight: 700,
                color: DEMO.ink,
                marginTop: 3,
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>

      {/* Failure mode beat: was fehlt vor echtem Versand? */}
      {stage >= 4 && (
        <div
          style={{
            border: "1px solid rgba(249,115,22,0.25)",
            background: "rgba(249,115,22,0.04)",
            padding: "10px 14px",
          }}
        >
          <div
            style={{
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: "var(--color-brand-orange)",
              marginBottom: 6,
            }}
          >
            Was passiert, wenn...?
          </div>
          <button
            type="button"
            onClick={() => setShowChecklist((v) => !v)}
            aria-expanded={showChecklist}
            style={{
              minHeight: 44,
              background: "transparent",
              border: "1px solid rgba(249,115,22,0.4)",
              color: "var(--color-brand-orange)",
              padding: "5px 12px",
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {showChecklist
              ? "Verbergen"
              : "Was fehlt vor einem echten Versand?"}
          </button>
          {showChecklist && (
            <ul
              style={{
                marginTop: 10,
                listStyle: "none",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {[
                {
                  icon: "◻",
                  label:
                    "Rechtliche Grundlage: Einwilligung oder berechtigtes Interesse nachweisen (DSGVO Art. 6)",
                },
                {
                  icon: "◻",
                  label:
                    "Opt-out-Mechanismus: Abmeldelink in jeder E-Mail, sofortige Umsetzung",
                },
                {
                  icon: "◻",
                  label:
                    "Quellenprüfung: Woher stammt die Kontaktadresse? Wird sie aktuell gehalten?",
                },
                {
                  icon: "◻",
                  label:
                    "Menschliche Freigabe: Entwurf gelesen und bestätigt, bevor etwas verschickt wird",
                },
              ].map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: DEMO.ink,
                    padding: "6px 10px",
                    background: DEMO.birke,
                    border: `1px solid ${DEMO.leinen}`,
                  }}
                >
                  <span
                    style={{
                      color: "var(--color-brand-orange)",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

const LEADS_EN: readonly Lead[] = [
  {
    name: "Sample Contact Alpha",
    role: "Head of Operations",
    company: "Fictional Works Alpha (sample only)",
    last: "412 days",
    signal: "Fictional hiring signal · 42 employees",
    score: 87,
    subject: "Order handling: a specific follow-up",
    email:
      "Hello,\n\nwe last discussed order handling 14 months ago. The fictional public sample now shows a larger operations team.\n\nA useful first check would cover status updates and inventory requests. This is a draft for human review, not an offer and not a sent email.\n\nReply only if the topic is relevant.",
    address: "contact-alpha@fictional.example",
  },
  {
    name: "Sample Contact Beta",
    role: "Managing director",
    company: "Fictional Works Beta (sample only)",
    last: "228 days",
    signal: "Fictional support-system update",
    score: 74,
    subject: "Support workload: one follow-up question",
    email:
      "Hello,\n\nour last fictional exchange marked support automation as premature. A bounded review could now examine ticket grouping and suggested replies, with manual approval before delivery.\n\nThis sample creates a review draft only.",
    address: "contact-beta@fictional.example",
  },
  {
    name: "Sample Contact Gamma",
    role: "CTO",
    company: "Fictional Works Gamma (sample only)",
    last: "591 days",
    signal: "Fictional machinery upgrade in 2024",
    score: 91,
    subject: "Maintenance data after the equipment update",
    email:
      "Hello,\n\nour earlier fictional discussion stopped because the data was incomplete. After an equipment update, the next valid check is still the same: failure history, ownership, and an escalation threshold.\n\nHas the sample data position changed? No message is sent from this page.",
    address: "contact-gamma@fictional.example",
  },
];

function OutboundWorkflowDemoEnglish() {
  const [leadIndex, setLeadIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [minScore, setMinScore] = useState(70);
  const lead = LEADS_EN[leadIndex];
  // The sample score was previously display-only. A real gate compares it
  // against a learner-adjustable threshold: the failure beat is what
  // happens when the threshold is set above every lead's score.
  const gated = lead.score < minScore;

  return (
    <div
      data-demo-id="outbound-workflow"
      role="region"
      aria-label="Outbound review workflow example"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: DEMO_HEIGHT,
        minWidth: 0,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
      }}
    >
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
          Signal-based draft · review required
        </div>
        <h2
          style={{
            margin: "6px 0 0",
            fontSize: "clamp(20px, 4vw, 28px)",
            lineHeight: 1.08,
          }}
        >
          State the evidence.{" "}
          <span style={{ color: "var(--color-brand-orange)" }}>
            Stop before delivery.
          </span>
        </h2>
        <p
          style={{
            margin: "8px 0 0",
            maxWidth: 760,
            color: DEMO.schiefer,
            fontSize: 12,
            lineHeight: 1.55,
          }}
        >
          All people, companies, addresses, and signals below are fictional. The
          interface drafts locally and cannot send email.
        </p>
      </div>

      <div
        aria-label="Workflow stages"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
          gap: 8,
        }}
      >
        {[
          ["01", "Sample contact", "fictional CRM row"],
          ["02", "Evidence check", "public-source field"],
          ["03", "Draft", "fixed browser copy"],
          ["04", "Human review", "no delivery action"],
        ].map(([number, title, detail]) => (
          <div
            key={number}
            style={{
              minWidth: 0,
              border: `1px solid ${DEMO.leinen}`,
              borderTop: "3px solid var(--color-brand-orange)",
              background: DEMO.birke,
              padding: "10px 12px",
            }}
          >
            <span
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: DEMO.schiefer,
              }}
            >
              {number}
            </span>
            <strong
              style={{
                display: "block",
                marginTop: 3,
                overflowWrap: "anywhere",
              }}
            >
              {title}
            </strong>
            <span
              style={{
                display: "block",
                marginTop: 2,
                fontSize: 12,
                color: DEMO.schiefer,
              }}
            >
              {detail}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: 14,
        }}
      >
        <section
          aria-label="Fictional contacts"
          style={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {LEADS_EN.map((item, index) => {
            const selected = index === leadIndex;
            return (
              <button
                key={item.address}
                type="button"
                aria-pressed={selected}
                onClick={() => setLeadIndex(index)}
                style={{
                  minWidth: 0,
                  minHeight: 68,
                  padding: "10px 12px",
                  textAlign: "left",
                  border: `1px solid ${DEMO.ink}`,
                  background: selected ? DEMO.ink : DEMO.kalk,
                  color: selected ? DEMO.kalk : DEMO.ink,
                  boxShadow: selected
                    ? "3px 3px 0 var(--color-brand-orange)"
                    : "none",
                  cursor: "pointer",
                }}
              >
                <strong style={{ display: "block", overflowWrap: "anywhere" }}>
                  {item.name}
                </strong>
                <span
                  style={{
                    display: "block",
                    marginTop: 3,
                    fontSize: 12,
                    opacity: 0.72,
                    overflowWrap: "anywhere",
                  }}
                >
                  {item.role} · {item.company}
                </span>
              </button>
            );
          })}
          <div
            style={{
              border: `1px solid ${DEMO.leinen}`,
              background: DEMO.birke,
              padding: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                fontFamily: DEMO.font.mono,
                fontSize: 12,
              }}
            >
              <span>Last contact</span>
              <strong>{lead.last}</strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                marginTop: 6,
                fontFamily: DEMO.font.mono,
                fontSize: 12,
              }}
            >
              <span>Sample score</span>
              <strong style={{ color: "var(--color-brand-orange)" }}>
                {lead.score}/100
              </strong>
            </div>
            <div
              style={{
                marginTop: 10,
                borderLeft: "3px solid var(--color-brand-orange)",
                paddingLeft: 9,
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {lead.signal}
            </div>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginTop: 10,
                fontFamily: DEMO.font.mono,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    color: DEMO.schiefer,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  Score threshold
                </span>
                <span
                  style={{
                    color: gated
                      ? "var(--color-destructive)"
                      : "var(--color-brand-orange)",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {minScore}/100
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                aria-label="Minimum score threshold for outreach"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={minScore}
                style={{
                  minHeight: 44,
                  width: "100%",
                  accentColor: "var(--color-brand-orange)",
                }}
              />
            </label>
          </div>
        </section>

        <section
          aria-label="Draft email"
          style={{
            minWidth: 0,
            border: `1px solid ${DEMO.ink}`,
            background: "white",
            color: "#222",
            boxShadow: `3px 3px 0 ${DEMO.ink}`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              padding: "8px 12px",
              background: DEMO.ink,
              color: DEMO.kalk,
              fontFamily: DEMO.font.mono,
              fontSize: 12,
            }}
          >
            <strong style={{ color: "var(--color-brand-orange)" }}>
              REVIEW DRAFT
            </strong>
            <span style={{ overflowWrap: "anywhere" }}>to: {lead.address}</span>
            <span
              role={gated ? "alert" : undefined}
              style={{
                marginLeft: "auto",
                color: gated ? "#fca5a5" : "#fbbf24",
              }}
            >
              {gated ? "HOLD · BELOW THRESHOLD" : "QUALIFIED · NOT SENT"}
            </span>
          </div>
          <div
            style={{
              padding: "10px 14px",
              borderBottom: `1px solid ${DEMO.leinen}`,
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: DEMO.schiefer }}>Subject: </span>
            <strong>{lead.subject}</strong>
          </div>
          <div
            style={{
              minHeight: 260,
              padding: "16px 18px",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              fontFamily: "Georgia, serif",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            {lead.email}
          </div>
          <div
            style={{
              padding: "8px 14px",
              borderTop: `1px dashed ${DEMO.leinen}`,
              background: DEMO.birke,
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              color: DEMO.schiefer,
            }}
          >
            247 sample tokens · Sonnet 4.6 label · source status: unverified
            sample
          </div>
        </section>
      </div>

      <section
        style={{
          border: "1px solid rgba(249,115,22,0.35)",
          background: "rgba(249,115,22,0.05)",
          padding: "12px 14px",
        }}
      >
        <button
          type="button"
          aria-expanded={showControls}
          onClick={() => setShowControls((current) => !current)}
          style={{
            minHeight: 44,
            border: "1px solid var(--color-brand-orange)",
            background: "transparent",
            color: "var(--color-brand-orange)",
            padding: "7px 11px",
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          {showControls ? "Hide pre-send controls" : "Show pre-send controls"}
        </button>
        {showControls && (
          <ul
            style={{
              margin: "10px 0 0",
              paddingLeft: 20,
              display: "grid",
              gap: 7,
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            <li>Document the lawful basis and purpose limitation.</li>
            <li>Verify the contact source, address, and current relevance.</li>
            <li>Provide a working opt-out path before any real delivery.</li>
            <li>Require a named human reviewer to approve the final text.</li>
          </ul>
        )}
      </section>
    </div>
  );
}
