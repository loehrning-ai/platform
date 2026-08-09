"use client";

import { useState } from "react";
import type { DemoEvidenceMode, DemoExternalActionMode } from "@/lib/demos";
import type { Locale } from "@/lib/i18n/locale";
import { DEMO_ACTION_LABELS, DEMO_EVIDENCE_COPY } from "@/lib/demos-ui-copy";
import { useDemoLocale } from "./demo-locale";

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
    color: "#9a3412",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.4)",
    icon: "◆",
    tooltip:
      "Dieses Praxisbeispiel verwendet vollständig erfundene Beispieldaten. Kein echter Nutzer, kein echtes Unternehmen, keine echte KI-Inferenz laufen im Hintergrund. Die Zahlen zeigen, wie ein Ergebnis aussehen könnte, nicht was ein System tatsächlich gemessen hat.",
  },
  rule_based: {
    label: "Regelbasiert",
    color: "#1d4ed8",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.4)",
    icon: "◎",
    tooltip:
      "Dieses Praxisbeispiel läuft vollständig mit festen If-Else-Regeln im Browser. Kein KI-Modell und keine externe API werden aufgerufen. Das zeigt dir, wie regelbasierte Systeme funktionieren und wo ihre Grenzen liegen.",
  },
  recorded_trace: {
    label: "Aufgezeichnete Spur",
    color: "#4b5563",
    bg: "rgba(107,114,128,0.08)",
    border: "rgba(107,114,128,0.4)",
    icon: "▶",
    tooltip:
      "Dieses Praxisbeispiel spielt eine aufgezeichnete Beispielspur ab. Du siehst die Wiederholung einer aufgezeichneten Beispielspur, keine Live-Ausführung. So kannst du den Ablauf in Ruhe studieren, ohne auf echte Systeme zuzugreifen.",
  },
  live_api: {
    label: "Live-API",
    color: "#166534",
    bg: "rgba(22,163,74,0.08)",
    border: "rgba(22,163,74,0.4)",
    icon: "●",
    tooltip:
      "Dieses Praxisbeispiel sendet tatsächliche Anfragen an eine KI-API. Ergebnisse variieren bei jeder Ausführung. Kosten entstehen pro Anfrage. Keine persönlichen Daten eingeben.",
  },
};

/** Renders a coloured mode badge at the TOP of a demo interactive panel. */
export function EvidenceBadge({
  evidenceMode,
  externalActionMode,
  locale = "de",
}: {
  evidenceMode: DemoEvidenceMode;
  externalActionMode: DemoExternalActionMode;
  locale?: Locale;
}) {
  const [open, setOpen] = useState(false);
  const cfg = EVIDENCE_CONFIG[evidenceMode];
  const evidenceCopy = DEMO_EVIDENCE_COPY[locale][evidenceMode];
  const actionLabel = DEMO_ACTION_LABELS[locale][externalActionMode];

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
          aria-label={
            locale === "de"
              ? `Evidenzmodus: ${evidenceCopy.label}. Details einblenden.`
              : `Evidence mode: ${evidenceCopy.label}. Show details.`
          }
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
          {evidenceCopy.label}
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
              color: "#4b5563",
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
          {locale === "de" ? "SIMULIERT" : "SIMULATED"}
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
            color: "#f3f0e9",
            background: "#0b0908",
            border: `1px solid ${cfg.border}`,
            maxWidth: 480,
          }}
        >
          {evidenceCopy.tooltip}
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
  const { locale } = useDemoLocale();
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
      aria-label={locale === "de" ? "Hinweis zur Simulation" : "Simulation notice"}
    >
      {children}
    </div>
  );
}
