"use client";

import { useEffect, useState, type JSX } from "react";
import type {
  PracticeLocale,
  PracticeModelId,
} from "@/app/api/ai-native/practice/types";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";
import { LiveNote } from "./_live-note";
import { usePracticeApi } from "./use-practice-api";

/**
 * PromptTransform — the same task at three escalating levels of prompt craft
 * (vage → konkret → strukturiert). Each stage carries a STATIC quality value
 * so the lesson lands even when live mode is off. With live mode the learner
 * runs each stage through Claude to feel the jump.
 *
 * Ported from `claude/js/widgets.js:638` (PromptTransform). German Mittelstand
 * scenario, CI v3.0 styling, keyboard nav (stage dots + run are buttons),
 * reduced motion respected (quality bar is a CSS transition only).
 */

interface Stage {
  readonly label: string;
  readonly quality: number;
  readonly prompt: string;
  readonly note: string;
}

const STAGES: readonly Stage[] = [
  {
    label: "vage",
    quality: 18,
    prompt: "schreib eine Ankündigungs-Mail",
    note: "Keine Rolle. Kein Publikum. Kein Ziel. Kein Format. Claude muss alles raten.",
  },
  {
    label: "konkret",
    quality: 58,
    prompt:
      "Schreibe eine Ankündigungs-Mail für unser neues Angebots-Tool an die interne Vertriebsmannschaft. Halte sie kurz.",
    note: "Besser: Publikum, Thema, Tonhinweis. Es fehlen noch Struktur und Erfolgskriterien.",
  },
  {
    label: "strukturiert",
    quality: 94,
    prompt: `Du bist ein erfahrener Vertriebsleiter im Maschinenbau, der eine interne Ankündigung schreibt.

KONTEXT
Wir führen kommende Woche das neue Angebots-Tool ein. Es löst die alte Excel-Vorlage ab. Start am Montag, zwei Wochen Übergangszeit.

PUBLIKUM
Interne Vertriebsmitarbeitende (gemischte Erfahrung). Sie überfliegen Texte und mögen keine Floskeln.

AUFTRAG
Schreibe die Ankündigungs-Mail.

CONSTRAINTS
- Unter 180 Wörter
- Eine klare Handlungsaufforderung ganz oben
- Keine Marketing-Sprache

FORMAT
Betreffzeile, dann Fließtext. Keine Grußformel.`,
    note: "Rolle. Kontext. Auftrag. Constraints. Format. Claude hat alles, um es beim ersten Versuch zu treffen.",
  },
];

export interface PromptTransformWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly scenario?: string;
  readonly locale?: PracticeLocale;
  readonly model?: PracticeModelId;
}

export function PromptTransformWidget({
  lessonId,
  cpId,
  title = "Vom Wunsch zum Auftrag",
  scenario = "Dieselbe Aufgabe, drei Stufen Prompt-Handwerk. Spüre den Sprung von Stufe 1 zu Stufe 3.",
  locale = "de",
  model,
}: PromptTransformWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [stageIdx, setStageIdx] = useState(0);
  const [output, setOutput] = useState<string | null>(null);
  const [viewed, setViewed] = useState<Set<number>>(new Set([0]));
  const api = usePracticeApi({ locale, ...(model ? { model } : {}) });

  const active = STAGES[stageIdx]!;

  // Once the learner has inspected all three stages, the checkpoint is earned
  // (works offline; the lesson is in the comparison, not the API call).
  useEffect(() => {
    if (viewed.size >= STAGES.length) complete();
  }, [viewed, complete]);

  const selectStage = (i: number) => {
    setStageIdx(i);
    setOutput(null);
    setViewed((prev) => {
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  };

  const run = async () => {
    setOutput(null);
    const text = await api.complete(active.prompt);
    setOutput(text);
  };

  const qBar =
    active.quality >= 80
      ? "bg-risk-green"
      : active.quality >= 40
        ? "bg-brand-amber"
        : "bg-destructive";

  return (
    <WidgetFrame
      kindLabel="Transformation"
      title={title}
      scenario={scenario}
      done={done}
    >
      <div
        className="mb-4 flex items-center gap-2"
        role="group"
        aria-label="Prompt-Stufe wählen"
      >
        {STAGES.map((s, i) => (
          <button
            key={s.label}
            type="button"
            aria-pressed={i === stageIdx}
            onClick={() => selectStage(i)}
            className={cn(
              "min-h-11 border-2 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.1em] transition-colors",
              i === stageIdx
                ? "border-brand-orange bg-brand-orange/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-brand-orange/60",
            )}
          >
            {i + 1} · {s.label}
          </button>
        ))}
      </div>

      <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap border-2 border-border bg-background p-4 font-mono text-[12.5px] leading-[1.55] text-foreground">
        {active.prompt}
      </pre>

      <div className="mt-3 border-l-[3px] border-brand-amber bg-brand-amber/5 px-3 py-2 text-[13px] leading-[1.5] text-foreground">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-amber">
          Diagnose
        </span>
        <p className="mt-1">{active.note}</p>
      </div>

      <div className="mt-3">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Prompt-Qualität · {active.quality}
        </p>
        <div className="h-[6px] w-full overflow-hidden rounded-full bg-border">
          <div
            className={cn("h-full transition-[width] duration-500", qBar)}
            style={{ width: `${active.quality}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={api.loading}
          className={cn(
            "min-h-11 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-foreground shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0",
          )}
        >
          {api.loading ? "Läuft …" : `Stufe ${stageIdx + 1} live ausführen`}
        </button>
      </div>

      {output && (
        <pre className="mt-3 max-h-[300px] overflow-auto whitespace-pre-wrap border-2 border-border bg-background p-4 text-[13px] leading-[1.6] text-foreground">
          {output}
        </pre>
      )}
      <LiveNote available={api.available} />
    </WidgetFrame>
  );
}

export default PromptTransformWidget;
