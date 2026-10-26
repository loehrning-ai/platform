"use client";

import { useState } from "react";
import { GlasChip, GlasSheet } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { REPORT } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { unitsShipped } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import type { Fmt } from "./fmt";

const REPORT_FILE = "reports/2023-09-monthly-report.md";
const REPORT_YEAR = 2023;
const REPORT_SECTION = 5;

/**
 * The claim: the VP's sentence from section 5 of the invented monthly report,
 * with the figure underlined. Full in scene 1, a one-line strip after it. The
 * file chip opens the section and the report's CRAFT figures in a sheet.
 */
export function ReportCard({ pack, fmt, compact }: { readonly pack: DemoPack; readonly fmt: Fmt; readonly compact: boolean }) {
  const [open, setOpen] = useState(false);
  const r = pack.report;
  const figure = fmt.t(r.quoteFigure, {
    a: fmt.n(REPORT.vpDefectsAug, 2),
    b: fmt.n(REPORT.vpDefectsSep, 2),
  });
  if (compact) {
    return (
      <p className="w02-report-strip" data-w02-report="" data-compact="">
        <span className="w02-invented">{pack.invented}</span>{" "}
        {fmt.t(r.strip, {
          a: fmt.n(REPORT.vpDefectsAug, 2),
          b: fmt.n(REPORT.vpDefectsSep, 2),
        })}
      </p>
    );
  }
  return (
    <div className="w02-report" data-w02-report="">
      <p className="w02-report-kicker">
        <span>{fmt.t(r.kicker, { year: REPORT_YEAR, section: REPORT_SECTION })}</span>
        <span className="w02-invented">{pack.invented}</span>
      </p>
      <p className="w02-report-speaker">{r.speaker}</p>
      <blockquote className="w02-report-quote">
        {fmt.t(r.quoteBefore)}
        <mark className="w02-report-figure">{figure}</mark>
        {fmt.t(r.quoteAfter)}
      </blockquote>
      <div className="w02-report-file">
        <GlasChip kind="file" icon="doc" onClick={() => setOpen(true)} label={r.open}>
          {REPORT_FILE.split("/").pop() as string}
        </GlasChip>
      </div>
      <GlasSheet open={open} onClose={() => setOpen(false)} title={fmt.t(r.sheetTitle, { section: REPORT_SECTION })} closeLabel={pack.close} resizeLabel={pack.resize}>
        <p className="w02-sheet-lead">{r.sheetLead}</p>
        <blockquote className="w02-report-quote">
          {fmt.t(r.quoteBefore)}
          <mark className="w02-report-figure">{figure}</mark>
          {fmt.t(r.quoteAfter)}
        </blockquote>
        <table className="w02-table">
          <caption>{fmt.t(r.tableHead)}</caption>
          <tbody>
            <tr>
              <th scope="row">{r.rows.units}</th>
              <td>{fmt.n(unitsShipped("sep"))}</td>
            </tr>
            <tr>
              <th scope="row">{r.rows.growth}</th>
              <td>{fmt.pct(REPORT.unitsGrowthPermille / 1000)}</td>
            </tr>
            <tr>
              <th scope="row">{r.rows.revenue}</th>
              <td>{fmt.eur(REPORT.craftRevenueEur)}</td>
            </tr>
            <tr>
              <th scope="row">{r.rows.price}</th>
              <td>{fmt.eur(REPORT.avgPriceCents / 100, 2)}</td>
            </tr>
            <tr>
              <th scope="row">{fmt.t(r.rows.defects)}</th>
              <td>
                {fmt.n(REPORT.vpDefectsAug, 2)}, {fmt.n(REPORT.vpDefectsSep, 2)}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="w02-sheet-file">{REPORT_FILE}</p>
      </GlasSheet>
    </div>
  );
}
