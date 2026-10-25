"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { hitFrame, type HitFrame } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/motion";
import { splitWords, type Span } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/redact";
import type { Hit, Placeholder } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";
import type { DemoPack } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/copy";

interface Props {
  readonly text: string;
  readonly hits: readonly Hit[];
  readonly kept: ReadonlySet<string>;
  readonly placeholders: readonly Placeholder[];
  /** Hit id to its slot among the detector hits that can still be blacked out. */
  readonly slots: ReadonlyMap<string, number>;
  readonly n: number;
  readonly p: number;
  readonly steps: boolean;
  /** Capitalised word pairs no hit covers: their words are underlined so the next tap is obvious. */
  readonly nameSpans: readonly Span[];
  readonly copy: Pick<DemoPack, "stage" | "take">;
  readonly describedBy: string;
  readonly onWord: (span: Span) => void;
  readonly onKeep: (id: string) => void;
  readonly onLeave: () => void;
}

const fill = (template: string, values: Readonly<Record<string, string | number>>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

/** Closing punctuation that stays glued to the hit before it: a line may not break between "Musterstadt" and ".". */
const TRAILING = /^[.,;:!?)\]"'»“”’]+/;

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * The text as the sender would see it: every detected hit is a button that is
 * a marker, then a bar, then a pill, all stacked in one grid cell so the line
 * never re-wraps while the handle moves. Every other word is a button too: a
 * tap blacks it out. Roving tabindex: Tab enters once, arrows walk the words.
 */
export function HitCard(props: Props) {
  const { text, hits, kept, placeholders, slots, n, p, steps, nameSpans, copy, describedBy, onWord, onKeep, onLeave } = props;
  const group = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  let nav = 0;
  const items: ReactNode[] = [];
  let at = 0;

  const navProps = () => {
    const index = nav++;
    return {
      "data-nav": index,
      tabIndex: index === active ? 0 : -1,
      onFocus: () => setActive(index),
    } as const;
  };

  const pushWords = (from: number, to: number) => {
    const gap = text.slice(from, to);
    let cursor = 0;
    for (const word of splitWords(gap, from)) {
      if (word.start - from > cursor) items.push(gap.slice(cursor, word.start - from));
      const glue = TRAILING.exec(gap.slice(word.end - from))?.[0] ?? "";
      const button = (
        <button
          key={`w${word.start}`}
          type="button"
          className="w05-word"
          data-name={nameSpans.some((span) => word.start < span.end && word.end > span.start) ? "" : undefined}
          onClick={() => onWord(word)}
          {...navProps()}
        >
          {text.slice(word.start, word.end)}
        </button>
      );
      items.push(
        glue ? (
          <span key={`wg${word.start}`} className="w05-glue">
            {button}
            {glue}
          </span>
        ) : (
          button
        ),
      );
      cursor = word.end - from + glue.length;
    }
    if (cursor < gap.length) items.push(gap.slice(cursor));
  };

  for (const [hitIndex, hit] of hits.entries()) {
    if (hit.start > at) pushWords(at, hit.start);
    const limit = hits[hitIndex + 1]?.start ?? text.length;
    const glue = TRAILING.exec(text.slice(hit.end, limit))?.[0] ?? "";
    at = hit.end + glue.length;
    const token = placeholders.find((placeholder) => placeholder.hitId === hit.id)?.token ?? "";
    const isKept = kept.has(hit.id);
    const slot = slots.get(hit.id);
    const kind = copy.take.note.nouns[hit.kind][0];
    let frame: HitFrame;
    let state: string;
    if (isKept) {
      frame = { marker: 0, bar: 0, pill: 0, done: false };
      state = "kept";
    } else if (hit.kind === "manual" || slot === undefined) {
      frame = { marker: 0, bar: 0, pill: 1, done: true };
      state = "done";
    } else {
      frame = hitFrame(p, slot, n, steps);
      state = frame.done ? "done" : frame.marker === 1 && frame.bar === 0 ? "marker" : "sweep";
    }
    const vars: Vars = { "--mk": frame.marker, "--bar": frame.bar, "--pill": frame.pill };
    const button = (
      <button
        key={hit.id}
        type="button"
        className="w05-hit"
        data-kind={hit.kind}
        data-state={state}
        data-hit-id={hit.id}
        style={vars}
        aria-label={fill(isKept ? copy.stage.hitKept : copy.stage.hitReplaced, { kind, value: hit.value, token })}
        onClick={() => (hit.kind === "manual" ? onWord({ start: hit.start, end: hit.end }) : onKeep(hit.id))}
        {...navProps()}
      >
        <span className="w05-raw" aria-hidden="true">{hit.value}</span>
        <span className="w05-mk" aria-hidden="true">{hit.value}</span>
        <span className="w05-bar" aria-hidden="true" />
        <span className="w05-pill" aria-hidden="true">{token}</span>
      </button>
    );
    items.push(
      glue ? (
        <span key={`g${hit.id}`} className="w05-glue">
          {button}
          {glue}
        </span>
      ) : (
        button
      ),
    );
  }
  if (at < text.length) pushWords(at, text.length);

  const total = nav;
  /*
   * A thumb is wider than a word and than the line it sits on. A tap that lands
   * on no word (a space, a line gap, the edge of a one-letter word) goes to the
   * NEAREST word or detail within 22px (10px for a mouse): the winner is the
   * closest rectangle, so a tap never goes to the neighbouring line just
   * because that box overlapped. A tap that lands on a word is untouched.
   */
  const snap = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-nav]")) return;
    const reach = (event.nativeEvent as PointerEvent).pointerType === "mouse" ? 10 : 22;
    let best: HTMLElement | null = null;
    let bestDistance = reach;
    for (const el of Array.from(group.current?.querySelectorAll<HTMLElement>("[data-nav]") ?? [])) {
      const r = el.getBoundingClientRect();
      const distance = Math.hypot(Math.max(r.left - event.clientX, 0, event.clientX - r.right), Math.max(r.top - event.clientY, 0, event.clientY - r.bottom));
      if (distance < bestDistance) {
        best = el;
        bestDistance = distance;
      }
    }
    best?.click();
  };
  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const all = Array.from(group.current?.querySelectorAll<HTMLElement>("[data-nav]") ?? []);
    const current = all.findIndex((el) => el === document.activeElement);
    if (current < 0) return;
    let target: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") target = Math.min(all.length - 1, current + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") target = Math.max(0, current - 1);
    else if (event.key === "Home" || event.key === "End") {
      const row = all[current]?.offsetTop ?? 0;
      const same = all.filter((el) => Math.abs(el.offsetTop - row) < 6);
      target = all.indexOf((event.key === "Home" ? same[0] : same[same.length - 1]) as HTMLElement);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onLeave();
      return;
    } else return;
    event.preventDefault();
    all[target]?.focus();
  };

  return (
    <div
      ref={group}
      role="group"
      aria-label={fill(copy.stage.cardLabel, { n: hits.length })}
      aria-describedby={describedBy}
      className="w05-card-text"
      data-count={total}
      onKeyDown={move}
      onClick={snap}
    >
      {items}
    </div>
  );
}
