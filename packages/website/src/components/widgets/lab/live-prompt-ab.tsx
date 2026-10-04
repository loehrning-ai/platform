"use client";

import { useState, type JSX } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Check, Play, Radio, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePracticeApi } from "@/components/widgets/practice/use-practice-api";
import {
  LabButton,
  LabLive,
  LabSurface,
  LabVerdictPill,
  labLocale,
  useLabCompletion,
  type LabBaseProps,
} from "./_lab";

export interface PromptVariant {
  readonly label: string;
  readonly prompt: string;
  /**
   * Pre-generated output shown when live mode is unavailable. Authored once
   * (synthetic), labelled on screen as a recorded example.
   */
  readonly recorded: string;
}

export interface PromptRubricCriterion {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  /** Ground truth for the recorded outputs: does A / B meet it? */
  readonly expected: { readonly a: boolean; readonly b: boolean };
}

export interface LivePromptAbProps extends LabBaseProps {
  /** What both prompts are trying to achieve. */
  readonly task: string;
  /** Synthetic source material appended to both prompts. */
  readonly input?: { readonly label: string; readonly text: string };
  readonly variants: readonly [PromptVariant, PromptVariant];
  readonly rubric: readonly PromptRubricCriterion[];
  /** Let the learner edit prompt B (only sent when live mode works). */
  readonly allowEdit?: boolean;
}

type Mode = "idle" | "loading" | "live" | "recorded";
type Side = "a" | "b";
type Marks = Readonly<Record<string, Partial<Record<Side, boolean>>>>;

const COPY = {
  de: {
    region: "Prompt-Vergleich",
    material: "Ausgangsmaterial",
    prompt: "Prompt",
    output: "Ausgabe",
    run: "Beide ausführen",
    running: "Läuft …",
    liveBadge: "Live-Modell",
    recordedBadge: "Aufgezeichnetes Beispiel",
    recordedNote:
      "Live-Modus nicht verfügbar (nur mit Lernkonto und wenn freigeschaltet). Du siehst vorab erzeugte Beispielausgaben, keine Live-Antwort.",
    liveNote: "Live-Ausgaben variieren. Bewerte, was du siehst.",
    rubric: "Bewerte beide Ausgaben",
    yes: "erfüllt",
    no: "nicht erfüllt",
    evaluate: "Auswerten",
    again: "Nochmal",
    agreement: (n: number, total: number) => `${n} von ${total} Urteilen stimmen mit der Musterlösung überein`,
    liveScore: (label: string, n: number, total: number) => `${label}: ${n}/${total} Kriterien`,
    edit: "Prompt B bearbeiten",
    expectedLabel: "Musterlösung",
    mark: (criterion: string, label: string) => `${criterion}: ${label}`,
  },
  en: {
    region: "Prompt comparison",
    material: "Source material",
    prompt: "Prompt",
    output: "Output",
    run: "Run both",
    running: "Running …",
    liveBadge: "Live model",
    recordedBadge: "Recorded example",
    recordedNote:
      "Live mode unavailable (requires a learning account and must be enabled). You are seeing pre-generated example outputs, not a live answer.",
    liveNote: "Live outputs vary. Judge what you see.",
    rubric: "Judge both outputs",
    yes: "met",
    no: "not met",
    evaluate: "Evaluate",
    again: "Again",
    agreement: (n: number, total: number) => `${n} of ${total} judgements match the model answer`,
    liveScore: (label: string, n: number, total: number) => `${label}: ${n}/${total} criteria`,
    edit: "Edit prompt B",
    expectedLabel: "Model answer",
    mark: (criterion: string, label: string) => `${criterion}: ${label}`,
  },
} as const;

/** Compose the text sent to the model (exported for tests). */
export function composePrompt(prompt: string, input?: LivePromptAbProps["input"]): string {
  return input ? `${prompt.trim()}\n\n${input.label}:\n${input.text.trim()}` : prompt.trim();
}

/** Count judgements matching the recorded ground truth (exported for tests). */
export function rubricAgreement(rubric: readonly PromptRubricCriterion[], marks: Marks): number {
  let agree = 0;
  for (const criterion of rubric) {
    for (const side of ["a", "b"] as const) {
      if (marks[criterion.id]?.[side] === criterion.expected[side]) agree += 1;
    }
  }
  return agree;
}

export function LivePromptAbWidget({
  task,
  input,
  variants,
  rubric,
  allowEdit = false,
  lessonId,
  cpId,
  locale,
  title,
}: LivePromptAbProps): JSX.Element {
  const lang = labLocale(locale);
  const copy = COPY[lang];
  const api = usePracticeApi({ locale: lang });
  const { complete } = useLabCompletion({ lessonId, cpId });
  const [mode, setMode] = useState<Mode>("idle");
  const [outputs, setOutputs] = useState<Record<Side, string>>({ a: "", b: "" });
  const [promptB, setPromptB] = useState(variants[1].prompt);
  const [marks, setMarks] = useState<Marks>({});
  const [revealed, setRevealed] = useState(false);

  const run = async () => {
    setMode("loading");
    setRevealed(false);
    setMarks({});
    const [a, b] = await Promise.all([
      api.complete(composePrompt(variants[0].prompt, input)),
      api.complete(composePrompt(promptB, input)),
    ]);
    if (a !== null && b !== null) {
      setOutputs({ a, b });
      setMode("live");
    } else {
      setOutputs({ a: variants[0].recorded, b: variants[1].recorded });
      setPromptB(variants[1].prompt);
      setMode("recorded");
    }
  };

  const setMark = (criterionId: string, side: Side, value: boolean) => {
    if (revealed) return;
    setMarks((previous) => ({
      ...previous,
      [criterionId]: { ...previous[criterionId], [side]: value },
    }));
  };

  const allMarked = rubric.every(
    (criterion) => marks[criterion.id]?.a !== undefined && marks[criterion.id]?.b !== undefined,
  );
  const agreement = rubricAgreement(rubric, marks);
  const total = rubric.length * 2;
  const liveScore = (side: Side) => rubric.filter((criterion) => marks[criterion.id]?.[side]).length;

  const evaluate = () => {
    setRevealed(true);
    complete();
  };

  const hasOutputs = mode === "live" || mode === "recorded";
  const sides: readonly Side[] = ["a", "b"];

  return (
    <LabSurface label={copy.region} title={title}>
      <p className="text-[15px] font-semibold text-foreground">{task}</p>
      {input ? (
        <details className="mt-3 rounded-2xl border border-lab-line bg-paper" open>
          <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold text-foreground">
            {copy.material}: {input.label}
          </summary>
          <p className="whitespace-pre-line px-4 pb-4 text-sm leading-relaxed text-foreground/90">{input.text}</p>
        </details>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {sides.map((side, index) => {
          const variant = variants[index];
          const editable = side === "b" && allowEdit;
          return (
            <div key={side} className="flex min-w-0 flex-col rounded-2xl border border-lab-line bg-card p-4 shadow-lab-sm">
              <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-lab-accent-soft text-xs text-lab-accent">
                  {side.toUpperCase()}
                </span>
                {variant.label}
              </p>
              {editable ? (
                <label className="mt-2 block">
                  <span className="sr-only">{copy.edit}</span>
                  <textarea
                    value={promptB}
                    onChange={(event) => setPromptB(event.target.value)}
                    rows={6}
                    maxLength={3000}
                    className="min-h-11 w-full resize-y rounded-xl border border-lab-line bg-paper p-3 font-mono text-[13px] leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
                  />
                </label>
              ) : (
                <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-inset/70 p-3 font-mono text-[13px] leading-relaxed text-foreground">
                  {variant.prompt}
                </pre>
              )}
              <AnimatePresence initial={false}>
                {hasOutputs ? (
                  <m.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.12 }}
                    className="mt-3"
                  >
                    <p className="flex items-center justify-between gap-2 text-label text-muted-foreground">
                      {copy.output}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                          mode === "live" ? "bg-lab-good-soft text-lab-good" : "bg-lab-warn-soft text-lab-warn",
                        )}
                      >
                        <Radio className="h-3 w-3" aria-hidden="true" />
                        {mode === "live" ? copy.liveBadge : copy.recordedBadge}
                      </span>
                    </p>
                    <p
                      data-output-side={side}
                      className="mt-1 whitespace-pre-line rounded-xl border border-lab-line bg-paper p-3 text-sm leading-relaxed text-foreground"
                    >
                      {outputs[side]}
                    </p>
                  </m.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <LabButton onClick={run} disabled={mode === "loading"}>
          <Play className="h-4 w-4" aria-hidden="true" />
          {mode === "loading" ? copy.running : copy.run}
        </LabButton>
        <LabLive className="min-w-0 flex-1 text-sm text-muted-foreground">
          {mode === "recorded" ? copy.recordedNote : mode === "live" ? copy.liveNote : null}
        </LabLive>
      </div>

      {hasOutputs ? (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-5 rounded-2xl border border-lab-line bg-paper p-4"
        >
          <p className="text-label text-muted-foreground">{copy.rubric}</p>
          <ul className="mt-2 divide-y divide-lab-line">
            {rubric.map((criterion) => (
              <li key={criterion.id} data-criterion-id={criterion.id} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{criterion.label}</p>
                  {criterion.hint ? <p className="text-xs text-muted-foreground">{criterion.hint}</p> : null}
                </div>
                {sides.map((side) => {
                  const value = marks[criterion.id]?.[side];
                  const expected = criterion.expected[side];
                  const showTruth = revealed && mode === "recorded";
                  return (
                    <div
                      key={side}
                      role="group"
                      aria-label={copy.mark(criterion.label, side.toUpperCase())}
                      className="flex items-center gap-1"
                    >
                      <span aria-hidden="true" className="w-5 text-center text-xs font-bold text-muted-foreground">
                        {side.toUpperCase()}
                      </span>
                      {[true, false].map((option) => (
                        <button
                          key={String(option)}
                          type="button"
                          aria-pressed={value === option}
                          onClick={() => setMark(criterion.id, side, option)}
                          className={cn(
                            "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 text-xs font-semibold transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent",
                            value === option
                              ? option
                                ? "border-lab-good bg-lab-good text-paper"
                                : "border-lab-bad bg-lab-bad text-paper"
                              : "border-lab-line bg-card text-foreground hover:border-lab-accent/50",
                            showTruth && expected === option && value !== option && "ring-2 ring-lab-accent",
                          )}
                        >
                          {option ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
                          <span className="sr-only">{option ? copy.yes : copy.no}</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <LabLive>
              {revealed ? (
                mode === "recorded" ? (
                  <LabVerdictPill tone={agreement >= total - 2 ? "good" : "warn"}>
                    {copy.agreement(agreement, total)}
                  </LabVerdictPill>
                ) : (
                  <span className="flex flex-wrap gap-2">
                    <LabVerdictPill tone="neutral">{copy.liveScore(variants[0].label, liveScore("a"), rubric.length)}</LabVerdictPill>
                    <LabVerdictPill tone="neutral">{copy.liveScore(variants[1].label, liveScore("b"), rubric.length)}</LabVerdictPill>
                  </span>
                )
              ) : null}
            </LabLive>
            {revealed ? (
              <LabButton tone="ghost" onClick={() => { setRevealed(false); setMarks({}); }}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {copy.again}
              </LabButton>
            ) : (
              <LabButton onClick={evaluate} disabled={!allMarked}>
                {copy.evaluate}
              </LabButton>
            )}
          </div>
          {revealed && mode === "recorded" ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {copy.expectedLabel}: {lang === "en" ? "a ring marks the answer you missed." : "ein Ring markiert die Antwort, die gefehlt hat."}
            </p>
          ) : null}
        </m.div>
      ) : null}
    </LabSurface>
  );
}
