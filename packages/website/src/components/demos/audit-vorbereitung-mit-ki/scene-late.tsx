"use client";

import { GlasChip } from "@/components/demos/glas";
import type { Model } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import { fillNote } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/note";
import type { Fmt } from "./fmt";

export type LateStep = "start" | "edited" | "written";

/** The new-paper note with the title, the day it is written and the known facts filled in. The signature stays empty. */
export function lateNote(fmt: Fmt, model: Model): string {
  const { copy } = fmt;
  const weekday = model.week.find((cell) => cell.date === model.today)?.weekday ?? null;
  const day = fmt.t(copy.late.day, { weekday: fmt.weekday(weekday), date: fmt.date(model.today) }).trim();
  return fillNote(model.noteTemplate, fmt.locale, {
    title: fmt.t(copy.late.title, { month: copy.months[Number(model.pay.periodEnd.slice(5, 7)) - 1] as string }),
    day,
    known: fmt.t(copy.late.known, { periodEnd: fmt.date(model.pay.periodEnd), paid: fmt.date(model.pay.paid), file: model.pay.file }),
  });
}

/** Scene 6: the pay date that was late. Changing it leaves the old value visible; the honest way is a new dated paper. */
export function LateStage({ fmt, model, step }: { readonly fmt: Fmt; readonly model: Model; readonly step: LateStep }) {
  const { copy } = fmt;
  const { pay } = model;
  const month = copy.months[Number(pay.periodEnd.slice(5, 7)) - 1] as string;
  const edited = step !== "start";
  const shownRow = edited ? pay.row.replace(pay.paid, pay.limit) : pay.row;
  return (
    <div className="w05-late" data-w05-late={step}>
      <p className="w05-lead">{fmt.t(copy.late.lead, { month, n: pay.daysLate })}</p>
      <section className="w05-sheet-card" aria-label={fmt.t(copy.late.rowLabel, { file: pay.file })}>
        <GlasChip kind="file">{pay.file}</GlasChip>
        {edited ? <p className="w05-label">{copy.late.editedLabel}</p> : null}
        <pre className="w05-quote" data-w05-row-text="">
          {pay.header}
          {"\n"}
          {shownRow}
        </pre>
        {edited ? (
          <p className="w05-ghost" data-w05-ghost="">
            <span className="w05-old">{fmt.t(copy.late.oldValue, { date: fmt.date(pay.paid) })}</span> <span>{copy.late.ghost}</span>
          </p>
        ) : null}
      </section>
      {step === "written" ? (
        <section className="w05-sheet-card" aria-label={copy.late.noteLabel}>
          <p className="w05-label">{copy.late.noteLabel}</p>
          <pre className="w05-note" data-w05-note="">
            {lateNote(fmt, model)}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
