"use client";

import type { ReactNode } from "react";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { CRAFT_NCR_SEP, REPORT } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import {
  COUNTERS,
  mergeRecords,
  rate,
  SAME_BAND,
  verdict,
  type Counter,
  type Verdict,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import {
  ease,
  flight,
  lerp,
  RAIL_H,
  RAIL_VIEW,
  RAIL_Y,
  railItems,
  railX,
  REVEAL,
  span,
  STRIP_IN_RAILS,
  stripBar,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/timelines";
import { fill, type Fmt } from "./fmt";
import { usePointerChoice } from "./pointer-choice";
import { DECISION_SECTION } from "./stage-claim";

/** The rail a poll answer is true on. */
export const RAIL_OF: Readonly<Record<Verdict, Counter>> = { better: "records", same: "affected", worse: "scrapped" };

const DOT_H = 6;
/** The label row above each track, in viewBox units. */
const LABEL_ROW = 24;
const DOT_STEP = 7;
const pct = (value: number, of: number) => `${(value / of) * 100}%`;

interface RailsProps {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  /** Reveal clock 0..1; 1 on every later beat. */
  readonly t: number;
  /** The rail that carries the Mennige frame, or null. */
  readonly framed: Counter | null;
  /** Merge share 0..1 (records only). */
  readonly merge: number;
  /** The control in the top row: the report strip (reveal) or the merge toggle (counter beat). */
  readonly top: ReactNode;
  /** On the counter beat each rail is a radio card: tapping it chooses the numerator. */
  readonly choice?: {
    readonly legend: string;
    readonly value: Counter | null;
    readonly onChange: (counter: Counter) => void;
  };
}

/** Ghosts (rework on the scrap rail) stay this faint once they have landed. */
const GHOST_OPACITY = 0.15;

function RailMarks({ counter, t, merge }: { readonly counter: Counter; readonly t: number; readonly merge: number }) {
  const plain = railItems(counter, false);
  const merged = counter === "records" ? railItems(counter, true) : plain;
  const bottom = RAIL_Y[counter] + RAIL_H;
  const tick = railX(counter, rate(counter, "aug"));
  const tickShow = span(t, REVEAL.tick[0], REVEAL.tick[1]);
  return (
    <g>
      <line x1={RAIL_X0} x2={RAIL_VIEW.width - RAIL_X0} y1={bottom + 1.5} y2={bottom + 1.5} className="nw-track" opacity={span(t, REVEAL.labels[0], REVEAL.labels[1])} vectorEffect="non-scaling-stroke" />
      {plain.map((item, index) => {
        const target = merged[index] ?? item;
        const share = counter === "records" ? ease(merge) : 0;
        const x = lerp(item.x, target.x, share);
        const w = lerp(item.w, target.w, share);
        const level = lerp(item.level, target.level, share);
        const fly = flight(t, item.row);
        const h = counter === "records" ? DOT_H : RAIL_H;
        const y = bottom - h - level * DOT_STEP;
        // Before the flight every row stands in the file strip; the three rails' copies of a row coincide there.
        const from = stripBar(item.row, STRIP_IN_RAILS.base, STRIP_IN_RAILS.height);
        return (
          <rect
            key={item.row}
            x={lerp(from.x, x, fly)}
            y={lerp(from.y, y, fly)}
            width={Math.max(0.5, lerp(from.w, w, fly))}
            height={lerp(from.h, h, fly)}
            className={item.filled ? "nw-mark-fill" : "nw-mark-line"}
            opacity={item.ghost ? lerp(1, GHOST_OPACITY, fly) : 1}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {/* The August tick stays inside the band of marks, below the rail's label row. */}
      <line
        x1={tick}
        x2={tick}
        y1={RAIL_Y[counter] + 6}
        y2={bottom + 6}
        className="nw-tick"
        opacity={tickShow}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

const RAIL_X0 = 8;

/** The rail labels; on the counter beat they form one radio group with a legend. */
function RailGroup({
  legend,
  pointer,
  children,
}: {
  readonly legend: string | null;
  readonly pointer: ReturnType<typeof usePointerChoice>;
  readonly children: ReactNode;
}) {
  if (legend === null) return <>{children}</>;
  return (
    <fieldset
      className="nw-rail-group"
      data-chip-group="nw-counter"
      onPointerDown={pointer.onPointerDown}
      onKeyDown={pointer.onKeyDown}
    >
      <legend className="sr-only">{legend}</legend>
      {children}
    </fieldset>
  );
}

/** Beats 2 and 3: the 23 September rows of ncr_records.csv, laid out three ways. */
export function StageRails({ pack, fmt, t, framed, merge, top, choice }: RailsProps) {
  const count = span(t, REVEAL.count[0], REVEAL.count[1]);
  const labels = span(t, REVEAL.labels[0], REVEAL.labels[1]);
  const showVerdict = t >= REVEAL.verdict;
  const showFrame = t >= REVEAL.frame;
  const groups = mergeRecords(CRAFT_NCR_SEP).length;
  const pointer = usePointerChoice();
  return (
    <div className="nw-rails">
      <div className="nw-top">{top}</div>
      <p className="nw-file">{fill(pack.reveal.file, { n: CRAFT_NCR_SEP.length })}</p>
      <div className="nw-area">
        <svg className="nw-svg" viewBox={`0 0 ${RAIL_VIEW.width} ${RAIL_VIEW.height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {COUNTERS.map((counter) => (
            <RailMarks key={counter} counter={counter} t={t} merge={merge} />
          ))}
        </svg>
        <RailGroup legend={choice?.legend ?? null} pointer={pointer}>
        {COUNTERS.map((counter) => {
          const aug = rate(counter, "aug");
          const sep = rate(counter, "sep");
          const now = counter === "records" ? lerp(sep, rate("records", "sep", true), ease(merge)) : sep;
          // The figure runs from August to September, so the motion itself carries the verdict.
          const value = lerp(aug, now, ease(count));
          const isMerged = counter === "records" && merge > 0.5;
          const Row = choice ? "label" : "div";
          return (
            <Row
              key={counter}
              className="nw-rail-label"
              data-rail={counter}
              data-choosable={choice ? "" : undefined}
              data-framed={framed === counter && showFrame ? "" : undefined}
              style={{
                top: pct(RAIL_Y[counter] - LABEL_ROW, RAIL_VIEW.height),
                height: pct(RAIL_H + LABEL_ROW + 8, RAIL_VIEW.height),
                opacity: labels,
              }}
            >
              {choice ? (
                <input
                  type="radio"
                  name="nw-counter"
                  value={counter}
                  checked={choice.value === counter}
                  onChange={() => {
                    choice.onChange(counter);
                    pointer.settle();
                  }}
                  className="nw-rail-input"
                />
              ) : null}
              <span className="nw-rail-name">{pack.counters[counter].name}</span>
              <span className="nw-rail-value">
                <span className="nw-rail-verdict" data-show={showVerdict ? "" : undefined}>
                  {isMerged
                    ? fill(pack.counter.mergedCount, { from: CRAFT_NCR_SEP.length, to: groups })
                    : pack.verdicts[verdict(counter)]}
                </span>
                <strong data-rail-value={counter}>{fmt.rate(counter, value)}</strong>
                <span className="nw-rail-aug" data-show={showVerdict ? "" : undefined}>
                  {pack.monthsShort.aug} {fmt.rate(counter, aug)}
                </span>
              </span>
            </Row>
          );
        })}
        </RailGroup>
      </div>
      <p className="nw-per">{fill(pack.reveal.per, { per: fmt.per, band: fmt.share(SAME_BAND, 0) })}</p>
    </div>
  );
}

/** The report strip of beat 2: the VP's two figures from section 5. */
export function ReportStrip({ pack, fmt }: { readonly pack: DemoPack; readonly fmt: Fmt }) {
  return (
    <p className="nw-strip">
      {fill(pack.reveal.strip, {
        section: DECISION_SECTION,
        a: fmt.n(REPORT.vpDefectsAug, 2),
        b: fmt.n(REPORT.vpDefectsSep, 2),
        per: fmt.per,
      })}
    </p>
  );
}
