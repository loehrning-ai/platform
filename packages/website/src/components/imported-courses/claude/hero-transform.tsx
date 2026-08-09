"use client";

import { useState, type JSX } from "react";
import { cn } from "@/lib/utils";
import {
  genericAnswer,
  simulatedDelayMs,
} from "@/lib/claude-course/simulated-claude";
import type { Locale } from "@/lib/i18n/locale";

/**
 * HeroTransform, the claude-course landing-page hero demo. Ported from
 * `claude/js/widgets.js:638` (PromptTransform). Confirmed zero props, no
 * checkpoint, never mounted inside a lesson (only `index.html`'s hero
 * section), a deliberately bespoke, non-registry component.
 */
interface Stage {
  readonly label: string;
  readonly quality: number;
  readonly prompt: string;
  readonly note: string;
}

const STAGES_EN: readonly Stage[] = [
  {
    label: "vague",
    quality: 18,
    prompt: "write a launch email",
    note: "Audience, purpose, source context, and output format are unspecified.",
  },
  {
    label: "specific",
    quality: 58,
    prompt:
      "Write a launch email announcing our new authentication service to internal engineers. Keep it short.",
    note: "Adds audience, subject, and length. Structure and acceptance criteria remain unspecified.",
  },
  {
    label: "structured",
    quality: 94,
    prompt: `You are a staff engineer drafting an internal launch announcement.

CONTEXT
We're rolling out AuthKit v2, a new authentication service replacing the legacy SSO. It ships next Monday, opt-in for 2 weeks, then default.

AUDIENCE
Internal engineers (mixed seniority). They skim. They hate ceremony.

TASK
Write the launch email.

CONSTRAINTS
- Under 180 words
- One clear migration action at the top
- No marketing language
- Code-block the CLI command

FORMAT
Subject line, then body. No sign-off.`,
    note: "Role, context, task, constraints, and format are explicit. Fewer details are left to inference.",
  },
];

const STAGES_DE: readonly Stage[] = [
  {
    label: "vage",
    quality: 18,
    prompt: "Schreibe eine Ankündigungs-E-Mail",
    note: "Zielgruppe, Zweck, Quellenkontext und Ausgabeformat fehlen.",
  },
  {
    label: "konkret",
    quality: 58,
    prompt:
      "Schreibe eine kurze Ankündigungs-E-Mail zu unserem neuen Authentifizierungsdienst für interne Entwicklerinnen und Entwickler.",
    note: "Zielgruppe, Thema und eine Längenvorgabe sind vorhanden. Struktur und Erfolgskriterien fehlen noch.",
  },
  {
    label: "strukturiert",
    quality: 94,
    prompt: `Du erstellst als Staff Engineer eine interne Ankündigung.

KONTEXT
Wir führen AuthKit v2 als Ersatz für das bisherige SSO ein. Die Einführung beginnt nächsten Montag. Zwei Wochen lang ist die Nutzung optional, danach wird AuthKit v2 zum Standard.

ZIELGRUPPE
Interne Entwicklerinnen und Entwickler mit unterschiedlicher Erfahrung. Der Text muss schnell erfassbar sein.

AUFGABE
Schreibe die Ankündigungs-E-Mail.

VORGABEN
- Höchstens 180 Wörter
- Beginne mit einer klaren Migrationshandlung
- Keine Marketingsprache
- CLI-Befehl in einem Codeblock

FORMAT
Zuerst die Betreffzeile, dann der Text. Keine Grußformel.`,
    note: "Rolle, Kontext, Aufgabe, Vorgaben und Format sind explizit. Weniger Details bleiben offen.",
  },
];

const COPY = {
  de: {
    prompt: "Prompt",
    stage: "Stufe",
    choose: "Stufe wählen",
    diagnosis: "Einordnung",
    structure: "Strukturabdeckung",
    running: "Wird ausgeführt…",
    run: (stage: number) => `Stufe ${stage} simulieren →`,
    output: "Simulierte Ausgabe",
    disclosure: "Feste lokale Regeln; kein Modell- oder API-Aufruf.",
    result: "Ergebnis",
    waiting: "Noch nicht ausgeführt",
    empty: (stage: number) =>
      `Führe Stufe ${stage} aus, um die simulierte Antwort zu sehen. Vergleiche anschließend die drei Stufen.`,
  },
  en: {
    prompt: "Prompt",
    stage: "Stage",
    choose: "Choose stage",
    diagnosis: "Assessment",
    structure: "Structure coverage",
    running: "Running…",
    run: (stage: number) => `Run stage ${stage} →`,
    output: "Simulated output",
    disclosure: "Fixed local rules; no model or API call.",
    result: "Result",
    waiting: "Not run yet",
    empty: (stage: number) =>
      `Run stage ${stage} to see the simulated response, then compare all three stages.`,
  },
} as const;

export function HeroTransform({
  locale,
}: {
  readonly locale: Locale;
}): JSX.Element {
  const stages = locale === "de" ? STAGES_DE : STAGES_EN;
  const copy = COPY[locale];
  const [stageIdx, setStageIdx] = useState(0);
  const [outputs, setOutputs] = useState<(string | null)[]>([null, null, null]);
  const [loading, setLoading] = useState(false);

  const active = stages[stageIdx];

  const run = async () => {
    setLoading(true);
    await new Promise((resolve) =>
      setTimeout(resolve, simulatedDelayMs(active.prompt)),
    );
    const result = genericAnswer(active.prompt, locale);
    setOutputs((prev) => prev.map((o, i) => (i === stageIdx ? result : o)));
    setLoading(false);
  };

  return (
    <div className="grid gap-0 border-2 border-foreground shadow-[6px_6px_0_var(--color-foreground)] md:grid-cols-2">
      <div className="border-b border-border bg-card p-6 md:border-b-0 md:border-r">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              {copy.prompt}
            </p>
            <p className="mt-1 text-[16px] font-semibold text-foreground">
              {copy.stage} {stageIdx + 1} / 3 · {active.label}
            </p>
          </div>
          <div role="group" aria-label={copy.choose} className="flex gap-1.5">
            {stages.map((stage, i) => (
              <button
                key={stage.label}
                type="button"
                aria-pressed={i === stageIdx}
                onClick={() => setStageIdx(i)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[12px]",
                  i === stageIdx
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <pre className="max-h-[220px] overflow-y-auto whitespace-pre-wrap border border-border bg-background p-3 text-[12.5px] leading-[1.5] text-foreground">
          {active.prompt}
        </pre>
        <div className="mt-3 border border-border bg-background p-3">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-brand-amber">
            {copy.diagnosis}
          </p>
          <p className="mt-1 text-[13px] leading-[1.5] text-muted-foreground">
            {active.note}
          </p>
        </div>
        <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              {copy.structure}
            </p>
            <div className="h-[6px] w-full overflow-hidden rounded-full bg-border">
              <div
                className={cn(
                  "h-full transition-[width] duration-500",
                  active.quality > 80
                    ? "bg-risk-green"
                    : active.quality > 40
                      ? "bg-brand-amber"
                      : "bg-destructive",
                )}
                style={{ width: `${active.quality}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="w-full border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-auto sm:shrink-0"
          >
            {loading ? copy.running : copy.run(stageIdx + 1)}
          </button>
        </div>
      </div>
      <div className="bg-background p-6">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {copy.output}
        </p>
        <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">
          {copy.disclosure}
        </p>
        <p className="mt-1 text-[16px] font-semibold text-foreground">
          {outputs[stageIdx] ? copy.result : copy.waiting}
        </p>
        <div
          className={cn(
            "mt-4 min-h-[260px] overflow-auto whitespace-pre-wrap break-words border p-4 text-[13.5px] leading-[1.6] text-foreground",
            stageIdx === 2
              ? "border-brand-amber/40 bg-brand-amber/5"
              : "border-border bg-card/40",
          )}
        >
          {outputs[stageIdx] ?? (
            <span className="italic text-muted-foreground">
              {copy.empty(stageIdx + 1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default HeroTransform;
