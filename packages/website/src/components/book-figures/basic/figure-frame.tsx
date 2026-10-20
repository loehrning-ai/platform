import type { ReactNode } from "react";
import type { FigureTable } from "@/lib/figures";
import { columnDigits, csvDataUri, formatCell, tableToCsv } from "./csv";
import { SourceLine, sourceLineFieldsOf } from "../shared/source-line";
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

function DataTableView({ item, label }: { readonly item: DataTableSpec; readonly label: string }) {
  const { table } = item;
  const digits = columnDigits(table);
  return (
    <div className="bf-table-wrap" role="region" aria-label={label}>
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
 * What a figure rests on, printed and never hidden: the plotted numbers as a
 * table for assistive technology (visually hidden, not focusable, so a
 * sighted keyboard never lands on nothing) and one visible source line with
 * the CSV link. Server markup, no script.
 */
export function SourceAndTables({
  meta,
  tables,
}: {
  readonly meta: FigureMeta;
  readonly tables: readonly DataTableSpec[];
}) {
  const several = tables.length > 1;
  return (
    <div className="bf-source-block" data-bf-source={meta.id}>
      <div className="bf-sr">
        {tables.map((item) => (
          <DataTableView key={item.fileStem} item={item} label={`Zahlen der Abbildung: ${item.title}`} />
        ))}
      </div>
      <SourceLine
        fields={sourceLineFieldsOf(meta)}
        csv={tables.map((item) => ({
          href: item.href ?? csvDataUri(tableToCsv(item.table)),
          label: several ? `CSV: ${item.title}` : "Daten als CSV",
          fileName: `${item.fileStem}.csv`,
        }))}
      />
    </div>
  );
}

/** Figure, caption and the visible source line around an interactive stage (the children). */
export function FigureFrame({ meta, kind, tables, provisional = false, children }: FigureFrameProps) {
  return (
    <figure className="bf" data-bf-kind={kind} data-bf-id={meta.id}>
      <figcaption className="bf-head">
        {provisional ? <span className="bf-flag">Vorläufige Daten</span> : null}
        <span className="bf-title">{meta.title}</span>
        {meta.caption ? <span className="bf-caption">{meta.caption}</span> : null}
      </figcaption>
      {children}
      <SourceAndTables meta={meta} tables={tables} />
    </figure>
  );
}
