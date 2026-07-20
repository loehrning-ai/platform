"use client";

import { useState, type JSX } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { useCheckpoint } from "@/lib/progress";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "./_frame";

/**
 * FailureTagger — classify several real-looking KI outputs by HOW they went
 * wrong. The core move of eval work: you cannot fix a class of failure until
 * you can name it. Ported from `claude/js/widgets.js:1110` (FailureTagger),
 * rewritten with German Mittelstand scenarios.
 *
 *  - Each case is a radiogroup of failure-mode pills (native buttons → keyboard
 *    + a11y for free).
 *  - Fully deterministic: the score is a pure comparison against the authored
 *    `correct` mode. No Date.now / Math.random.
 *  - Awards the checkpoint once on submit if `passThreshold` cases are right.
 *  - The only motion is the feedback reveal, gated by `prefers-reduced-motion`.
 *
 * German copy throughout. No em dashes.
 */

export type FailureModeId =
  | "halluzination"
  | "verweigerung"
  | "formatdrift"
  | "themaverfehlung";

export interface FailureMode {
  readonly id: FailureModeId;
  readonly label: string;
  readonly desc: string;
}

export interface FailureCase {
  readonly id: string;
  /** The prompt the user gave. */
  readonly prompt: string;
  /** The (broken) model output. */
  readonly output: string;
  /** The author ground-truth failure mode. */
  readonly correct: FailureModeId;
  /** One-line explanation revealed after submit. */
  readonly why: string;
}

/**
 * Chrome-copy override (plan 008 stage 3): additive, default-preserving —
 * every field defaults to the original German literal so the 3 existing
 * native courses render byte-identical when `copy` is omitted.
 */
export interface FailureTaggerWidgetCopy {
  readonly kindLabel: string;
  readonly promptLabel: string;
  readonly outputLabel: string;
  readonly tagAriaLabelPrefix: string;
  readonly correctSuffix: string;
  readonly taggedSuffix: string;
  readonly submitLabel: string;
  readonly passedLabel: string;
  readonly retryPromptLabel: string;
  readonly resetLabel: string;
  readonly perCaseCorrectLabel: string;
  readonly perCaseWrongLabel: string;
}

const DEFAULT_COPY: FailureTaggerWidgetCopy = {
  kindLabel: "Eval-Drill",
  promptLabel: "Auftrag",
  outputLabel: "KI-Antwort",
  tagAriaLabelPrefix: "Fehlertyp für:",
  correctSuffix: "richtig",
  taggedSuffix: "zugeordnet",
  submitLabel: "Auswerten",
  passedLabel: "Bestanden",
  retryPromptLabel: "Nochmal ansehen",
  resetLabel: "Zurücksetzen",
  perCaseCorrectLabel: "Richtig.",
  perCaseWrongLabel: "Daneben.",
};

export interface FailureTaggerWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly scenario?: string;
  /** Override the default cases (e.g. a course-specific set). */
  readonly cases?: readonly FailureCase[];
  /** Override the failure-mode legend. */
  readonly modes?: readonly FailureMode[];
  /** Minimum correct answers to award XP. Default: all but one. */
  readonly passThreshold?: number;
  readonly copy?: Partial<FailureTaggerWidgetCopy>;
}

const DEFAULT_MODES: readonly FailureMode[] = [
  {
    id: "halluzination",
    label: "Halluzination",
    desc: "Hat selbstbewusst eine Tatsache erfunden.",
  },
  {
    id: "verweigerung",
    label: "Übervorsicht",
    desc: "Hat etwas verweigert, das harmlos war.",
  },
  {
    id: "formatdrift",
    label: "Formatdrift",
    desc: "Hat die geforderte Form ignoriert.",
  },
  {
    id: "themaverfehlung",
    label: "Thema verfehlt",
    desc: "Ist vom eigentlichen Auftrag abgewichen.",
  },
];

/**
 * German Mittelstand scenarios: a Steuerberatung, a Maschinenbauer, a
 * Handwerksbetrieb and a Praxis. Each output is broken in exactly one way.
 */
const DEFAULT_CASES: readonly FailureCase[] = [
  {
    id: "c1",
    prompt:
      "Wie hoch ist der aktuelle Kontostand unseres Geschäftskontos bei der Sparkasse?",
    output:
      "Ihr Geschäftskonto weist aktuell einen Stand von 48.213,77 EUR auf, zuletzt aktualisiert am 14. Mai um 09:42 Uhr.",
    correct: "halluzination",
    why: "Das Modell hat keinen Zugriff auf Ihr Bankkonto. Saldo, Datum und Uhrzeit sind frei erfunden, klingen aber plausibel.",
  },
  {
    id: "c2",
    prompt:
      "Erstelle eine Beispiel-Kundenliste mit drei fiktiven Firmen: Name, Branche, Ansprechpartner.",
    output:
      "Das kann ich leider nicht tun, da ich keine personenbezogenen Daten zu echten Personen oder Unternehmen generieren darf.",
    correct: "verweigerung",
    why: "Die Bitte war völlig harmlos: ausdrücklich fiktive Beispieldaten. Das ist eine klassische, übervorsichtige Verweigerung.",
  },
  {
    id: "c3",
    prompt:
      'Gib mir eine reine CSV-Tabelle mit drei Spalten "Artikelnummer", "Bezeichnung", "Lagerbestand". Keine Erklärung.',
    output:
      "Gerne! Hier ist eine Übersicht Ihrer Artikel:\n\n- A-1001: Schraube M6 (240 Stück)\n- A-1002: Dichtung NBR (58 Stück)\n- A-1003: Lagerbock (12 Stück)\n\nSoll ich noch etwas ergänzen?",
    correct: "formatdrift",
    why: "Es war ausdrücklich eine reine CSV ohne Erklärung gefordert. Geliefert wurde eine Aufzählung mit Begrüßung und Rückfrage.",
  },
  {
    id: "c4",
    prompt:
      "Fasse das angehängte Reklamationsschreiben des Kunden in einem Satz zusammen.",
    output:
      "Reklamationen lassen sich oft vermeiden. Hier sind sieben bewährte Tipps für ein gutes Beschwerdemanagement: 1. Schnell reagieren 2. Verständnis zeigen 3. Lösung anbieten ...",
    correct: "themaverfehlung",
    why: "Statt das konkrete Schreiben zusammenzufassen, ist das Modell auf allgemeine Ratschläge zum Beschwerdemanagement abgeschweift.",
  },
  {
    id: "c5",
    prompt:
      "Welche Version unserer internen Angebots-Vorlage ist gerade freigegeben?",
    output:
      "Aktuell freigegeben ist Version 3.2 der Angebots-Vorlage, ausgerollt am 3. April mit überarbeitetem Rabatt-Block und neuem Footer.",
    correct: "halluzination",
    why: "Das Modell kann Ihre interne Versionierung nicht kennen. Versionsnummer, Datum und Änderungen sind erfunden.",
  },
];

export function FailureTaggerWidget({
  lessonId,
  cpId,
  title = "Benenne den Fehlertyp",
  scenario = "Fünf echt aussehende KI-Antworten, jede auf ihre Art kaputt. Ordne jeder zu, wie sie schiefgelaufen ist. Wer einen Fehlertyp benennen kann, kann ihn auch abstellen.",
  cases = DEFAULT_CASES,
  modes = DEFAULT_MODES,
  passThreshold,
  copy,
}: FailureTaggerWidgetProps): JSX.Element {
  const chrome = { ...DEFAULT_COPY, ...copy };
  const reduced = useReducedMotion();
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [picks, setPicks] = useState<Readonly<Record<string, FailureModeId>>>(
    {},
  );
  const [submitted, setSubmitted] = useState(false);

  const threshold =
    passThreshold ?? Math.max(1, cases.length - 1);
  const allPicked = cases.length > 0 && cases.every((c) => picks[c.id]);
  const correctCount = cases.filter((c) => picks[c.id] === c.correct).length;
  const passed = correctCount >= threshold;

  const pick = (caseId: string, modeId: FailureModeId) => {
    if (submitted) return;
    setPicks({ ...picks, [caseId]: modeId });
  };

  const submit = () => {
    if (!allPicked) return;
    setSubmitted(true);
    if (passed) complete();
  };

  const reset = () => {
    setPicks({});
    setSubmitted(false);
  };

  return (
    <WidgetFrame
      kindLabel={chrome.kindLabel}
      title={title}
      scenario={scenario}
      done={done}
      xpLabel="+25 XP"
    >
      {/* Legend */}
      <div className="mb-5 grid gap-3 border-2 border-border bg-background p-3 sm:grid-cols-2">
        {modes.map((m) => (
          <div key={m.id} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="mt-1 h-2.5 w-2.5 shrink-0 bg-brand-orange"
            />
            <span>
              <span className="block text-[13.5px] font-semibold text-foreground">
                {m.label}
              </span>
              <span className="block text-[12px] leading-[1.45] text-muted-foreground">
                {m.desc}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Cases */}
      <div className="flex flex-col gap-3">
        {cases.map((c) => {
          const picked = picks[c.id];
          const isCorrect = submitted && picked === c.correct;
          const isWrong = submitted && picked != null && picked !== c.correct;
          return (
            <div
              key={c.id}
              data-state={
                isCorrect ? "correct" : isWrong ? "wrong" : "pending"
              }
              className={cn(
                "border-2 bg-background p-4 transition-colors",
                isCorrect && "border-[#22c55e]",
                isWrong && "border-destructive",
                !submitted && "border-border",
                submitted && !picked && "border-border",
              )}
            >
              <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {chrome.promptLabel}
              </p>
              <p className="mt-1 text-[13.5px] leading-[1.55] text-foreground">
                {c.prompt}
              </p>
              <p className="mt-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {chrome.outputLabel}
              </p>
              <p className="mt-1 whitespace-pre-wrap border-l-[3px] border-brand-orange/40 pl-3 text-[13.5px] leading-[1.55] text-foreground">
                {c.output}
              </p>

              <div
                role="radiogroup"
                aria-label={`${chrome.tagAriaLabelPrefix} ${c.prompt}`}
                className="mt-3 flex flex-wrap gap-2"
              >
                {modes.map((m) => {
                  const active = picked === m.id;
                  const markRight = submitted && m.id === c.correct;
                  const markWrong = submitted && active && m.id !== c.correct;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={submitted}
                      onClick={() => pick(c.id, m.id)}
                      className={cn(
                        "border-2 px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                        markRight &&
                          "border-[#22c55e] bg-[#22c55e]/10 text-foreground",
                        markWrong &&
                          "border-destructive bg-destructive/10 text-foreground",
                        !submitted &&
                          active &&
                          "border-brand-orange bg-brand-orange/10 text-foreground",
                        !submitted &&
                          !active &&
                          "border-border bg-background text-muted-foreground hover:border-brand-orange/60",
                        submitted &&
                          !active &&
                          !markRight &&
                          "border-border bg-background text-muted-foreground opacity-60",
                      )}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {submitted && (
                  <m.p
                    initial={reduced ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { duration: 0.26, ease: EASE_OUT_EXPO }
                    }
                    className="mt-3 text-[13px] leading-[1.55] text-muted-foreground"
                  >
                    <span
                      className={cn(
                        "font-semibold",
                        isCorrect ? "text-[#22c55e]" : "text-destructive",
                      )}
                    >
                      {isCorrect ? chrome.perCaseCorrectLabel : chrome.perCaseWrongLabel}
                    </span>{" "}
                    {c.why}
                  </m.p>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Actions + score */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground">
          {submitted
            ? `${correctCount} / ${cases.length} ${chrome.correctSuffix}`
            : `${Object.keys(picks).length} / ${cases.length} ${chrome.taggedSuffix}`}
        </span>
        {!submitted ? (
          <button
            type="button"
            onClick={submit}
            disabled={!allPicked}
            className={cn(
              "inline-flex items-center gap-1.5 border-2 border-foreground px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow]",
              allPicked
                ? "bg-brand-orange text-white hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
                : "cursor-not-allowed bg-muted text-muted-foreground opacity-60 shadow-none",
            )}
          >
            {chrome.submitLabel}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em]",
                passed ? "text-[#22c55e]" : "text-brand-amber",
              )}
            >
              {passed ? (
                <CheckCircle2 size={14} />
              ) : (
                <XCircle size={14} />
              )}
              {passed ? chrome.passedLabel : chrome.retryPromptLabel}
            </span>
            <button
              type="button"
              onClick={reset}
              className="border-2 border-foreground bg-background px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-foreground shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
            >
              {chrome.resetLabel}
            </button>
          </div>
        )}
      </div>
    </WidgetFrame>
  );
}

export default FailureTaggerWidget;
