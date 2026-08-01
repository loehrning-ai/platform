"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { m, AnimatePresence } from "framer-motion";
import { DemoOverline } from "./_shared";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";

/**
 * WorkflowDemo — signal-based message pipeline.
 *
 * Renders a 7-node n8n-style flow as SVG with animated pulses on edges,
 * picks a dormant lead, streams a personalized outbound email through
 * 4 stages (signal → write → send + DB touch + tracking).
 *
 * Provenance: first-party loehrning.ai implementation by Tim Löhr.
 * Ported 2026-04-21. See AI-native demo gallery implementation.
 */

interface Node {
  readonly id: string;
  readonly title: string;
  readonly kind: string;
  readonly col: 0 | 1 | 2 | 3;
  readonly row: 0 | 1 | 2;
  readonly icon: string;
  readonly note: string;
}

const NODES: readonly Node[] = [
  {
    id: "db",
    title: "Postgres · leads_db",
    kind: "Quelle",
    col: 0,
    row: 1,
    icon: "▦",
    note: "> 180 Tage kalt",
  },
  {
    id: "signal",
    title: "Signal-Scan",
    kind: "Firmograph",
    col: 1,
    row: 0,
    icon: "◎",
    note: "LinkedIn · News · CB",
  },
  {
    id: "score",
    title: "Intent-Score",
    kind: "Claude Haiku",
    col: 1,
    row: 2,
    icon: "◈",
    note: "0–100 Priorität",
  },
  {
    id: "write",
    title: "Text-Generierung",
    kind: "Claude Sonnet",
    col: 2,
    row: 1,
    icon: "✎",
    note: "Referenziert Signal",
  },
  {
    id: "send",
    title: "E-Mail-Entwurf",
    kind: "Review",
    col: 3,
    row: 0,
    icon: "✉",
    note: "kein Versand",
  },
  {
    id: "log",
    title: "DB-Rückschreibung",
    kind: "Postgres",
    col: 3,
    row: 1,
    icon: "⟲",
    note: "touched_at = NOW()",
  },
  {
    id: "track",
    title: "Review-Tracking",
    kind: "Warehouse",
    col: 3,
    row: 2,
    icon: "≡",
    note: "Quellen · Freigaben",
  },
];

const EDGES: readonly [string, string][] = [
  ["db", "signal"],
  ["db", "score"],
  ["signal", "write"],
  ["score", "write"],
  ["write", "send"],
  ["write", "log"],
  ["write", "track"],
];

interface Lead {
  readonly name: string;
  readonly role: string;
  readonly company: string;
  readonly lastContact: string;
  readonly signal: string;
  readonly score: number;
  readonly email: string;
  readonly subjectHint: string;
}

const LEADS: readonly Lead[] = [
  {
    name: "Fiktivkontakt Alpha",
    role: "Head of Ops",
    company: "Fiktivwerk Alpha (rein fiktiv)",
    lastContact: "412 Tage",
    signal: "Fiktives Wachstumssignal · ungeprüft",
    score: 87,
    subjectHint: "Alpha",
    email: `Guten Tag,

dies ist ein ausdrücklich fiktiver Entwurf. Im Beispiel bestand früher Kontakt zur Auftragsabwicklung.

Ein unbestätigtes Wachstumssignal wäre vor einer Ansprache gegen eine zulässige Quelle und die Kontaktgrundlage zu prüfen. Ein möglicher Pilot müsste Zeit, Fehler und Nacharbeit messen, statt einen ROI zu versprechen.

Kein Versand ohne Rechts- und Quellenprüfung.`,
  },
  {
    name: "Fiktivkontakt Beta",
    role: "Geschäftsführung",
    company: "Fiktivwerk Beta (rein fiktiv)",
    lastContact: "228 Tage",
    signal: "Fiktives Modernisierungssignal · ungeprüft",
    score: 74,
    subjectHint: "Beta",
    email: `Guten Tag,

dies ist ein ausdrücklich fiktiver Entwurf. Im Beispiel bestand früher Kontakt zum Kundendienst.

Ein Modernisierungssignal sagt nichts Verlässliches über Ticketvolumen oder Bedarf aus. Diese Punkte müssen vor einer Ansprache belegt werden.

Ein sinnvoller erster Schritt: Ticketarten clustern, Standardantworten prüfen, Eskalation definieren und erst danach automatisieren.`,
  },
  {
    name: "Fiktivkontakt Gamma",
    role: "CTO",
    company: "Fiktivwerk Gamma (rein fiktiv)",
    lastContact: "591 Tage",
    signal: "Fiktives Fördersignal · ungeprüft",
    score: 91,
    subjectHint: "Gamma",
    email: `Guten Tag,

dies ist ein ausdrücklich fiktiver Entwurf zu Predictive Maintenance.

Ein angebliches Fördersignal muss anhand einer offiziellen Quelle geprüft werden und schafft weder Bedarf noch Kontaktberechtigung.

Prüfen Sie zuerst Sensorabdeckung, Ausfallhistorie und Verantwortlichkeiten, bevor ein Modell gebaut wird.`,
  },
];

type Stage = 0 | 1 | 2 | 3 | 4;

const VB = {
  w: 920,
  h: 340,
  cols: [88, 358, 618, 822] as const,
  rows: [44, 138, 232] as const,
  nodeW: 156,
  nodeH: 80,
};

function posOf(n: Node): { x: number; y: number } {
  return { x: VB.cols[n.col] - VB.nodeW / 2, y: VB.rows[n.row] };
}

function pickSubject(hint: string): string {
  if (hint === "Alpha") return "Fiktiver Entwurf · Signal Alpha prüfen";
  if (hint === "Beta") return "Fiktiver Entwurf · Signal Beta prüfen";
  return "Fiktiver Entwurf · Signal Gamma prüfen";
}

function pickEmailAddress(lead: Lead): string {
  const local = lead.name
    .toLowerCase()
    .replace(/dr\.\s*/g, "")
    .replace(/ß/g, "ss")
    .replace(/[äöüé]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", é: "e" })[c] ?? c)
    .replace(/\s+/g, ".")
    .replace(/\.+/g, ".");
  const domain = lead.company.toLowerCase().replace(/[^a-z]/g, "");
  return `${local}@${domain}.example`;
}

export function WorkflowDemo(): JSX.Element {
  const [running, setRunning] = useState(false);
  const [pulseEdges, setPulseEdges] = useState<Set<string>>(new Set());
  const [pickedIdx, setPickedIdx] = useState(-1);
  const [stage, setStage] = useState<Stage>(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextIdx = useRef(0);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  function run() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunning(true);
    setPulseEdges(new Set());
    // Deterministic cycle through leads (not Math.random — we want grading purity for tests).
    const idx = nextIdx.current % LEADS.length;
    nextIdx.current = idx + 1;
    setPickedIdx(idx);
    setStage(1);

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = reducedMotion ? 0.1 : 1;

    const chains: readonly (readonly string[])[] = [
      ["db", "signal", "write", "send"],
      ["db", "score", "write", "log"],
      ["db", "score", "write", "track"],
    ];

    chains.forEach((chain, ci) => {
      for (let i = 0; i < chain.length - 1; i++) {
        const edgeId = `${chain[i]}→${chain[i + 1]}`;
        timers.current.push(
          setTimeout(
            () =>
              setPulseEdges((prev) => {
                const next = new Set(prev);
                next.add(edgeId);
                return next;
              }),
            (ci * 350 + i * 550) * scale,
          ),
        );
      }
    });

    timers.current.push(setTimeout(() => setStage(2), 600 * scale));
    timers.current.push(setTimeout(() => setStage(3), 1800 * scale));
    timers.current.push(setTimeout(() => setStage(4), 3200 * scale));
    timers.current.push(
      setTimeout(() => {
        setRunning(false);
        setPulseEdges(new Set());
      }, 4500 * scale),
    );
  }

  const picked = pickedIdx >= 0 ? LEADS[pickedIdx] : null;

  return (
    <div
      className="flex flex-col gap-4 overflow-hidden"
      role="region"
      aria-label="Praxisbeispiel: signalbasierter Workflow"
    >
      <div>
        <DemoOverline>Signalbasierte Nachricht · Pipeline</DemoOverline>
        <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-foreground md:text-[26px]">
          Öffentliche Signale.{" "}
          <span className="text-brand-orange">
            Begründet schreiben. Vor Versand prüfen.
          </span>
        </h3>
        <p className="mt-1.5 max-w-[620px] text-[13px] leading-[1.55] text-muted-foreground">
          Der simulierte Flow bewertet öffentliche Signale, priorisiert nach
          Intent-Score und schreibt einen Entwurf mit Quellenbezug. Nicht
          generisch, sondern prüfbar: Warum diese Nachricht, welche Quelle,
          welche sensible Information muss raus?
        </p>
      </div>

      {/* Node graph */}
      <div
        className="relative w-full border border-border bg-card/60"
        style={{
          backgroundImage:
            "radial-gradient(rgba(11,9,8,0.06) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        <svg
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-auto w-full"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="wf-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 z" fill="var(--color-muted-foreground)" />
            </marker>
          </defs>
          {EDGES.map(([a, b]) => {
            const na = NODES.find((n) => n.id === a);
            const nb = NODES.find((n) => n.id === b);
            if (!na || !nb) return null;
            const pa = posOf(na);
            const pb = posOf(nb);
            const x1 = pa.x + VB.nodeW;
            const y1 = pa.y + VB.nodeH / 2;
            const x2 = pb.x;
            const y2 = pb.y + VB.nodeH / 2;
            const cx = (x1 + x2) / 2;
            const path = `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
            const edgeId = `${a}→${b}`;
            const pulsing = pulseEdges.has(edgeId);
            return (
              <g key={edgeId}>
                <path
                  d={path}
                  stroke={
                    pulsing
                      ? "var(--color-brand-orange)"
                      : "var(--color-muted-foreground)"
                  }
                  strokeWidth={pulsing ? 2 : 1}
                  fill="none"
                  markerEnd="url(#wf-arrow)"
                />
                {pulsing && (
                  <circle r="5" fill="var(--color-brand-orange)">
                    <animateMotion dur="0.9s" path={path} />
                  </circle>
                )}
              </g>
            );
          })}
          {NODES.map((n) => {
            const p = posOf(n);
            return (
              <g key={n.id} transform={`translate(${p.x}, ${p.y})`}>
                <rect
                  x="3"
                  y="3"
                  width={VB.nodeW}
                  height={VB.nodeH}
                  fill="var(--color-foreground)"
                />
                <rect
                  width={VB.nodeW}
                  height={VB.nodeH}
                  fill="var(--color-background)"
                  stroke="var(--color-foreground)"
                />
                <rect
                  width="3"
                  height={VB.nodeH}
                  fill="var(--color-brand-orange)"
                />
                <rect
                  x="14"
                  y="16"
                  width="28"
                  height="28"
                  fill="var(--color-foreground)"
                />
                <text
                  x="28"
                  y="36"
                  textAnchor="middle"
                  fontSize="18"
                  fill="var(--color-brand-orange)"
                  fontFamily="system-ui"
                  fontWeight="700"
                >
                  {n.icon}
                </text>
                <text
                  x="52"
                  y="28"
                  fontSize="12"
                  fontWeight="700"
                  fill="var(--color-foreground)"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {n.title}
                </text>
                <text
                  x="52"
                  y="42"
                  fontSize="8.5"
                  fontWeight="700"
                  fill="var(--color-muted-foreground)"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.1em" }}
                >
                  {n.kind.toUpperCase()}
                </text>
                <text
                  x="16"
                  y="66"
                  fontSize="8.5"
                  fill="var(--color-muted-foreground)"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.04em" }}
                >
                  {n.note}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className={cn(
            "border-2 border-foreground bg-brand-orange px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-[background-color,border-color,color,opacity,transform,box-shadow]",
            running
              ? "cursor-wait opacity-75"
              : "shadow-[4px_4px_0_0_var(--color-foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)]",
          )}
        >
          {running
            ? "◆ Pipeline läuft"
            : picked
              ? "↻ Nächsten Entwurf prüfen"
              : "▶ Beispielkontakt prüfen"}
        </button>
        <div className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
          {running
            ? `Stufe ${stage}/4 · ${pulseEdges.size}/9 Kanten aktiv`
            : picked
              ? "Gesendet. Nächster?"
              : "3 Beispielkontakte in Queue"}
        </div>
      </div>

      {/* Selected lead + email */}
      <AnimatePresence>
        {picked && (
          <m.div
            key={pickedIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,320px)_1fr]"
          >
            {/* Lead card */}
            <div className="flex flex-col gap-2.5 border border-foreground border-l-[3px] border-l-brand-orange bg-background p-4 shadow-[3px_3px_0_0_var(--color-foreground)]">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[9px] font-bold tracking-[0.18em] text-brand-orange">
                  ◆ LEAD · AUSGEWÄHLT
                </div>
                <div className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
                  #{String(pickedIdx + 412).padStart(4, "0")}
                </div>
              </div>
              <div>
                <div className="text-[16px] font-bold tracking-[-0.02em] text-foreground">
                  {picked.name}
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">
                  {picked.role} · {picked.company}
                </div>
              </div>
              <div className="mt-0.5 grid grid-cols-2 gap-2 font-mono text-[10px]">
                <div>
                  <div className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Letzter Kontakt
                  </div>
                  <div className="mt-0.5 font-bold text-foreground">
                    {picked.lastContact}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Intent-Score
                  </div>
                  <div className="mt-0.5 font-bold text-brand-orange text-[14px]">
                    {picked.score}
                    <span className="text-[10px] text-muted-foreground">
                      /100
                    </span>
                  </div>
                </div>
              </div>
              <div className="border border-dashed border-brand-orange bg-card/60 px-2.5 py-2">
                <div className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  Signal erkannt
                </div>
                <div className="mt-0.5 text-[12px] font-semibold text-foreground">
                  {picked.signal}
                </div>
              </div>
              <div className="flex gap-2 font-mono text-[9px] leading-[1.7] tracking-[0.08em]">
                {(
                  [
                    ["Signal", 2],
                    ["Text", 3],
                    ["Versand", 4],
                  ] as const
                ).map(([label, step]) => (
                  <div
                    key={label}
                    className={cn(
                      stage >= step
                        ? "text-brand-orange"
                        : "text-muted-foreground",
                    )}
                  >
                    {stage >= step ? "✓" : "○"} {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Generated email */}
            <div className="relative flex min-h-[280px] flex-col border border-foreground bg-white">
              <div className="flex items-center gap-2.5 bg-foreground px-3.5 py-2 font-mono text-[10px] font-bold tracking-[0.12em] text-background">
                <span className="text-brand-orange">✉ Entwurf</span>
                <span className="opacity-50">›</span>
                <span>an: {pickEmailAddress(picked)}</span>
                <span
                  className={cn(
                    "ml-auto",
                    stage >= 4 ? "text-risk-green" : "text-muted-foreground",
                  )}
                >
                  {stage >= 4
                    ? "● GESENDET 09:14"
                    : stage >= 3
                      ? "◆ DRAFT"
                      : "○ WARTE…"}
                </span>
              </div>
              <div
                className="relative flex-1 px-5 py-4 text-[12px] leading-[1.55] text-[#000]"
                style={{ fontFamily: "Georgia, serif" }}
              >
                <div className="mb-2.5 font-mono text-[11px] tracking-[0.08em] text-muted-foreground">
                  Betreff:{" "}
                  <span
                    className="font-bold text-[#000]"
                    style={{
                      letterSpacing: 0,
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    {pickSubject(picked.subjectHint)}
                  </span>
                </div>
                {stage < 3 ? (
                  <div className="flex items-center gap-2 py-10 font-mono text-[11px] text-muted-foreground">
                    <span
                      className="inline-block h-2 w-2 animate-pulse bg-brand-orange"
                      aria-hidden="true"
                    />
                    {stage === 1
                      ? "// Signal-Scan läuft…"
                      : "// Claude Sonnet generiert personalisierten Text…"}
                  </div>
                ) : (
                  <m.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                    className="whitespace-pre-wrap"
                  >
                    {picked.email}
                    <div className="mt-3.5 text-[11px] text-muted-foreground">
                      Tim Löhr · loehrning.ai
                    </div>
                  </m.div>
                )}
              </div>
              {stage >= 3 && (
                <div className="flex flex-wrap gap-3.5 border-t border-dashed border-border px-3.5 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                  <span>◆ 247 Tokens</span>
                  <span>◆ Sonnet 4.5</span>
                  <span>◆ 1,8 s</span>
                  <span>◆ Quelle geprüft</span>
                  <span className="ml-auto text-brand-orange">
                    {stage >= 4 ? "DB: touched_at = 2026-04-21" : ""}
                  </span>
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ["Quellenabdeckung", "100 %"],
          ["PII-Check", "aktiv"],
          ["Entwürfe", "3"],
          ["Review-Status", "offen"],
        ].map(([label, val]) => (
          <div
            key={label}
            className="border border-l-[3px] border-border border-l-brand-orange bg-background p-3"
          >
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

export default WorkflowDemo;
