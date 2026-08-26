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
  "inline-flex min-h-12 max-w-full items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.06em] text-white transition-[background-color,border-color,color] hover:bg-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange";

export const TECHNICAL_COURSE_SECONDARY_ACTION_CLASS =
  "inline-flex min-h-12 max-w-full items-center border-b-2 border-foreground px-1 py-3 font-mono text-xs font-bold uppercase tracking-[0.06em] text-foreground transition-[border-color,color] hover:border-brand-orange hover:text-brand-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange";

export const TECHNICAL_COURSE_LEDGER_LINK_CLASS =
  "group grid min-h-14 min-w-0 items-center gap-2 border-b border-border px-2 py-3 transition-[background-color,border-color,color] hover:border-brand-orange hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange sm:px-3";

export function TechnicalCourseFrame({
  children,
  courseId,
  lang,
}: TechnicalCourseFrameProps): JSX.Element {
  return (
    <div
      className="mx-auto w-full max-w-[1180px] min-w-0 overflow-x-clip px-4 pb-12 pt-6 sm:px-6 sm:pt-8"
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
    <header className="border-y border-foreground py-6 sm:py-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-[900px] break-words text-[38px] font-bold leading-[1.02] tracking-[-0.035em] text-foreground [overflow-wrap:anywhere] sm:text-[48px] lg:text-[56px]">
            {title}
          </h1>
          <p className="mt-4 max-w-[720px] break-words text-base leading-[1.55] text-muted-foreground [overflow-wrap:anywhere]">
            {intro}
          </p>
          <div className="mt-5 flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
            {primaryAction}
            {secondaryAction}
          </div>
        </div>

        <aside
          aria-label={factsLabel}
          className="min-w-0 border-t border-border lg:border-l lg:border-t-0 lg:pl-5"
        >
          <ul className="divide-y divide-border">
            {facts.map((fact, index) => (
              <li
                key={fact}
                className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-baseline gap-2 py-2.5 font-mono text-xs text-foreground"
              >
                <span
                  className="tabular-nums text-muted-foreground"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="break-words">{fact}</span>
              </li>
            ))}
          </ul>
          {progress ? <div className="mt-3">{progress}</div> : null}
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
    <div className="min-w-0" id={id}>
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
  );
}
