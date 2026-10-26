"use client";

import type { CSSProperties } from "react";
import { breakingCheck, type CheckSet } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/breaks";
import type { ItemId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import { decisionFor } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/decision-lines";
import type { TestId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import type { FolderFile } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/kit";
import type { Model, StageRow } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import type { Fmt } from "./fmt";

/**
 * Scenes 1 and 2: the customer's eight requests on the left, the file whose
 * name fits on the right, a line between them drawn straight on the field,
 * and the three files that fit nowhere in the tray below. With checks on, a
 * link whose file fails one of them breaks, the request gets its stamp and
 * the file card turns over to show the line from the file that decided it.
 * A pure function of the switched-on checks; nothing plays by itself.
 */
export function Board({
  model,
  fmt,
  active,
  checking,
  drawn,
  front,
  guess,
  attention,
  onRequest,
  onFile,
  onTurn,
  lead,
}: {
  readonly model: Model;
  readonly fmt: Fmt;
  readonly active: CheckSet;
  /** Scene 2 and later: the legend counts and the rows step down into their file. */
  readonly checking: boolean;
  /** The link lines are drawn (after the entry motion, or at once with reduced motion). */
  readonly drawn: boolean;
  /** Broken cards the visitor turned back to their name. */
  readonly front: ReadonlySet<ItemId>;
  readonly guess: number | null;
  /** The rows the last switched check touched: the attention light sits there. */
  readonly attention: readonly ItemId[];
  readonly onRequest: (id: ItemId) => void;
  readonly onFile: (file: FolderFile) => void;
  readonly onTurn: (id: ItemId) => void;
  /** A question above the board (scene 1 before the guess). */
  readonly lead?: string;
}) {
  const { copy } = fmt;
  const holding = model.rows.filter((row) => breakingCheck(row, active) === null).length;
  const allOn = active.size === 4;
  return (
    <div className="w05-board" data-w05-board="" data-checking={checking ? "" : undefined}>
      {lead ? (
        <p className="w05-board-lead" data-w05-lead="">
          {lead}
        </p>
      ) : null}
      <div className="w05-board-head">
        {checking ? (
          <>
            <span className="w05-label">{copy.checks.legend}</span>
            <span className="w05-legend" data-w05-legend={holding}>
              <span className="w05-legend-value">{fmt.t(copy.checks.legendValue, { n: holding })}</span>
              <span className="w05-bar" aria-hidden="true">
                {model.rows.map((row, index) => (
                  <span key={row.item.id} data-on={index < holding ? "" : undefined} data-guess={guess !== null && index === guess - 1 ? "" : undefined} />
                ))}
              </span>
            </span>
            <span className="sr-only" aria-live="polite">
              {fmt.t(copy.checks.live, { n: holding })}
            </span>
          </>
        ) : (
          <>
            <span className="w05-label">{copy.folder.headRequests}</span>
            <span className="w05-label">{copy.folder.headFiles}</span>
          </>
        )}
      </div>
      <ol className="w05-rows">
        {model.rows.map((row, index) => {
          const test = breakingCheck(row, active);
          const broken = test !== null;
          const turned = broken && !front.has(row.item.id);
          const stamp = broken ? row.naive.status : allOn ? row.naive.status : null;
          return (
            <li
              key={row.item.id}
              className="w05-row"
              data-w05-row={row.item.id}
              data-broken={broken ? "" : undefined}
              data-attention={attention.includes(row.item.id) ? "" : undefined}
              style={{ "--i": index } as CSSProperties}
            >
              <button
                type="button"
                className="w05-request"
                onClick={() => onRequest(row.item.id)}
                aria-label={`${row.item.id} ${copy.shortName[row.item.id].replace(/­/g, "")}${stamp ? `, ${copy.status[stamp]}` : ""}. ${checking ? fmt.t(copy.sheet.best, { id: row.item.id, file: row.best.doc.file }) : fmt.t(copy.folder.openRequest, { id: row.item.id })}`}
              >
                <span className="w05-request-id">{row.item.id}</span>
                <span className="w05-request-name">{copy.shortName[row.item.id]}</span>
                {stamp ? (
                  <span className="w05-stamp" data-status={stamp} aria-hidden="true">
                    {copy.stamp[stamp]}
                  </span>
                ) : null}
              </button>
              <svg className="w05-link" viewBox="0 0 34 10" preserveAspectRatio="none" aria-hidden="true" data-drawn={drawn ? "" : undefined}>
                <line className="w05-link-a" x1="0" y1="5" x2={broken ? 12 : 17.5} y2="5" />
                <line className="w05-link-b" x1={broken ? 22 : 16.5} y1="5" x2="34" y2="5" />
              </svg>
              <FileCard fmt={fmt} row={row} test={test} turned={turned} onOpen={() => onFile(row.naive.doc.file as FolderFile)} onTurn={() => onTurn(row.item.id)} />
            </li>
          );
        })}
      </ol>
      <div className="w05-tray" data-w05-tray="">
        <span className="w05-label">{copy.folder.tray}</span>
        <ul>
          {model.unlinked.map((file) => (
            <li key={file}>
              <button type="button" className="w05-file w05-file-tray" onClick={() => onFile(file)} aria-label={fmt.t(copy.folder.openFile, { file })}>
                {file}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** The back of a turned card: the deciding line, an empty field, a recount, or (for R7) a seal until scene 3. */
function CardBack({ fmt, row, test }: { readonly fmt: Fmt; readonly row: StageRow; readonly test: TestId }) {
  const { copy } = fmt;
  const { quote } = row.naive.tests;
  if (test === "quote" && row.item.id === "R7") return <span className="w05-back-seal">{copy.checks.sealed}</span>;
  if (test === "quote" && quote.figures.unique !== undefined && quote.figures.staff !== undefined) {
    return (
      <span className="w05-back-count">
        <span className="w05-back-tag">{copy.checks.counted}</span>
        {fmt.t(copy.checks.trained, { unique: quote.figures.unique, staff: quote.figures.staff })}
      </span>
    );
  }
  if (test === "quote" && quote.missingParts.length > 0) {
    return (
      <span className="w05-back-line">
        {quote.missingParts.map((part) => (
          <span key={part} className="w05-back-part">
            {part} <em>{copy.checks.empty}</em>
          </span>
        ))}
      </span>
    );
  }
  const decision = decisionFor(row.naive, test);
  if (!decision) return <span className="w05-back-seal">{fmt.copy.sheet.fail.none}</span>;
  return (
    <span className="w05-back-line">
      <span className="w05-back-text">{decision.span}</span>
      <span className="w05-back-no">{fmt.t(copy.line, { n: decision.line })}</span>
    </span>
  );
}

function FileCard({
  fmt,
  row,
  test,
  turned,
  onOpen,
  onTurn,
}: {
  readonly fmt: Fmt;
  readonly row: StageRow;
  readonly test: TestId | null;
  readonly turned: boolean;
  readonly onOpen: () => void;
  readonly onTurn: () => void;
}) {
  const file = row.naive.doc.file;
  return (
    <button
      type="button"
      className="w05-card"
      data-turned={turned ? "" : undefined}
      onClick={test ? onTurn : onOpen}
      aria-label={test ? fmt.t(fmt.copy.checks.turn, { file }) : fmt.t(fmt.copy.folder.openFile, { file })}
      aria-pressed={test ? turned : undefined}
    >
      <span className="w05-card-inner">
        <span className="w05-card-front w05-file">{file}</span>
        <span className="w05-card-back" aria-hidden={turned ? undefined : "true"}>
          {test ? <CardBack fmt={fmt} row={row} test={test} /> : null}
        </span>
      </span>
    </button>
  );
}
