"use client";

import { GlasChip } from "@/components/demos/glas";
import { ownStatus, TEST_ORDER, type TestId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import type { Fmt } from "./fmt";

/** The most papers the page lists, so a pasted file cannot grow the page without end. */
export const OWN_LIMIT = 12;

/** One paper per line: trimmed, empty lines dropped, duplicates merged, cut at the limit. */
export function papersOf(text: string): readonly string[] {
  return [...new Set(text.split("\n").map((line) => line.trim()).filter((line) => line !== ""))].slice(0, OWN_LIMIT);
}

export type OwnTicks = Readonly<Record<string, readonly TestId[]>>;

/** Scene 7: the visitor's own papers, one test chip per test. Nothing is stored; the status never reaches covered. */
export function OwnStage({
  fmt,
  text,
  onText,
  ticks,
  onTick,
}: {
  readonly fmt: Fmt;
  readonly text: string;
  readonly onText: (text: string) => void;
  readonly ticks: OwnTicks;
  readonly onTick: (paper: string, test: TestId) => void;
}) {
  const { copy } = fmt;
  const papers = papersOf(text);
  return (
    <div className="w05-own" data-w05-own="">
      <p className="w05-lead">{copy.own.lead}</p>
      <label className="w05-field">
        <span className="w05-label">{copy.own.label}</span>
        <textarea className="w05-textarea" rows={4} value={text} placeholder={copy.own.placeholder} onChange={(event) => onText(event.target.value)} spellCheck={false} autoComplete="off" data-w05-own-text="" />
      </label>
      <p className="w05-hint">{copy.own.privacy}</p>
      {papers.length === 0 ? <p className="w05-hint">{copy.own.empty}</p> : null}
      <ul className="w05-papers-own">
        {papers.map((paper) => {
          const set = new Set(ticks[paper] ?? []);
          // Nothing ticked yet: a neutral state, never a red verdict on input the visitor has not given.
          const status = set.size === 0 ? "idle" : ownStatus(set);
          return (
            <li key={paper} className="w05-own-paper" data-w05-own-paper="" data-status={status}>
              <span className="w05-own-name">{paper}</span>
              <span className="w05-guess" role="group" aria-label={fmt.t(copy.own.testsFor, { paper })}>
                {TEST_ORDER.map((test) => (
                  <GlasChip key={test} kind="filter" selected={set.has(test)} onClick={() => onTick(paper, test)}>
                    {copy.test[test]}
                  </GlasChip>
                ))}
              </span>
              <span className="w05-own-status">{copy.own.status[status]}</span>
            </li>
          );
        })}
      </ul>
      <p className="w05-hint">{copy.own.note}</p>
      {text.split("\n").filter((line) => line.trim() !== "").length > OWN_LIMIT ? <p className="w05-hint">{fmt.t(copy.own.limit, { n: OWN_LIMIT })}</p> : null}
    </div>
  );
}
