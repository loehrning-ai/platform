"use client";

import { useState, type ReactNode } from "react";
import { decisionLines, type DecisionLine } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/decision-lines";
import { TEST_ORDER, type Evaluation, type TestId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import { DocView, marksOf, type DocMark } from "./doc-view";
import { testSentence, type Fmt } from "./fmt";

/** What the line under the band means: the sentence of the first check that reads it. */
export function bandReadout(fmt: Fmt, evaluation: Evaluation, decisions: readonly DecisionLine[], line: number | null, noticeHours: number): string | null {
  if (line === null) return null;
  const tests = decisions.filter((entry) => entry.line === line).map((entry) => entry.test);
  const first = tests[0];
  if (!first) return null;
  const words = tests.map((test) => `${fmt.copy.check[test]}: ${evaluation.failed.includes(test) ? fmt.copy.sheet.failed : fmt.copy.sheet.passed}`).join(", ");
  return `${words}. ${testSentence(fmt, evaluation, first, noticeHours)}`;
}

/** The deciding line the band rests on first: the first failing check's, else the first one. */
export function firstBand(evaluation: Evaluation, decisions: readonly DecisionLine[], focus?: TestId): number | null {
  const pick = (test: TestId | undefined) => (test ? decisions.find((entry) => entry.test === test) : undefined);
  return (pick(focus) ?? pick(evaluation.failed[0]) ?? decisions[0])?.line ?? null;
}

/** The four checks of one file as plain sentences: pass or fail, and why. */
export function CheckList({ fmt, evaluation, noticeHours, lit }: { readonly fmt: Fmt; readonly evaluation: Evaluation; readonly noticeHours: number; readonly lit?: ReadonlySet<TestId> }) {
  return (
    <ul className="w05-checklist" data-w05-checklist={evaluation.doc.file}>
      {TEST_ORDER.map((test) => {
        const shown = !lit || lit.has(test);
        const failed = evaluation.failed.includes(test);
        const notMet = test === "quote" && evaluation.tests.quote.kind === "notMet";
        const state = !shown ? "open" : failed ? "fail" : "pass";
        return (
          <li key={test} data-state={state} data-w05-check={test}>
            <span className="w05-check-word">
              {fmt.copy.check[test]}
              <span className="w05-check-state">{!shown ? "" : notMet ? fmt.copy.sheet.notMet : failed ? fmt.copy.sheet.failed : fmt.copy.sheet.passed}</span>
            </span>
            {shown ? <span className="w05-check-text">{testSentence(fmt, evaluation, test, noticeHours)}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Step down from a request (scene 2): its best file in the document view
 * with the Prüflupe already resting on the line that decided it, then the
 * four checks as sentences.
 */
export function EvidenceView({
  fmt,
  evaluation,
  noticeHours,
  reducedMotion,
  focus,
  children,
}: {
  readonly fmt: Fmt;
  readonly evaluation: Evaluation;
  readonly noticeHours: number;
  readonly reducedMotion: boolean;
  readonly focus?: TestId;
  readonly children?: ReactNode;
}) {
  const decisions = decisionLines(evaluation);
  const marks: readonly DocMark[] = marksOf(decisions);
  const [band, setBand] = useState<number | null>(() => firstBand(evaluation, decisions, focus));
  const { copy } = fmt;
  const covered = evaluation.tests.quote.quote !== null;
  return (
    <div className="w05-evidence" data-w05-evidence={evaluation.item.id}>
      <p className="w05-sheet-lead">{covered ? fmt.t(copy.sheet.best, { id: evaluation.item.id, file: evaluation.doc.file }) : fmt.t(copy.sheet.none, { id: evaluation.item.id })}</p>
      <p className="w05-request-text" lang="en">
        {evaluation.item.request}
      </p>
      <p className="w05-hint">{copy.sheet.lensHint}</p>
      <DocView
        name={evaluation.doc.file}
        text={evaluation.doc.text}
        marks={marks}
        band={band}
        onBand={setBand}
        lensLabel={copy.sheet.lens}
        lineLabel={(n) => fmt.t(copy.line, { n })}
        readout={bandReadout(fmt, evaluation, decisions, band, noticeHours)}
        reducedMotion={reducedMotion}
      />
      {children}
      <p className="w05-label">{fmt.t(copy.sheet.ring, { file: evaluation.doc.file })}</p>
      <CheckList fmt={fmt} evaluation={evaluation} noticeHours={noticeHours} />
    </div>
  );
}

/** A file on its own (scene 1, a found quote, the visitor's text file): the band rests on `line` when there is one. */
export function PlainFile({
  fmt,
  name,
  text,
  line,
  marks = [],
  readout,
  reducedMotion,
  note,
}: {
  readonly fmt: Fmt;
  readonly name: string;
  readonly text: string;
  readonly line: number | null;
  readonly marks?: readonly DocMark[];
  readonly readout?: (line: number | null) => string | null;
  readonly reducedMotion: boolean;
  readonly note?: string | null;
}) {
  const [band, setBand] = useState<number | null>(line);
  const all: readonly DocMark[] = line !== null && !marks.some((mark) => mark.line === line) ? [...marks, { line, tests: [], pass: true }].sort((a, b) => a.line - b.line) : marks;
  return (
    <div className="w05-plain" data-w05-plain={name}>
      {note ? <p className="w05-hint">{note}</p> : null}
      <DocView
        name={name}
        text={text}
        marks={all}
        band={band}
        onBand={setBand}
        lensLabel={fmt.copy.sheet.lens}
        lineLabel={(n) => fmt.t(fmt.copy.line, { n })}
        readout={readout ? readout(band) : null}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
