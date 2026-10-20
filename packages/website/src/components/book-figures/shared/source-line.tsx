import { formatDateDe, formatDecimal } from "@/lib/figures";
import "./source-line.css";

/**
 * The one visible source line under every figure. It replaces the old
 * "Daten & Grenzen" drawer: nothing in the book collapses, so what the figure
 * rests on is printed in a single quiet Figtree line (n, window, limit) and
 * the plotted numbers are one plain CSV link away.
 *
 *   n = 21.402 Startseiten mit eigener Domain · Scan 2026-03 bis 05 · Grenze: Zusammenhang, keine Ursache
 *
 * A figure JSON may carry its own `sourceLine` (the frozen exports of the
 * insight spine do) and a static `rescanNote` for figures whose firm
 * attributes are recomputed with verified websites. Figures that predate those
 * fields get the line composed from n, date and the first sentence of the
 * limit, so no figure is ever without one. Server markup, no script.
 */

export interface SourceLineFields {
  readonly id: string;
  readonly n: number;
  readonly nNote?: string;
  readonly source?: string;
  readonly asOf: string;
  readonly limitation: string;
  /** Authored line; wins over the composed one. At most 20 words. */
  readonly sourceLine?: string;
  /** Static sentence after the line, for example "Wird mit geprüften Websites neu gerechnet." No animation. */
  readonly rescanNote?: string;
}

/** What a frozen spec may carry beyond the core fields. Read defensively: the engine owns the type. */
export function sourceLineFieldsOf(spec: object & Omit<SourceLineFields, "sourceLine" | "rescanNote">): SourceLineFields {
  const extra = spec as { sourceLine?: unknown; rescanNote?: unknown };
  return {
    id: spec.id,
    n: spec.n,
    nNote: spec.nNote,
    source: spec.source,
    asOf: spec.asOf,
    limitation: spec.limitation,
    sourceLine: typeof extra.sourceLine === "string" && extra.sourceLine.trim() !== "" ? extra.sourceLine.trim() : undefined,
    rescanNote: typeof extra.rescanNote === "string" && extra.rescanNote.trim() !== "" ? extra.rescanNote.trim() : undefined,
  };
}

export function wordCount(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

/** First sentence of a limitation, without its closing full stop. */
function firstSentence(text: string): string {
  const match = /^(.+?[.!?])(?:\s|$)/.exec(text.trim());
  return (match?.[1] ?? text.trim()).replace(/[.!?]$/, "");
}

/** The line as text: authored when present, composed from n, date and limit otherwise. */
export function composeSourceLine(fields: SourceLineFields): string {
  if (fields.sourceLine) return fields.sourceLine;
  const n = `n = ${formatDecimal(fields.n, 0)}${fields.nNote ? ` (${fields.nNote})` : ""}`;
  return `${n} · Stand ${formatDateDe(fields.asOf)} · Grenze: ${firstSentence(fields.limitation)}`;
}

interface SourceLineProps {
  readonly fields: SourceLineFields;
  /** Public CSV of the plotted numbers, or a data URI. Without it no link is printed. */
  readonly csv?: readonly { readonly href: string; readonly label: string; readonly fileName: string }[];
  readonly className?: string;
}

export function SourceLine({ fields, csv = [], className }: SourceLineProps) {
  return (
    <p className={className ? `bf-sourceline ${className}` : "bf-sourceline"} data-source-line={fields.id}>
      <span className="bf-sourceline-text">{composeSourceLine(fields)}</span>
      {fields.rescanNote ? (
        <>
          {" "}
          <span className="bf-sourceline-rescan" data-rescan-note="">
            {fields.rescanNote}
          </span>
        </>
      ) : null}
      {csv.map((item) => (
        <a key={item.fileName} className="bf-csv bf-sourceline-csv" href={item.href} download={item.fileName}>
          {item.label}
        </a>
      ))}
    </p>
  );
}
