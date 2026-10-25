"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import type { BillRow, Status } from "@/lib/demo-cases/esg-berichte-mit-ki/rules";

/** ■ BELEGT solid ink, ▨ SCHWACH hatched ink, □ LÜCKE Mennige outline: never colour alone. */
export function StatusGlyph({ status, size = 14 }: { readonly status: Status; readonly size?: number }) {
  return (
    <svg className="nw-glyph" data-status={status} width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      {status === "belegt" ? <rect x="1" y="1" width="12" height="12" className="nw-fill-ink" /> : null}
      {status === "schwach" ? (
        <>
          <rect x="1.5" y="1.5" width="11" height="11" className="nw-stroke-ink" fill="none" strokeWidth="1.5" />
          <path d="M1.5 9.5l8-8M1.5 12.5l11-11M5 12.5l7.5-7.5" className="nw-stroke-ink" strokeWidth="1.5" />
        </>
      ) : null}
      {status === "luecke" ? <rect x="1.75" y="1.75" width="10.5" height="10.5" className="nw-stroke-mark" fill="none" strokeWidth="2.5" /> : null}
    </svg>
  );
}

export function StatusTag({ status, pack }: { readonly status: Status; readonly pack: Pack }) {
  return (
    <span className="nw-status" data-status={status}>
      <StatusGlyph status={status} />
      {pack.statuses[status]}
    </span>
  );
}

/**
 * Hides the optional lines, in the given order, only while the stage would
 * overflow: measured, never by breakpoint. Runs again when the stage resizes
 * or the stage's content changes (fitKey).
 */
function useFitLines(card: React.RefObject<HTMLDivElement | null>, optional: readonly number[] | undefined, fitKey: string | undefined) {
  useLayoutEffect(() => {
    const element = card.current;
    const stage = element?.closest<HTMLElement>(".nw-stage");
    if (!element || !stage || !optional || optional.length === 0) return;
    const fit = () => {
      const lines = optional.flatMap((line) => {
        const item = element.querySelector<HTMLElement>(`[data-line="${line}"]`);
        return item ? [item] : [];
      });
      element.dataset.fitted = "";
      for (const item of lines) item.hidden = false;
      for (const item of lines) {
        if (stage.scrollHeight <= stage.clientHeight + 1) break;
        item.hidden = true;
      }
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [card, optional, fitKey]);
}

/** A kit file as a paper card: real line numbers in the gutter, the lines verbatim. */
export function DocCard({
  file,
  lines,
  lineClass,
  optional,
  fitKey,
  className,
  style,
}: {
  readonly file: string;
  readonly lines: readonly (readonly [number, string])[];
  readonly lineClass?: (line: number) => string | undefined;
  /** Lines that step back, in this order, while the stage is too short for all; the gutter keeps the real numbers. */
  readonly optional?: readonly number[];
  /** Changes whenever the stage around the card changes its content. */
  readonly fitKey?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFitLines(ref, optional, fitKey);
  return (
    <div ref={ref} className={`nw-doc ${className ?? ""}`} style={style}>
      <p className="nw-doc-name">{file}</p>
      <ol className="nw-doc-lines">
        {lines.map(([line, text]) => (
          <li key={line} className={`nw-doc-line ${lineClass?.(line) ?? ""} ${optional?.includes(line) ? "is-optional" : ""}`} data-line={line}>
            <span className="nw-gutter" aria-hidden="true">
              {line}
            </span>
            <span className="nw-line-text">{text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export type Mark = "ok" | "fail" | "skip";
type CheckKey = keyof Pack["checks"];
const CHECK_KEYS: readonly CheckKey[] = ["zitat", "zeitraum", "umfang", "stand"];

/** The four checks as a row of chips; each shows its mark once its share of the motion is done. */
export function CheckChips({
  pack,
  marks,
  shown,
  active,
}: {
  readonly pack: Pack;
  readonly marks: readonly Mark[];
  /** 0 to 1 per check. */
  readonly shown: readonly number[];
  readonly active?: number;
}) {
  return (
    <ul className="nw-checks" aria-label={CHECK_KEYS.map((key) => pack.checks[key]).join(", ")}>
      {CHECK_KEYS.map((key, index) => {
        const done = (shown[index] ?? 0) >= 1;
        const mark = marks[index] ?? "skip";
        return (
          <li
            key={key}
            className="nw-check"
            data-mark={done ? mark : undefined}
            data-active={active === index ? "" : undefined}
            style={{ opacity: 0.35 + 0.65 * Math.min(1, (shown[index] ?? 0) * 2) }}
          >
            <span className="nw-check-label">{pack.checks[key]}</span>
            <span className="nw-check-mark" aria-label={done ? pack.checkMarks[mark] : undefined}>
              {done ? (mark === "ok" ? "✓" : mark === "fail" ? "✗" : "·") : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Twelve month slots for a bill series: one bar per distinct invoice, a
 * booking twice stacks a second block on the same slot, a missing month is a
 * hatched empty slot (never an average, never zero).
 */
export function MonthStrip({
  rows,
  monthsShort,
  twice,
  filled,
  year = 2025,
  extra,
}: {
  readonly rows: readonly BillRow[];
  readonly monthsShort: readonly string[];
  readonly twice: string;
  /** 0 to 1: a filed month rising into its slot (the cascade). */
  readonly filled?: { readonly month: number; readonly amount: number; readonly t: number };
  readonly year?: number;
  readonly extra?: ReactNode;
}) {
  const max = Math.max(...rows.map((row) => row.amount), filled?.amount ?? 0);
  return (
    <div className="nw-strip" role="img" aria-label={monthsShort.join(" ")}>
      {monthsShort.map((label, index) => {
        const month = `${year}-${String(index + 1).padStart(2, "0")}`;
        const bills = rows.filter((row) => row.month === month);
        const fill = filled && filled.month === index + 1 ? filled : null;
        const empty = bills.length === 0 && !(fill && fill.t > 0);
        return (
          <div key={month} className="nw-slot" data-empty={empty ? "" : undefined} data-twice={bills.length > 1 ? "" : undefined}>
            <div className="nw-slot-track">
              {bills.length > 0 ? <span className="nw-bar" style={{ height: `${(bills[0]!.amount / max) * 100}%` }} /> : null}
              {fill && fill.t > 0 ? (
                <span className="nw-bar" data-new="" style={{ height: `${(fill.amount / max) * 100 * fill.t}%` }} />
              ) : null}
              {empty ? (
                <svg className="nw-hatch" viewBox="0 0 20 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                  <path d="M0 10L10 0M0 22L20 2M0 34L20 14M0 46L20 26M0 58L20 38M8 60L20 50" vectorEffect="non-scaling-stroke" />
                </svg>
              ) : null}
              {bills.length > 1 ? <span className="nw-twice">{twice}</span> : null}
            </div>
            <span className="nw-slot-label">{label}</span>
          </div>
        );
      })}
      {extra}
    </div>
  );
}
