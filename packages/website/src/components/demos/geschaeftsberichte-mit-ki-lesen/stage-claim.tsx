"use client";

import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { CRAFT_NCR_SEP, CRAFT_WEEKS, REPORT } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { ease, RAIL_VIEW, span, stagger, stripBar } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/timelines";
import { fill, type Fmt } from "./fmt";

export const REPORT_FILE = "reports/2023-09-monthly-report.md";
export const REPORT_YEAR = (CRAFT_WEEKS[0]?.start ?? "").slice(0, 4);
/** The decision section of the September report. */
export const DECISION_SECTION = 5;

/** The strip's own viewBox: the full rail width, bars up to STRIP_H tall on a baseline. */
const STRIP_VIEW = { width: RAIL_VIEW.width, height: 100 } as const;
const STRIP_BASE = 96;
const STRIP_H = 92;

/**
 * Beat 1: the VP's sentence from the kit report, its figure underlined in
 * Mennige as t runs, and under it the file the sentence is about: the 23
 * September rows of ncr_records.csv as upright bars (height qty_affected,
 * filled = scrap, outlined = rework). The tap sends these same bars into the
 * three rails of beat 2.
 */
export function StageClaim({ pack, fmt, progress }: { readonly pack: DemoPack; readonly fmt: Fmt; readonly progress: number }) {
  const copy = pack.claim;
  const figure = fill(copy.quoteFigure, { a: fmt.n(REPORT.vpDefectsAug, 2), b: fmt.n(REPORT.vpDefectsSep, 2), per: fmt.per });
  const draw = span(progress, 0.05, 0.55);
  return (
    <div className="nw-claim">
      <div className="nw-top">
        <p className="nw-caps">{fill(copy.caps, { year: REPORT_YEAR, section: DECISION_SECTION })}</p>
      </div>
      <blockquote className="nw-quote" data-nw-quote="">
        <p>
          {copy.quoteBefore}
          <span className="nw-figure">
            {figure}
            <span className="nw-figure-line" aria-hidden="true" style={{ transform: `scaleX(${draw})` }} />
          </span>
          {copy.quoteAfter}
        </p>
        <footer className="nw-quote-by">
          {copy.speaker} · <code>{REPORT_FILE}</code>
        </footer>
      </blockquote>
      <div className="nw-strip-band" data-nw-file-strip="">
        <p className="nw-file">{fill(pack.reveal.file, { n: CRAFT_NCR_SEP.length })}</p>
        <div className="nw-area">
          <svg className="nw-svg" viewBox={`0 0 ${STRIP_VIEW.width} ${STRIP_VIEW.height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <line x1="8" x2={STRIP_VIEW.width - 8} y1={STRIP_BASE + 1.5} y2={STRIP_BASE + 1.5} className="nw-track" vectorEffect="non-scaling-stroke" />
            {CRAFT_NCR_SEP.map((row, index) => {
              const bar = stripBar(index, STRIP_BASE, STRIP_H);
              const rise = ease(stagger(progress, index, CRAFT_NCR_SEP.length, 0.2, 1, 0.4));
              const h = bar.h * rise;
              return (
                <rect
                  key={row.id}
                  x={bar.x}
                  y={STRIP_BASE - h}
                  width={bar.w}
                  height={h}
                  className={row.scrap ? "nw-mark-fill" : "nw-mark-line"}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
        </div>
        <p className="nw-strip-key">{copy.stripKey}</p>
      </div>
    </div>
  );
}
