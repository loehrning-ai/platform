"use client";

import { useMemo, useState, type JSX } from "react";
import { cx as cn } from "@/components/werk/cx";
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
    note: "Role, context, task, constraints and format are stated, so less is left to inference.",
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
    note: "Rolle, Kontext, Aufgabe, Vorgaben und Format sind genannt; weniger bleibt offen.",
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
  // Final state first: every stage's simulated output is on screen from the
  // first paint, so the comparison works without pressing play. The run
  // button replays the current stage. genericAnswer is deterministic, so
  // server and client render the same text.
  const outputs = useMemo(
    () => stages.map((stage) => genericAnswer(stage.prompt, locale)),
    [stages, locale],
  );
  const [loading, setLoading] = useState(false);

  const active = stages[stageIdx];

  const run = async () => {
    setLoading(true);
    await new Promise((resolve) =>
      setTimeout(resolve, simulatedDelayMs(active.prompt)),
    );
    setLoading(false);
  };

  return (
    // Werkzeichnung: 1px ink frame, no offset shadows, square stage buttons and
    // sentence-case labels. The frame is the only box: assessment and output
    // sit under hairlines. Prompt text and output stay pre-formatted because
    // they are data. The replay button is ink; the landing keeps Mennige for
    // "Lektion 01 starten" only.
    <div className="grid gap-0 border border-foreground md:grid-cols-2">
      <div className="border-b border-border bg-card p-4 sm:p-6 md:border-b-0 md:border-r">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-label text-muted-foreground">{copy.prompt}</p>
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
                  "flex min-h-11 min-w-11 items-center justify-center border text-label tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange",
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
        <pre className="max-h-[220px] overflow-y-auto whitespace-pre-wrap border-y border-hairline py-3 text-[12.5px] leading-[1.5] text-foreground">
          {active.prompt}
        </pre>
        <div className="mt-3">
          <p className="text-label text-foreground">{copy.diagnosis}</p>
          <p className="mt-1 text-[13px] leading-[1.5] text-muted-foreground">
            {active.note}
          </p>
        </div>
        <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-caption text-muted-foreground">
              {copy.structure}
            </p>
            <div className="h-[6px] w-full overflow-hidden bg-border">
              <div
                className={cn(
                  "h-full transition-[width] duration-500 motion-reduce:transition-none",
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
            className="inline-flex min-h-11 w-full items-center justify-center rounded-none bg-foreground px-4 py-2 text-[0.9375rem] font-semibold text-background transition-colors duration-[120ms] hover:bg-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none sm:w-auto sm:shrink-0"
          >
            {loading ? copy.running : copy.run(stageIdx + 1)}
          </button>
        </div>
      </div>
      <div className="bg-background p-4 sm:p-6">
        <p className="text-label text-muted-foreground">{copy.output}</p>
        <p className="mt-1 text-caption text-muted-foreground">
          {copy.disclosure}
        </p>
        <p className="mt-1 text-[16px] font-semibold text-foreground">
          {copy.result} · {copy.stage} {stageIdx + 1}
        </p>
        <div
          aria-live="polite"
          aria-busy={loading}
          className="mt-4 overflow-auto whitespace-pre-wrap break-words border-t border-hairline pt-4 text-[13.5px] leading-[1.6] text-foreground sm:min-h-[260px]"
        >
          {loading ? (
            <span className="text-muted-foreground">{copy.running}</span>
          ) : (
            outputs[stageIdx]
          )}
        </div>
      </div>
    </div>
  );
}

export default HeroTransform;
