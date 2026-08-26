import { type JSX } from "react";
import type { Locale } from "@/lib/i18n/locale";
import type { LessonMissionFrame as LessonMissionFrameData } from "@/lib/course-projects/lesson-mission-binding";
import { cn } from "@/lib/utils";

export interface LessonMissionFrameProps {
  readonly frame: LessonMissionFrameData;
  readonly locale: Locale;
  readonly headingLevel?: 1 | 2 | 3;
  /** The persistent mission header can own the lesson heading while collapsed. */
  readonly showHeading?: boolean;
  /** Removes repeated mobile chrome while preserving the authored focus. */
  readonly compactOnMobile?: boolean;
}

/** Visible authored-content bridge between the active lesson and its lab. */
export function LessonMissionFrame({
  frame,
  locale,
  headingLevel = 3,
  showHeading = true,
  compactOnMobile = false,
}: LessonMissionFrameProps): JSX.Element {
  const NestedHeading = headingLevel === 2 ? "h2" : "h3";
  const headingClass =
    "mt-1 block text-balance text-lg font-black leading-tight text-foreground";

  return (
    <article
      data-lesson-mission-id={frame.missionId}
      data-lesson-skill-id={frame.skillId}
      data-lesson-scenario-seed={frame.scenarioSeed}
      className={cn(
        "grid min-w-0 gap-3 sm:grid-cols-[minmax(12rem,0.8fr)_minmax(0,1.2fr)] sm:items-start",
        compactOnMobile && "gap-1 sm:gap-3",
      )}
    >
      <div
        className={cn(
          "min-w-0",
          compactOnMobile && !showHeading && "sr-only sm:not-sr-only",
        )}
      >
        <p className="font-mono text-xs font-black uppercase tracking-[0.16em] text-brand-orange-dark">
          {frame.label}
        </p>
        {showHeading ? (
          headingLevel === 1 ? (
            <span role="heading" aria-level={1} className={headingClass}>
              {frame.title}
            </span>
          ) : (
            <NestedHeading className={headingClass}>
              {frame.title}
            </NestedHeading>
          )
        ) : null}
      </div>
      <div className="min-w-0 border-l-4 border-brand-orange pl-3">
        <p className="break-words text-sm font-semibold leading-snug text-foreground">
          {frame.objective}
        </p>
        {frame.keyConcepts.length > 0 ? (
          <ul
            aria-label={locale === "de" ? "Schlüsselkonzepte" : "Key concepts"}
            className={cn(
              "mt-2 flex min-w-0 flex-wrap gap-1.5",
              compactOnMobile && "mt-1 gap-x-3 gap-y-1 sm:mt-2 sm:gap-1.5",
            )}
          >
            {frame.keyConcepts.map((concept) => (
              <li
                key={concept}
                className={cn(
                  "max-w-full break-words border border-border bg-background px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground",
                  compactOnMobile &&
                    "border-0 bg-transparent px-0 py-0 sm:border sm:bg-background sm:px-2 sm:py-1",
                )}
              >
                {concept}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p className="sr-only">{frame.bridge}</p>
    </article>
  );
}
