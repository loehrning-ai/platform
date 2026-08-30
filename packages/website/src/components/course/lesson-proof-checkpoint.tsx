"use client";

import { useId, useState, type FormEvent, type JSX } from "react";
import { Check, Circle } from "lucide-react";
import type { Locale } from "@/lib/i18n/locale";

const MINIMUM_DECISION_CHARACTERS = 12;
const MINIMUM_DECISION_WORDS = 3;
const FILLER_TOKENS = new Set([
  "a",
  "asdf",
  "bla",
  "blah",
  "blabla",
  "ipsum",
  "lorem",
  "n",
  "na",
  "qwerty",
  "test",
]);

const COPY = {
  de: {
    sectionOpen: "Abschnitt als geprüft bestätigen",
    sectionDone: "Abschnitt geprüft",
    eyebrow: "Transfer-Checkpoint",
    title: "Lege deinen nächsten Schritt fest.",
    body: "Notiere eine Prognose, Entscheidung, einen Test oder eine Änderung, die du in die Praxis übernimmst.",
    label: "Entscheidung oder Änderung",
    placeholder: "Ich werde … ändern und mit … prüfen.",
    validation: "Mindestens 3 Wörter und 12 Zeichen.",
    privacy:
      "Deine Antwort wird weder gespeichert noch synchronisiert. Nur der Kursfortschritt wird festgehalten.",
    boundary:
      "Dieser Checkpoint dokumentiert Navigation, nicht Beherrschung oder Zertifizierung.",
    save: "Checkpoint speichern",
    loading: "Lernstand wird geladen",
    completed: "Navigations-Checkpoint gespeichert",
    completedBody:
      "Der Lektionsfortschritt ist erfasst. Das ist keine Kompetenzprüfung und kein Nachweis.",
  },
  en: {
    sectionOpen: "Confirm section reviewed",
    sectionDone: "Section reviewed",
    eyebrow: "Transfer checkpoint",
    title: "State your next move.",
    body: "Name one prediction, decision, test, or revision you will carry into real work.",
    label: "Decision or revision",
    placeholder: "I will revise … and test it by …",
    validation: "Use at least 3 words and 12 characters.",
    privacy:
      "Your response is not saved or synced. Only the course-progress checkpoint is recorded.",
    boundary:
      "This checkpoint records navigation, not mastery or certification.",
    save: "Save checkpoint",
    loading: "Loading progress",
    completed: "Navigation checkpoint saved",
    completedBody:
      "Lesson progress is recorded. This is not a mastery assessment or credential.",
  },
} as const;

export function isMeaningfulTransferDecision(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < MINIMUM_DECISION_CHARACTERS) return false;
  const tokens = normalized
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length < MINIMUM_DECISION_WORDS) return false;
  if (tokens.every((token) => FILLER_TOKENS.has(token))) return false;

  const tokenCounts = new Map<string, number>();
  for (const token of tokens) {
    tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);
  }
  const highestRepetition = Math.max(...tokenCounts.values());
  return highestRepetition / tokens.length < 0.6;
}

interface LessonSectionCheckpointProps {
  readonly locale: Locale;
  readonly checked: boolean;
  readonly progressReady: boolean;
  readonly onCheck: () => void;
}

/**
 * A learner-confirmed navigation marker. The persisted state retains the
 * legacy `sectionsRead` identity, but the interface no longer claims that a
 * click proves reading or understanding.
 */
export function LessonSectionCheckpoint({
  locale,
  checked,
  progressReady,
  onCheck,
}: LessonSectionCheckpointProps): JSX.Element {
  const copy = COPY[locale];

  return (
    <button
      type="button"
      onClick={onCheck}
      disabled={!progressReady || checked}
      aria-busy={!progressReady || undefined}
      aria-pressed={checked}
      className="inline-flex min-h-11 max-w-full items-center gap-2 border-b border-border px-0 text-left text-[13px] font-medium text-muted-foreground outline-none transition-colors hover:border-brand-orange hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default disabled:text-risk-green"
    >
      {checked ? (
        <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <Circle className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span>{checked ? copy.sectionDone : copy.sectionOpen}</span>
    </button>
  );
}

interface LessonProofCheckpointProps {
  readonly locale: Locale;
  readonly completed: boolean;
  readonly progressReady: boolean;
  readonly prerequisitesMet: boolean;
  readonly prerequisiteHint: string;
  readonly onCommit: () => void;
}

/**
 * A compact transfer gate for lesson progress. The learner must formulate a
 * concrete decision before the existing completion boolean is recorded. The
 * response intentionally remains ephemeral: no prose enters local storage,
 * account synchronization, analytics, or certificate data.
 */
export function LessonProofCheckpoint({
  locale,
  completed,
  progressReady,
  prerequisitesMet,
  prerequisiteHint,
  onCommit,
}: LessonProofCheckpointProps): JSX.Element {
  const copy = COPY[locale];
  const inputId = useId();
  const helpId = `${inputId}-help`;
  const [decision, setDecision] = useState("");
  const decisionReady = isMeaningfulTransferDecision(decision);
  const canCommit = progressReady && prerequisitesMet && decisionReady;

  const commit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCommit) return;
    onCommit();
  };

  if (completed) {
    return (
      <section
        data-lesson-proof-checkpoint="complete"
        className="border border-border bg-brand-teal/10 p-4"
        aria-live="polite"
      >
        <p className="font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-risk-green">
          {copy.completed}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {copy.completedBody}
        </p>
      </section>
    );
  }

  return (
    <section
      data-lesson-proof-checkpoint="open"
      className="border border-border bg-background"
    >
      <div className="border-b border-border p-4">
        <p className="font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-brand-orange">
          {copy.eyebrow}
        </p>
        <h2 className="mt-1 text-[19px] font-semibold tracking-[-0.02em] text-foreground">
          {copy.title}
        </h2>
        <p className="mt-1 max-w-[62ch] text-[14px] leading-relaxed text-muted-foreground">
          {copy.body}
        </p>
      </div>

      <form onSubmit={commit} className="space-y-3 p-4">
        <label
          htmlFor={inputId}
          className="block text-[13px] font-semibold text-foreground"
        >
          {copy.label}
        </label>
        <textarea
          id={inputId}
          value={decision}
          onChange={(event) => setDecision(event.currentTarget.value)}
          placeholder={copy.placeholder}
          rows={3}
          maxLength={240}
          autoComplete="off"
          disabled={!progressReady || !prerequisitesMet}
          aria-describedby={helpId}
          className="w-full resize-y border border-border bg-card px-3 py-2 text-[14px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/30 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div
          id={helpId}
          className="grid gap-1 text-[12px] leading-relaxed text-muted-foreground sm:grid-cols-2"
        >
          <p>{prerequisitesMet ? copy.validation : prerequisiteHint}</p>
          <p className="sm:text-right">{copy.privacy}</p>
        </div>
        <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[48ch] text-[12px] leading-relaxed text-muted-foreground">
            {copy.boundary}
          </p>
          <button
            type="submit"
            disabled={!canCommit}
            aria-busy={!progressReady || undefined}
            className="inline-flex min-h-11 shrink-0 items-center justify-center border border-foreground bg-brand-orange px-4 text-[12px] font-bold uppercase tracking-[0.08em] text-white outline-none transition-colors hover:bg-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:border-border disabled:bg-track disabled:text-muted-foreground"
          >
            {!progressReady ? copy.loading : copy.save}
          </button>
        </div>
      </form>
    </section>
  );
}
