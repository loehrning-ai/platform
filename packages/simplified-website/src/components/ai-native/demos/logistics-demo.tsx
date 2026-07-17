"use client";

import { useEffect, useRef, useState, type JSX, Fragment } from "react";
import { m } from "framer-motion";
import { DemoOverline } from "./_shared";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";

/**
 * LogisticsDemo — Supply-chain delay → auto-triage via n8n-style flow.
 *
 * Provenance: first-party loehrning.ai implementation by Tim Löhr.
 * Ported 2026-04-21. See AI-native demo gallery implementation.
 */

interface Node {
  readonly id: string;
  readonly title: string;
  readonly kind: string;
  readonly icon: string;
  readonly note: string;
}

interface Column {
  readonly label: string;
  readonly nodes: readonly Node[];
}

const COLUMNS: readonly Column[] = [
  {
    label: "① Trigger",
    nodes: [
      {
        id: "trigger",
        title: "DHL / DB Schenker",
        kind: "Webhook",
        icon: "◎",
        note: "Sendung 42291-A · +31h Verzug",
      },
    ],
  },
  {
    label: "② Anreicherung + Logik",
    nodes: [
      {
        id: "enrich",
        title: "ERP-Bestand prüfen",
        kind: "HTTP",
        icon: "▦",
        note: "Lager: 14 Stk · 2 Tage Reichweite",
      },
      {
        id: "delay",
        title: "Verzug klassifizieren",
        kind: "IF-Node",
        icon: "△",
        note: "ETA > 24h → Alert-Pfad",
      },
      {
        id: "llm",
        title: "Claude Haiku · Brief",
        kind: "LLM",
        icon: "◈",
        note: "~200 Tokens · DE · Beispielwert",
      },
    ],
  },
  {
    label: "③ Aktionen",
    nodes: [
      {
        id: "mail",
        title: "Kunde informieren",
        kind: "E-Mail",
        icon: "✉",
        note: "einkauf@fiktivwerk.example",
      },
      {
        id: "slack",
        title: "Disposition pingen",
        kind: "Team-Notiz",
        icon: "◉",
        note: "#logistik-warn · @disposition",
      },
      {
        id: "erp",
        title: "Notfall-Bestellung",
        kind: "ERP",
        icon: "▦",
        note: "BANF 4500-8821 · 20 Stk",
      },
    ],
  },
];

interface LogEvent {
  readonly t: string;
  readonly source: string;
  readonly message: string;
  readonly level: "warn" | "info" | "ok";
}

const EVENTS: readonly LogEvent[] = [
  {
    t: "09:14:02",
    source: "Beispiel-Webhook",
    message: "Sendung 42291-A · Hamburg→Stuttgart · +31h verspätet",
    level: "warn",
  },
  {
    t: "09:14:03",
    source: "ERP · Bestand",
    message: "Lagerbestand SKU S-2200: 14 Stk · Reichweite 2 Tage",
    level: "info",
  },
  {
    t: "09:14:04",
    source: "Claude · Haiku",
    message: "Kunden-E-Mail als Entwurf generiert",
    level: "info",
  },
  {
    t: "09:14:05",
    source: "E-Mail-Entwurf",
    message: "Entwurf für einkauf@fiktivwerk.example erstellt",
    level: "ok",
  },
  {
    t: "09:14:05",
    source: "Team-Notiz",
    message: "#logistik-warn · Disposition markiert",
    level: "ok",
  },
  {
    t: "09:14:06",
    source: "ERP · Vorschlag",
    message: "Bestellanforderung 4500-8821 als Vorschlag erzeugt",
    level: "ok",
  },
];

const LEVEL_COLOR: Record<LogEvent["level"], string> = {
  warn: "text-brand-amber",
  info: "text-[var(--color-kupfer-light)]",
  ok: "text-[#22c55e]",
};

export function LogisticsDemo(): JSX.Element {
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [events, setEvents] = useState<LogEvent[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const refs = timers.current;
    return () => {
      refs.forEach(clearTimeout);
    };
  }, []);

  function run() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunning(true);
    setActiveStep(-1);
    setEvents([]);
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = reducedMotion ? 0.1 : 1;

    [0, 1, 2, 3, 4].forEach((step) => {
      timers.current.push(
        setTimeout(() => setActiveStep(step), step * 650 * scale),
      );
    });
    EVENTS.forEach((e, i) => {
      timers.current.push(
        setTimeout(
          () => setEvents((arr) => [...arr, e]),
          (400 + i * 500) * scale,
        ),
      );
    });
    timers.current.push(
      setTimeout(() => {
        setRunning(false);
        setActiveStep(-1);
      }, 5200 * scale),
    );
  }

  return (
    <div
      className="flex flex-col gap-4 overflow-hidden"
      role="region"
      aria-label="Praxisbeispiel: Logistik-Auto-Triage"
    >
      <div>
        <DemoOverline>n8n · Supply-Chain Automation</DemoOverline>
        <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-foreground md:text-[26px]">
          Lieferverzug erkannt.{" "}
          <span className="text-brand-orange">Review-Liste erstellt.</span>
        </h3>
        <p className="mt-1.5 max-w-[680px] text-[13px] leading-[1.55] text-muted-foreground">
          Simulierter n8n-Flow verbindet Logistiksignal, ERP-Bestand, KI-Entwurf
          und Team-Notiz. Keine E-Mail, Slack-Nachricht oder Bestellanpassung
          wird versendet.
        </p>
      </div>

      {/* Flow graph */}
      <div
        className="grid items-stretch gap-0 border border-border bg-card/60 p-4 md:p-5"
        style={{
          gridTemplateColumns:
            "minmax(0,1fr) auto minmax(0,1.15fr) auto minmax(0,1.15fr)",
          backgroundImage:
            "radial-gradient(rgba(11,9,8,0.06) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        {COLUMNS.map((col, ci) => (
          <Fragment key={ci}>
            <div className="flex min-w-0 flex-col gap-2.5">
              <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {col.label}
              </div>
              {col.nodes.map((n, ni) => {
                const stepIdx =
                  ci === 0 ? 0 : ci === 1 ? (ni === 2 ? 2 : 1) : 3 + ni * 0.01;
                const isActive = running && activeStep >= Math.floor(stepIdx);
                const isCurrent =
                  running && Math.floor(activeStep) === Math.floor(stepIdx);
                return (
                  <m.div
                    key={n.id}
                    animate={{
                      x: isCurrent ? -1 : 0,
                      y: isCurrent ? -1 : 0,
                    }}
                    transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                    className={cn(
                      "border border-l-[3px] border-l-brand-orange px-3 py-2.5 min-w-0",
                      isCurrent
                        ? "border-brand-orange bg-brand-orange text-white shadow-[3px_3px_0_0_var(--color-brand-orange)]"
                        : isActive
                          ? "border-brand-orange bg-background shadow-[3px_3px_0_0_var(--color-brand-orange)]"
                          : "border-foreground bg-background shadow-[3px_3px_0_0_var(--color-foreground)]",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center text-[15px]",
                          isCurrent
                            ? "bg-foreground text-brand-orange"
                            : "bg-foreground text-brand-orange",
                        )}
                      >
                        {n.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-bold tracking-[-0.02em]">
                          {n.title}
                        </div>
                        <div
                          className={cn(
                            "mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em]",
                            isCurrent
                              ? "text-white/70"
                              : "text-muted-foreground",
                          )}
                        >
                          {n.kind}
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "mt-1.5 font-mono text-[9px] leading-[1.4] tracking-[0.04em]",
                        isCurrent ? "text-white/85" : "text-muted-foreground",
                      )}
                    >
                      {n.note}
                    </div>
                  </m.div>
                );
              })}
            </div>
            {ci < COLUMNS.length - 1 && (
              <div className="relative flex flex-col items-center justify-center px-3.5">
                <div className="h-[60%] w-px bg-border" />
                <div
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 font-mono text-[18px] font-bold transition-colors",
                    running && activeStep > ci
                      ? "text-brand-orange"
                      : "text-muted-foreground",
                  )}
                  aria-hidden="true"
                >
                  →
                </div>
              </div>
            )}
          </Fragment>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className={cn(
            "border-2 border-foreground bg-brand-orange px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-[background-color,border-color,color,opacity,transform,box-shadow]",
            running
              ? "cursor-wait opacity-75"
              : "shadow-[4px_4px_0_0_var(--color-foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)]",
          )}
        >
          {running ? "◆ Läuft" : "▶ Verzug simulieren"}
        </button>
        <div className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
          {running
            ? "Webhook eingegangen…"
            : "Klicken → Beispielsignal mit 31h Verzug → Review-Pfad läuft"}
        </div>
      </div>

      {/* Simulated log */}
      <div className="min-h-[170px] border-l-[3px] border-brand-orange bg-[var(--color-dark-bg)] px-4 py-3.5 font-mono text-[11px] leading-[1.7] text-[var(--color-dark-fg)]">
        <div className="mb-2 flex items-center justify-between font-mono text-[9px] tracking-[0.14em] text-[var(--color-dark-muted)]">
          <span>› BEISPIEL-LOG · WORKFLOW SC-042</span>
          <span>{events.length}/6 Ereignisse</span>
        </div>
        {events.length === 0 && (
          <div className="text-[var(--color-dark-muted)]/80">
            // warte auf Beispiel-Event…
          </div>
        )}
        {events.map((e, i) => (
          <m.div
            key={`${e.t}-${i}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
          >
            <span className="text-[var(--color-dark-muted)]/50">{e.t} </span>
            <span className={cn("tracking-[0.08em]", LEVEL_COLOR[e.level])}>
              [{e.level.toUpperCase().padEnd(4)}]
            </span>
            <span className="text-brand-orange"> {e.source.padEnd(18)}</span>
            <span className="text-[var(--color-dark-fg)]/90"> {e.message}</span>
          </m.div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ["Reaktionszeit", "4 s"],
          ["Vorher (manuell)", "≈ 45 min"],
          ["Runs / Monat", "1.240"],
          ["Hosting", "Self-host"],
        ].map(([label, val]) => (
          <div key={label} className="border border-border bg-background p-3">
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {label}
            </div>
            <div className="mt-1 font-mono text-[18px] font-bold tracking-[-0.02em] text-foreground md:text-[20px]">
              {val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LogisticsDemo;
