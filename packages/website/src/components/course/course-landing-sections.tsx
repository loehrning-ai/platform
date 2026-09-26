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

/**
 * Columns for an outcome list so every column ends on the same row: two for
 * an even count, three from lg for a count divisible by three, otherwise a
 * single reading column. A two-column grid with three items would leave a
 * hole at the bottom right and a hairline that stops short.
 */
export function courseOutcomeColumnsClass(count: number): string {
  if (count > 1 && count % 2 === 0) return "sm:grid-cols-2";
  if (count > 1 && count % 3 === 0) return "lg:grid-cols-3";
  return "max-w-[64ch]";
}

/** "Was du danach kannst": a hairline list, no icons, no boxes. */
export function CourseOutcomeList({
  items,
}: {
  readonly items: readonly CourseOutcome[];
}): JSX.Element {
  return (
    <ul
      className={cx(
        "grid min-w-0 gap-x-12",
        courseOutcomeColumnsClass(items.length),
      )}
      data-course-outcomes
    >
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
 *
 * From sm the number has its own column. On a phone that column would push
 * every title and description about 56px to the right, so the row is one
 * column and the number moves into the caption ("01 · 3 Lektionen · 10 Min.").
 * Exactly one of the two number spans is displayed at any width, so a screen
 * reader hears the number once.
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
          className="grid min-w-0 grid-cols-1 gap-y-1 border-b border-hairline py-5 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-x-4"
          data-course-ledger-row
        >
          <span className="hidden text-label text-muted tabular-nums sm:col-start-1 sm:row-start-1 sm:block">
            {row.number}
          </span>
          <h3 className="min-w-0 break-words text-fluid-h3 font-bold text-foreground text-balance sm:col-start-2 sm:row-start-1">
            {row.title}
          </h3>
          {/* Mobile: number and facts sit directly under the title, before
              any disclosure; from sm the facts move to the right-hand column
              and the number to its own column on the left. */}
          <p className="text-caption text-muted-foreground tabular-nums sm:col-start-3 sm:row-start-1 sm:text-right">
            <span className="sm:hidden">
              {row.number}
              {row.meta ? " · " : ""}
            </span>
            {row.meta}
          </p>
          {row.description || row.extra ? (
            <div className="min-w-0 sm:col-start-2 sm:row-start-2">
              {row.description ? (
                <p className="max-w-[64ch] break-words text-body text-muted-foreground text-pretty">
                  {row.description}
                </p>
              ) : null}
              {row.extra}
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/**
 * Collapsed boundary notes (legal basis, scope of the record). A quiet
 * disclosure between hairlines; a plain plus turns into a minus when open.
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
          className="w-4 shrink-0 text-center text-label leading-none tabular-nums"
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

/**
 * The follow-on course as a text link with an arrow. Place it inside the last
 * section so it does not float alone above the footer.
 */
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
