import type { JSX, ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";

const COPY = {
  de: {
    eyebrow: "Lektion",
    open: "Aufklappen",
    close: "Einklappen",
    toggleContext: "Lektionstext",
  },
  en: {
    eyebrow: "Lesson",
    open: "Expand",
    close: "Collapse",
    toggleContext: "Lesson text",
  },
} as const;

export interface LessonReferenceProps {
  readonly children: ReactNode;
  readonly locale: Locale;
  readonly title: string;
  readonly objective?: string | null;
  /**
   * Where the lesson sits in the course, for example "Lektion 2 von 12".
   * Replaces the bare "Lektion" kicker, so a reader does not need its own
   * progress eyebrow above the text.
   */
  readonly position?: string | null;
  /** Use level 2 only when the surrounding custom shell already owns its h1. */
  readonly headingLevel?: 1 | 2;
  /**
   * Hides the objective below sm. A checkpoint lesson passes it because its
   * mission, directly above, already shows the same objective; on a phone the
   * repeat cost about 90px before the lesson text. It also reduces the head
   * to screen-reader text and drops the fold control below sm (the text stays
   * open), and hides a reader's `.lesson-head-position` and
   * `.lesson-head-concepts`. From sm everything is shown.
   */
  readonly objectiveRepeatedAbove?: boolean;
}

/**
 * The lesson head and the lesson text.
 *
 * The head (kicker, title, objective) sits above the disclosure under the
 * Kopflinie and stays visible when the text is folded, so the page keeps its
 * heading and the disclosure's accessible name is only "Lektionstext
 * einklappen". The title is a `role="heading"` element rather than an `<h1>`
 * because every reader passes its own authored `<h1>` in `children` (hidden
 * below); the document then still holds exactly one `<h1>` element.
 *
 * The text renders open: the lesson is the page, so a reader lands on the
 * text rather than on a closed box. The native <details> keeps keyboard,
 * crawl and no-JavaScript access, and a reader can still fold the text away
 * (for example to work on a checkpoint above it) without client state on the
 * lesson page. React only writes the `open` attribute when the prop changes,
 * so a reader's own toggle sticks until the lesson changes.
 */
export function LessonReference({
  children,
  locale,
  title,
  objective,
  position,
  headingLevel = 1,
  objectiveRepeatedAbove = false,
}: LessonReferenceProps): JSX.Element {
  const copy = COPY[locale];
  const kicker = position?.trim() || copy.eyebrow;
  const normalizedObjective = objective?.trim() || null;

  return (
    <div
      className="relative min-w-0 border-t-2 border-foreground"
      data-lesson-reference-block
    >
      {/* With the mission directly above, the head only repeats its title on
          a phone, so below sm it stays for assistive technology only. The
          wrapper carries the plain `sr-only` class, which layout probes
          recognise, and has no padding for `sm:not-sr-only` to reset. */}
      <div
        className={
          objectiveRepeatedAbove ? "sr-only sm:not-sr-only" : undefined
        }
        data-lesson-reference-head
      >
        <header className="min-w-0 break-words pt-4 sm:pr-40">
          <p className="text-label text-muted-foreground tabular-nums">
            {kicker}
          </p>
          <div
            role="heading"
            aria-level={headingLevel}
            className="mt-1 text-fluid-h2 font-bold text-foreground text-balance"
          >
            {title}
          </div>
          {normalizedObjective ? (
            <p
              className={`mt-2 max-w-[64ch] text-body text-muted-foreground text-pretty${
                objectiveRepeatedAbove ? " max-sm:hidden" : ""
              }`}
            >
              {normalizedObjective}
            </p>
          ) : null}
        </header>
      </div>
      <details open className="group min-w-0" data-lesson-reference>
        {/* In flow under the head on a phone; from sm it moves to the top
            right of the block, level with the kicker. */}
        <summary
          className={`mt-2 flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 text-label text-foreground underline decoration-border underline-offset-4 outline-none hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange sm:absolute sm:right-0 sm:top-3 sm:mt-0 [&::-webkit-details-marker]:hidden${
            objectiveRepeatedAbove ? " max-sm:hidden" : ""
          }`}
        >
          <span className="sr-only">{copy.toggleContext} </span>
          <span className="group-open:hidden">{copy.open}</span>
          <span className="hidden group-open:inline">{copy.close}</span>
          <span
            aria-hidden="true"
            className="w-4 text-center leading-none tabular-nums no-underline"
          >
            <span className="group-open:hidden">+</span>
            <span className="hidden group-open:inline">−</span>
          </span>
        </summary>
        {/* The head above names the lesson, so the reader's own title and,
            in the Data Science and data engineering chapters, the chapter
            eyebrow, the meta row (which repeats the objective) and the hero
            rule are hidden. The chapter stylesheets are unlayered, so these
            overrides need `!` to win over them. */}
        {/* A phone below a mission also drops the reader's own position
            line and concept run (`.lesson-head-position`,
            `.lesson-head-concepts`): the reader bar shows the position and
            the mission lists the concepts. */}
        <div
          className={`mt-4 min-w-0 border-t border-hairline pb-6 pt-6 max-sm:pt-4 [&_h1]:hidden [&_.hero-eyebrow]:hidden! [&_.hero-meta]:hidden! [&_.hero]:border-0! [&_.hero]:pt-0! [&_.hero]:after:hidden!${
            objectiveRepeatedAbove
              ? " max-sm:mt-0 max-sm:border-t-0 max-sm:[&_.lesson-head-position]:hidden! max-sm:[&_.lesson-head-concepts]:hidden!"
              : ""
          }`}
          data-lesson-reference-content
        >
          {children}
        </div>
      </details>
    </div>
  );
}
