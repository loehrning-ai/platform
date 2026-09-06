import Link from "next/link";
import type { CourseLevel } from "@/lib/courses/catalog";
import { COURSE_LEVEL_LABELS_BY_LOCALE } from "@/lib/courses/catalog-copy";
import { Card } from "@/components/ui/card";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type { AccountPageCopy } from "../account-copy";
import {
  COURSE_LEVEL_VALUES,
  KONTO_SECTION_IDS,
  kontoHref,
  type AccountCourseEntry,
  type CourseSort,
} from "./account-data";
import { CourseCatalogCard } from "./course-card";

/**
 * Meine Kurse: the catalog, split into what the learner has started and what
 * is still open, with level and sort as real links rather than client state.
 *
 * The region carries the anchor, so the section nav keeps a valid target even
 * when nothing has been started yet and the "Meine Kurse" heading is absent.
 */
export function MeineKurseSection({
  copy,
  locale,
  activeLevel,
  activeSort,
  myCourses,
  availableCourses,
}: {
  readonly copy: AccountPageCopy;
  readonly locale: Locale;
  readonly activeLevel: CourseLevel | undefined;
  readonly activeSort: CourseSort;
  readonly myCourses: readonly AccountCourseEntry[];
  readonly availableCourses: readonly AccountCourseEntry[];
}) {
  return (
    <section
      id={KONTO_SECTION_IDS.kurse}
      aria-label={copy.coursesHeading}
      className="scroll-mt-24"
    >
      {myCourses.length > 0 ? (
        <>
          <h2 className="mt-12 text-2xl font-bold tracking-[-0.03em] text-foreground">
            {copy.coursesHeading}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {myCourses.map((entry) => (
              <CourseCatalogCard
                key={entry.course.slug}
                entry={entry}
                copy={copy}
                locale={locale}
              />
            ))}
          </div>
        </>
      ) : null}

      {/* Available courses: filter/sort, cover art, honest gating note */}
      <div className="mt-12 flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id="konto-katalog"
          className="scroll-mt-24 text-2xl font-bold tracking-[-0.03em] text-foreground"
        >
          {copy.availableCoursesHeading}
        </h2>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {copy.levelFilterLabel}
            </span>
            <Link
              href={localizeHref(kontoHref({ sort: activeSort }), locale)}
              className={`inline-flex min-h-11 items-center px-2.5 font-mono text-xs font-bold uppercase tracking-[0.08em] ${
                activeLevel
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-brand-orange underline underline-offset-4"
              }`}
            >
              {copy.allLevels}
            </Link>
            {COURSE_LEVEL_VALUES.map((level) => (
              <Link
                key={level}
                href={localizeHref(
                  kontoHref({ level, sort: activeSort }),
                  locale,
                )}
                className={`inline-flex min-h-11 items-center px-2.5 font-mono text-xs font-bold uppercase tracking-[0.08em] ${
                  activeLevel === level
                    ? "text-brand-orange underline underline-offset-4"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {COURSE_LEVEL_LABELS_BY_LOCALE[locale][level]}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {copy.sortLabel}
            </span>
            {(
              [
                ["step", copy.sortByStep],
                ["duration", copy.sortByDuration],
                ["progress", copy.sortByProgress],
              ] as const
            ).map(([sort, label]) => (
              <Link
                key={sort}
                href={localizeHref(
                  kontoHref({ level: activeLevel, sort }),
                  locale,
                )}
                className={`inline-flex min-h-11 items-center px-2.5 font-mono text-xs font-bold uppercase tracking-[0.08em] ${
                  activeSort === sort
                    ? "text-brand-orange underline underline-offset-4"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {copy.accountRequiredNote}
      </p>
      {availableCourses.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {availableCourses.map((entry) => (
            <CourseCatalogCard
              key={entry.course.slug}
              entry={entry}
              copy={copy}
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <Card className="mt-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {copy.noCoursesMatchFilter}
          </p>
        </Card>
      )}
    </section>
  );
}
