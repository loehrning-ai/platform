"use client";

import { useState } from "react";
import type { DemoEvidenceMode, DemoExternalActionMode } from "@/lib/demos";

const EVIDENCE_CONFIG: Record<
  DemoEvidenceMode,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: string;
    tooltip: string;
  }
> = {
  synthetic: {
    label: "Synthetisch",
    color: "#ea580c",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.4)",
    icon: "◆",
    tooltip:
      "Dieses Praxisbeispiel verwendet vollständig erfundene Beispieldaten. Kein echter Nutzer, kein echtes Unternehmen, keine echte KI-Inferenz laufen im Hintergrund. Die Zahlen zeigen, wie ein Ergebnis aussehen könnte, nicht was ein System tatsächlich gemessen hat.",
  },
  rule_based: {
    label: "Regelbasiert",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.4)",
    icon: "◎",
    tooltip:
      "Dieses Praxisbeispiel läuft vollständig mit festen If-Else-Regeln im Browser. Kein KI-Modell und keine externe API werden aufgerufen. Das zeigt dir, wie regelbasierte Systeme funktionieren und wo ihre Grenzen liegen.",
  },
  recorded_trace: {
    label: "Aufgezeichnete Spur",
    color: "#6b7280",
    bg: "rgba(107,114,128,0.08)",
    border: "rgba(107,114,128,0.4)",
    icon: "▶",
    tooltip:
      "Dieses Praxisbeispiel spielt eine aufgezeichnete Beispielspur ab. Du siehst die Wiederholung einer aufgezeichneten Beispielspur, keine Live-Ausführung. So kannst du den Ablauf in Ruhe studieren, ohne auf echte Systeme zuzugreifen.",
  },
  live_api: {
    label: "Live-API",
    color: "#16a34a",
    bg: "rgba(22,163,74,0.08)",
    border: "rgba(22,163,74,0.4)",
    icon: "●",
    tooltip:
      "Dieses Praxisbeispiel sendet tatsächliche Anfragen an eine KI-API. Ergebnisse variieren bei jeder Ausführung. Kosten entstehen pro Anfrage. Keine persönlichen Daten eingeben.",
  },
};

const ACTION_LABELS: Record<DemoExternalActionMode, string | null> = {
  none: null,
  simulated: "Aktionen simuliert",
  review_gated: "Freigabe-Schritt simuliert",
  real_disabled: "Aktionen deaktiviert",
};

/** Renders a coloured mode badge at the TOP of a demo interactive panel. */
export function EvidenceBadge({
  evidenceMode,
  externalActionMode,
}: {
  evidenceMode: DemoEvidenceMode;
  externalActionMode: DemoExternalActionMode;
}) {
  const [open, setOpen] = useState(false);
  const cfg = EVIDENCE_CONFIG[evidenceMode];
  const actionLabel = ACTION_LABELS[externalActionMode];

  return (
    <div
      style={{
        marginBottom: 12,
        fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
      }}
    >
      {/* Badge row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={`Evidenzmodus: ${cfg.label}. Klicke für Details.`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: cfg.color,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <span aria-hidden="true">{cfg.icon}</span>
          {cfg.label}
          <span aria-hidden="true" style={{ opacity: 0.7, fontSize: 8 }}>
            {open ? "▲" : "▼"}
          </span>
        </button>

        {actionLabel && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#6b7280",
              background: "rgba(107,114,128,0.08)",
              border: "1px solid rgba(107,114,128,0.3)",
            }}
          >
            ◇ {actionLabel}
          </span>
        )}

        <span
          style={{
            padding: "3px 8px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#92400e",
            background: "rgba(146,64,14,0.08)",
            border: "1px solid rgba(146,64,14,0.3)",
          }}
        >
          SIMULIERT
        </span>
      </div>

      {/* Tooltip accordion */}
      {open && (
        <div
          role="tooltip"
          style={{
            marginTop: 6,
            padding: "10px 12px",
            fontSize: 11,
            lineHeight: 1.6,
            color: "#d1d5db",
            background: "rgba(0,0,0,0.25)",
            border: `1px solid ${cfg.border}`,
            maxWidth: 480,
          }}
        >
          {cfg.tooltip}
        </div>
      )}
    </div>
  );
}

/**
 * Inline simulation disclosure block — renders a one-sentence explanation
 * before any metric or interactive element, following the Ciechanowski
 * "before the claim, co-located with it" disclosure principle.
 */
export function SimulationDisclosure({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginBottom: 14,
        padding: "8px 12px",
        fontSize: 11,
        lineHeight: 1.5,
        color: "#9ca3af",
        background: "rgba(107,114,128,0.06)",
        borderLeft: "3px solid rgba(107,114,128,0.4)",
        fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
        letterSpacing: "0.02em",
      }}
      role="note"
      aria-label="Hinweis zur Simulation"
    >
      {children}
    </div>
  );
}
