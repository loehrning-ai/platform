"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { EsgCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { REQUESTS } from "@/lib/demo-cases/esg-berichte-mit-ki/constants";
import { STATUS_LABEL, tally } from "@/lib/demo-cases/esg-berichte-mit-ki/core";
import type { Cell, Day, Request, RowId, SheetRow } from "@/lib/demo-cases/esg-berichte-mit-ki/types";
import type { Locale } from "@/lib/i18n/locale";
import { StatusGlyph } from "./glyphs";
import { Refs } from "./refs";

interface Props {
  readonly rows: readonly SheetRow[];
  /** Friday cells for the before/after on Monday's reveal. */
  readonly before?: readonly SheetRow[];
  readonly day: Day;
  readonly complete: boolean;
  readonly copy: EsgCopy;
  readonly locale: Locale;
  readonly announce: string;
}

function StatusText({ cell, copy }: { readonly cell: Cell; readonly copy: EsgCopy }) {
  if (cell.state === "open") return <span className="eb-cell-open">{copy.feedback.open}</span>;
  return (
    <span className="eb-cell-status" data-status={cell.status}>
      <StatusGlyph status={cell.status} />
      {STATUS_LABEL[cell.status]}
    </span>
  );
}

function yoursText(entry: SheetRow, copy: EsgCopy): string | null {
  if (!entry.differs || entry.yours.state !== "filled" || entry.key.state !== "filled") return null;
  const status = STATUS_LABEL[entry.yours.status];
  if (entry.yours.status === entry.key.status) {
    return `${copy.sheet.yours}: ${status}, ${entry.yours.action ? copy.sheet.withAction : copy.sheet.withoutAction}`;
  }
  return `${copy.sheet.yours}: ${status}`;
}

/**
 * The fit-aware sticky: the sheet sticks on wide, tall screens only when its
 * own height fits under the header. A ResizeObserver writes data-fits; the
 * CSS reads it inside the media query. Otherwise the sheet is static, and
 * each card's "Wirkt auf" carries the rows it changes.
 */
function useFits(ref: RefObject<HTMLElement | null>): boolean {
  const [fits, setFits] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;
    const measure = () => {
      const header = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 5;
      setFits(element.offsetHeight <= window.innerHeight - header);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ref]);
  return fits;
}

export function AnswerSheet({ rows, before, day, complete, copy, locale, announce }: Props) {
  const ref = useRef<HTMLElement>(null);
  const fits = useFits(ref);
  const reveal = day === "monday" && before !== undefined;
  const filled = rows.filter((entry) => entry.key.state === "filled").length;
  const differing = rows.filter((entry) => entry.differs).map((entry) => entry.row.id);

  const beforeOf = (id: RowId): SheetRow | undefined => before?.find((entry) => entry.row.id === id);

  const table = (request: Request) => {
    const own = rows.filter((entry) => entry.row.request === request);
    const counts = tally(rows, request);
    const done = own.every((entry) => entry.key.state === "filled");
    return (
      <table className="eb-table" key={request} data-request={request}>
        <caption className="eb-caption">
          <span className="eb-caption-h">{copy.sheet.heads[request]}</span>
          <span className="eb-caption-tally">
            {done
              ? copy.sheet.tally(counts.ok, counts.check, counts.notFound)
              : copy.sheet.partial(own.filter((entry) => entry.key.state === "filled").length, own.length)}
          </span>
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">{copy.sheet.colId}</th>
            <th scope="col">{copy.sheet.colQuestion}</th>
            <th scope="col">{copy.sheet.colStatus}</th>
          </tr>
        </thead>
        <tbody>
          {own.map((entry) => {
            const old = reveal ? beforeOf(entry.row.id) : undefined;
            const moved =
              old !== undefined &&
              old.key.state === "filled" &&
              entry.key.state === "filled" &&
              old.key.status !== entry.key.status;
            const value =
              entry.key.state === "filled"
                ? (day === "monday" && entry.row.value.monday ? entry.row.value.monday : entry.row.value.friday)[locale]
                : null;
            const mine = yoursText(entry, copy);
            return (
              <tr key={entry.row.id} id={`eb-row-${entry.row.id}`} data-row={entry.row.id} data-differs={entry.differs ? "" : undefined}>
                <th scope="row" className="eb-td-id">
                  {entry.row.id}
                </th>
                <td className="eb-td-q">
                  <span className="eb-td-label">
                    <Refs text={entry.row.label[locale]} />
                  </span>
                  {value ? (
                    <span className="eb-td-value">
                      <Refs text={value} />
                    </span>
                  ) : null}
                </td>
                <td className="eb-td-status">
                  {moved && old ? (
                    <span className="eb-moved">
                      <StatusText cell={old.key} copy={copy} />
                      <span aria-hidden="true" className="eb-arrow">
                        →
                      </span>
                      <span className="sr-only">{copy.monday.to}</span>
                      <span className="eb-now">
                        <StatusText cell={entry.key} copy={copy} />
                      </span>
                    </span>
                  ) : (
                    <StatusText cell={entry.key} copy={copy} />
                  )}
                  {mine ? <span className="eb-yours">
                      <Refs text={mine} />
                    </span> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <section
      ref={ref}
      id="antworten"
      className="eb-sheet"
      aria-labelledby="eb-sheet-h"
      data-fits={fits ? "true" : "false"}
    >
      <div className="eb-sheet-head">
        <h2 id="eb-sheet-h" className="eb-h2">
          {copy.sheet.heading}
        </h2>
        <p className="eb-sheet-count">{copy.sheet.filled(filled)}</p>
      </div>
      {complete ? (
        <div className="eb-summary" data-testid="eb-summary">
          <p className="eb-summary-h">{copy.sheet.summaryHead}</p>
          <p>
            {differing.length === 0 ? (
              copy.sheet.allMatch
            ) : (
              <>
                {copy.sheet.differ(differing.length)}{" "}
                {differing.map((id, index) => (
                  <span key={id}>
                    <a href={`#eb-row-${id}`} className="eb-link">
                      {id}
                    </a>
                    {index < differing.length - 1 ? ", " : "."}
                  </span>
                ))}
              </>
            )}
          </p>
        </div>
      ) : null}
      {REQUESTS.map((request) => table(request))}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </section>
  );
}

