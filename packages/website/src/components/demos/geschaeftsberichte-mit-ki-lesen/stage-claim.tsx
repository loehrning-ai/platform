"use client";

import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { CRAFT_WEEKS, REPORT } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { span } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/timelines";
import { fill, type Fmt } from "./fmt";

export const REPORT_FILE = "reports/2023-09-monthly-report.md";
export const REPORT_YEAR = (CRAFT_WEEKS[0]?.start ?? "").slice(0, 4);
/** The decision section of the September report. */
export const DECISION_SECTION = 5;

/** Beat 1: the VP's sentence from the kit report, its figure underlined in Mennige as t runs. */
export function StageClaim({ pack, fmt, progress }: { readonly pack: DemoPack; readonly fmt: Fmt; readonly progress: number }) {
  const copy = pack.claim;
  const figure = fill(copy.quoteFigure, { a: fmt.n(REPORT.vpDefectsAug, 2), b: fmt.n(REPORT.vpDefectsSep, 2), per: fmt.per });
  const draw = span(progress, 0.1, 1);
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
        <footer className="nw-quote-by">{copy.speaker}</footer>
      </blockquote>
      <p className="nw-file">
        <span className="nw-file-label">{pack.kitFile}</span> <code>{REPORT_FILE}</code>
      </p>
    </div>
  );
}
