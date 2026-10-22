"use client";

import { forwardRef } from "react";
import { fill, type DemoText } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-shared";
import type { DefState } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/engine";
import { formatValueLong } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/format";
import type { Blank, DefinitionRequest, Row } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/model";
import { noteText, ruleText } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/text";
import { Figure } from "./figures";
import { VerdictGlyph } from "./glyphs";
import { Rich } from "./rich";

/**
 * "19 von 200 = 9,5 %" breaks only before "=", "0 von 0, keine Quote" only
 * after the comma, "206 Beschäftigte" only before the noun: never inside a
 * group, and never between a number and its € or % (a no-break space).
 */
export function valueChunks(text: string): string[] {
  const count = /^([+−]?[\d.,]+) (\p{L}+)$/u.exec(text);
  if (count) return [count[1], count[2]];
  return text.split(/ (?==)|(?<=,) /);
}

function Value({ text }: { readonly text: string }) {
  const chunks = valueChunks(text);
  return (
    <>
      {chunks.map((chunk, index) => (
        <span key={index}>
          {index > 0 ? " " : null}
          <span className="dr3-nowrap">{chunk}</span>
        </span>
      ))}
    </>
  );
}

/** A row label wraps only between words: "alle" / "Segmente", never "Mid-" / "Market". */
function Words({ text }: { readonly text: string }) {
  return (
    <>
      {text.split(" ").map((word, index) => (
        <span key={index}>
          {index > 0 ? " " : null}
          <span className="dr3-nowrap">{word}</span>
        </span>
      ))}
    </>
  );
}

/**
 * Yours against the database check as one table: one row per label, so the
 * months (or segments) line up across both columns at every width.
 */
function RowsTable({
  rows,
  truth,
  caseLabel,
  text,
}: {
  readonly rows: readonly Row[];
  readonly truth: readonly Row[];
  readonly caseLabel: { readonly before: string; readonly id: string; readonly after: string };
  readonly text: DemoText;
}) {
  const labels = [...truth.map((row) => row.label), ...rows.map((row) => row.label)].filter(
    (label, index, all) => all.indexOf(label) === index,
  );
  const lookup = (list: readonly Row[], label: Row["label"]) => list.find((row) => row.label === label);
  const cell = (row: Row | undefined, emptyText?: string) =>
    row ? (
      <span className="dr3-row-value">
        <Value text={formatValueLong(row.value, text.locale)} />
      </span>
    ) : emptyText ? (
      <span className="dr3-row-value">{emptyText}</span>
    ) : (
      <>
        <span aria-hidden="true" className="dr3-row-empty">
          ·
        </span>
        <span className="dr3-sr">{text.noRow}</span>
      </>
    );
  return (
    <table className="dr3-rows" data-rows="" role="table">
      <thead role="rowgroup">
        <tr role="row">
          <th scope="col" role="columnheader" className="dr3-rows-corner">
            <span className="dr3-sr">{text.rowHeader}</span>
          </th>
          <th scope="col" role="columnheader" className="dr3-yours">
            {text.yours}
          </th>
          <th scope="col" role="columnheader">
            {caseLabel.before}
            <span className="dr3-nowrap">{caseLabel.id}</span>
            {caseLabel.after}
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {labels.map((label, index) => (
          <tr key={label} role="row">
            <th scope="row" role="rowheader" className="dr3-row-label">
              <Words text={text.rowLabels[label]} />
            </th>
            <td role="cell" className="dr3-yours" data-cell="yours">
              {cell(lookup(rows, label), rows.length === 0 && index === 0 ? text.noRows : undefined)}
            </td>
            <td role="cell" data-cell="truth">{cell(lookup(truth, label))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * "Datenbankprüfung {id}" split around the id, so the id never breaks inside;
 * the long German compound may hyphenate at its seam ("Datenbank-" / "prüfung").
 */
function caseLabel(template: string, id: string): { before: string; id: string; after: string } {
  const [before, after = ""] = template.split("{id}");
  return { before: before.replace("Datenbankprüfung", "Datenbank\u00adprüfung"), id, after };
}

interface Props {
  readonly request: DefinitionRequest;
  readonly state: DefState;
  readonly text: DemoText;
  readonly headingId: string;
  readonly nextLabel: string;
  readonly onChangeBlank: (blank: Blank) => void;
  readonly onNext: () => void;
}

/**
 * The receipt of a definition request: verdict, the figure, "Deine Definition
 * ergibt" against "Datenbankprüfung", the why sentence and the data line. It
 * stays after a change, marked "Veraltet" with a hatched, dashed border.
 */
export const DefinitionReceipt = forwardRef<HTMLHeadingElement, Props>(function DefinitionReceipt(
  { request, state, text, headingId, nextLabel, onChangeBlank, onNext },
  headingRef,
) {
  const { locale } = text;
  const receipt = state.receipt;
  const computed = receipt && receipt.verdict !== "open";

  return (
    <div
      className="dr3-receipt"
      data-receipt={request.id}
      data-verdict={receipt?.verdict ?? "none"}
      data-stale={state.stale ? "true" : "false"}
    >
      {state.stale ? <div className="dr3-receipt-hatch" aria-hidden="true" /> : null}
      <div className="dr3-receipt-head">
        <h3 id={headingId} ref={headingRef} tabIndex={-1} className="dr3-receipt-title">
          {receipt ? fill(text.receipt, { n: receipt.attempt }) : text.receiptHeading}
        </h3>
      </div>

      {receipt ? (
        <p className="dr3-verdict" data-verdict-line="">
          <VerdictGlyph verdict={receipt.verdict} />
          <span>{text.verdicts[receipt.verdict]}</span>
        </p>
      ) : (
        <p className="dr3-empty">{text.receiptEmpty}</p>
      )}

      {state.stale ? <p className="dr3-stale">{text.stale}</p> : null}

      <Figure
        figure={request.figure}
        reading={receipt?.reading ?? "none"}
        text={text}
        context={{ request: request.id, single: receipt?.rows.some((row) => row.label === "allSegments") ?? false }}
      />

      {computed ? (
        <>
          <RowsTable
            rows={receipt.rows}
            truth={receipt.truth}
            caseLabel={caseLabel(text.dbCheck, request.caseId === "HC01" ? "HC-G01" : request.caseId)}
            text={text}
          />
          {receipt.origin ? (
            <p className="dr3-origin-line">
              <span className="dr3-origin">{receipt.origin === "recorded" ? text.recorded : text.plausible}</span>
            </p>
          ) : null}
        </>
      ) : null}

      {receipt ? (
        <p className="dr3-why" data-why="">
          <Rich text={ruleText(receipt, request, text)} locale={locale} />
        </p>
      ) : null}
      {receipt && noteText(receipt, text) ? (
        <p className="dr3-note">
          <Rich text={noteText(receipt, text) ?? ""} locale={locale} />
        </p>
      ) : null}

      {receipt && ((receipt.changeBlank && receipt.verdict !== "open") || receipt.verdict === "correct") ? (
        <div className="dr3-actions">
          {receipt.changeBlank && (receipt.verdict === "wrong" || receipt.verdict === "rightNumberWrongDef") ? (
            <button
              type="button"
              className="dr3-btn dr3-btn-secondary anti-btn"
              data-change-blank={receipt.changeBlank}
              onClick={() => onChangeBlank(receipt.changeBlank as Blank)}
            >
              {fill(text.changeBlank, { blank: text.legends[receipt.changeBlank] })}
            </button>
          ) : null}
          {receipt.verdict === "correct" && !state.stale ? (
            <button type="button" className="dr3-btn dr3-btn-secondary anti-btn" data-next="" onClick={onNext}>
              {nextLabel}
              <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="square">
                <path d="M3 10h13M11 5l5 5-5 5" />
              </svg>
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="dr3-dataline">
        <Rich text={text.dataLine[request.id]} locale={locale} />
      </p>
    </div>
  );
});
