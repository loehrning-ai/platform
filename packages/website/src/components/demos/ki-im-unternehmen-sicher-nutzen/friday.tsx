"use client";

import { cx } from "@/components/werk";
import {
  FRIDAY_KEY,
  fmt,
  fridayJudge,
  ledgerSummary,
  quote,
} from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/core";
import { stampFrame } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/motion";
import type { W05Text } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/pack";
import type { FridayNumber, Vote } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";
import { LightLabel } from "./glyphs";
import { LedgerTable } from "./ledger";
import { resultsOf, type DemoState } from "./store";

const VOTES: readonly Vote[] = ["true", "half", "false"];

type FridayRow = W05Text["fridayRows"][number];

export function fridayResultId(n: FridayNumber): string {
  return `w05-friday-${n}-result`;
}

interface Props {
  readonly state: DemoState;
  readonly text: W05Text;
  readonly stamp: { readonly n: FridayNumber; readonly t: number } | null;
  readonly onVote: (n: FridayNumber, vote: Vote) => void;
}

/** Deck slide 12: the boss's three sentences, a vote each, then the evidence. */
export function Friday({ state, text, stamp, onVote }: Props) {
  const copy = text.ui;
  const showLedger = state.runs.dario.picked !== null;
  const summary = ledgerSummary(text, resultsOf(state, text.scenes));
  const allVoted = text.fridayRows.every((row) => state.votes[row.n] !== undefined);

  return (
    <section
      id="freitag"
      aria-labelledby="freitag-heading"
      className="scroll-mt-24 border-t-2 border-scene-line pt-4"
      data-friday=""
    >
      <h2 id="freitag-heading" tabIndex={-1} className="text-fluid-h2 font-bold">
        {copy.fridayHeading}
      </h2>
      <p className="mt-2 text-body text-muted-foreground">{copy.fridayIntro}</p>

      <div className={cx("mt-6 grid gap-6", showLedger && "lg:grid-cols-[7fr_5fr] lg:gap-10")}>
        {showLedger ? (
          // A plain block, not a second landmark: the island's aside already
          // carries the name "Deine acht Ampeln".
          <div className="lg:order-2" data-friday-ledger="">
            <h3 id="w05-friday-ledger" className="text-[1.25rem] font-bold">
              {copy.tableHeading}
            </h3>
            <div className="mt-3">
              <LedgerTable state={state} text={text} headingId="w05-friday-ledger" />
            </div>
            <p className="mt-3 border-l-[3px] border-[var(--color-bernstein)] pl-3 text-[1rem] font-semibold leading-snug" data-summary="">
              {summary.line}
            </p>
          </div>
        ) : null}

        <div className="grid min-w-0 gap-5 lg:order-1">
          <div className="border-2 border-foreground bg-[var(--color-paper)]" data-customer-mail="">
            <p className="border-b border-hairline bg-[var(--color-inset)] px-4 py-2 text-[0.875rem] font-semibold text-muted-foreground">
              {copy.mailMeta}
            </p>
            <div className="px-4 py-3">
              <p className="font-bold">{copy.mailAsks}</p>
              <ol className="mt-1.5 grid list-decimal gap-1 pl-6 text-[1rem] leading-snug">
                {copy.mailQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ol>
              <p className="mt-3 border-t border-hairline pt-3 text-[0.9375rem] leading-snug text-muted-foreground">
                {copy.clause}
              </p>
            </div>
          </div>

          <p className="text-[1rem] font-bold">{copy.draftLabel}</p>
          <ol className="grid gap-4">
            {text.fridayRows.map((row) => (
              <FridaySentence
                key={row.n}
                row={row}
                text={text}
                vote={state.votes[row.n]}
                stampT={stamp?.n === row.n ? stamp.t : 1}
                onVote={(vote) => onVote(row.n, vote)}
              />
            ))}
          </ol>

          {/* Until every sentence has a vote, the true sentences are not on
              screen yet, so the close line would point at the boss's draft. */}
          <p className="text-[1rem] leading-snug" data-friday-close={allVoted ? "done" : "pending"}>
            {allVoted ? copy.fridayClose : copy.fridayPending}{" "}
            <a href="#mitnehmen" className="anti-link font-semibold">
              {copy.fridayCloseLink}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

function FridaySentence({
  row,
  text,
  vote,
  stampT,
  onVote,
}: {
  readonly row: FridayRow;
  readonly text: W05Text;
  readonly vote: Vote | undefined;
  readonly stampT: number;
  readonly onVote: (vote: Vote) => void;
}) {
  const copy = text.ui;
  const legendId = `w05-friday-${row.n}-legend`;
  const right = vote ? fridayJudge(row.n, vote).right : false;
  const frame = stampFrame(stampT);

  return (
    <li className="border-2 border-foreground bg-[var(--color-paper)] p-4" data-sentence={row.n}>
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend id={legendId} className="w-full p-0">
          <span className="flex gap-3">
            <span className="text-[1.5rem] font-bold leading-none tabular-nums" aria-hidden="true">
              {row.n}
            </span>
            <span className="text-[1.1875rem] font-bold leading-snug">
              <span className="sr-only">{fmt(copy.voteLegend, { n: row.n })} </span>
              {quote(text, row.sentence)}
            </span>
          </span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {VOTES.map((option) => (
            <button
              key={option}
              type="button"
              className="w05-vote anti-btn"
              aria-pressed={vote === option}
              aria-disabled={vote ? true : undefined}
              data-vote={option}
              onClick={() => {
                if (!vote) onVote(option);
              }}
            >
              {copy.votes[option]}
            </button>
          ))}
        </div>
      </fieldset>

      {vote ? (
        <div className="mt-4 border-t border-hairline pt-3" data-friday-result="">
          <h4 id={fridayResultId(row.n)} tabIndex={-1} className="text-[1.0625rem]">
            <span
              className={cx("w05-stamp", right ? "text-[var(--color-risk-green)]" : "text-[var(--color-risk-red)]")}
              data-t={frame.opacity.toFixed(2)}
              style={{ opacity: frame.opacity, transform: `scale(${frame.scale})` }}
            >
              {right ? copy.right : fmt(copy.wrong, { key: copy.votes[FRIDAY_KEY[row.n]] })}
            </span>
          </h4>
          <p className="mt-3 text-[0.875rem] font-bold">{copy.evidence}</p>
          <ul className="mt-1 grid gap-1">
            {row.evidence.map((line) => (
              <li key={line} className="flex gap-2 text-[0.9375rem] leading-snug">
                <span aria-hidden="true" className="mt-[0.45rem] inline-block size-1.5 shrink-0 bg-current" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.875rem] font-bold">{copy.trueWould}</p>
          <blockquote className="mt-1 border-l-[3px] border-[#1f4a38] bg-[#dce6d4] px-3 py-2 text-[1rem] leading-snug text-[#1f4a38]">
            {quote(text, row.trueSentence)}
          </blockquote>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem]">
            {row.lights.map((entry) => (
              <span key={entry.light} className="inline-flex items-center gap-1.5">
                <LightLabel light={entry.light} copy={copy} />
                {entry.label ? <span>{entry.label}</span> : null}
              </span>
            ))}
            {row.owner ? (
              <span>
                · {copy.owner} <span className="font-semibold">{row.owner}</span>
              </span>
            ) : null}
          </p>
        </div>
      ) : null}
    </li>
  );
}
