import type { JSX, ReactNode } from "react";
import { Kicker } from "@/components/werk";

interface TechnicalCourseFrameProps {
  readonly children: ReactNode;
  readonly courseId: string;
  readonly lang?: string;
}

interface TechnicalCourseHeaderProps {
  readonly eyebrow: string;
  /** A string, or inline markup that only controls line breaks. */
  readonly title: ReactNode;
  readonly intro: string;
  readonly primaryAction: ReactNode;
  readonly secondaryAction?: ReactNode;
  readonly facts: readonly string[];
  readonly factsLabel: string;
  readonly progress?: ReactNode;
}

interface TechnicalCourseSectionHeadingProps {
  /**
   * Optional factual note shown at the right of the Kopflinie. Section heads
   * get no kicker in Werkzeichnung, so this renders as a quiet caption.
   */
  readonly eyebrow?: string;
  readonly title: string;
  readonly intro?: string;
  readonly id?: string;
}

/**
 * The course landing kit renders 9 of 10 course landings (Werkzeichnung,
 * design direction 7.4): a paper hero with a sentence-case kicker, an ink
 * headline and one Mennige primary action; sections open with a 2px ink
 * Kopflinie; lists are hairline rows. No boxes, no offset shadows, no radius.
 */

/**
 * The page's one Mennige action. It keeps `bg-brand-orange` because the
 * landing tests and e2e specs locate the primary action by that class.
 * Paper text on Mennige is 5.40:1, on the Mennige-tief hover 7.14:1.
 */
export const TECHNICAL_COURSE_PRIMARY_ACTION_CLASS =
  "inline-flex min-h-12 max-w-full min-w-0 items-center justify-center gap-2 bg-brand-orange px-5 py-3 text-center text-[0.9375rem] font-semibold text-paper transition-colors duration-[120ms] hover:bg-kupfer-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange motion-reduce:transition-none";

/** Secondary action: square ink outline, same height as the primary. */
export const TECHNICAL_COURSE_SECONDARY_ACTION_CLASS =
  "inline-flex min-h-12 max-w-full min-w-0 items-center justify-center gap-2 border border-foreground bg-transparent px-5 py-3 text-center text-[0.9375rem] font-semibold text-foreground transition-colors duration-[120ms] hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange motion-reduce:transition-none";

/**
 * Ledger row link: the whole row is one link, separated by a hairline, with a
 * tonal hover. Consumers add their own grid columns.
 */
export const TECHNICAL_COURSE_LEDGER_LINK_CLASS =
  "group relative grid min-h-14 min-w-0 items-center gap-2 border-b border-hairline bg-transparent px-0 py-4 transition-colors duration-[120ms] hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange motion-reduce:transition-none";

/** Legal-document "§ " prefixes are dropped from labels on the landing. */
function plainLabel(label: string): string {
  return label.replace(/^§\s*/, "");
}

export function TechnicalCourseFrame({
  children,
  courseId,
  lang,
}: TechnicalCourseFrameProps): JSX.Element {
  return (
    <div
      className="mx-auto w-full max-w-[75rem] min-w-0 overflow-x-clip px-4 pb-12 pt-6 sm:px-6 sm:pt-10"
      data-technical-course={courseId}
      lang={lang}
    >
      {children}
    </div>
  );
}

export function TechnicalCourseHeader({
  eyebrow,
  title,
  intro,
  primaryAction,
  secondaryAction,
  facts,
  factsLabel,
  progress,
}: TechnicalCourseHeaderProps): JSX.Element {
  return (
    <header
      className="grid min-w-0 gap-x-12 gap-y-8 pb-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:pb-12"
      data-technical-course-header
    >
      <div className="min-w-0">
        <Kicker>{plainLabel(eyebrow)}</Kicker>
        <h1 className="mt-3 max-w-[26ch] break-words text-fluid-h1 font-bold text-foreground text-balance [overflow-wrap:anywhere]">
          {title}
        </h1>
        <p className="mt-5 max-w-[56ch] break-words text-lead text-muted-foreground text-pretty [overflow-wrap:anywhere]">
          {intro}
        </p>
        <div
          className="mt-7 flex min-w-0 flex-wrap items-center gap-3"
          data-course-entry-actions
        >
          {primaryAction}
          {secondaryAction}
        </div>
      </div>

      <aside
        aria-label={factsLabel}
        className="min-w-0 self-start border-t-2 border-foreground pt-4"
      >
        <p className="text-label text-foreground">{plainLabel(factsLabel)}</p>
        <ul className="mt-3" data-course-onboarding-checklist>
          {facts.map((fact) => (
            <li
              key={fact}
              className="min-w-0 break-words border-b border-hairline py-2.5 text-body text-foreground tabular-nums"
            >
              {fact}
            </li>
          ))}
        </ul>
        {progress ? (
          <div className="mt-5 empty:hidden" data-course-progress-card>
            {progress}
          </div>
        ) : null}
      </aside>
    </header>
  );
}

export function TechnicalCourseSectionHeading({
  eyebrow,
  title,
  intro,
  id,
}: TechnicalCourseSectionHeadingProps): JSX.Element {
  const note = eyebrow ? plainLabel(eyebrow) : "";
  return (
    <div
      className="min-w-0 border-t-2 border-foreground pt-4"
      id={id}
      data-technical-section-heading
    >
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="max-w-[40ch] break-words text-fluid-h2 font-bold text-foreground text-balance [overflow-wrap:anywhere]">
          {title}
        </h2>
        {note ? (
          <p className="text-caption text-muted-foreground">{note}</p>
        ) : null}
      </div>
      {intro ? (
        <p className="mt-2 max-w-[64ch] break-words text-body text-muted-foreground text-pretty [overflow-wrap:anywhere]">
          {intro}
        </p>
      ) : null}
    </div>
  );
}
