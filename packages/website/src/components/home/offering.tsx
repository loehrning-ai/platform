import Link from "next/link";
import Image from "next/image";
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
      className="relative scroll-mt-24 border-b border-border bg-background py-16 md:py-20"
      data-testid="kurse-section"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-end lg:gap-16">
          <header className="max-w-xl">
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
          <div className="flex items-center gap-3 border-y border-border py-4 lg:justify-end">
            <span className="font-mono text-3xl font-bold tabular-nums text-brand-orange">
              01–04
            </span>
            <span className="max-w-48 text-sm leading-snug text-muted-foreground">
              {copy.routeSignal}
            </span>
          </div>
        </div>

        <ol
          className="relative mt-10 grid gap-4 before:pointer-events-none before:absolute before:left-8 before:top-8 before:hidden before:h-[calc(100%-4rem)] before:border-l before:border-dashed before:border-brand-orange/50 before:content-[''] lg:grid-cols-12 lg:gap-5 lg:before:block"
          data-testid="foundation-route"
          aria-label={copy.routeLabel}
        >
          {SPINE_HOME_COURSES.map((course, index) => {
            const courseCopy = homeCourseCopy(locale, course.slug);
            const wideCard = index === 0 || index === 3;
            return (
              <li
                key={course.slug}
                className={wideCard ? "lg:col-span-7" : "lg:col-span-5"}
              >
                <Link
                  href={localizeHref(course.href, locale)}
                  className="group relative grid h-full min-w-0 overflow-hidden border border-border bg-card outline-none transition-[border-color,background-color,transform] duration-200 hover:-translate-y-1 hover:border-brand-orange hover:bg-card-hover focus-visible:-translate-y-1 focus-visible:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <span className="relative block aspect-[16/7] overflow-hidden border-b border-border bg-kupfer-mist">
                    {course.coverImage ? (
                      <Image
                        src={course.coverImage}
                        alt=""
                        width={610}
                        height={610}
                        sizes={
                          wideCard
                            ? "(min-width: 1024px) 56vw, 100vw"
                            : "(min-width: 1024px) 40vw, 100vw"
                        }
                        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.025] group-focus-visible:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
                      />
                    ) : null}
                    <span className="absolute left-4 top-4 flex size-11 items-center justify-center border border-foreground/25 bg-background font-mono text-sm font-bold tabular-nums text-brand-orange shadow-[3px_3px_0_var(--color-foreground)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="absolute bottom-3 right-3 bg-foreground px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-background">
                      {courseCopy.duration}
                    </span>
                  </span>

                  <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-5 p-5 md:p-6">
                    <span className="min-w-0">
                      <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
                        {course.unitCount} {course.unitLabel} ·{" "}
                        {course.totalLessons} {copy.lessonLabel}
                      </span>
                      <span className="mt-2 block text-xl font-bold tracking-[-0.025em] text-foreground transition-colors duration-150 group-hover:text-brand-orange group-focus-visible:text-brand-orange">
                        {courseCopy.title}
                      </span>
                      <span className="mt-2 block max-w-xl text-sm leading-relaxed text-muted-foreground">
                        {courseCopy.tagline}
                      </span>
                    </span>
                    <span className="flex size-11 shrink-0 items-center justify-center self-end border border-border bg-background text-brand-orange transition-[background-color,color,transform] duration-150 group-hover:translate-x-1 group-hover:bg-foreground group-hover:text-background group-focus-visible:translate-x-1 group-focus-visible:bg-foreground group-focus-visible:text-background motion-reduce:transform-none motion-reduce:transition-none">
                      <ArrowRight aria-hidden="true" size={18} />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 grid gap-4 border border-border bg-kupfer-mist p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
          <p className="text-sm leading-relaxed text-foreground">
            {copy.deeperSummary(TECHNICAL_COURSE_COUNT)}
          </p>
          <Link
            href={localizeHref("/kurse", locale)}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 justify-self-start border-b border-brand-orange font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange outline-none transition-[border-color,color] duration-150 hover:border-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:justify-self-end"
          >
            {copy.viewAllCourses}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
