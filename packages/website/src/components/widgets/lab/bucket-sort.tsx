"use client";

import {
  useMemo,
  useState,
  type DragEvent,
  type JSX,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, m } from "framer-motion";
import { Check, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LAB_SPRING,
  LabButton,
  LabLive,
  LabSurface,
  LabVerdictPill,
  labLocale,
  useLabCompletion,
  type LabBaseProps,
} from "./_lab";

export interface BucketSortBucket {
  readonly id: string;
  readonly label: string;
  /** One-line description shown under the label. */
  readonly hint?: string;
}

export interface BucketSortItem {
  readonly id: string;
  readonly text: string;
  /** Correct bucket id. */
  readonly bucket: string;
  /** Why this item belongs there. Shown right after the learner places it. */
  readonly why: string;
}

export interface BucketSortProps extends LabBaseProps {
  readonly buckets: readonly BucketSortBucket[];
  readonly items: readonly BucketSortItem[];
  /**
   * Share of items that must be right on the first try for the exercise to
   * count as done (0..1). Default 0: sorting every item with its feedback is
   * the exercise.
   */
  readonly passRatio?: number;
  /** Optional source material shown above the cards (e.g. meeting notes). */
  readonly context?: { readonly label: string; readonly text: string };
}

interface Placement {
  readonly bucket: string;
  readonly firstTryCorrect: boolean;
  readonly picked: string;
}

const COPY = {
  de: {
    region: "Sortierübung",
    tray: "Noch zu sortieren",
    trayEmpty: "Alles sortiert.",
    pickHint: "Wähle eine Karte, dann den passenden Stapel. Tastatur: Karte fokussieren, Ziffer drücken.",
    placeHere: "Hierhin",
    selected: "ausgewählt",
    rightFirst: "Richtig.",
    wrongFirst: (bucket: string) => `Gehört zu: ${bucket}.`,
    score: (right: number, total: number) => `${right} von ${total} beim ersten Versuch richtig`,
    again: "Nochmal sortieren",
    belowPass: "Noch nicht sicher genug. Lies die Begründungen und sortiere nochmal.",
    reviewTitle: "Diese Karten lagen zuerst falsch",
    count: (n: number) => `${n} Karten`,
  },
  en: {
    region: "Sorting exercise",
    tray: "Still to sort",
    trayEmpty: "Everything is sorted.",
    pickHint: "Pick a card, then the matching pile. Keyboard: focus a card, press a number.",
    placeHere: "Place here",
    selected: "selected",
    rightFirst: "Correct.",
    wrongFirst: (bucket: string) => `Belongs to: ${bucket}.`,
    score: (right: number, total: number) => `${right} of ${total} right on the first try`,
    again: "Sort again",
    belowPass: "Not confident enough yet. Read the reasons and sort again.",
    reviewTitle: "These cards were misplaced at first",
    count: (n: number) => `${n} cards`,
  },
} as const;

/** Pure scoring helper (exported for tests). */
export function scoreBucketSort(
  items: readonly BucketSortItem[],
  placements: Readonly<Record<string, Placement>>,
): { readonly placed: number; readonly firstTryRight: number } {
  let placed = 0;
  let firstTryRight = 0;
  for (const item of items) {
    const placement = placements[item.id];
    if (!placement) continue;
    placed += 1;
    if (placement.firstTryCorrect) firstTryRight += 1;
  }
  return { placed, firstTryRight };
}

export function BucketSortWidget({
  buckets,
  items,
  passRatio = 0,
  context,
  lessonId,
  cpId,
  locale,
  title,
}: BucketSortProps): JSX.Element {
  const copy = COPY[labLocale(locale)];
  const { complete } = useLabCompletion({ lessonId, cpId });
  const [placements, setPlacements] = useState<Record<string, Placement>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [lastPlaced, setLastPlaced] = useState<string | null>(null);

  const bucketById = useMemo(
    () => new Map(buckets.map((bucket) => [bucket.id, bucket])),
    [buckets],
  );
  const remaining = items.filter((item) => !placements[item.id]);
  const { placed, firstTryRight } = scoreBucketSort(items, placements);
  const finished = items.length > 0 && placed === items.length;
  const passed = finished && firstTryRight / items.length >= passRatio;

  const place = (itemId: string, bucketId: string) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item || placements[itemId]) return;
    const next = {
      ...placements,
      [itemId]: {
        bucket: item.bucket,
        picked: bucketId,
        firstTryCorrect: item.bucket === bucketId,
      },
    };
    setPlacements(next);
    setSelected(null);
    setLastPlaced(itemId);
    const score = scoreBucketSort(items, next);
    if (
      score.placed === items.length &&
      score.firstTryRight / items.length >= passRatio
    ) {
      complete();
    }
  };

  const reset = () => {
    setPlacements({});
    setSelected(null);
    setLastPlaced(null);
  };

  const onItemKey = (event: KeyboardEvent<HTMLButtonElement>, itemId: string) => {
    const index = Number.parseInt(event.key, 10);
    if (Number.isInteger(index) && index >= 1 && index <= buckets.length) {
      event.preventDefault();
      place(itemId, buckets[index - 1].id);
    }
  };

  const onDrop = (event: DragEvent<HTMLElement>, bucketId: string) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData("text/plain");
    if (itemId) place(itemId, bucketId);
  };

  const last = lastPlaced ? items.find((item) => item.id === lastPlaced) : null;
  const lastPlacement = last ? placements[last.id] : null;
  const misses = items.filter((item) => placements[item.id] && !placements[item.id].firstTryCorrect);

  return (
    <LabSurface label={copy.region} title={title}>
      {context ? (
        <div className="mb-4 rounded-2xl border border-lab-line bg-paper p-4 shadow-lab-sm">
          <p className="text-label text-muted-foreground">{context.label}</p>
          <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-foreground">{context.text}</p>
        </div>
      ) : null}
      <p className="mb-3 text-sm text-muted-foreground">{copy.pickHint}</p>

      {/* Tray */}
      <div className="rounded-2xl bg-inset/60 p-3">
        <p className="mb-2 flex items-center justify-between text-label text-muted-foreground">
          <span>{copy.tray}</span>
          <span className="tabular-nums">{remaining.length}/{items.length}</span>
        </p>
        {remaining.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">{copy.trayEmpty}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            <AnimatePresence initial={false}>
              {remaining.map((item) => {
                const isSelected = selected === item.id;
                return (
                  <m.li
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={LAB_SPRING}
                  >
                    <button
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", item.id);
                        setSelected(item.id);
                      }}
                      onClick={() => setSelected(isSelected ? null : item.id)}
                      onKeyDown={(event) => onItemKey(event, item.id)}
                      aria-pressed={isSelected}
                      data-item-id={item.id}
                      className={cn(
                        "min-h-11 max-w-full cursor-grab rounded-xl border px-3 py-2 text-left text-[15px] leading-snug transition-[background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent",
                        isSelected
                          ? "border-lab-accent bg-lab-accent-soft shadow-lab"
                          : "border-lab-line bg-card shadow-lab-sm hover:border-lab-accent/50",
                      )}
                    >
                      {item.text}
                      {isSelected ? <span className="sr-only"> ({copy.selected})</span> : null}
                    </button>
                  </m.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Feedback for the last placement */}
      <LabLive className="min-h-0">
        <>
          {last && lastPlacement ? (
            <m.div
              key={last.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "mt-3 rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                lastPlacement.firstTryCorrect ? "bg-lab-good-soft" : "bg-lab-bad-soft",
              )}
            >
              <p className={cn("font-semibold", lastPlacement.firstTryCorrect ? "text-lab-good" : "text-lab-bad")}>
                „{last.text}“ ·{" "}
                {lastPlacement.firstTryCorrect
                  ? copy.rightFirst
                  : copy.wrongFirst(bucketById.get(last.bucket)?.label ?? last.bucket)}
              </p>
              <p className="mt-1 text-foreground">{last.why}</p>
            </m.div>
          ) : null}
        </>
      </LabLive>

      {/* Buckets */}
      <div
        className={cn(
          "mt-4 grid gap-3",
          buckets.length >= 5
            ? "sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
            : buckets.length === 4
              ? "sm:grid-cols-2 xl:grid-cols-4"
              : buckets.length === 3
                ? "sm:grid-cols-3"
                : "sm:grid-cols-2",
        )}
      >
        {buckets.map((bucket, index) => {
          const inBucket = items.filter((item) => placements[item.id]?.bucket === bucket.id);
          return (
            <div
              key={bucket.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDrop(event, bucket.id)}
              data-bucket-id={bucket.id}
              className="flex min-w-0 flex-col rounded-2xl border border-lab-line bg-paper p-2"
            >
              <button
                type="button"
                disabled={!selected}
                onClick={() => selected && place(selected, bucket.id)}
                className={cn(
                  "min-h-11 rounded-xl px-3 py-2 text-left transition-[background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent",
                  selected ? "bg-lab-accent-soft shadow-lab-sm hover:bg-lab-accent/15" : "bg-transparent",
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[15px] font-bold text-foreground">
                    <span aria-hidden="true" className="mr-1.5 text-muted-foreground tabular-nums">{index + 1}</span>
                    {bucket.label}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">{inBucket.length}</span>
                </span>
                {bucket.hint ? (
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{bucket.hint}</span>
                ) : null}
                {selected ? <span className="sr-only">: {copy.placeHere}</span> : null}
              </button>
              <ul className="mt-1 space-y-1.5">
                <AnimatePresence initial={false}>
                  {inBucket.map((item) => {
                    const placement = placements[item.id];
                    return (
                      <m.li
                        key={item.id}
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={LAB_SPRING}
                        className={cn(
                          "flex items-start gap-2 rounded-xl px-2.5 py-2 text-sm leading-snug",
                          placement.firstTryCorrect ? "bg-lab-good-soft" : "bg-lab-bad-soft",
                        )}
                      >
                        <span aria-hidden="true" className={cn("mt-0.5", placement.firstTryCorrect ? "text-lab-good" : "text-lab-bad")}>
                          {placement.firstTryCorrect ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0 break-words text-foreground">{item.text}</span>
                      </m.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </div>
          );
        })}
      </div>

      {finished ? (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-4 rounded-2xl border border-lab-line bg-card p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <LabVerdictPill tone={passed ? "good" : "warn"}>
              {copy.score(firstTryRight, items.length)}
            </LabVerdictPill>
            <LabButton tone="ghost" onClick={reset}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {copy.again}
            </LabButton>
          </div>
          {!passed ? <p className="mt-2 text-sm text-lab-warn">{copy.belowPass}</p> : null}
          {misses.length > 0 ? (
            <div className="mt-3">
              <p className="text-label text-muted-foreground">{copy.reviewTitle}</p>
              <ul className="mt-2 space-y-2">
                {misses.map((item) => (
                  <li key={item.id} className="text-sm leading-relaxed">
                    <span className="font-semibold text-foreground">{item.text}</span>
                    <span className="text-muted-foreground"> → {bucketById.get(item.bucket)?.label}: {item.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </m.div>
      ) : null}
    </LabSurface>
  );
}
