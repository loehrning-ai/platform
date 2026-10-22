"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cx } from "@/components/werk";
import type { Verdict } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/logic";
import styles from "./northwind.module.css";

/* ------------------------------------------------------------------ */
/* Verdict mark: glyph and word, never hue alone                       */
/* ------------------------------------------------------------------ */

const VERDICT_TONE: Record<Verdict, string> = {
  holds: "text-kobalt",
  misleads: "text-himbeere-tief",
  absent: "text-muted-foreground",
};

export function VerdictGlyph({ verdict, className }: { verdict: Verdict; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      className={cx("size-4 shrink-0", className)}
      fill="none"
      stroke="currentColor"
    >
      {verdict === "holds" ? (
        <>
          <rect x="1" y="1" width="14" height="14" strokeWidth="2" />
          <rect x="4.5" y="4.5" width="7" height="7" fill="currentColor" stroke="none" />
        </>
      ) : verdict === "misleads" ? (
        <path d="M2.5 2.5l11 11M13.5 2.5l-11 11" strokeWidth="2.5" strokeLinecap="square" />
      ) : (
        <rect x="1" y="1" width="14" height="14" strokeWidth="2" strokeDasharray="3 2" />
      )}
    </svg>
  );
}

export function VerdictMark({
  verdict,
  word,
  className,
}: {
  verdict: Verdict;
  word: string;
  className?: string;
}) {
  return (
    <span
      data-verdict={verdict}
      className={cx("inline-flex items-center gap-1.5 font-bold", VERDICT_TONE[verdict], className)}
    >
      <VerdictGlyph verdict={verdict} />
      {word}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Choice group: fieldset, legend, native radios as whole-row labels   */
/* ------------------------------------------------------------------ */

export interface ChoiceOption<Id extends string> {
  readonly id: Id;
  readonly label: ReactNode;
}

export function ChoiceGroup<Id extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  compact = false,
  className,
  legendClassName,
  optionsClassName,
  testId,
}: {
  name: string;
  legend: ReactNode;
  options: readonly ChoiceOption<Id>[];
  value: Id | undefined;
  onChange: (id: Id) => void;
  compact?: boolean;
  className?: string;
  legendClassName?: string;
  optionsClassName?: string;
  testId?: string;
}) {
  const groupRef = useRef<HTMLFieldSetElement>(null);
  /*
   * Adopt a choice made before hydration. A tap on the server HTML checks the
   * radio natively; React then hydrates with no value, and a second tap on the
   * same, already checked radio fires no change, so the choice would stay dead.
   * Runs once on mount; afterwards every input is controlled.
   */
  useEffect(() => {
    const early = groupRef.current?.querySelector<HTMLInputElement>("input:checked");
    if (early && early.value !== value) onChange(early.value as Id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);

  return (
    <fieldset ref={groupRef} className={cx("min-w-0", className)} data-testid={testId}>
      <legend className={cx("mb-3 text-[1.0625rem] font-bold leading-snug", legendClassName)}>
        {legend}
      </legend>
      <div className={cx(compact ? "flex flex-wrap gap-2" : "flex flex-col gap-2", optionsClassName)}>
        {options.map((option) => (
          <label
            key={option.id}
            className={cx(styles.option, compact && styles.compact)}
            data-option={option.id}
          >
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className={styles.radio}
            />
            <span className={cx("min-w-0 text-pretty", compact ? "text-[0.9375rem]" : "text-[1rem] leading-snug")}>
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */
/* Live region                                                         */
/* ------------------------------------------------------------------ */

export function LiveRegion({ message, id }: { message: string; id?: string }) {
  return (
    <p id={id} className="sr-only" aria-live="polite" aria-atomic="true">
      {message}
    </p>
  );
}

/** The first `count` sentences of a text, for the live region. */
export function firstSentences(text: string, count = 1): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .slice(0, count)
    .join(" ");
}

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

function legacyCopy(text: string): boolean {
  if (typeof document === "undefined") return false;
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "absolute";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  let ok: boolean;
  try {
    ok = typeof document.execCommand === "function" && document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
}

/** Copy text to the clipboard: the async API first, the selection fallback second. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or insecure context: fall back below.
  }
  return legacyCopy(text);
}

export const ACTION_BUTTON =
  "anti-btn inline-flex min-h-11 items-center justify-center gap-2 border-2 border-kobalt bg-card px-4 text-[0.9375rem] font-bold text-kobalt disabled:cursor-not-allowed disabled:border-border disabled:text-muted disabled:shadow-none disabled:transform-none";

export function CopyButton({
  text,
  label,
  copiedLabel,
  failedLabel,
  disabled = false,
  describedBy,
  testId,
}: {
  text: string;
  label: string;
  copiedLabel: string;
  failedLabel: string;
  disabled?: boolean;
  describedBy?: string;
  testId?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const statusId = useId();

  useEffect(() => {
    setStatus("idle");
  }, [text]);

  useEffect(() => {
    if (status !== "copied") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2400);
    return () => window.clearTimeout(timer);
  }, [status]);

  return (
    <span className={cx("inline-flex flex-wrap items-center gap-x-3 gap-y-1", styles.noPrint)}>
      <button
        type="button"
        className={ACTION_BUTTON}
        disabled={disabled}
        aria-describedby={[describedBy, statusId].filter(Boolean).join(" ")}
        data-testid={testId}
        onClick={async () => {
          const ok = await copyToClipboard(text);
          setStatus(ok ? "copied" : "failed");
        }}
      >
        <CopyGlyph />
        {/*
         * "Kopiert" shows inside the button, and both labels reserve the same
         * width, so a button beside a heading never grows or squeezes it.
         * The name stays "Kopieren" at all times (sr-only span); the two
         * visual labels are aria-hidden, so hiding one never empties the
         * name. The live region beside the button announces "Kopiert".
         */}
        <span className="grid">
          <span className="sr-only">{label}</span>
          <span aria-hidden="true" className={cx("col-start-1 row-start-1", status === "copied" && "invisible")}>
            {label}
          </span>
          <span aria-hidden="true" className={cx("col-start-1 row-start-1", status !== "copied" && "invisible")}>
            {copiedLabel}
          </span>
        </span>
      </button>
      <span
        id={statusId}
        aria-live="polite"
        className={cx(
          "text-[0.875rem] font-semibold",
          status === "failed" ? "text-himbeere-tief" : "sr-only",
        )}
      >
        {status === "copied" ? copiedLabel : status === "failed" ? failedLabel : ""}
      </span>
    </span>
  );
}

function CopyGlyph() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <rect x="5" y="5" width="9" height="9" />
      <path d="M11 5V2H2v9h3" />
    </svg>
  );
}

/** A copyable text as it is copied: Beton inset, mono, wrapping. */
export function CopyText({ text, id, testId }: { text: string; id?: string; testId?: string }) {
  return (
    <pre
      id={id}
      data-testid={testId}
      className={cx(
        "mt-3 bg-inset px-4 py-3 font-mono text-[0.875rem] leading-relaxed text-foreground",
        styles.copyText,
      )}
    >
      {text}
    </pre>
  );
}
