"use client";

import type { CSSProperties } from "react";
import { GlasChip } from "@/components/demos/glas";
import { GUESS_LINES } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/beats";
import { clockVerdict } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/clock-rule";
import { daysBetween } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/dates";
import { statusOf, STATUS_ORDER, TEST_ORDER, type Status, type TestId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import type { Model, ModelLine } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import type { Fmt } from "./fmt";

export type Guesses = Readonly<Partial<Record<string, Status>>>;

const isGuessLine = (id: string) => (GUESS_LINES as readonly string[]).includes(id);

/** Scene 1: the thirteen questions of the inspector's list, drawn one by one; three of them ask for a guess. */
export function FolderStage({
  fmt,
  model,
  drawn,
  guesses,
  onGuess,
  locked,
}: {
  readonly fmt: Fmt;
  readonly model: Model;
  /** How many cards are drawn so far. */
  readonly drawn: number;
  readonly guesses: Guesses;
  readonly onGuess: (id: string, status: Status) => void;
  /** The guesses are kept: the chips stop taking taps. */
  readonly locked: boolean;
}) {
  const { copy } = fmt;
  return (
    <div className="w05-folder" data-w05-folder="">
      <p className="w05-hint">{copy.folder.invented}</p>
      <p className="w05-lead">{fmt.t(copy.folder.lead, { n: model.lines.length, guesses: GUESS_LINES.length })}</p>
      <ol className="w05-cards">
        {model.lines.map((line, index) => (
          <li key={line.id} className="w05-card" data-w05-card={line.id} data-drawn={index < drawn ? "" : undefined} data-guess={isGuessLine(line.id) ? "" : undefined} style={{ "--i": index } as CSSProperties}>
            <span className="w05-card-head">
              <span className="w05-card-id">{line.id}</span>
              <span className="w05-card-label">{line.label}</span>
            </span>
            <span className="w05-card-q">{line.question}</span>
            {isGuessLine(line.id) ? (
              <span className="w05-guess" role="group" aria-label={fmt.t(copy.folder.guessFor, { label: line.label })}>
                {STATUS_ORDER.map((status) => (
                  <GlasChip key={status} kind="filter" selected={guesses[line.id] === status} onClick={() => (locked ? undefined : onGuess(line.id, status))} label={`${line.label}: ${fmt.status(status)}`}>
                    {fmt.status(status)}
                  </GlasChip>
                ))}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Scene 2: the days from the notice to the visit, counted on the calendar and in working days. */
export function ClockStage({ fmt, model, pick }: { readonly fmt: Fmt; readonly model: Model; readonly pick: number }) {
  const { copy } = fmt;
  const chosen = model.clock[pick] ?? (model.clock[model.clock.length - 1] as Model["clock"][number]);
  const verdict = clockVerdict(chosen.workingBetween, model.needWorking);
  const due = daysBetween(chosen.visit, chosen.papersDue);
  // A weekend date is never printed: only a paper day on Monday to Friday is named, the others show the day count.
  const papers = chosen.papersDueOnWorkday ? fmt.t(copy.clock.papers, { days: due, date: fmt.short(chosen.papersDue, chosen.papersDueWeekday) }) : fmt.t(copy.clock.papersNote, { days: due });
  let between = 0;
  return (
    <div className="w05-clock" data-w05-clock={pick}>
      <p className="w05-lead">{fmt.t(copy.clock.lead, { notice: fmt.date(model.notice) })}</p>
      {/* The strip is keyed by the pick, so the working days light up one after the other each time. */}
      <ol className="w05-days" key={pick}>
        {model.week.map((cell, index) => {
          const role = index === 0 ? "notice" : cell.date === chosen.visit ? "visit" : cell.date < chosen.visit ? "between" : "after";
          if (role === "between") between += 1;
          return (
            <li key={cell.date} className="w05-day" data-role={role} style={{ "--k": role === "between" ? between : 0 } as CSSProperties}>
              <span className="w05-day-name">{fmt.day(cell.date, cell.weekday)}</span>
              {role === "between" ? <span className="w05-day-n">{between}</span> : null}
            </li>
          );
        })}
      </ol>
      <dl className="w05-counts">
        <div className="w05-count" data-w05-calendar={chosen.calendar}>
          <dt>{copy.clock.calendar}</dt>
          <dd>{chosen.calendar}</dd>
        </div>
        <div className="w05-count" data-w05-working={chosen.workingBetween} data-verdict={verdict}>
          <dt>{copy.clock.working}</dt>
          <dd>{chosen.workingBetween}</dd>
        </div>
      </dl>
      <p className="w05-verdict" data-w05-verdict={verdict}>
        <GlasChip kind="status">{copy.clock.verdict[verdict]}</GlasChip> <span className="w05-hint">{fmt.t(copy.clock.rule, { need: model.needWorking })}</span>
      </p>
      <p className="w05-hint">{copy.clock.open}</p>
      <p className="w05-hint">{papers}</p>
    </div>
  );
}

function PaperTests({ fmt, line, focus, paper }: { readonly fmt: Fmt; readonly line: ModelLine; readonly focus: TestId | null; readonly paper: "L04" | "L11" }) {
  const { copy } = fmt;
  const reasons = copy.tests.reasons[paper] as Readonly<Partial<Record<TestId, string>>>;
  const status = statusOf(line.tests, line.broken);
  return (
    <>
      <ul className="w05-tests">
        {TEST_ORDER.map((test) => {
          const holds = line.tests[test];
          return (
            <li key={test} className="w05-test" data-holds={holds ? "" : undefined} data-focus={focus === test ? "" : undefined} data-w05-test={test}>
              <span className="w05-test-name">{copy.test[test]}</span>
              <span className="w05-test-state">{holds ? copy.tests.holds : copy.tests.fails}</span>
              {!holds && reasons[test] ? <span className="w05-test-why">{reasons[test]}</span> : null}
            </li>
          );
        })}
      </ul>
      <p className="w05-paper-result" data-w05-status={status}>
        <GlasChip kind="status">{fmt.t(copy.tests.result, { paper: copy.tests.papers[paper], status: fmt.status(status) })}</GlasChip>
      </p>
    </>
  );
}

/** Scene 3: the four tests on two papers of the folder, the attendance sheet and the safety statement. */
export function TestsStage({ fmt, model, focus }: { readonly fmt: Fmt; readonly model: Model; readonly focus: TestId | null }) {
  const { copy } = fmt;
  const papers = [
    { id: "L04" as const, view: model.attendance },
    { id: "L11" as const, view: model.statement },
  ];
  return (
    <div className="w05-tests-stage" data-w05-tests="">
      <p className="w05-lead">{copy.tests.lead}</p>
      <div className="w05-papers">
        {papers.map(({ id, view }) => {
          const line = model.lines.find((entry) => entry.id === id) as ModelLine;
          return (
            <section key={id} className="w05-paper" data-w05-paper={id} aria-label={copy.tests.papers[id]}>
              <h3 className="w05-paper-title">{copy.tests.papers[id]}</h3>
              <GlasChip kind="file">{view.file}</GlasChip>
              <pre className="w05-quote">{view.lines.join("\n")}</pre>
              <PaperTests fmt={fmt} line={line} focus={focus} paper={id} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
