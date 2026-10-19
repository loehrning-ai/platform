import type { ReactNode } from "react";
import { formatDateDe, formatDecimal, type FigureTable } from "@/lib/figures";
import { columnDigits, csvDataUri, formatCell, tableToCsv } from "./csv";
import type { FigureMeta } from "./types";
import "./book-figures.css";

export interface DataTableSpec {
  /** Short name; shown when a figure has more than one table. */
  readonly title: string;
  readonly table: FigureTable;
  /** File name stem of the CSV download. */
  readonly fileStem: string;
  /** Link to the CSV file of the plotted numbers (public/books/...). Without it the CSV is a data link. */
  readonly href?: string;
}

interface FigureFrameProps {
  readonly meta: FigureMeta;
  readonly kind: string;
  readonly tables: readonly DataTableSpec[];
  /** Marks preview data that is not the book's final data. */
  readonly provisional?: boolean;
  readonly children: ReactNode;
}

function nLine(meta: FigureMeta): string {
  const n = `n = ${formatDecimal(meta.n, 0)}`;
  return meta.nNote ? `${n} (${meta.nNote})` : n;
}

function DataTableView({ item, label }: { readonly item: DataTableSpec; readonly label: string }) {
  const { table } = item;
  const digits = columnDigits(table);
  return (
    <div className="bf-table-wrap" role="region" aria-label={label} tabIndex={0}>
      <table className="bf-table">
        <caption className="bf-sr">{label}</caption>
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} data-num={typeof cell === "number"}>
                  {formatCell(cell, digits[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * "Daten & Grenzen": what the figure rests on, what it cannot say, and the
 * exact plotted numbers as a table and as CSV. Server markup, no script.
 */
export function DataAndLimits({
  meta,
  tables,
}: {
  readonly meta: FigureMeta;
  readonly tables: readonly DataTableSpec[];
}) {
  const several = tables.length > 1;
  return (
    <details className="bf-data" data-bf-data={meta.id}>
      <summary>{"Daten & Grenzen"}</summary>
      <dl className="bf-dl">
        <dt>Stichprobe</dt>
        <dd>{nLine(meta)}</dd>
        <dt>Quelle</dt>
        <dd>{meta.source}</dd>
        <dt>Stand</dt>
        <dd>{formatDateDe(meta.asOf)}</dd>
        <dt>Grenzen</dt>
        <dd>{meta.limitation}</dd>
      </dl>
      {tables.map((item) => (
        <DataTableView
          key={item.fileStem}
          item={item}
          label={`Zahlen der Abbildung: ${item.title}`}
        />
      ))}
      <p>
        {tables.map((item) => (
          <a
            key={item.fileStem}
            className="bf-csv"
            href={item.href ?? csvDataUri(tableToCsv(item.table))}
            download={`${item.fileStem}.csv`}
          >
            {several ? `CSV: ${item.title}` : "Daten als CSV laden"}
          </a>
        ))}
      </p>
    </details>
  );
}

/** Figure, caption and "Daten & Grenzen" around an interactive stage (the children). */
export function FigureFrame({ meta, kind, tables, provisional = false, children }: FigureFrameProps) {
  return (
    <figure className="bf" data-bf-kind={kind} data-bf-id={meta.id}>
      <figcaption className="bf-head">
        {provisional ? <span className="bf-flag">Vorläufige Daten</span> : null}
        <span className="bf-title">{meta.title}</span>
        {meta.caption ? <span className="bf-caption">{meta.caption}</span> : null}
      </figcaption>
      {children}
      <DataAndLimits meta={meta} tables={tables} />
    </figure>
  );
}
