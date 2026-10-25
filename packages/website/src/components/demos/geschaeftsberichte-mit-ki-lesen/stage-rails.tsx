"use client";

import type { ReactNode } from "react";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { CRAFT_NCR_SEP, REPORT } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import {
  COUNTERS,
  mergeRecords,
  rate,
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
  sourceX,
  span,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/timelines";
import { fill, type Fmt } from "./fmt";
import { DECISION_SECTION } from "./stage-claim";

/** The rail a poll answer is true on. */
export const RAIL_OF: Readonly<Record<Verdict, Counter>> = { better: "records", same: "affected", worse: "scrapped" };

const DOT_H = 6;
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

function RailMarks({ counter, t, merge }: { readonly counter: Counter; readonly t: number; readonly merge: number }) {
  const plain = railItems(counter, false);
  const merged = counter === "records" ? railItems(counter, true) : plain;
  const bottom = RAIL_Y[counter] + RAIL_H;
  const tick = railX(counter, rate(counter, "aug"));
  const tickShow = span(t, REVEAL.tick[0], REVEAL.tick[1]);
  return (
    <g>
      <line x1={RAIL_X0} x2={RAIL_VIEW.width - RAIL_X0} y1={bottom + 1.5} y2={bottom + 1.5} className="nw-track" vectorEffect="non-scaling-stroke" />
      {plain.map((item, index) => {
        const target = merged[index] ?? item;
        const share = counter === "records" ? ease(merge) : 0;
        const x = lerp(item.x, target.x, share);
        const w = lerp(item.w, target.w, share);
        const level = lerp(item.level, target.level, share);
        const fly = flight(t, item.row);
        const h = counter === "records" ? DOT_H : RAIL_H;
        const y = bottom - h - level * DOT_STEP;
        const fromX = sourceX(item.row);
        const fx = lerp(fromX, x, fly);
        const fy = lerp(-RAIL_H, y, fly);
        const fw = lerp(2, w, fly);
        return (
          <rect
            key={item.row}
            x={fx}
            y={fy}
            width={Math.max(0.5, fw)}
            height={h}
            className={item.filled ? "nw-mark-fill" : "nw-mark-line"}
            opacity={item.ghost ? 1 - fly : fly > 0 ? 1 : 0}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      <line
        x1={tick}
        x2={tick}
        y1={RAIL_Y[counter] - 4}
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
function RailGroup({ legend, children }: { readonly legend: string | null; readonly children: ReactNode }) {
  if (legend === null) return <>{children}</>;
  return (
    <fieldset className="nw-rail-group" data-chip-group="nw-counter">
      <legend className="sr-only">{legend}</legend>
      {children}
    </fieldset>
  );
}

/** Beats 2 and 3: the 23 September rows of ncr_records.csv, laid out three ways. */
export function StageRails({ pack, fmt, t, framed, merge, top, choice }: RailsProps) {
  const count = span(t, REVEAL.count[0], REVEAL.count[1]);
  const showVerdict = t >= REVEAL.verdict;
  const showFrame = t >= REVEAL.frame;
  const groups = mergeRecords(CRAFT_NCR_SEP).length;
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
        <RailGroup legend={choice?.legend ?? null}>
        {COUNTERS.map((counter) => {
          const aug = rate(counter, "aug");
          const sep = rate(counter, "sep");
          const now = counter === "records" ? lerp(sep, rate("records", "sep", true), ease(merge)) : sep;
          const value = lerp(0, now, ease(count));
          const isMerged = counter === "records" && merge > 0.5;
          const Row = choice ? "label" : "div";
          return (
            <Row
              key={counter}
              className="nw-rail-label"
              data-rail={counter}
              data-choosable={choice ? "" : undefined}
              data-framed={framed === counter && showFrame ? "" : undefined}
              style={{ top: pct(RAIL_Y[counter] - 22, RAIL_VIEW.height), height: pct(RAIL_H + 30, RAIL_VIEW.height) }}
            >
              {choice ? (
                <input
                  type="radio"
                  name="nw-counter"
                  value={counter}
                  checked={choice.value === counter}
                  onChange={() => choice.onChange(counter)}
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
      <p className="nw-per">{fill(pack.reveal.per, { per: fmt.per })}</p>
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
