"use client";

import { useMemo, useState, type JSX } from "react";
import { cn } from "@/lib/utils";
import {
  genericAnswer,
  simulatedDelayMs,
} from "@/lib/claude-course/simulated-claude";
import type { Locale } from "@/lib/i18n/locale";

/**
 * HeroOrrery, the claude-course landing-page hero demo. Ported from
 * `claude/js/widgets.js:847` (PromptOrrery). Confirmed zero props, no
 * checkpoint, never mounted inside a lesson (only `index.html`'s hero
 * section), this is a deliberately bespoke, non-registry component, not a
 * `WidgetKind`.
 */
interface PromptPart {
  readonly id: string;
  readonly label: string;
  readonly weight: number;
  readonly default: boolean;
  readonly content: string;
  readonly hint: string;
}

const PARTS_EN: readonly PromptPart[] = [
  {
    id: "role",
    label: "Role",
    weight: 18,
    default: true,
    content: "You are a staff engineer writing internal documentation.",
    hint: "Specifies the review perspective, vocabulary, and tone.",
  },
  {
    id: "context",
    label: "Context",
    weight: 22,
    default: true,
    content:
      "We're launching AuthKit v2 next Monday as the planned replacement for legacy SSO.",
    hint: "Supplies task-specific facts that are not available by default.",
  },
  {
    id: "task",
    label: "Task",
    weight: 28,
    default: true,
    content: "Draft the internal launch email.",
    hint: "Names the requested action and deliverable.",
  },
  {
    id: "constraints",
    label: "Constraints",
    weight: 16,
    default: false,
    content:
      "Under 180 words. No marketing language. One clear migration action at the top.",
    hint: "Defines limits and required content that can be checked.",
  },
  {
    id: "format",
    label: "Format",
    weight: 16,
    default: false,
    content:
      "Subject line, then body. No sign-off. CLI command in a code block.",
    hint: "Defines the output structure for downstream use.",
  },
];

const PARTS_DE: readonly PromptPart[] = [
  {
    id: "role",
    label: "Rolle",
    weight: 18,
    default: true,
    content: "Du erstellst als Staff Engineer eine interne Dokumentation.",
    hint: "Legt Wortwahl, fachliche Tiefe und Ton fest.",
  },
  {
    id: "context",
    label: "Kontext",
    weight: 22,
    default: true,
    content:
      "Wir führen AuthKit v2 nächsten Montag als geplanten Ersatz für das bisherige SSO ein.",
    hint: "Enthält Fakten, die das Modell nicht kennen kann.",
  },
  {
    id: "task",
    label: "Aufgabe",
    weight: 28,
    default: true,
    content: "Entwirf die interne Ankündigungs-E-Mail.",
    hint: "Benennt eine konkrete Handlung und ein Ergebnis.",
  },
  {
    id: "constraints",
    label: "Vorgaben",
    weight: 16,
    default: false,
    content:
      "Höchstens 180 Wörter. Keine Marketingsprache. Beginne mit einer klaren Migrationshandlung.",
    hint: "Grenzt Umfang, Ton und notwendige Inhalte ein.",
  },
  {
    id: "format",
    label: "Format",
    weight: 16,
    default: false,
    content:
      "Zuerst die Betreffzeile, dann der Text. Keine Grußformel. CLI-Befehl in einem Codeblock.",
    hint: "Definiert die Form der Antwort.",
  },
];

const COPY = {
  de: {
    kind: "Prompt-Werkbank",
    title: "Fünf Bestandteile ein- und ausschalten",
    intro:
      "Die Anzeige misst nur die Abdeckung dieser fünf Bestandteile, nicht die inhaltliche Qualität.",
    score: "Struktur",
    group: "Prompt-Bestandteile",
    on: "an",
    off: "aus",
    running: "Wird ausgeführt…",
    rerun: "Erneut ausführen →",
    run: "Simulation starten →",
    words: "Wörter",
    from: "aus",
    parts: "Bestandteilen",
    disclosure: "Feste lokale Regeln; kein Modell- oder API-Aufruf.",
    labels: ["vollständig", "weitgehend", "teilweise", "gering", "leer"],
  },
  en: {
    kind: "Prompt workbench",
    title: "Toggle five prompt components",
    intro:
      "The indicator measures coverage of these five components, not output quality.",
    score: "Structure",
    group: "Prompt components",
    on: "on",
    off: "off",
    running: "Running…",
    rerun: "Run again →",
    run: "Run simulation →",
    words: "words",
    from: "from",
    parts: "components",
    disclosure: "Fixed local rules; no model or API call.",
    labels: ["complete", "mostly complete", "partial", "limited", "empty"],
  },
} as const;

function structureLabel(quality: number, labels: readonly string[]): string {
  if (quality >= 90) return labels[0];
  if (quality >= 70) return labels[1];
  if (quality >= 40) return labels[2];
  if (quality >= 20) return labels[3];
  return labels[4];
}

export function HeroOrrery({
  locale,
}: {
  readonly locale: Locale;
}): JSX.Element {
  const parts = locale === "de" ? PARTS_DE : PARTS_EN;
  const copy = COPY[locale];
  const [active, setActive] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(parts.map((p) => [p.id, p.default])),
  );
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeParts = useMemo(
    () => parts.filter((p) => active[p.id]),
    [active, parts],
  );
  const quality = Math.min(
    100,
    activeParts.reduce((sum, p) => sum + p.weight, 0),
  );
  const assembled = useMemo(
    () =>
      activeParts
        .map((p) => `${p.label.toUpperCase()}\n${p.content}`)
        .join("\n\n"),
    [activeParts],
  );

  const toggle = (id: string) =>
    setActive((prev) => ({ ...prev, [id]: !prev[id] }));

  const run = async () => {
    if (!assembled.trim()) return;
    setLoading(true);
    setOutput(null);
    await new Promise((resolve) =>
      setTimeout(resolve, simulatedDelayMs(assembled)),
    );
    setOutput(genericAnswer(assembled, locale));
    setLoading(false);
  };

  const qColor =
    quality >= 80
      ? "text-risk-green"
      : quality >= 40
        ? "text-brand-amber"
        : "text-destructive";
  const qBar =
    quality >= 80
      ? "bg-risk-green"
      : quality >= 40
        ? "bg-brand-amber"
        : "bg-destructive";

  return (
    <div className="border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_var(--color-foreground)] md:p-8">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.kind}
          </p>
          <h2 className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-foreground">
            {copy.title}
          </h2>
          <p className="mt-1 max-w-[380px] text-[14px] leading-[1.5] text-muted-foreground">
            {copy.intro}
          </p>
        </div>
        <div className="min-w-[120px] border border-border bg-background p-4 text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {copy.score}
          </p>
          <p
            className={cn(
              "mt-1 font-mono text-[32px] font-bold leading-none",
              qColor,
            )}
          >
            {quality}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
            {structureLabel(quality, copy.labels)}
          </p>
          <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-border">
            <div
              className={cn("h-full transition-[width] duration-500", qBar)}
              style={{ width: `${quality}%` }}
            />
          </div>
        </div>
      </div>

      <div
        role="group"
        aria-label={copy.group}
        className="mt-6 flex flex-col gap-2"
      >
        {parts.map((part) => {
          const on = !!active[part.id];
          return (
            <button
              key={part.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(part.id)}
              className={cn(
                "flex flex-col gap-0.5 border-2 px-4 py-2.5 text-left transition-colors",
                on
                  ? "border-brand-orange bg-brand-orange/10"
                  : "border-border bg-background hover:border-brand-orange/60",
              )}
            >
              <span className="flex items-center justify-between font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-brand-orange">
                {part.label}
                <span className="text-muted-foreground">
                  {on ? copy.on : copy.off} · +{part.weight}
                </span>
              </span>
              <span className="text-[13px] leading-[1.45] text-muted-foreground">
                {on ? part.content : part.hint}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={loading || !assembled.trim()}
          className="border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? copy.running : output ? copy.rerun : copy.run}
        </button>
        {!loading && output && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {output.split(/\s+/).filter(Boolean).length} {copy.words} ·{" "}
            {copy.from} {activeParts.length} {copy.parts}
          </span>
        )}
      </div>

      {output && (
        <div className="mt-3">
          <p className="mb-1 font-mono text-[10.5px] text-muted-foreground">
            {copy.disclosure}
          </p>
          <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap break-words border border-border bg-background p-4 text-[13px] leading-[1.55] text-foreground">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}

export default HeroOrrery;
