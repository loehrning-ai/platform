import type { JSX, ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";

const COPY = {
  de: {
    eyebrow: "Lektion",
    open: "Aufklappen",
    close: "Einklappen",
  },
  en: {
    eyebrow: "Lesson",
    open: "Expand",
    close: "Collapse",
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
 * The lesson text inside a native disclosure. It renders open: the lesson is
 * the page, so a reader lands on the text rather than on a closed box. The
 * native <details> keeps keyboard, crawl and no-JavaScript access, and a
 * reader can still fold the text away (for example to work on a checkpoint
 * above it) without client state on the lesson page. React only writes the
 * `open` attribute when the prop changes, so a reader's own toggle sticks
 * until the lesson changes.
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
      open
      className="group min-w-0 border-t-2 border-foreground"
      data-lesson-reference
    >
      <summary className="grid min-h-16 cursor-pointer list-none grid-cols-1 items-start gap-3 py-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 [overflow-wrap:anywhere]">
          <span className="block text-label text-muted-foreground">
            {copy.eyebrow}
          </span>
          <span
            role="heading"
            aria-level={headingLevel}
            className="mt-1 block text-fluid-h2 font-bold text-foreground text-balance"
          >
            {title}
          </span>
          {normalizedObjective ? (
            <span className="mt-2 block max-w-[64ch] text-body text-muted-foreground text-pretty">
              {normalizedObjective}
            </span>
          ) : null}
        </span>
        <span className="inline-flex min-h-11 shrink-0 items-center gap-2 text-label text-foreground underline decoration-border underline-offset-4 group-hover:decoration-foreground sm:justify-self-end">
          <span className="group-open:hidden">{copy.open}</span>
          <span className="hidden group-open:inline">{copy.close}</span>
          <span
            aria-hidden="true"
            className="flex size-5 items-center justify-center border border-foreground text-sm leading-none no-underline"
          >
            <span className="group-open:hidden">+</span>
            <span className="hidden group-open:inline">−</span>
          </span>
        </span>
      </summary>
      <div
        className="min-w-0 border-t border-hairline pb-6 pt-6 [&_h1]:hidden"
        data-lesson-reference-content
      >
        {children}
      </div>
    </details>
  );
}
