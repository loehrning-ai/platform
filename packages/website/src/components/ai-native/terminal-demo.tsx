"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useInView } from "framer-motion";
import {
  SectionShell,
  ClipHeading,
  Eyebrow,
  FadeBlock,
} from "@/components/ai-native/primitives";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";

/* TerminalDemo — "Claude · drei Oberflächen".
 * Three animated surface mockups (Chat, Artifacts, Claude Code) with
 * their own reveal logic — restart on tab switch. */

type SurfaceKey = "chat" | "artifacts" | "code";

interface Surface {
  readonly key: SurfaceKey;
  readonly label: string;
  readonly sub: string;
  readonly icon: string;
  readonly description: string;
  readonly lesson: string;
  readonly advanced?: boolean;
}

const SURFACES: readonly Surface[] = [
  {
    key: "chat",
    label: "Claude.ai",
    sub: "Chat",
    icon: "◐",
    description: "Browser-basiert. So fängst du an.",
    lesson: "Modul 1 · Lektion 1.1",
  },
  {
    key: "artifacts",
    label: "Artifacts",
    sub: "Dokumente",
    icon: "▣",
    description: "Claude schreibt neben dir. Live-Output.",
    lesson: "Modul 2 · Lektion 2.3",
  },
  {
    key: "code",
    label: "Claude Code",
    sub: "Terminal",
    icon: "❯_",
    description: "Für Devs & Power-User. Dateisystem-Zugriff.",
    lesson: "Modul 2 · Lektion 2.5",
    advanced: true,
  },
];

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(mq.matches);
    const h = (e: MediaQueryListEvent) => setR(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return r;
}

export function AiNativeTerminalDemo() {
  const [active, setActive] = useState<SurfaceKey>("chat");
  const current = SURFACES.find((s) => s.key === active) ?? SURFACES[0];

  return (
    <SectionShell num="VII" label="Claude · drei Oberflächen">
      <Eyebrow>Modul 2 · Vorschau</Eyebrow>
      <ClipHeading
        as="h2"
        className="mt-2.5 font-bold leading-none tracking-[-0.035em]"
        style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
      >
        Drei Wege,
        <br />
        mit Claude zu arbeiten.
      </ClipHeading>
      <FadeBlock delay={1}>
        <p className="mt-4 max-w-[640px] text-[17px] text-muted-foreground">
          Die meisten bleiben bei Chat. Aber Claude hat drei Oberflächen, jede
          für andere Aufgaben gebaut. Modul 2 geht durch alle drei, ohne
          Technik-Schock.
        </p>
      </FadeBlock>

      {/* Tabs */}
      <FadeBlock delay={2}>
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {SURFACES.map((s) => {
            const isActive = s.key === active;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setActive(s.key)}
                aria-pressed={isActive}
                aria-label={`Oberfläche ${s.label} - ${s.sub}`}
                className={cn(
                  "group relative flex items-center gap-3 border p-4 text-left transition-colors",
                  isActive
                    ? "border-brand-orange bg-brand-orange/5"
                    : "border-border bg-card/40 hover:border-foreground",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center border font-mono text-sm",
                    isActive
                      ? "border-brand-orange bg-brand-orange text-white"
                      : "border-border text-foreground",
                  )}
                >
                  {s.icon}
                </span>
                <span className="flex flex-col">
                  <span className="text-[14.5px] font-semibold tracking-[-0.01em]">
                    {s.label}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {s.sub}
                  </span>
                </span>
                {s.advanced && (
                  <span className="ml-auto border border-brand-amber px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-brand-amber">
                    ADV
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </FadeBlock>

      {/* Stage */}
      <FadeBlock delay={3}>
        <div className="mt-6 overflow-hidden border border-border bg-card/50">
          <AnimatePresence mode="wait">
            {active === "chat" && <ChatSurface key="chat" />}
            {active === "artifacts" && <ArtifactsSurface key="artifacts" />}
            {active === "code" && <CodeSurface key="code" />}
          </AnimatePresence>
        </div>
      </FadeBlock>

      <FadeBlock delay={4}>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-[14px] text-muted-foreground">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
            {current.lesson}
          </span>
          <span className="text-border">·</span>
          <span>{current.description}</span>
        </div>
      </FadeBlock>
    </SectionShell>
  );
}

/* ──────────────────────────────────────────────────────────────
   Surface 1, Claude.ai chat with streaming messages
   ────────────────────────────────────────────────────────────── */

interface ChatMsg {
  readonly role: "user" | "claude";
  readonly text: string;
  readonly attach?: boolean;
}

const CHAT_MESSAGES: readonly ChatMsg[] = [
  {
    role: "user",
    text: "Ich habe drei Lieferanten-Angebote als PDF. Kannst du die in eine Tabelle bringen: Preis, Lieferzeit, Zahlungsziel, Sonstiges?",
  },
  {
    role: "claude",
    text: "Klar. Lade die drei PDFs hoch (Büroklammer unten links), ich lese sie, baue die Tabelle und markiere, wo Angaben fehlen oder uneinheitlich sind.",
  },
  { role: "user", text: "[3 PDFs hochgeladen]", attach: true },
  {
    role: "claude",
    text: "Alle drei fiktiven Angebote gelesen. Hier die Tabelle:\n\n• Anbieter Alpha · 48.200 € · 4 Wo · 30 Tage netto\n• Anbieter Beta · 51.800 € · 2 Wo · 14 Tage netto\n• Anbieter Gamma · 45.900 € · 6 Wo · sofort −2 %\n\nAuffällig: Gamma ist im Beispiel am günstigsten, hat aber ein Skonto-Modell. Rechenwert bei sofortiger Zahlung: 45.000 €. Soll ich ein Entscheidungs-Memo mit klaren Annahmen entwerfen?",
  },
];

function ChatSurface() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [visible, setVisible] = useState(reduced ? CHAT_MESSAGES.length : 0);

  useEffect(() => {
    if (reduced || !inView) return;
    setVisible(1);
    const timers = CHAT_MESSAGES.map((_, i) =>
      setTimeout(() => setVisible(i + 1), 900 * (i + 1)),
    );
    return () => timers.forEach(clearTimeout);
  }, [inView, reduced]);

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col bg-[#fafaf7]"
    >
      <WindowBar title="claude.ai / Lieferanten-Vergleich" />
      <div className="min-h-[420px] space-y-5 p-5 md:p-7">
        {CHAT_MESSAGES.slice(0, visible).map((msg, i) => (
          <m.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            {msg.role === "claude" && (
              <Avatar label="C" color="brand-orange" />
            )}
            <div
              className={cn(
                "max-w-[560px] border px-4 py-3 text-[14px] leading-[1.5]",
                msg.role === "user"
                  ? "border-foreground/10 bg-card text-foreground"
                  : "border-brand-orange/30 bg-white text-foreground",
              )}
            >
              {msg.attach && (
                <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  ◪ 3 fiktive Dateien · anbieter-alpha.pdf · anbieter-beta.pdf · anbieter-gamma.pdf
                </div>
              )}
              <span className="whitespace-pre-wrap">{msg.text}</span>
              {!reduced &&
                msg.role === "claude" &&
                i === visible - 1 &&
                i === CHAT_MESSAGES.length - 1 && (
                  <span className="ai-cursor ml-0.5" aria-hidden="true" />
                )}
            </div>
            {msg.role === "user" && <Avatar label="D" color="muted" />}
          </m.div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border bg-background/60 px-5 py-3 text-[13px] text-muted-foreground">
        <span>Antworte Claude…</span>
        <span className="inline-flex h-7 w-7 items-center justify-center bg-brand-orange text-white">
          ↑
        </span>
      </div>
    </m.div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Surface 2, Artifacts (split chat + live doc)
   ────────────────────────────────────────────────────────────── */

interface ArtifactLine {
  readonly kind: "h1" | "h2" | "dim" | "body" | "spacer";
  readonly text?: string;
}

const ARTIFACT_LINES: readonly ArtifactLine[] = [
  { kind: "h1", text: "Entscheidungs-Memo · Lieferanten" },
  { kind: "dim", text: "Erstellt: heute · Quelle: 3 Angebote" },
  { kind: "spacer" },
  { kind: "h2", text: "Empfehlung" },
  { kind: "body", text: "Anbieter Gamma, unter der Annahme, dass das Skonto genutzt werden kann." },
  { kind: "spacer" },
  { kind: "h2", text: "Vergleich" },
  { kind: "body", text: "• Anbieter Alpha · 48.200 € · 4 Wo · 30 Tage netto" },
  { kind: "body", text: "• Anbieter Beta · 51.800 € · 2 Wo · 14 Tage netto" },
  { kind: "body", text: "• Anbieter Gamma · 45.900 € → 45.000 € bei Skonto · 6 Wo · sofort −2 %" },
  { kind: "spacer" },
  { kind: "h2", text: "Risiken" },
  { kind: "body", text: "Die 6-Wochen-Lieferzeit von Gamma liegt eng am fiktiven Projektstart. Beta ist eine mögliche Puffer-Option." },
];

function ArtifactsSurface() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [count, setCount] = useState(reduced ? ARTIFACT_LINES.length : 0);

  useEffect(() => {
    if (reduced || !inView) return;
    setCount(0);
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= ARTIFACT_LINES.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, 280);
    return () => clearInterval(id);
  }, [inView, reduced]);

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col bg-[#fafaf7]"
    >
      <WindowBar title="claude.ai / Artifact geöffnet" />
      <div className="grid min-h-[420px] grid-cols-1 md:grid-cols-[1fr_1.1fr]">
        {/* LEFT — chat column */}
        <div className="space-y-4 border-r border-border p-5">
          <div className="flex gap-3">
            <Avatar label="D" color="muted" />
            <div className="max-w-full border border-foreground/10 bg-card px-3.5 py-2.5 text-[13px] leading-[1.55] text-foreground">
              Schreib draus ein Memo für die GF.
            </div>
          </div>
          <div className="flex gap-3">
            <Avatar label="C" color="brand-orange" />
            <div className="max-w-full border border-brand-orange/30 bg-white px-3.5 py-2.5 text-[13px] leading-[1.55] text-foreground">
              Mache ich. Du siehst rechts das Artifact, es wird live
              geschrieben, du kannst reinspringen und ändern.
            </div>
          </div>
          <div className="flex items-center gap-3 border border-brand-orange/30 bg-brand-orange/5 px-3.5 py-3">
            <span className="inline-flex h-8 w-8 items-center justify-center bg-brand-orange text-[14px] text-white">
              ▣
            </span>
            <div>
              <p className="text-[13px] font-semibold text-foreground">
                Entscheidungs-Memo
              </p>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                Markdown · wird live aktualisiert
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — live doc */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b border-border bg-background/60 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
            <span>MEMO.md</span>
            <div className="flex items-center gap-3">
              <span>Kopieren</span>
              <span>Download</span>
              <span className="flex items-center gap-1 text-brand-orange">
                <span className="inline-block h-1.5 w-1.5 animate-pulse bg-brand-orange" />
                live
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-1 p-5 font-mono text-[12.5px] leading-[1.6] text-foreground">
            {ARTIFACT_LINES.slice(0, count).map((line, i) => {
              if (line.kind === "spacer") return <div key={i} className="h-2" />;
              const cls =
                line.kind === "h1"
                  ? "text-[17px] font-bold tracking-[-0.01em]"
                  : line.kind === "h2"
                    ? "mt-1 text-[14px] font-bold uppercase tracking-[0.08em] text-brand-orange"
                    : line.kind === "dim"
                      ? "text-[11.5px] text-muted-foreground"
                      : "";
              return (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cls}
                >
                  {line.text}
                </m.div>
              );
            })}
            {!reduced && count < ARTIFACT_LINES.length && (
              <span className="ai-cursor" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>
    </m.div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Surface 3, Claude Code terminal with tool blocks
   ────────────────────────────────────────────────────────────── */

type CCBlock =
  | { readonly kind: "user"; readonly text: string }
  | { readonly kind: "thought"; readonly text: string }
  | {
      readonly kind: "tool";
      readonly name: string;
      readonly args: string;
      readonly summary: string;
    }
  | {
      readonly kind: "result";
      readonly title: string;
      readonly lines: readonly string[];
    }
  | { readonly kind: "ask"; readonly text: string };

const CC_BLOCKS: readonly CCBlock[] = [
  { kind: "user", text: "analysiere invoice_Q3.csv und finde Duplikate" },
  {
    kind: "thought",
    text: "Ich lese erst die Datei, prüfe Schema, dann Hash-basierter Match + Fuzzy auf Beträgen.",
  },
  {
    kind: "tool",
    name: "Read",
    args: "invoice_Q3.csv",
    summary: "2.4 MB · 8.412 Zeilen · 5 Spalten erkannt",
  },
  {
    kind: "tool",
    name: "Bash",
    args: "python analyze.py --hash vendor+invoice_no --fuzzy 0.5%",
    summary: "23 exakte Duplikate · 12 Fuzzy-Kandidaten · Laufzeit 1.2s",
  },
  {
    kind: "result",
    title: "Befund",
    lines: [
      "Gesamt-Schaden in exakten Duplikaten: 18.420 €",
      "Top-Muster:",
      "  · Bosch AG: 6 Duplikate, über 3 Kostenstellen gestreut",
      "  · Trumpf: 4 Duplikate, immer 2 Wochen auseinander",
      "  · KSB: 3 Duplikate, alle im Dezember 2024",
    ],
  },
  {
    kind: "tool",
    name: "Write",
    args: "~/invoice_audit/Q3_duplicates.md",
    summary: "Report geschrieben · 94 Zeilen",
  },
  {
    kind: "ask",
    text: "Soll ich die 12 Fuzzy-Kandidaten jetzt interaktiv reviewen?",
  },
];

function CodeSurface() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [shown, setShown] = useState(reduced ? CC_BLOCKS.length : 0);

  useEffect(() => {
    if (reduced || !inView) return;
    setShown(0);
    let i = 0;
    const advance = () => {
      const block = CC_BLOCKS[i];
      if (!block) return;
      const delay =
        block.kind === "user"
          ? 450
          : block.kind === "thought"
            ? 800
            : block.kind === "tool"
              ? 900
              : block.kind === "result"
                ? 1100
                : 650;
      const t = setTimeout(() => {
        i += 1;
        setShown(i);
        if (i < CC_BLOCKS.length) advance();
      }, delay);
      return () => clearTimeout(t);
    };
    const cleanup = advance();
    return cleanup;
  }, [inView, reduced]);

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col bg-[#0d0b09]"
    >
      {/* Terminal header */}
      <div className="flex items-center gap-3 border-b border-[rgba(243,240,233,0.08)] bg-[#161310] px-4 py-2.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
        <span className="ml-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-dark-muted)]">
          ~/finance_audit
        </span>
        <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-orange">
          claude-code · v1.4
        </span>
      </div>
      <div className="min-h-[420px] space-y-3.5 p-5 font-mono text-[13px] leading-[1.55] text-[var(--color-dark-fg)] md:p-6">
        {CC_BLOCKS.slice(0, shown).map((block, i) => {
          const delay = 0;
          if (block.kind === "user") {
            return (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay, duration: 0.25 }}
                className="flex gap-2"
              >
                <span className="text-brand-orange">&gt;</span>
                <span className="text-[var(--color-dark-fg)]">{block.text}</span>
              </m.div>
            );
          }
          if (block.kind === "thought") {
            return (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay, duration: 0.25 }}
                className="flex gap-2 text-[var(--color-dark-muted)]"
              >
                <span className="shrink-0 border border-[rgba(243,240,233,0.2)] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-brand-sand">
                  thinking
                </span>
                <span className="italic">{block.text}</span>
              </m.div>
            );
          }
          if (block.kind === "tool") {
            return (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay, duration: 0.25 }}
                className="border-l-2 border-[#22c55e] pl-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#22c55e]">✓</span>
                  <span className="font-semibold text-[var(--color-dark-fg)]">
                    {block.name}
                  </span>
                  <span className="text-[var(--color-dark-muted)]">
                    ({block.args})
                  </span>
                </div>
                <div className="mt-0.5 pl-5 text-[var(--color-dark-muted)]">
                  └ {block.summary}
                </div>
              </m.div>
            );
          }
          if (block.kind === "result") {
            return (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay, duration: 0.3 }}
                className="border border-brand-orange/40 bg-brand-orange/5 p-3"
              >
                <div className="mb-1.5 font-bold uppercase tracking-[0.12em] text-brand-orange">
                  {block.title}
                </div>
                {block.lines.map((line, j) => (
                  <div key={j} className="text-[var(--color-dark-fg)]">
                    {line}
                  </div>
                ))}
              </m.div>
            );
          }
          // ask
          return (
            <m.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.25 }}
              className="flex gap-2 text-brand-amber"
            >
              <span>↳</span>
              <span>{block.text}</span>
            </m.div>
          );
        })}
        {shown >= CC_BLOCKS.length && (
          <div className="flex gap-2">
            <span className="text-brand-orange">&gt;</span>
            {!reduced && <span className="ai-cursor" aria-hidden="true" />}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 border-t border-[rgba(243,240,233,0.08)] bg-[#161310] px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-dark-muted)]">
        <span className="inline-block h-1.5 w-1.5 animate-pulse bg-brand-orange" />
        <span className="text-brand-amber">Advanced · optional</span>
        <span className="hidden sm:inline">
          · Terminal-basiert. Nicht jeder braucht das, aber wer's lernt,
          arbeitet damit 5× schneller an Daten-Tasks.
        </span>
      </div>
    </m.div>
  );
}

/* Shared bits */

function WindowBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-border bg-background/60 px-4 py-2.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
      <span className="ml-4 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </span>
    </div>
  );
}

function Avatar({
  label,
  color,
}: {
  readonly label: string;
  readonly color: "brand-orange" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center border font-mono text-[12px] font-bold uppercase tracking-[0.05em]",
        color === "brand-orange"
          ? "border-brand-orange bg-brand-orange text-white"
          : "border-foreground/20 bg-card text-foreground",
      )}
    >
      {label}
    </span>
  );
}
