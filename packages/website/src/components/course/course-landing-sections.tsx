import type { JSX, ReactNode } from "react";
import { ButtonLink, cx } from "@/components/werk";
import { TechnicalCourseSectionHeading } from "./technical-course-landing";

/**
 * Werkzeichnung building blocks for the native course landings
 * (KI-Führerschein, KI und Gesellschaft, EU AI Act, AI-Native). Sections open
 * with a Kopflinie head, content is hairline rows, and nothing is boxed.
 */

interface CourseLandingSectionProps {
  readonly title: string;
  readonly caption?: string;
  readonly intro?: string;
  readonly id?: string;
  readonly children: ReactNode;
}

export function CourseLandingSection({
  title,
  caption,
  intro,
  id,
  children,
}: CourseLandingSectionProps): JSX.Element {
  return (
    <section className="mt-12 min-w-0 scroll-mt-24 lg:mt-14" id={id}>
      <TechnicalCourseSectionHeading
        title={title}
        eyebrow={caption}
        intro={intro}
      />
      <div className="mt-6 min-w-0">{children}</div>
    </section>
  );
}

export interface CourseOutcome {
  readonly title: string;
  readonly detail?: string;
}

/** "Was du danach kannst": a two-column hairline list, no icons, no boxes. */
export function CourseOutcomeList({
  items,
}: {
  readonly items: readonly CourseOutcome[];
}): JSX.Element {
  return (
    <ul className="grid min-w-0 gap-x-12 sm:grid-cols-2" data-course-outcomes>
      {items.map((item) => (
        <li
          key={item.title}
          className="min-w-0 border-b border-hairline py-4"
        >
          <p className="break-words text-body font-semibold text-foreground">
            {item.title}
          </p>
          {item.detail ? (
            <p className="mt-1 break-words text-body text-muted-foreground">
              {item.detail}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export interface CourseLedgerRow {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly description?: string;
  readonly meta?: string;
  /** Optional extra content under the description (e.g. a topic disclosure). */
  readonly extra?: ReactNode;
}

/**
 * Curriculum ledger (design direction 6.6): number, title and one line, with
 * the lesson count and time as plain caption text. Rows are not links; the
 * reader behind the landing is gated or has its own entry.
 */
export function CourseBlockLedger({
  rows,
  label,
}: {
  readonly rows: readonly CourseLedgerRow[];
  readonly label?: string;
}): JSX.Element {
  return (
    <ol aria-label={label} className="min-w-0 border-t border-hairline" data-course-ledger>
      {rows.map((row) => (
        <li
          key={row.id}
          className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 gap-y-2 border-b border-hairline py-5 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-baseline"
        >
          <span className="text-label text-muted tabular-nums">{row.number}</span>
          <div className="min-w-0">
            <h3 className="break-words text-fluid-h3 font-bold text-foreground">
              {row.title}
            </h3>
            {row.description ? (
              <p className="mt-1 max-w-[60ch] break-words text-body text-muted-foreground">
                {row.description}
              </p>
            ) : null}
            {row.extra}
          </div>
          {row.meta ? (
            <p className="col-start-2 text-caption text-muted-foreground tabular-nums sm:col-start-auto sm:text-right">
              {row.meta}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/**
 * Collapsed boundary notes (legal basis, scope of the record). A quiet
 * disclosure between hairlines; the square marker turns into a minus when open.
 */
export function CourseBoundaryDetails({
  summary,
  children,
}: {
  readonly summary: string;
  readonly children: ReactNode;
}): JSX.Element {
  return (
    <details className="group/boundary mt-12 border-y border-hairline lg:mt-14">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 text-label text-foreground [&::-webkit-details-marker]:hidden">
        {summary}
        <span
          aria-hidden="true"
          className="flex size-5 shrink-0 items-center justify-center border border-foreground text-sm leading-none"
        >
          <span className="group-open/boundary:hidden">+</span>
          <span className="hidden group-open/boundary:inline">−</span>
        </span>
      </summary>
      <div className="grid gap-8 border-t border-hairline py-6 lg:grid-cols-2">
        {children}
      </div>
    </details>
  );
}

export function CourseBoundaryColumn({
  title,
  children,
  className,
}: {
  readonly title?: string;
  readonly children: ReactNode;
  readonly className?: string;
}): JSX.Element {
  return (
    <div className={cx("min-w-0", className)}>
      {title ? <h3 className="text-label text-foreground">{title}</h3> : null}
      <div className={cx("text-caption text-muted-foreground", title ? "mt-2" : undefined)}>
        {children}
      </div>
    </div>
  );
}

/** Hairline list inside a boundary column. */
export function CourseNoteList({
  items,
}: {
  readonly items: readonly string[];
}): JSX.Element {
  return (
    <ul className="border-t border-hairline">
      {items.map((item) => (
        <li key={item} className="border-b border-hairline py-2.5 text-caption text-muted-foreground">
          {item}
        </li>
      ))}
    </ul>
  );
}

/** The follow-on course as a text link with an arrow, below the boundary notes. */
export function CourseNextLink({
  href,
  children,
}: {
  readonly href: string;
  readonly children: ReactNode;
}): JSX.Element {
  return (
    <p className="mt-8">
      <ButtonLink href={href} variant="text">
        {children}
      </ButtonLink>
    </p>
  );
}

/** "1 Std. 40 Min." / "1 hr 40 min" for a minute total. */
export function formatCourseMinutes(total: number, locale: "de" | "en"): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (locale === "de") {
    if (hours === 0) return `${minutes} Min.`;
    return minutes === 0 ? `${hours} Std.` : `${hours} Std. ${minutes} Min.`;
  }
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}
