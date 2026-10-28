"use client";

import type { ReactNode, Ref } from "react";
import type { KitLine } from "@/lib/demo-cases/esg-berichte-mit-ki/kit-text";
import type { Status } from "@/lib/demo-cases/esg-berichte-mit-ki/rules";
import { toSentences } from "@/lib/demo-sentences";
import { StatusGlyph } from "./glyph";

export interface LineMark {
  readonly status: Status;
  readonly label: string;
}

/**
 * A kit file as a Quick Look preview: a light card with a header row (icon,
 * file name, the kit's invented-data line as a grey subtitle) and the kit's
 * lines verbatim with their numbers in a tinted gutter. While a quote is
 * being connected every line is a target: a button for tap and keyboard, and
 * data-w4-line for the drag (elementFromPoint).
 */
export function DocCard({
  name,
  subtitle,
  lines,
  marks = {},
  glow,
  hot,
  picking = false,
  pickLabel,
  onPick,
  lineRef,
  compact = false,
  stripMarks = false,
  className,
  children,
  label,
}: {
  readonly name: string;
  readonly subtitle?: string;
  readonly lines: readonly KitLine[];
  readonly marks?: Readonly<Record<number, LineMark>>;
  /** The line the guide glows after three misses. */
  readonly glow?: number | null;
  /** The line under the finger or the keyboard focus while picking. */
  readonly hot?: number | null;
  readonly picking?: boolean;
  /** While picking: what a line's button adds for a screen reader after its visible text ("Zeile 4 wählen"). */
  readonly pickLabel?: (line: KitLine) => string;
  readonly onPick?: (n: number) => void;
  /** Registers each line's element, so connections can be drawn to it. */
  readonly lineRef?: (n: number) => Ref<HTMLElement>;
  /** Only the header row: the file stays visible as a strip. */
  readonly compact?: boolean;
  /** Also show the line marks in the header row (a phone may fold the body away). */
  readonly stripMarks?: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
  readonly label?: string;
}) {
  return (
    <section className={`w4-doc${className ? ` ${className}` : ""}`} data-compact={compact ? "" : undefined} data-picking={picking ? "" : undefined} aria-label={label ?? name}>
      <header className="w4-doc-head">
        <svg className="w4-doc-icon" viewBox="0 0 20 24" aria-hidden="true" focusable="false">
          <path d="M3 1.5h9.5L18.5 7.5V21a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 21V3A1.5 1.5 0 0 1 3 1.5z" />
          <path d="M12.5 1.5v6h6" />
        </svg>
        <span className="w4-doc-titles">
          <span className="w4-doc-name">{name}</span>
          {subtitle ? (
            <span className="w4-doc-sub">
              {toSentences([subtitle]).map((sentence, index) => (
                <span key={sentence} className={index === 0 ? undefined : "w4-doc-sub-rest"}>
                  {index === 0 ? sentence : ` ${sentence}`}
                </span>
              ))}
            </span>
          ) : null}
        </span>
        {compact || stripMarks ? (
          <span className="w4-doc-strip-marks" data-always={compact ? "" : undefined} aria-hidden="true">
            {Object.entries(marks).map(([n, mark]) => (
              <span key={n} className="w4-doc-strip-mark">
                {n}
                <StatusGlyph status={mark.status} size={14} />
              </span>
            ))}
          </span>
        ) : null}
      </header>
      {compact ? null : (
        <ol
          className="w4-doc-body"
          onKeyDown={(event) => {
            // While picking, the lines are a list of buttons: ArrowUp and ArrowDown move through them.
            if (!picking || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
            const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-w4-line]")];
            const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
            const next = buttons[Math.min(buttons.length - 1, Math.max(0, at + (event.key === "ArrowDown" ? 1 : -1)))];
            if (next) {
              event.preventDefault();
              next.focus();
            }
          }}
        >
          {lines.map((line) => {
            const mark = marks[line.n];
            const state = hot === line.n ? "hot" : glow === line.n ? "glow" : mark ? "marked" : undefined;
            const content = (
              <>
                <span className="w4-doc-n" aria-hidden="true">
                  {line.n}
                </span>
                <span className="w4-doc-text">{line.text || " "}</span>
                {mark ? <StatusGlyph status={mark.status} label={mark.label} size={16} className="w4-doc-mark" /> : null}
              </>
            );
            return (
              <li key={line.n} className="w4-doc-line" data-state={state} data-empty={line.text ? undefined : ""}>
                {picking && onPick && line.text ? (
                  <button
                    type="button"
                    className="w4-doc-row"
                    ref={lineRef?.(line.n) as Ref<HTMLButtonElement> | undefined}
                    data-w4-line={line.n}
                    onClick={() => onPick(line.n)}
                  >
                    {content}
                    {/* The name is the visible line plus the action, so speech input can say what it sees. */}
                    {pickLabel ? <span className="sr-only">, {pickLabel(line)}</span> : null}
                  </button>
                ) : (
                  <span className="w4-doc-row" ref={lineRef?.(line.n) as Ref<HTMLSpanElement> | undefined} data-w4-line={line.text ? line.n : undefined}>
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {children}
    </section>
  );
}
