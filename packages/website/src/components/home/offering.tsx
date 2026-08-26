import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOME_COPY, homeCourseCopy } from "@/components/home/home-copy";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { courseGroupFor } from "@/lib/courses/tracks";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

const SPINE_HOME_COURSES = COURSE_CATALOG.filter(
  (course) => courseGroupFor(course.slug) !== "deeper",
);

const TECHNICAL_COURSE_COUNT = COURSE_CATALOG.filter(
  (course) => courseGroupFor(course.slug) === "deeper",
).length;

export function Offering({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = HOME_COPY[locale].offering;

  return (
    <section
      id="kurse"
      className="relative scroll-mt-24 border-b border-border bg-background py-12"
      data-testid="kurse-section"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-12">
          <header>
            <p className="overline border-l-[3px] border-brand-orange pl-3">
              {copy.overline}
            </p>
            <h2 className="mt-4 text-fluid-h2 font-bold tracking-[-0.035em] text-foreground">
              {copy.headline[0]}{" "}
              <span className="text-muted-foreground">{copy.headline[1]}</span>
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              {copy.introduction}
            </p>
          </header>

          <ol className="border-t border-border" data-testid="foundation-route">
            {SPINE_HOME_COURSES.map((course, index) => {
              const courseCopy = homeCourseCopy(locale, course.slug);
              return (
                <li key={course.slug} className="border-b border-border">
                  <Link
                    href={localizeHref(course.href, locale)}
                    className="group grid min-h-20 grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 py-3 sm:gap-5"
                  >
                    <span
                      aria-hidden="true"
                      className="font-mono text-xs font-bold tabular-nums text-brand-orange"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-lg font-bold tracking-[-0.02em] text-foreground transition-colors group-hover:text-brand-orange">
                        {courseCopy.title}
                      </span>
                      <span className="mt-1 block text-sm leading-snug text-muted-foreground">
                        {courseCopy.tagline}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1 text-right">
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {courseCopy.duration}
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        size={18}
                        className="text-brand-orange transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transition-none"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-l-[3px] border-brand-orange bg-kupfer-mist px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-foreground">
            {copy.deeperSummary(TECHNICAL_COURSE_COUNT)}
          </p>
          <Link
            href={localizeHref("/kurse", locale)}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange"
          >
            {copy.viewAllCourses}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
