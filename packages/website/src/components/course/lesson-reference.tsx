import type { JSX, ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";

const COPY = {
  de: {
    eyebrow: "Lektionsreferenz",
    open: "Referenz öffnen",
    close: "Referenz schließen",
  },
  en: {
    eyebrow: "Lesson reference",
    open: "Open reference",
    close: "Close reference",
  },
} as const;

export interface LessonReferenceProps {
  readonly children: ReactNode;
  readonly locale: Locale;
  readonly title: string;
  readonly objective?: string | null;
  /** Use level 2 only when the surrounding custom shell already owns its h1. */
  readonly headingLevel?: 1 | 2;
}

/**
 * Server-rendered supporting material. Native disclosure preserves keyboard,
 * crawl, and no-JavaScript access without adding client state to lesson pages.
 */
export function LessonReference({
  children,
  locale,
  title,
  objective,
  headingLevel = 1,
}: LessonReferenceProps): JSX.Element {
  const copy = COPY[locale];
  const normalizedObjective = objective?.trim() || null;

  return (
    <details
      className="group min-w-0 border-l-2 border-brand-orange bg-card/20"
      data-lesson-reference
    >
      <summary className="grid min-h-16 cursor-pointer list-none grid-cols-1 items-center gap-3 px-4 py-3 text-foreground outline-none hover:bg-brand-orange/5 focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-5 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 [overflow-wrap:anywhere]">
          <span className="block font-mono text-xs font-black uppercase tracking-[0.16em] text-brand-orange-dark">
            {copy.eyebrow}
          </span>
          <span
            role="heading"
            aria-level={headingLevel}
            className="mt-1 block text-base font-black leading-tight"
          >
            {title}
          </span>
          {normalizedObjective ? (
            <span className="mt-1 block max-w-[70ch] text-xs leading-snug text-muted-foreground">
              {normalizedObjective}
            </span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.1em] text-brand-orange-dark sm:justify-self-end">
          <span className="group-open:hidden">{copy.open}</span>
          <span className="hidden group-open:inline">{copy.close}</span>
          <span
            aria-hidden="true"
            className="text-lg leading-none text-brand-orange transition-transform group-open:rotate-45 motion-reduce:transition-none"
          >
            +
          </span>
        </span>
      </summary>
      <div
        className="min-w-0 border-t border-border px-4 py-6 sm:px-5 [&_h1]:hidden"
        data-lesson-reference-content
      >
        {children}
      </div>
    </details>
  );
}
