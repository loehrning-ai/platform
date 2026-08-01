"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";
import { LiveNote } from "./_live-note";
import { usePracticeApi } from "./use-practice-api";

/**
 * PromptOrrery — five prompt parts (Rolle, Kontext, Auftrag, Constraints,
 * Format). Toggle each on/off; a STATIC quality score responds live (the core
 * lesson works with zero API). When live mode is enabled the learner can run
 * the assembled prompt through Claude; otherwise an honest note is shown.
 *
 * Ported from `claude/js/widgets.js:847` (PromptOrrery). German Mittelstand
 * copy, CI v3.0 styling, keyboard nav (each part is a native button), reduced
 * motion respected (the quality bar uses a CSS transition only).
 */

interface PromptPart {
  readonly id: string;
  readonly label: string;
  readonly weight: number;
  readonly default: boolean;
  readonly content: string;
  readonly hint: string;
}

const PARTS: readonly PromptPart[] = [
  {
    id: "role",
    label: "Rolle",
    weight: 18,
    default: true,
    content: "Du bist ein erfahrener Vertriebsleiter im Maschinenbau.",
    hint: "Wer Claude sein soll. Legt Vokabular, Seniorität und Ton fest.",
  },
  {
    id: "context",
    label: "Kontext",
    weight: 22,
    default: true,
    content:
      "Wir führen kommende Woche ein neues Angebots-Tool ein, das die alte Excel-Vorlage ablöst.",
    hint: "Hintergrund, den das Modell nicht kennen kann. Die Welt der Aufgabe.",
  },
  {
    id: "task",
    label: "Auftrag",
    weight: 28,
    default: true,
    content: "Schreibe die interne Ankündigungs-Mail.",
    hint: "Die eine Sache, die du willst. Ein Verb, ein Objekt.",
  },
  {
    id: "constraints",
    label: "Constraints",
    weight: 16,
    default: false,
    content:
      "Unter 180 Wörter. Keine Marketing-Sprache. Eine klare Handlungsaufforderung ganz oben.",
    hint: "Die unsichtbaren Leitplanken. Verhindert, dass Claude abschweift.",
  },
  {
    id: "format",
    label: "Format",
    weight: 16,
    default: false,
    content: "Betreffzeile, dann Fließtext. Keine Grußformel.",
    hint: "Die Form der Antwort. Wo die Struktur lebt.",
  },
];

function qualityLabel(q: number): string {
  if (q >= 90) return "reviewbereit";
  if (q >= 70) return "solide";
  if (q >= 40) return "dünn";
  if (q >= 20) return "schwach";
  return "ein Wunsch, kein Prompt";
}

export interface PromptOrreryWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly scenario?: string;
}

export function PromptOrreryWidget({
  lessonId,
  cpId,
  title = "Die Prompt-Schmiede",
  scenario = "Fünf Bausteine. Schalte jeden zu oder ab und beobachte, wie der Qualitätswert reagiert.",
}: PromptOrreryWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [active, setActive] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PARTS.map((p) => [p.id, p.default])),
  );
  const [output, setOutput] = useState<string | null>(null);
  const api = usePracticeApi();

  const activeParts = useMemo(
    () => PARTS.filter((p) => active[p.id]),
    [active],
  );
  const quality = Math.min(
    100,
    activeParts.reduce((sum, p) => sum + p.weight, 0),
  );
  const assembled = useMemo(
    () =>
      activeParts.map((p) => `${p.label.toUpperCase()}\n${p.content}`).join("\n\n"),
    [activeParts],
  );

  // Awarding: once the learner reaches a production-ready (>=80) assembly, the
  // checkpoint is earned. Works fully offline (no API needed).
  useEffect(() => {
    if (quality >= 80) complete();
  }, [quality, complete]);

  const toggle = (id: string) =>
    setActive((a) => ({ ...a, [id]: !a[id] }));

  const run = async () => {
    if (!assembled.trim()) return;
    setOutput(null);
    const text = await api.complete(assembled);
    setOutput(text);
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
    <WidgetFrame
      kindLabel="Prompt-Schmiede"
      title={title}
      scenario={scenario}
      done={done}
      xpLabel="+15 XP"
    >
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
        <div role="group" aria-label="Prompt-Bausteine" className="flex flex-col gap-2">
          {PARTS.map((p) => {
            const on = !!active[p.id];
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(p.id)}
                className={cn(
                  "flex flex-col gap-0.5 border-2 px-3 py-2 text-left transition-colors",
                  on
                    ? "border-brand-orange bg-brand-orange/10"
                    : "border-border bg-background hover:border-brand-orange/60",
                )}
              >
                <span className="flex items-center justify-between font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-brand-orange">
                  {p.label}
                  <span className="text-muted-foreground">
                    {on ? "an" : "aus"} · +{p.weight}
                  </span>
                </span>
                <span className="text-[12.5px] leading-[1.45] text-muted-foreground">
                  {p.hint}
                </span>
              </button>
            );
          })}
        </div>

        <div className="min-w-[150px] border-2 border-border bg-background p-4 text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Qualität
          </p>
          <p className={cn("mt-1 font-mono text-[34px] font-bold leading-none", qColor)}>
            {quality}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            {qualityLabel(quality)}
          </p>
          <div className="mt-3 h-[5px] w-full overflow-hidden rounded-full bg-border">
            <div
              className={cn("h-full transition-[width] duration-500", qBar)}
              style={{ width: `${quality}%` }}
            />
          </div>
        </div>
      </div>

      <details className="mt-5 border-l-[3px] border-border pl-3">
        <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          Zusammengesetzter Prompt
        </summary>
        <pre className="mt-2 whitespace-pre-wrap font-mono text-[12.5px] leading-[1.55] text-foreground">
          {assembled || "(noch nichts ausgewählt)"}
        </pre>
      </details>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={api.loading || !assembled.trim()}
          className={cn(
            "border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-foreground shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0",
          )}
        >
          {api.loading ? "Läuft …" : "Prompt live ausführen"}
        </button>
      </div>

      {output && (
        <pre className="mt-3 max-h-[280px] overflow-auto whitespace-pre-wrap border-2 border-border bg-background p-4 text-[13px] leading-[1.6] text-foreground">
          {output}
        </pre>
      )}
      <LiveNote available={api.available} />
    </WidgetFrame>
  );
}

export default PromptOrreryWidget;
