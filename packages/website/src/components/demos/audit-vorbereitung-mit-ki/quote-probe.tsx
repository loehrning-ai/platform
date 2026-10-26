"use client";

import { useState } from "react";
import type { AuditContext } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import { checkAnswer, MAX_ANSWER, parseClaudeAnswer, type CheckedRow, type Flag } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/claude-answer";
import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { formatPercent } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/counts";
import { fill } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/fill";
import type { Loc } from "./words";

function flagText(flag: Flag, copy: W05Copy, locale: Loc): string {
  const words = copy.probe.flag;
  switch (flag.kind) {
    case "missing-file":
      return fill(words.missingFile, { file: flag.file });
    case "covered-no-quote":
      return words.coveredNoQuote;
    case "policy-for-record":
      return fill(words.policyForRecord, { file: flag.file });
    case "source-fails":
      return fill(words.sourceFails, { file: flag.file, test: copy.test[flag.test] });
    case "unknown-ref":
      return fill(words.unknownRef, { ref: flag.ref });
    case "compliance-word":
      return fill(words.compliance, { word: flag.word });
    case "status-differs":
      return fill(words.statusDiffers, { expected: copy.status[flag.expected] });
    case "number-differs":
      return fill(words.numberDiffers, { found: flag.found.toLocaleString(locale), expected: flag.expected.toLocaleString(locale) });
  }
}

/** Zitat-Probe: Claude's Mission 2 table, every quote looked up in the eleven files, here in the tab. */
export function QuoteProbe({
  copy,
  locale,
  context,
  onFirstInput,
}: {
  readonly copy: W05Copy;
  readonly locale: Loc;
  readonly context: AuditContext;
  readonly onFirstInput: () => void;
}) {
  const [text, setText] = useState("");
  const [checked, setChecked] = useState<readonly CheckedRow[] | null>(null);
  const notes = checked?.reduce((sum, row) => sum + row.flags.length + row.quotes.filter((quote) => quote.check.kind !== "found").length, 0) ?? 0;
  return (
    <section className="w05-section" aria-labelledby="w05-probe" id="zitat-probe" data-w05-probe="">
      <h2 id="w05-probe" className="w05-h2">
        {copy.probe.heading}
      </h2>
      <p className="w05-lede">{copy.probe.lede}</p>
      <label className="w05-field">
        <span className="w05-label">{copy.probe.label}</span>
        <textarea
          className="w05-textarea"
          rows={6}
          maxLength={MAX_ANSWER}
          value={text}
          spellCheck={false}
          onChange={(event) => {
            onFirstInput();
            setText(event.target.value);
          }}
        />
      </label>
      <div className="w05-actions">
        <button type="button" className="w05-button is-primary" onClick={() => setChecked(checkAnswer(parseClaudeAnswer(text), context))} data-w05-probe-run="">
          {copy.probe.run}
        </button>
        <button
          type="button"
          className="w05-button"
          onClick={() => {
            setText(copy.probe.sampleText);
            setChecked(checkAnswer(parseClaudeAnswer(copy.probe.sampleText), context));
          }}
          data-w05-probe-sample=""
        >
          {copy.probe.sample}
        </button>
        <button
          type="button"
          className="w05-button"
          onClick={() => {
            setText("");
            setChecked(null);
          }}
        >
          {copy.probe.clear}
        </button>
      </div>
      {checked ? (
        <div className="w05-probe-out" aria-live="polite" data-w05-probe-out="">
          {checked.length === 0 ? (
            <p className="w05-note">{copy.probe.none}</p>
          ) : (
            <>
              <p className="w05-note">{fill(copy.probe.summary, { rows: checked.length, notes })}</p>
              <ol className="w05-probe-rows">
                {checked.map(({ row, quotes, flags }) => (
                  <li key={row.item} className="w05-probe-row" data-item={row.item} data-flags={flags.length}>
                    <p className="w05-probe-head">
                      <b>{row.item}</b> <span>{row.status ? copy.status[row.status] : copy.probe.noStatus}</span>
                    </p>
                    {quotes.map(({ text: quote, check }) => (
                      <p key={quote} className="w05-probe-quote" data-check={check.kind}>
                        <q>{quote}</q>{" "}
                        <span>
                          {check.kind === "found"
                            ? fill(copy.probe.found, { file: check.file })
                            : check.kind === "similar"
                              ? fill(copy.probe.similar, { share: formatPercent(check.share, locale), file: check.file })
                              : copy.probe.missing}
                        </span>
                      </p>
                    ))}
                    {flags.length === 0 && quotes.every((quote) => quote.check.kind === "found") ? (
                      <p className="w05-note">{copy.probe.clean}</p>
                    ) : (
                      <ul className="w05-flags">
                        {flags.map((flag, index) => (
                          <li key={`${flag.kind}-${index}`} data-flag={flag.kind}>
                            {flagText(flag, copy, locale)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
