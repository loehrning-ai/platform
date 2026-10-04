"use client";

import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { m } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { evaluateNumber } from "@/lib/lesson-engine/expression";
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

// ─── triage-matrix: rate tasks, see them on a matrix, pick the top ones ──
//
// The learner rates each task on three axes (how often, what an error costs,
// how quickly a result can be checked) with three levels each. A scatter plot
// places every rated task (x = frequency, y = error cost, dot size =
// checkability) and a transparent score ranks them. Learners may add up to
// three tasks of their own. "Auswerten" ranks everything, marks the top
// picks and compares the learner's ratings of the authored tasks with a
// reference, explaining every disagreement. Done on evaluation.

export type TriageAxis = "f" | "c" | "k";
export type TriageRating = Readonly<Record<TriageAxis, number>>;

export interface TriageItem {
  readonly id: string;
  readonly text: string;
  /** Reference rating, 1..3 per axis. */
  readonly reference: TriageRating;
  /** Why the reference rates it this way. */
  readonly why: string;
}

export interface TriageAxisCopy {
  readonly label: string;
  /** Three level labels, low to high. */
  readonly levels: readonly [string, string, string];
}

export interface TriageMatrixProps extends LabBaseProps {
  readonly items: readonly TriageItem[];
  /** How many top tasks to highlight. */
  readonly pick?: number;
  /** Let learners add up to three tasks of their own. */
  readonly allowOwn?: boolean;
  /** Score formula over f, c and k (each 1..3). */
  readonly score?: string;
  /** The score formula in words. */
  readonly scoreLabel?: string;
  readonly axes?: Partial<Record<TriageAxis, TriageAxisCopy>>;
  readonly note?: string;
}

export const DEFAULT_TRIAGE_SCORE = "f * k * (4 - c)";
const MAX_OWN = 3;

const COPY = {
  de: {
    region: "Aufgaben-Triage",
    axes: {
      f: { label: "Wie oft?", levels: ["selten", "wöchentlich", "täglich"] },
      c: { label: "Was kostet ein Fehler?", levels: ["wenig", "spürbar", "hoch"] },
      k: { label: "Wie schnell prüfbar?", levels: ["schwer", "mit Aufwand", "auf einen Blick"] },
    } as Record<TriageAxis, TriageAxisCopy>,
    scoreLabel: "Priorität = Häufigkeit × Prüfbarkeit × (4 − Fehlerkosten)",
    matrix: "Matrix: Häufigkeit (rechts mehr) und Fehlerkosten (oben höher). Größere Punkte sind leichter prüfbar.",
    zone: "Kandidaten",
    own: "Eigene Aufgabe hinzufügen",
    ownPlaceholder: "z. B. Wochenbericht aus Ticketliste",
    add: "Hinzufügen",
    remove: (text: string) => `${text} entfernen`,
    ownTag: "eigene",
    rated: (done: number, total: number) => `${done} von ${total} Aufgaben bewertet`,
    evaluate: "Auswerten",
    ranking: "Rangfolge",
    top: (n: number) => `Deine Top ${n}`,
    agreement: (same: number, total: number) => `${same} von ${total} Einschätzungen wie die Referenz`,
    reference: "Referenz",
    referenceTop: (n: number) => `Referenz-Top ${n}`,
    score: "Punkte",
    differs: "Abweichung",
    matches: "wie Referenz",
    announce: (top: string, same: number, total: number) =>
      `Deine Top-Aufgaben: ${top}. ${same} von ${total} Einschätzungen wie die Referenz.`,
  },
  en: {
    region: "Task triage",
    axes: {
      f: { label: "How often?", levels: ["rarely", "weekly", "daily"] },
      c: { label: "What does an error cost?", levels: ["little", "noticeable", "a lot"] },
      k: { label: "How fast to check?", levels: ["hard", "with effort", "at a glance"] },
    } as Record<TriageAxis, TriageAxisCopy>,
    scoreLabel: "Priority = frequency × checkability × (4 − error cost)",
    matrix: "Matrix: frequency (more to the right) and error cost (higher up). Larger dots are easier to check.",
    zone: "Candidates",
    own: "Add a task of your own",
    ownPlaceholder: "e.g. weekly report from the ticket list",
    add: "Add",
    remove: (text: string) => `Remove ${text}`,
    ownTag: "yours",
    rated: (done: number, total: number) => `${done} of ${total} tasks rated`,
    evaluate: "Evaluate",
    ranking: "Ranking",
    top: (n: number) => `Your top ${n}`,
    agreement: (same: number, total: number) => `${same} of ${total} ratings match the reference`,
    reference: "Reference",
    referenceTop: (n: number) => `Reference top ${n}`,
    score: "points",
    differs: "differs",
    matches: "matches",
    announce: (top: string, same: number, total: number) =>
      `Your top tasks: ${top}. ${same} of ${total} ratings match the reference.`,
  },
} as const;

const AXES: readonly TriageAxis[] = ["f", "c", "k"];

export function triageScore(formula: string, rating: TriageRating): number {
  return evaluateNumber(formula, { f: rating.f, c: rating.c, k: rating.k });
}

/** Rank entries by score (desc), ties keep authored order. */
export function rankTriage<T extends { readonly id: string }>(
  entries: readonly T[],
  ratingOf: (entry: T) => TriageRating,
  formula: string,
): { readonly entry: T; readonly score: number }[] {
  return entries
    .map((entry, index) => ({ entry, index, score: triageScore(formula, ratingOf(entry)) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ entry, score }) => ({ entry, score }));
}

/** Count axis ratings that equal the reference. */
export function triageAgreement(
  items: readonly TriageItem[],
  ratings: Readonly<Record<string, Partial<TriageRating>>>,
): { readonly same: number; readonly total: number } {
  let same = 0;
  for (const item of items) {
    for (const axis of AXES) if (ratings[item.id]?.[axis] === item.reference[axis]) same += 1;
  }
  return { same, total: items.length * AXES.length };
}

interface OwnTask {
  readonly id: string;
  readonly text: string;
}

function isComplete(rating: Partial<TriageRating> | undefined): rating is TriageRating {
  return Boolean(rating && rating.f && rating.c && rating.k);
}

function Scatter({
  points,
  copy,
}: {
  readonly points: readonly { readonly id: string; readonly label: string; readonly rating: TriageRating; readonly top: boolean; readonly own: boolean }[];
  readonly copy: (typeof COPY)["de" | "en"];
}): JSX.Element {
  const size = 300;
  const pad = 36;
  const cell = (size - pad * 1.5) / 3;
  const x = (f: number) => pad + (f - 0.5) * cell;
  const y = (c: number) => size - pad - (c - 0.5) * cell;
  // Deterministic offsets so dots in the same cell do not overlap.
  const offsets = [
    [0, 0],
    [-16, -14],
    [16, 14],
    [16, -14],
    [-16, 14],
    [0, -22],
    [0, 22],
    [-24, 0],
    [24, 0],
  ];
  const seen = new Map<string, number>();
  return (
    <figure className="rounded-2xl border border-lab-line bg-card p-3 shadow-lab-sm">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full" aria-hidden="true">
        <rect x={pad + cell * 2} y={size - pad - cell} width={cell} height={cell} rx={12} className="fill-lab-good-soft" />
        <rect x={pad + cell} y={size - pad - cell} width={cell} height={cell} rx={12} className="fill-lab-good-soft" opacity={0.5} />
        <rect x={pad + cell * 2} y={size - pad - cell * 2} width={cell} height={cell} rx={12} className="fill-lab-good-soft" opacity={0.5} />
        {[0, 1, 2, 3].map((index) => (
          <g key={index}>
            <line x1={pad + index * cell} x2={pad + index * cell} y1={pad / 2} y2={size - pad} className="stroke-lab-line" />
            <line x1={pad} x2={size - pad / 2} y1={size - pad - index * cell} y2={size - pad - index * cell} className="stroke-lab-line" />
          </g>
        ))}
        <text x={pad + cell * 2.5} y={size - pad - cell + 16} textAnchor="middle" className="fill-lab-good text-[12px] font-semibold">
          {copy.zone}
        </text>
        <text x={size / 2} y={size - 8} textAnchor="middle" className="fill-muted-foreground text-[12px]">
          {copy.axes.f.label} →
        </text>
        <text x={12} y={size / 2} textAnchor="middle" transform={`rotate(-90 12 ${size / 2})`} className="fill-muted-foreground text-[12px]">
          {copy.axes.c.label} →
        </text>
        {points.map((point) => {
          const key = `${point.rating.f}-${point.rating.c}`;
          const slot = seen.get(key) ?? 0;
          seen.set(key, slot + 1);
          const [dx, dy] = offsets[slot % offsets.length];
          const r = 6 + point.rating.k * 3;
          return (
            <m.g
              key={point.id}
              initial={false}
              animate={{ x: x(point.rating.f) + dx, y: y(point.rating.c) + dy }}
              transition={LAB_SPRING}
            >
              <circle
                r={r}
                className={cn(point.top ? "fill-lab-accent" : point.own ? "fill-ocker-tief" : "fill-lab-accent-soft", "stroke-lab-accent")}
                strokeWidth={1.5}
              />
              <text textAnchor="middle" dy="0.35em" className={cn("text-[12px] font-bold", point.top ? "fill-paper" : "fill-lab-ink")}>
                {point.label}
              </text>
            </m.g>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">{copy.matrix}</figcaption>
    </figure>
  );
}

export function TriageMatrixWidget({
  items,
  pick = 3,
  allowOwn = true,
  score = DEFAULT_TRIAGE_SCORE,
  scoreLabel,
  axes,
  note,
  lessonId,
  cpId,
  locale,
  title,
}: TriageMatrixProps): JSX.Element {
  const lang = labLocale(locale);
  const copy = COPY[lang];
  const axisCopy: Record<TriageAxis, TriageAxisCopy> = { ...copy.axes, ...axes };
  const { complete } = useLabCompletion({ lessonId, cpId });
  const [ratings, setRatings] = useState<Record<string, Partial<TriageRating>>>({});
  const [own, setOwn] = useState<readonly OwnTask[]>([]);
  const [draft, setDraft] = useState("");
  const [evaluated, setEvaluated] = useState(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const ownCounter = useRef(0);
  const completed = useRef(false);

  const entries = useMemo(
    () => [
      ...items.map((item) => ({ id: item.id, text: item.text, own: false })),
      ...own.map((task) => ({ id: task.id, text: task.text, own: true })),
    ],
    [items, own],
  );
  const numberOf = (id: string) => String(entries.findIndex((entry) => entry.id === id) + 1);
  const ratedCount = entries.filter((entry) => isComplete(ratings[entry.id])).length;
  const allRated = ratedCount === entries.length;

  const ranking = useMemo(
    () =>
      rankTriage(
        entries.filter((entry) => isComplete(ratings[entry.id])),
        (entry) => ratings[entry.id] as TriageRating,
        score,
      ),
    [entries, ratings, score],
  );
  const topIds = new Set(evaluated ? ranking.slice(0, pick).map(({ entry }) => entry.id) : []);
  const referenceTop = rankTriage(items, (item) => item.reference, score).slice(0, pick);
  const agreement = triageAgreement(items, ratings);

  useEffect(() => {
    if (evaluated) resultHeading.current?.focus();
  }, [evaluated]);

  const rate = (id: string, axis: TriageAxis, value: number) => {
    setRatings((previous) => ({ ...previous, [id]: { ...previous[id], [axis]: value } }));
    setEvaluated(false);
  };

  const addOwn = () => {
    const text = draft.trim();
    if (!text || own.length >= MAX_OWN) return;
    ownCounter.current += 1;
    setOwn((previous) => [...previous, { id: `own-${ownCounter.current}`, text: text.slice(0, 120) }]);
    setDraft("");
    setEvaluated(false);
  };

  const evaluate = () => {
    if (!allRated) return;
    setEvaluated(true);
    if (!completed.current) {
      completed.current = true;
      complete();
    }
  };

  const points = entries
    .filter((entry) => isComplete(ratings[entry.id]))
    .map((entry) => ({
      id: entry.id,
      label: numberOf(entry.id),
      rating: ratings[entry.id] as TriageRating,
      top: topIds.has(entry.id),
      own: entry.own,
    }));

  const topText = ranking
    .slice(0, pick)
    .map(({ entry }) => entry.text)
    .join(", ");

  return (
    <LabSurface label={copy.region} title={title}>
      <p className="rounded-2xl lab-wash-acid px-4 py-2.5 text-sm font-semibold text-foreground">
        {scoreLabel ?? copy.scoreLabel}
      </p>
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="min-w-0 space-y-3">
          <ol className="space-y-3">
            {entries.map((entry) => {
              const rating = ratings[entry.id] ?? {};
              const done = isComplete(rating);
              return (
                <li
                  key={entry.id}
                  data-triage-id={entry.id}
                  className={cn(
                    "rounded-2xl border bg-card p-3 transition-[border-color] duration-150",
                    done ? "border-lab-accent/40" : "border-lab-line",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        done ? "bg-lab-accent text-paper" : "bg-inset text-foreground",
                      )}
                    >
                      {numberOf(entry.id)}
                    </span>
                    <p className="min-w-0 flex-1 pt-0.5 text-sm font-semibold text-foreground">
                      {entry.text}
                      {entry.own ? <span className="ml-2 text-xs font-normal text-muted-foreground">({copy.ownTag})</span> : null}
                    </p>
                    {entry.own ? (
                      <button
                        type="button"
                        aria-label={copy.remove(entry.text)}
                        onClick={() => {
                          setOwn((previous) => previous.filter((task) => task.id !== entry.id));
                          setEvaluated(false);
                        }}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {AXES.map((axis) => {
                      const groupId = `triage-${entry.id}-${axis}`;
                      return (
                        <div key={axis}>
                          <p id={groupId} className="text-xs font-semibold text-muted-foreground">
                            {axisCopy[axis].label}
                          </p>
                          <div role="radiogroup" aria-labelledby={groupId} className="mt-1 grid grid-cols-3 gap-1">
                            {axisCopy[axis].levels.map((level, index) => {
                              const value = index + 1;
                              const checked = rating[axis] === value;
                              return (
                                <button
                                  key={level}
                                  type="button"
                                  role="radio"
                                  aria-checked={checked}
                                  aria-label={`${entry.text}: ${axisCopy[axis].label} ${level}`}
                                  onClick={() => rate(entry.id, axis, value)}
                                  className={cn(
                                    "min-h-11 rounded-xl border px-1 text-xs leading-tight transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent",
                                    checked
                                      ? "border-lab-accent bg-lab-accent text-paper"
                                      : "border-lab-line bg-paper text-foreground hover:border-lab-accent/50",
                                  )}
                                >
                                  {level}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ol>

          {allowOwn && own.length < MAX_OWN ? (
            <form
              className="flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-lab-line bg-paper p-3"
              onSubmit={(event) => {
                event.preventDefault();
                addOwn();
              }}
            >
              <label className="min-w-0 flex-1 text-xs font-semibold text-muted-foreground">
                {copy.own}
                <input
                  value={draft}
                  maxLength={120}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={copy.ownPlaceholder}
                  className="mt-1 min-h-11 w-full rounded-xl border border-lab-line bg-card px-3 text-sm font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
                />
              </label>
              <LabButton type="submit" tone="secondary" disabled={!draft.trim()}>
                <Plus aria-hidden="true" className="h-4 w-4" />
                {copy.add}
              </LabButton>
            </form>
          ) : null}
        </div>

        <div className="min-w-0 space-y-3 lg:sticky lg:top-24 lg:self-start">
          <Scatter points={points} copy={copy} />
          <p className="text-sm text-muted-foreground">{copy.rated(ratedCount, entries.length)}</p>
          <LabButton onClick={evaluate} disabled={!allRated} className="w-full">
            {copy.evaluate}
          </LabButton>
        </div>
      </div>

      <LabLive className="sr-only">
        {evaluated ? copy.announce(topText, agreement.same, agreement.total) : ""}
      </LabLive>

      {evaluated ? (
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: LAB_EASE }}
          className="mt-5 grid gap-4 lg:grid-cols-2"
        >
          <div className="rounded-2xl border border-lab-line bg-card p-4 shadow-lab-sm">
            <h4
              ref={resultHeading}
              tabIndex={-1}
              className="text-base font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
            >
              {copy.top(pick)}
            </h4>
            <ol className="mt-2 space-y-1.5">
              {ranking.map(({ entry, score: points }, index) => (
                <li
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
                    index < pick ? "bg-lab-accent-soft font-semibold text-foreground" : "text-foreground",
                  )}
                >
                  <span className="w-5 shrink-0 tabular-nums text-muted-foreground">{index + 1}.</span>
                  <span className="min-w-0 flex-1">{entry.text}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {points} {copy.score}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-sm font-semibold text-foreground">
              {copy.agreement(agreement.same, agreement.total)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {copy.referenceTop(pick)}: {referenceTop.map(({ entry }) => entry.text).join(", ")}
            </p>
          </div>
          <div className="rounded-2xl border border-lab-line bg-paper p-4">
            <h4 className="text-base font-bold text-foreground">{copy.reference}</h4>
            <ul className="mt-2 space-y-2">
              {items.map((item) => {
                const mine = ratings[item.id] ?? {};
                const differs = AXES.filter((axis) => mine[axis] !== item.reference[axis]);
                return (
                  <li key={item.id} className="rounded-xl bg-card px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 flex-1 font-semibold text-foreground">
                        {numberOf(item.id)}. {item.text}
                      </span>
                      <LabVerdictPill tone={differs.length === 0 ? "good" : "warn"}>
                        {differs.length === 0 ? copy.matches : `${copy.differs}: ${differs.map((axis) => axisCopy[axis].label).join(", ")}`}
                      </LabVerdictPill>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {AXES.map((axis) => `${axisCopy[axis].label} ${axisCopy[axis].levels[item.reference[axis] - 1]}`).join(" · ")}
                    </p>
                    <p className="mt-1 leading-relaxed text-foreground">{item.why}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </m.div>
      ) : null}
      {note ? <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{note}</p> : null}
    </LabSurface>
  );
}
