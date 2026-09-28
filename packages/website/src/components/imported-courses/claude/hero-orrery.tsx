"use client";

import { useMemo, useState, type JSX } from "react";
import { cx as cn } from "@/components/werk/cx";
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

  // Werkzeichnung: a 1px ink frame with no offset shadow, sentence-case
  // labels, and each component as a hairline row with a square switch. The
  // frame is the only box: the score is a stat behind a hairline and the
  // output sits under a hairline, not in a second frame. The score, the
  // percentages and the output stay mono because they are data. The run
  // button is ink; the landing's one Mennige action is "Lektion 01 starten".
  return (
    <div className="border border-foreground bg-card p-4 sm:p-6 md:p-8">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start md:gap-6">
        <div>
          {/* Below lg the landing's toggle row already names the workbench. */}
          <p className="text-label text-muted-foreground max-lg:hidden">
            {copy.kind}
          </p>
          <h2 className="mt-2 text-[22px] max-lg:mt-0 font-bold tracking-[-0.02em] text-foreground">
            {copy.title}
          </h2>
          <p className="mt-1 max-w-[380px] text-[14px] leading-[1.5] text-muted-foreground">
            {copy.intro}
          </p>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 md:block md:min-w-[120px] md:border-l md:border-hairline md:pl-6 md:text-right">
          <p className="text-caption text-muted-foreground">{copy.score}</p>
          <p
            className={cn(
              "font-mono text-[22px] font-bold leading-none tabular-nums md:mt-1 md:text-[32px]",
              qColor,
            )}
          >
            {quality}
          </p>
          <p className="text-caption text-muted-foreground md:mt-1">
            {structureLabel(quality, copy.labels)}
          </p>
          <div className="mt-2 h-[3px] w-full basis-full overflow-hidden bg-border md:mt-3">
            <div
              className={cn(
                "h-full transition-[width] duration-500 motion-reduce:transition-none",
                qBar,
              )}
              style={{ width: `${quality}%` }}
            />
          </div>
        </div>
      </div>

      <div
        role="group"
        aria-label={copy.group}
        className="mt-5 flex flex-col border-t border-hairline md:mt-6"
      >
        {parts.map((part) => {
          const on = !!active[part.id];
          return (
            <button
              key={part.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(part.id)}
              className="grid min-h-11 grid-cols-[1rem_minmax(0,1fr)] gap-x-3 gap-y-0.5 border-b border-hairline px-1 py-2.5 text-left transition-colors duration-[120ms] hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange motion-reduce:transition-none"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 h-4 w-4 border border-foreground",
                  on ? "bg-foreground" : "bg-background",
                )}
              />
              <span className="flex min-w-0 items-baseline justify-between gap-3 text-label text-foreground">
                {part.label}
                <span className="shrink-0 font-normal text-muted-foreground tabular-nums">
                  {on ? copy.on : copy.off} · +{part.weight}
                </span>
              </span>
              <span className="col-start-2 text-[14px] leading-[1.45] text-muted-foreground">
                {on ? part.content : part.hint}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={loading || !assembled.trim()}
          className="inline-flex min-h-11 items-center rounded-none bg-brand-cobalt px-4 py-2 text-[0.9375rem] font-semibold text-paper transition-colors duration-[120ms] hover:bg-[#1e3790] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
        >
          {loading ? copy.running : output ? copy.rerun : copy.run}
        </button>
        {!loading && output && (
          <span className="text-caption text-muted-foreground tabular-nums">
            {output.split(/\s+/).filter(Boolean).length} {copy.words} ·{" "}
            {copy.from} {activeParts.length} {copy.parts}
          </span>
        )}
      </div>

      {output && (
        <div className="mt-3">
          <p className="mb-1 text-caption text-muted-foreground">
            {copy.disclosure}
          </p>
          <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap break-words border-t border-hairline pt-3 text-[13px] leading-[1.55] text-foreground">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}

export default HeroOrrery;
