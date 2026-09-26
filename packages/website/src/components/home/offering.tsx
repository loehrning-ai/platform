import Link from "next/link";
import { CourseArtwork } from "@/components/home/course-artwork";
import { HomeSectionHead } from "@/components/home/home-section-head";
import { ArrowGlyph } from "@/components/werk/arrow-glyph";
import { BUTTON_CLASSES } from "@/components/werk/button-link";
import { HOME_COPY, homeCourseCopy } from "@/components/home/home-copy";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalogCourse } from "@/lib/courses/catalog-copy";
import { courseGroupFor } from "@/lib/courses/tracks";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

const SPINE_HOME_COURSES = COURSE_CATALOG.filter(
  (course) => courseGroupFor(course.slug) !== "deeper",
);

const TECHNICAL_COURSE_COUNT = COURSE_CATALOG.filter(
  (course) => courseGroupFor(course.slug) === "deeper",
).length;

/**
 * Kurse: the four spine courses in their order, then the one path to the
 * full atlas.
 *
 * From lg the route reads left to right as four flat sheets: the course
 * cover in a 1px ink frame, a sentence-case meta line, the title, one
 * sentence and the duration. Below lg each course is one hairline row led by
 * its number. No tints, no shadows and no hover lift: hover underlines the
 * title and nudges the arrow; focus is the global Mennige ring.
 */
export function Offering({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = HOME_COPY[locale].offering;

  return (
    <section
      id="kurse"
      className="scroll-mt-24 bg-background px-6 pt-16 pb-12 max-lg:py-5 max-lg:pt-8 md:px-12 lg:pt-20"
      data-testid="kurse-section"
    >
      <div className="mx-auto max-w-6xl">
        <HomeSectionHead
          id="kurse-heading"
          kicker={copy.overline}
          note={copy.routeSignal}
          introduction={copy.introduction}
          title={
            <>
              {copy.headline[0]}{" "}
              <span className="max-lg:block">{copy.headline[1]}</span>
            </>
          }
        />

        <ol
          className="mt-10 grid grid-cols-4 gap-x-8 max-lg:mt-4 max-lg:grid-cols-1 max-lg:gap-0 max-lg:border-t max-lg:border-hairline"
          data-testid="foundation-route"
          aria-label={copy.routeLabel}
        >
          {SPINE_HOME_COURSES.map((course, index) => {
            const courseCopy = homeCourseCopy(locale, course.slug);
            const unitLabel = localizeCatalogCourse(course, locale).unitLabel;
            const number = String(index + 1).padStart(2, "0");
            return (
              <li key={course.slug} className="min-w-0">
                <Link
                  href={localizeHref(course.href, locale)}
                  className="group flex h-full min-w-0 flex-col transition-colors duration-[120ms] motion-reduce:transition-none max-lg:grid max-lg:grid-cols-[1.75rem_minmax(0,1fr)_auto] max-lg:items-center max-lg:gap-3 max-lg:border-b max-lg:border-hairline max-lg:py-2 max-lg:hover:bg-card-hover"
                  data-home-course-card
                >
                  {/* Below lg the artwork steps out and the course number
                      becomes the row's lead column. */}
                  <span className="block max-lg:contents">
                    {course.coverImage ? (
                      <CourseArtwork src={course.coverImage} />
                    ) : null}
                    <span className="text-sm font-semibold tabular-nums text-muted-foreground lg:hidden">
                      {number}
                    </span>
                  </span>

                  <span className="mt-4 flex min-w-0 flex-1 flex-col max-lg:mt-0">
                    {/* Below lg: title first, then one meta line (units and
                        duration). From lg: number, units and lessons above
                        the title, the duration at the foot of the sheet. */}
                    <span className="order-1 text-label text-muted-foreground tabular-nums max-lg:order-2 max-lg:mt-0.5 max-lg:text-[0.8125rem] max-lg:font-normal max-lg:leading-snug max-lg:tracking-normal">
                      <span className="max-lg:hidden">{number} · </span>
                      {course.unitCount} {unitLabel}
                      <span className="max-lg:hidden">
                        {" "}
                        · {course.totalLessons} {copy.lessonLabel}
                      </span>
                      <span className="lg:hidden">
                        {" "}
                        · <span className="whitespace-nowrap">{courseCopy.duration}</span>
                      </span>
                    </span>
                    <span className="order-2 mt-1 text-fluid-h3 font-bold text-foreground underline decoration-transparent underline-offset-4 transition-colors duration-[120ms] group-hover:decoration-current motion-reduce:transition-none max-lg:order-1 max-lg:mt-0 max-lg:text-base max-lg:leading-snug max-lg:no-underline">
                      {courseCopy.title}
                    </span>
                    <span className="order-3 mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground text-pretty max-lg:hidden">
                      {courseCopy.tagline}
                    </span>
                    <span className="order-4 mt-auto pt-4 max-lg:hidden">
                      <span className="flex items-center justify-between gap-3 border-t border-hairline pt-3 text-caption text-muted-foreground tabular-nums">
                        <span>{courseCopy.duration}</span>
                        <ArrowGlyph className="text-foreground" />
                      </span>
                    </span>
                  </span>
                  <ArrowGlyph className="mr-1 text-foreground lg:hidden" />
                </Link>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 flex items-center justify-between gap-6 border-t border-hairline pt-4 max-lg:mt-3 max-lg:grid max-lg:grid-cols-[minmax(0,1fr)_auto] max-lg:items-center max-lg:gap-4 max-lg:border-t-0 max-lg:pt-0">
          <p className="text-[0.9375rem] leading-relaxed text-muted-foreground max-lg:text-[0.8125rem] max-lg:leading-snug">
            {copy.deeperSummary(TECHNICAL_COURSE_COUNT)}
          </p>
          <Link
            href={localizeHref("/kurse", locale)}
            className={`${BUTTON_CLASSES.paper.text} shrink-0 text-[0.9375rem] max-lg:text-sm`}
          >
            {copy.viewAllCourses}
            <ArrowGlyph />
          </Link>
        </div>
      </div>
    </section>
  );
}
