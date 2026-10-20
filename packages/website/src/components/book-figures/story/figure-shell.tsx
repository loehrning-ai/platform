import type { ReactNode } from "react";
import { figureCsv, figureTable, formatDecimal, type Cell, type FigureSpec } from "@/lib/figures";
import { SourceLine, sourceLineFieldsOf } from "../shared/source-line";
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

/**
 * Figure frame shared by the story islands: title, the figure itself, caption,
 * and one visible source line (n, date, limit, rescan note, CSV link). Nothing
 * collapses. The plotted numbers stay in a visually hidden table for assistive
 * technology. A server component.
 */
export function FigureShell({ spec, title, provisional, csvHref, className, ownInput, children }: FigureShellProps) {
  const table = figureTable(spec);
  const fields = sourceLineFieldsOf(spec);
  // A figure built from the reader's own input has no sample: print the source and the limit only.
  const line = ownInput ? { ...fields, sourceLine: fields.sourceLine ?? `Quelle: ${spec.source} · Grenze: ${spec.limitation.replace(/[.!?]$/, "")}` } : fields;
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
      </figcaption>
      <div className="bf-visually-hidden">
        <table className="bf-table">
          <caption>Die gezeichneten Zahlen von {spec.title}</caption>
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
      <SourceLine
        fields={line}
        csv={[
          {
            href: csvHref ?? `data:text/csv;charset=utf-8,${encodeURIComponent(figureCsv(spec))}`,
            label: "Daten als CSV",
            fileName: `${spec.id}.csv`,
          },
        ]}
      />
    </figure>
  );
}
