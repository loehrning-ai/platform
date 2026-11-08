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

/** Scene 5: the pay date that was late. Changing it leaves the old value visible; the honest way is a new dated paper. */
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

/** Scene 6: which columns of the employee records go to an AI tool, and the level that follows from it. */
export function LevelStage({ fmt, model, picked, onToggle }: { readonly fmt: Fmt; readonly model: Model; readonly picked: ReadonlySet<string>; readonly onToggle: (id: string) => void }) {
  const { copy } = fmt;
  const level = picked.size === 0 ? 3 : 4;
  return (
    <div className="w05-level" data-w05-level={level}>
      <p className="w05-lead">{fmt.t(copy.level.lead, { n: model.columns.length })}</p>
      {picked.size > 0 ? (
        <p className="w05-chips" data-w05-selected="">
          <GlasChip kind="status">{fmt.t(copy.level.selected, { n: picked.size, total: model.columns.length })}</GlasChip>
        </p>
      ) : null}
      <div className="w05-columns" role="group" aria-label={copy.level.group}>
        {model.columns.map((column) => (
          <GlasChip key={column.id} kind="filter" selected={picked.has(column.id)} onClick={() => onToggle(column.id)}>
            {column.meaning}
          </GlasChip>
        ))}
      </div>
      <ol className="w05-levels">
        {copy.level.levels.map((name, index) => (
          <li key={name} className="w05-levels-item" data-active={index + 1 === level ? "" : undefined} data-here={index === 1 ? "" : undefined}>
            <span className="w05-levels-n">{fmt.t(copy.level.levelLabel, { n: index + 1 })}</span> {name}
            {index === 1 ? <span className="w05-hint"> {copy.level.here}</span> : null}
          </li>
        ))}
      </ol>
      {level === 4 ? (
        <div className="w05-gates" data-w05-gates="">
          <p className="w05-label">{copy.level.gatesLead}</p>
          <ul>
            {copy.level.gates.map((gate, index) => (
              <li key={gate}>
                <strong>{gate}</strong> {copy.level.gatesGloss[index]}
              </li>
            ))}
          </ul>
          <p className="w05-hint">{copy.level.health}</p>
        </div>
      ) : null}
    </div>
  );
}
