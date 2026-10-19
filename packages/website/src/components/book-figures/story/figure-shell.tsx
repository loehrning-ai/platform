import type { ReactNode } from "react";
import { figureCsv, figureTable, formatDateDe, formatDecimal, NBSP, type Cell, type FigureSpec } from "@/lib/figures";
import "./story.css";

interface FigureShellProps {
  readonly spec: FigureSpec;
  /** Names the figure in the page's own words; defaults to the spec title. */
  readonly title?: string;
  /** Shows the visible "vorläufig" note while the figure still runs on a provisional fixture. */
  readonly provisional?: boolean;
  /** Link to the exact CSV of the plotted numbers (public/books/...). */
  readonly csvHref?: string;
  readonly className?: string;
  /** For figures built from the reader's own input: print the source without a date or sample size. */
  readonly ownInput?: boolean;
  readonly children: ReactNode;
}

function cellText(cell: Cell): string {
  if (cell === null) return "";
  if (typeof cell === "number") {
    const digits = (String(cell).split(".")[1] ?? "").length;
    return formatDecimal(cell, Math.min(3, digits));
  }
  return cell;
}

function sourceLine(spec: FigureSpec, ownInput?: boolean): string {
  if (ownInput) return `Quelle: ${spec.source}.`;
  const n = spec.n > 0 ? ` n${NBSP}=${NBSP}${spec.nNote ?? formatDecimal(spec.n, 0)}.` : "";
  return `Quelle: ${spec.source}. Stand ${formatDateDe(spec.asOf)}.${n}`;
}

/**
 * Figure frame shared by the story islands: title, the figure itself, caption
 * with source line and sample size, and the "Daten & Grenzen" disclosure with
 * the plotted numbers and what the figure cannot say. A server component.
 */
export function FigureShell({ spec, title, provisional, csvHref, className, ownInput, children }: FigureShellProps) {
  const table = figureTable(spec);
  return (
    <figure className={`bf-figure${className ? ` ${className}` : ""}`} data-figure-id={spec.id}>
      <p className="bf-figure-title">{title ?? spec.title}</p>
      {provisional ? (
        <p className="bf-provisional" data-provisional="true">
          Vorläufige Werte: Diese Abbildung ist noch nicht endgültig. Zahlen und Termine werden vor der Veröffentlichung geprüft und können sich ändern.
        </p>
      ) : null}
      {children}
      <figcaption className="bf-caption">
        <span className="bf-caption-text">{spec.caption}</span>
        <span className="bf-source">{sourceLine(spec, ownInput)}</span>
      </figcaption>
      <details className="bf-data">
        <summary className="bf-summary">Daten &amp; Grenzen</summary>
        <div className="bf-data-body">
          <p className="bf-limit">
            <strong>Was die Abbildung nicht sagt.</strong> {spec.limitation}
          </p>
          <div className="bf-table-wrap" data-horizontal-scroll>
            <table className="bf-table">
              <caption className="bf-visually-hidden">Die gezeichneten Zahlen von {spec.title}</caption>
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
                {table.rows.map((row, i) => (
                  <tr key={`${spec.id}-${i}`}>
                    {row.map((cell, j) => (
                      <td key={j} data-numeric={typeof cell === "number" ? "true" : undefined}>
                        {cellText(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {csvHref ? (
            <a className="bf-button bf-csv" href={csvHref} download>
              CSV herunterladen
            </a>
          ) : (
            <a className="bf-button bf-csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(figureCsv(spec))}`} download={`${spec.id}.csv`}>
              CSV herunterladen
            </a>
          )}
        </div>
      </details>
    </figure>
  );
}
