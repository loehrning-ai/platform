"use client";

// ─── Lab primitives: the shared look of lesson-engine exercise widgets ──
//
// Calm, premium learning surface: rounded 16-24px sheets with soft layered
// depth on paper, Kobalt as the interactive accent, instant feedback, finite
// spring motion through the scoped LazyMotion `m.*` components. Every motion
// has a static reduced-motion result (MotionConfig reducedMotion="user" plus
// explicit `useReducedMotion` checks for number tweens).

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type JSX,
  type ReactNode,
} from "react";
import { animate, useReducedMotion } from "framer-motion";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locale";
import { useLabEmbed } from "./lab-context";

export const LAB_SPRING = { type: "spring", stiffness: 420, damping: 32 } as const;
export const LAB_EASE = [0.16, 1, 0.3, 1] as const;

/** Common props every lab widget accepts (injected by the lesson reader). */
export interface LabBaseProps {
  /** Checkpoint lesson key, injected by the reader: `<course>:<lesson>`. */
  readonly lessonId?: string;
  /** Checkpoint id, injected by the reader: "exercise". */
  readonly cpId?: string;
  readonly locale?: Locale;
  /** Optional heading when the widget is rendered outside the reader. */
  readonly title?: string;
}

export function labLocale(locale: Locale | undefined): Locale {
  return locale === "en" ? "en" : "de";
}

/**
 * Exercise completion: awards the reader's checkpoint once and notifies the
 * embedding reader. Safe outside the reader (preview pages, tests).
 */
export function useLabCompletion({
  lessonId,
  cpId,
}: Pick<LabBaseProps, "lessonId" | "cpId">): {
  readonly done: boolean;
  readonly complete: () => void;
} {
  const { onComplete } = useLabEmbed();
  const checkpoint = useCheckpoint(
    lessonId ?? "lab:preview",
    cpId ?? "exercise",
  );
  const notified = useRef(false);
  const complete = useCallback(() => {
    if (lessonId && cpId) checkpoint.complete();
    if (!notified.current) {
      notified.current = true;
      onComplete?.();
    }
  }, [checkpoint, cpId, lessonId, onComplete]);
  return { done: Boolean(lessonId && cpId && checkpoint.done), complete };
}

/** Outer sheet. Inside the reader it is the stage; outside it frames itself. */
export function LabSurface({
  children,
  className,
  title,
  label,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly title?: string;
  /** Accessible name for the exercise region. */
  readonly label: string;
}): JSX.Element {
  const { embedded } = useLabEmbed();
  return (
    <section
      aria-label={label}
      data-lab-widget
      className={cn(
        embedded
          ? "min-w-0"
          : "min-w-0 rounded-3xl border border-lab-line bg-card p-4 shadow-lab sm:p-6",
        className,
      )}
    >
      {!embedded && title ? (
        <h3 className="mb-4 text-lg font-bold tracking-[-0.01em] text-foreground">
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  );
}

type LabButtonTone = "primary" | "secondary" | "ghost";

const BUTTON_TONES: Record<LabButtonTone, string> = {
  primary:
    "bg-lab-accent text-paper shadow-lab-sm hover:bg-brand-cobalt/90 disabled:bg-track disabled:text-muted-foreground disabled:shadow-none",
  secondary:
    "border border-lab-line bg-card text-foreground shadow-lab-sm hover:border-lab-accent/50 hover:bg-lab-accent-soft disabled:text-muted-foreground",
  ghost:
    "text-lab-accent hover:bg-lab-accent-soft disabled:text-muted-foreground",
};

export const LabButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { readonly tone?: LabButtonTone }
>(function LabButton({ tone = "primary", className, type, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-[0.98] disabled:cursor-not-allowed",
        BUTTON_TONES[tone],
        className,
      )}
      {...rest}
    />
  );
});

/** Polite live region for results; screen readers hear each verdict once. */
export function LabLive({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}): JSX.Element {
  return (
    <div role="status" aria-live="polite" className={className}>
      {children}
    </div>
  );
}

/** A number that springs to its new value; static under reduced motion. */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  readonly value: number;
  readonly format: (value: number) => string;
  readonly className?: string;
}): JSX.Element {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (reduce || !Number.isFinite(from) || !Number.isFinite(value)) {
      setDisplay(value);
      return;
    }
    const controls = animate(from, value, {
      duration: 0.45,
      ease: LAB_EASE,
      onUpdate: setDisplay,
    });
    return () => controls.stop();
  }, [value, reduce]);

  return (
    <span className={cn("tabular-nums", className)}>
      {Number.isFinite(value) ? format(display) : "—"}
    </span>
  );
}

/** Pill showing pass/fail with an icon-free word (colour is never alone). */
export function LabVerdictPill({
  tone,
  children,
}: {
  readonly tone: "good" | "bad" | "warn" | "neutral";
  readonly children: ReactNode;
}): JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-3 text-xs font-semibold",
        tone === "good" && "bg-lab-good-soft text-lab-good",
        tone === "bad" && "bg-lab-bad-soft text-lab-bad",
        tone === "warn" && "bg-lab-warn-soft text-lab-warn",
        tone === "neutral" && "bg-inset text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

/** Number formatting shared by calculator, threshold lab and scores. */
export function formatLabValue(
  value: number,
  format: "number" | "percent" | "eur" | "int" | undefined,
  locale: Locale,
  decimals?: number,
): string {
  const tag = locale === "en" ? "en-GB" : "de-DE";
  if (!Number.isFinite(value)) return "\u2014";
  switch (format) {
    case "percent":
      return new Intl.NumberFormat(tag, {
        style: "percent",
        maximumFractionDigits: decimals ?? 1,
        minimumFractionDigits: 0,
      }).format(value);
    case "eur":
      return new Intl.NumberFormat(tag, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: decimals ?? 0,
      }).format(value);
    case "int":
      return new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(
        Math.round(value),
      );
    default:
      return new Intl.NumberFormat(tag, {
        maximumFractionDigits: decimals ?? 2,
      }).format(value);
  }
}
