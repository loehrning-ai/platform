import type { JSX, ReactNode } from "react";

interface TechnicalCourseFrameProps {
  readonly children: ReactNode;
  readonly courseId: string;
  readonly lang?: string;
}

interface TechnicalCourseHeaderProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly intro: string;
  readonly primaryAction: ReactNode;
  readonly secondaryAction?: ReactNode;
  readonly facts: readonly string[];
  readonly factsLabel: string;
  readonly progress?: ReactNode;
}

interface TechnicalCourseSectionHeadingProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly intro?: string;
  readonly id?: string;
}

export const TECHNICAL_COURSE_PRIMARY_ACTION_CLASS =
  "inline-flex min-h-12 max-w-full min-w-0 items-center justify-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-3 text-center font-mono text-xs font-bold uppercase tracking-[0.06em] text-white transition-[background-color,border-color,color] duration-150 hover:bg-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange motion-reduce:transition-none";

export const TECHNICAL_COURSE_SECONDARY_ACTION_CLASS =
  "inline-flex min-h-12 max-w-full min-w-0 items-center justify-center border-b-2 border-foreground px-1 py-3 text-center font-mono text-xs font-bold uppercase tracking-[0.06em] text-foreground transition-[border-color,color] duration-150 hover:border-brand-orange hover:text-brand-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange motion-reduce:transition-none";

export const TECHNICAL_COURSE_LEDGER_LINK_CLASS =
  "group relative grid min-h-14 min-w-0 items-center gap-2 border border-border bg-background px-3 py-3 transition-[background-color,border-color,color] duration-150 hover:border-brand-orange hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange motion-reduce:transition-none";

export function TechnicalCourseFrame({
  children,
  courseId,
  lang,
}: TechnicalCourseFrameProps): JSX.Element {
  return (
    <div
      className="mx-auto w-full max-w-[1180px] min-w-0 overflow-x-clip px-4 pb-12 pt-5 sm:px-6 sm:pt-7"
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
      className="min-w-0 overflow-hidden border border-foreground bg-card"
      data-technical-course-header
    >
      <div className="h-1 w-full bg-brand-orange" aria-hidden="true" />
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 p-5 sm:p-6 lg:p-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-[900px] break-words text-[38px] font-bold leading-[1.02] tracking-[-0.035em] text-foreground [overflow-wrap:anywhere] sm:text-[48px] lg:text-[56px]">
            {title}
          </h1>
          <p className="mt-4 max-w-[720px] break-words text-base leading-[1.55] text-muted-foreground [overflow-wrap:anywhere]">
            {intro}
          </p>
          <div
            className="mt-5 flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2"
            data-course-entry-actions
          >
            {primaryAction}
            {secondaryAction}
          </div>
        </div>

        <aside
          aria-label={factsLabel}
          className="min-w-0 border-t border-foreground bg-kupfer-mist p-4 sm:p-5 lg:border-l lg:border-t-0"
        >
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
            {factsLabel}
          </p>
          <ul
            className="mt-3 border-y border-border"
            data-course-onboarding-checklist
          >
            {facts.map((fact, index) => (
              <li
                key={fact}
                className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-center gap-2 border-b border-border py-2.5 font-mono text-xs text-foreground last:border-b-0"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center border border-brand-orange bg-background font-bold tabular-nums text-brand-orange"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="break-words leading-snug">{fact}</span>
              </li>
            ))}
          </ul>
          {progress ? (
            <div className="mt-4 border border-border bg-background p-3" data-course-progress-card>
              {progress}
            </div>
          ) : null}
        </aside>
      </div>
    </header>
  );
}

export function TechnicalCourseSectionHeading({
  eyebrow,
  title,
  intro,
  id,
}: TechnicalCourseSectionHeadingProps): JSX.Element {
  return (
    <div
      className="grid min-w-0 grid-cols-[0.25rem_minmax(0,1fr)] gap-3"
      id={id}
      data-technical-section-heading
    >
      <span className="h-full min-h-14 bg-brand-orange" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 max-w-[900px] break-words text-[26px] font-bold leading-tight tracking-[-0.025em] text-foreground [overflow-wrap:anywhere] sm:text-[32px]">
          {title}
        </h2>
        {intro ? (
          <p className="mt-2 max-w-[720px] break-words text-sm leading-[1.55] text-muted-foreground [overflow-wrap:anywhere]">
            {intro}
          </p>
        ) : null}
      </div>
    </div>
  );
}
