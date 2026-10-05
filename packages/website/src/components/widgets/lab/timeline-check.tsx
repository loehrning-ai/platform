"use client";

import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { m } from "framer-motion";
import { Check, Clock, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LAB_EASE,
  LAB_SPRING,
  LabButton,
  LabLive,
  LabSurface,
  LabVerdictPill,
  labLocale,
  useLabCompletion,
  type LabBaseProps,
} from "./_lab";
import type { Locale } from "@/lib/i18n/locale";

/**
 * TimelineCheck: a live legal timeline. Milestones carry ISO dates; the
 * widget computes "applies already" or "still to come" against today's date
 * on the learner's device, so the answer key ages with the law instead of
 * with the authoring date. The learner judges each obligation first and gets
 * the computed truth with the day count right after.
 */

export interface TimelineMilestone {
  readonly id: string;
  /** ISO date, YYYY-MM-DD. */
  readonly date: string;
  readonly title: string;
  readonly body?: string;
  readonly source?: string;
}

export interface TimelineQuestion {
  readonly id: string;
  /** The obligation, phrased without its date. */
  readonly text: string;
  /** Milestone id that sets the date the obligation applies from. */
  readonly milestone: string;
  /** Why this obligation hangs on that milestone. */
  readonly why: string;
}

export interface TimelineCheckProps extends LabBaseProps {
  readonly milestones: readonly TimelineMilestone[];
  readonly questions: readonly TimelineQuestion[];
  /** Share of first answers that must be right to count as done. Default 0. */
  readonly passRatio?: number;
  /** Fixed "today" (YYYY-MM-DD) for previews and tests. Omit in lesson content. */
  readonly today?: string;
  readonly note?: string;
}

export type TimelineAnswer = "applies" | "pending";

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse YYYY-MM-DD into a UTC midnight timestamp, or NaN. */
export function parseIsoDay(value: string): number {
  const match = ISO_DATE.exec(value);
  if (!match) return Number.NaN;
  const [, year, month, day] = match;
  const time = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const check = new Date(time);
  return check.getUTCDate() === Number(day) && check.getUTCMonth() === Number(month) - 1
    ? time
    : Number.NaN;
}

/** Today's calendar day on this device, as UTC midnight. */
export function localToday(now: Date = new Date()): number {
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Whole days from `today` to `date` (negative when the date has passed). */
export function daysUntil(date: string, today: number): number {
  return Math.round((parseIsoDay(date) - today) / DAY_MS);
}

/** The computed answer for a milestone date on a given day. */
export function timelineTruth(date: string, today: number): TimelineAnswer {
  return daysUntil(date, today) <= 0 ? "applies" : "pending";
}

function formatDay(time: number, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(time);
}

const COPY = {
  de: {
    region: "Zeitstrahl prüfen",
    today: (day: string) => `Heute: ${day}`,
    computing: "Heutiges Datum wird ermittelt …",
    obligations: "Gilt das heute schon?",
    applies: "Gilt schon",
    pending: "Kommt noch",
    right: "Richtig.",
    wrong: "Daneben.",
    since: (day: string, days: number) =>
      days === 0 ? `Gilt ab heute, dem ${day}.` : `Gilt seit dem ${day}, vor ${days} Tagen.`,
    from: (day: string, days: number) => `Gilt ab dem ${day}, in ${days} Tagen.`,
    progress: (n: number, total: number) => `${n} von ${total} beantwortet`,
    score: (right: number, total: number) => `${right} von ${total} richtig eingeschätzt`,
    belowPass: "Noch nicht sicher genug. Begründungen lesen und erneut versuchen.",
    again: "Nochmal",
    timeline: "Zeitstrahl",
    todayMarker: "Heute",
    past: "gilt",
    future: (days: number) => `in ${days} Tagen`,
    pinned: "Zugeordnete Fälle",
    source: "Grundlage",
  },
  en: {
    region: "Check the timeline",
    today: (day: string) => `Today: ${day}`,
    computing: "Working out today's date …",
    obligations: "Does this apply today?",
    applies: "Applies already",
    pending: "Still to come",
    right: "Correct.",
    wrong: "Not quite.",
    since: (day: string, days: number) =>
      days === 0 ? `Applies from today, ${day}.` : `Applies since ${day}, ${days} days ago.`,
    from: (day: string, days: number) => `Applies from ${day}, in ${days} days.`,
    progress: (n: number, total: number) => `${n} of ${total} answered`,
    score: (right: number, total: number) => `${right} of ${total} judged correctly`,
    belowPass: "Not confident enough yet. Read the reasons and try again.",
    again: "Try again",
    timeline: "Timeline",
    todayMarker: "Today",
    past: "applies",
    future: (days: number) => `in ${days} days`,
    pinned: "Assigned cases",
    source: "Basis",
  },
} as const;

export function TimelineCheckWidget({
  milestones,
  questions,
  passRatio = 0,
  today: fixedToday,
  note,
  lessonId,
  cpId,
  locale,
  title,
}: TimelineCheckProps): JSX.Element {
  const lang = labLocale(locale);
  const copy = COPY[lang];
  const { complete } = useLabCompletion({ lessonId, cpId });
  // Today is read on the client only, so server and client render the same
  // markup and the key follows the learner's calendar day.
  const [today, setToday] = useState<number | null>(() =>
    fixedToday ? parseIsoDay(fixedToday) : null,
  );
  useEffect(() => {
    if (!fixedToday) setToday(localToday());
  }, [fixedToday]);

  const [answers, setAnswers] = useState<Readonly<Record<string, TimelineAnswer>>>({});
  const summaryRef = useRef<HTMLDivElement>(null);
  const feedbackRefs = useRef(new Map<string, HTMLDivElement>());
  // The answer buttons disappear once a question is answered, so focus moves
  // to the feedback that replaced them (or to the summary after the last one).
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  useEffect(() => {
    if (!focusTarget) return;
    if (focusTarget === "summary") summaryRef.current?.focus();
    else feedbackRefs.current.get(focusTarget)?.focus();
    setFocusTarget(null);
  }, [focusTarget]);

  const sorted = useMemo(
    () => [...milestones].sort((a, b) => parseIsoDay(a.date) - parseIsoDay(b.date)),
    [milestones],
  );
  const milestoneById = useMemo(
    () => new Map(milestones.map((milestone) => [milestone.id, milestone])),
    [milestones],
  );

  const truthFor = (question: TimelineQuestion): TimelineAnswer | null => {
    const milestone = milestoneById.get(question.milestone);
    if (!milestone || today === null) return null;
    return timelineTruth(milestone.date, today);
  };

  const answered = questions.filter((question) => answers[question.id]).length;
  const right = questions.filter(
    (question) => answers[question.id] && answers[question.id] === truthFor(question),
  ).length;
  const finished = questions.length > 0 && answered === questions.length;
  const passed = finished && right / questions.length >= passRatio;

  const answer = (question: TimelineQuestion, value: TimelineAnswer) => {
    if (today === null || answers[question.id]) return;
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    const nextAnswered = questions.filter((entry) => next[entry.id]).length;
    if (nextAnswered === questions.length) {
      const nextRight = questions.filter(
        (entry) => next[entry.id] === truthFor(entry),
      ).length;
      setFocusTarget("summary");
      if (nextRight / questions.length >= passRatio) complete();
    } else {
      setFocusTarget(question.id);
    }
  };

  const reset = () => setAnswers({});

  const describe = (date: string): string => {
    if (today === null) return "";
    const days = daysUntil(date, today);
    const day = formatDay(parseIsoDay(date), lang);
    return days <= 0 ? copy.since(day, -days) : copy.from(day, days);
  };

  const todayIndex =
    today === null ? -1 : sorted.findIndex((milestone) => parseIsoDay(milestone.date) > today);
  const markerAt = todayIndex === -1 ? sorted.length : todayIndex;

  return (
    <LabSurface label={copy.region} title={title}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex min-h-9 items-center gap-2 rounded-full bg-lab-accent-soft px-4 text-sm font-semibold text-lab-accent">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {today === null ? copy.computing : copy.today(formatDay(today, lang))}
        </p>
        <p className="text-sm tabular-nums text-muted-foreground">
          {copy.progress(answered, questions.length)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Obligations */}
        <div>
          <h4 className="mb-2 text-label text-muted-foreground">{copy.obligations}</h4>
          <ul className="space-y-3">
            {questions.map((question) => {
              const given = answers[question.id];
              const truth = truthFor(question);
              const milestone = milestoneById.get(question.milestone);
              const isRight = given !== undefined && given === truth;
              return (
                <li
                  key={question.id}
                  data-question-id={question.id}
                  className={cn(
                    "rounded-2xl border p-4 transition-[background-color,border-color] duration-200",
                    given === undefined
                      ? "border-lab-line bg-card shadow-lab-sm"
                      : isRight
                        ? "border-lab-good/30 bg-lab-good-soft"
                        : "border-lab-bad/30 bg-lab-bad-soft",
                  )}
                >
                  <p className="text-[15px] font-semibold leading-snug text-foreground">{question.text}</p>
                  {given === undefined ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(["applies", "pending"] as const).map((value) => (
                        <button
                          key={value}
                          type="button"
                          disabled={today === null}
                          onClick={() => answer(question, value)}
                          className="min-h-11 rounded-full border border-lab-line bg-paper px-4 text-sm font-semibold text-foreground transition-[background-color,border-color] duration-150 hover:border-lab-accent/60 hover:bg-lab-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent disabled:cursor-not-allowed disabled:text-muted-foreground"
                        >
                          {value === "applies" ? copy.applies : copy.pending}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <LabLive>
                    {given !== undefined ? (
                      <m.div
                        ref={(node: HTMLDivElement | null) => {
                          if (node) feedbackRefs.current.set(question.id, node);
                          else feedbackRefs.current.delete(question.id);
                        }}
                        tabIndex={-1}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: LAB_EASE }}
                        className="mt-2 rounded-xl text-[15px] leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
                      >
                        <p
                          className={cn(
                            "flex flex-wrap items-center gap-x-2 font-semibold",
                            isRight ? "text-lab-good" : "text-lab-bad",
                          )}
                        >
                          {isRight ? (
                            <Check className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <X className="h-4 w-4" aria-hidden="true" />
                          )}
                          <span>{isRight ? copy.right : copy.wrong}</span>
                          <span>{milestone ? describe(milestone.date) : ""}</span>
                        </p>
                        <p className="mt-1 text-foreground">{question.why}</p>
                      </m.div>
                    ) : null}
                  </LabLive>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="mb-2 text-label text-muted-foreground">{copy.timeline}</h4>
          <ol className="relative space-y-3 border-l-2 border-lab-line pl-5">
            {sorted.map((milestone, index) => {
              const passed = today !== null && parseIsoDay(milestone.date) <= today;
              const days = today === null ? 0 : daysUntil(milestone.date, today);
              const pinned = questions.filter(
                (question) => question.milestone === milestone.id && answers[question.id],
              );
              return (
                <li key={milestone.id} className="relative">
                  {index === markerAt && today !== null ? (
                    <TodayMarker label={copy.todayMarker} />
                  ) : null}
                  <m.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3), ease: LAB_EASE }}
                    className={cn(
                      "rounded-2xl border p-3",
                      passed ? "border-lab-good/25 bg-lab-good-soft/60" : "border-lab-line bg-card",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute -left-[27px] top-4 h-3 w-3 rounded-full ring-4 ring-card",
                        passed ? "bg-lab-good" : "bg-lab-line",
                      )}
                    />
                    <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-bold tabular-nums text-foreground">
                        {formatDay(parseIsoDay(milestone.date), lang)}
                      </span>
                      {today !== null ? (
                        <span className={cn("text-xs font-semibold", passed ? "text-lab-good" : "text-muted-foreground")}>
                          {passed ? copy.past : copy.future(days)}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[15px] font-semibold leading-snug text-foreground">{milestone.title}</p>
                    {milestone.body ? (
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{milestone.body}</p>
                    ) : null}
                    {milestone.source ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {copy.source}: {milestone.source}
                      </p>
                    ) : null}
                    {pinned.length > 0 ? (
                      <ul aria-label={copy.pinned} className="mt-2 flex flex-wrap gap-1.5">
                        {pinned.map((question) => (
                          <m.li
                            key={question.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={LAB_SPRING}
                            className="rounded-full bg-lab-accent-soft px-2.5 py-1 text-xs font-semibold text-lab-accent"
                          >
                            {question.text}
                          </m.li>
                        ))}
                      </ul>
                    ) : null}
                  </m.div>
                </li>
              );
            })}
            {markerAt === sorted.length && today !== null ? (
              <li className="relative">
                <TodayMarker label={copy.todayMarker} />
              </li>
            ) : null}
          </ol>
        </div>
      </div>

      {finished ? (
        <m.div
          ref={summaryRef}
          tabIndex={-1}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-5 rounded-2xl border border-lab-line bg-card p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
        >
          <LabLive>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <LabVerdictPill tone={passed ? "good" : "warn"}>
                {copy.score(right, questions.length)}
              </LabVerdictPill>
              <LabButton tone="ghost" onClick={reset}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {copy.again}
              </LabButton>
            </div>
            {!passed ? <p className="mt-2 text-sm text-lab-warn">{copy.belowPass}</p> : null}
          </LabLive>
        </m.div>
      ) : null}

      {note ? <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{note}</p> : null}
    </LabSurface>
  );
}

function TodayMarker({ label }: { readonly label: string }): JSX.Element {
  return (
    <m.div
      initial={{ opacity: 0, scaleX: 0.6 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={LAB_SPRING}
      className="relative -ml-5 mb-3 flex origin-left items-center gap-2"
    >
      <span aria-hidden="true" className="h-0.5 w-4 bg-lab-accent" />
      <span className="rounded-full bg-lab-accent px-3 py-1 text-xs font-bold text-paper shadow-lab-sm">
        {label}
      </span>
      <span aria-hidden="true" className="h-0.5 flex-1 bg-lab-accent/40" />
    </m.div>
  );
}

export default TimelineCheckWidget;
