import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseArtwork } from "@/components/home/course-artwork";
import { ArrowGlyph } from "@/components/werk/arrow-glyph";
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

const COURSE_TONES = [
  "bg-brand-acid/42",
  "bg-brand-peach/38",
  "bg-brand-sky/42",
  "bg-brand-pink/34",
] as const;

const COURSE_PLATES = [
  "bg-brand-acid/55",
  "bg-brand-pink/45",
  "bg-brand-sky/55",
  "bg-brand-peach/50",
] as const;

// Solid tones for the per-card hover bar and number badge, positionally keyed
// to the same index COURSE_TONES uses. This list was previously identical to
// COURSE_TONES, so every badge and hover bar printed the card's own hue on
// itself and vanished into it. Each accent is now its card tone's complement:
// acid takes pink, peach takes sky, sky takes peach, pink takes acid. Warm
// tones get a cool accent and vice versa, so the accent reads as a distinct
// mark while staying inside the same family. All four stay in the light half
// of the palette because the badge prints foreground ink on them; cobalt and
// teal are too dark to carry it.
const COURSE_ACCENTS = [
  "bg-brand-pink",
  "bg-brand-sky",
  "bg-brand-peach",
  "bg-brand-acid",
] as const;

export function Offering({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = HOME_COPY[locale].offering;

  return (
    <section
      id="kurse"
      className="relative scroll-mt-24 overflow-hidden border-b border-border/60 bg-background/65 py-12 max-lg:border-b-0 max-lg:bg-background max-lg:py-5 max-lg:pt-8 md:py-20 lg:py-24"
      data-testid="kurse-section"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-end lg:gap-16">
          <header className="max-w-xl max-lg:border-t-2 max-lg:border-foreground max-lg:pt-3">
            {/* Below lg the 2px Kopflinie heads the section, so the kicker
                stays for assistive tech only. */}
            <p className="overline border-l-[3px] border-brand-orange pl-3 max-lg:sr-only">
              {copy.overline}
            </p>
            <h2 className="mt-4 text-fluid-h2 font-bold tracking-[-0.035em] text-foreground max-lg:mt-0 max-lg:text-2xl max-lg:tracking-[-0.03em] max-lg:text-balance">
              {copy.headline[0]}{" "}
              <span className="text-muted-foreground max-lg:block max-lg:text-foreground">
                {copy.headline[1]}
              </span>
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground max-lg:hidden">
              {copy.introduction}
            </p>
          </header>
          <div className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-brand-sky/45 px-4 py-3 shadow-card max-lg:hidden sm:px-5 sm:py-4 lg:justify-end">
            <span className="font-ui-mono text-2xl font-bold tabular-nums text-brand-orange sm:text-3xl">
              01–04
            </span>
            <span className="max-w-48 text-sm leading-snug text-muted-foreground">
              {copy.routeSignal}
            </span>
          </div>
        </div>

        <ol
          className="relative mt-8 grid gap-3 max-lg:mt-4 max-lg:grid-cols-1 max-lg:gap-0 max-lg:border-t max-lg:border-hairline sm:gap-4 md:grid-cols-2 lg:mt-10 lg:grid-cols-12 lg:gap-6"
          data-testid="foundation-route"
          aria-label={copy.routeLabel}
        >
          {SPINE_HOME_COURSES.map((course, index) => {
            const courseCopy = homeCourseCopy(locale, course.slug);
            const unitLabel = localizeCatalogCourse(course, locale).unitLabel;
            const wideCard = index === 0 || index === 3;
            const tone = COURSE_TONES[index] ?? COURSE_TONES[0];
            const accent = COURSE_ACCENTS[index] ?? COURSE_ACCENTS[0];
            return (
              <li
                key={course.slug}
                className={wideCard ? "lg:col-span-7" : "lg:col-span-5"}
              >
                <Link
                  href={localizeHref(course.href, locale)}
                  className={`group relative grid h-full min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] overflow-hidden rounded-[1.5rem] border border-foreground/10 ${tone} shadow-card outline-none transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1.5 hover:border-brand-cobalt/45 hover:shadow-card-hover focus-visible:-translate-y-1 focus-visible:border-brand-cobalt focus-visible:ring-2 focus-visible:ring-brand-cobalt focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none max-lg:grid-cols-[1.75rem_minmax(0,1fr)_auto] max-lg:items-center max-lg:gap-3 max-lg:rounded-none max-lg:border-0 max-lg:border-b max-lg:border-hairline max-lg:bg-transparent max-lg:py-2 max-lg:shadow-none max-lg:hover:translate-y-0 max-lg:hover:bg-card-hover max-lg:focus-visible:translate-y-0 max-lg:focus-visible:ring-offset-0 sm:grid-cols-1 sm:rounded-[1.75rem]`}
                  data-home-course-card
                >
                  {/* Below lg the retired risograph artwork steps out and the
                      course number becomes the row's lead column. */}
                  <span className="relative block max-lg:contents">
                    {course.coverImage ? (
                      <CourseArtwork
                        src={course.coverImage}
                        wide={wideCard}
                        plateClassName={
                          COURSE_PLATES[index] ?? COURSE_PLATES[0]
                        }
                        accentClassName={accent}
                      />
                    ) : null}
                    <span
                      className={`absolute left-4 top-4 flex size-11 items-center justify-center rounded-xl border border-foreground/25 font-ui-mono text-sm font-bold tabular-nums text-foreground shadow-[3px_3px_0_var(--color-foreground)] max-lg:static max-lg:size-auto max-lg:justify-start max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent max-lg:!font-sans max-lg:text-sm max-lg:font-semibold max-lg:text-muted-foreground max-lg:shadow-none ${accent}`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="absolute bottom-3 right-3 hidden max-lg:!hidden rounded-full border border-foreground/10 bg-paper/90 px-3 py-1.5 font-ui-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground shadow-card backdrop-blur-sm sm:inline-flex">
                      {courseCopy.duration}
                    </span>
                  </span>

                  <span className="grid min-w-0 grid-cols-1 gap-3 p-4 max-lg:p-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-5 sm:p-5 max-lg:sm:grid-cols-1 md:p-6">
                    {/* Below lg: title first, then one sentence-case meta
                        line (units, lessons, duration). From lg: the
                        reviewed mono meta above the title. */}
                    <span className="min-w-0 max-lg:flex max-lg:flex-col">
                      <span className="block font-ui-mono text-xs font-bold uppercase leading-relaxed tracking-[0.08em] text-kupfer-dark max-lg:order-2 max-lg:mt-0.5 max-lg:!font-sans max-lg:text-[0.8125rem] max-lg:font-normal max-lg:normal-case max-lg:leading-snug max-lg:tracking-normal max-lg:text-muted-foreground sm:tracking-[0.1em]">
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
                      <span className="mt-2 block text-lg font-bold tracking-[-0.025em] text-foreground transition-colors duration-150 group-hover:text-brand-orange group-focus-visible:text-brand-orange max-lg:order-1 max-lg:mt-0 max-lg:text-base max-lg:leading-snug max-lg:tracking-normal sm:text-xl">
                        {courseCopy.title}
                      </span>
                      <span className="mt-1.5 block max-w-xl text-sm leading-relaxed text-muted-foreground max-lg:hidden sm:mt-2">
                        {courseCopy.tagline}
                      </span>
                    </span>
                    <span className="hidden size-11 shrink-0 items-center justify-center self-end rounded-xl border border-foreground/15 bg-paper text-brand-cobalt shadow-card transition-[background-color,color,transform] duration-200 group-hover:translate-x-1 group-hover:bg-brand-cobalt group-hover:text-white group-focus-visible:translate-x-1 group-focus-visible:bg-brand-cobalt group-focus-visible:text-white motion-reduce:transform-none motion-reduce:transition-none max-lg:hidden sm:flex">
                      <ArrowRight aria-hidden="true" size={18} />
                    </span>
                  </span>
                  <ArrowGlyph className="mr-1 text-foreground lg:hidden" />
                </Link>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 grid gap-3 rounded-2xl border border-foreground/10 bg-brand-acid/65 p-4 shadow-card max-lg:mt-3 max-lg:grid-cols-[minmax(0,1fr)_auto] max-lg:items-center max-lg:gap-4 max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6 sm:py-5 max-lg:sm:p-0 lg:mt-7">
          <p className="text-sm leading-relaxed text-foreground max-lg:text-[0.8125rem] max-lg:leading-snug max-lg:text-muted-foreground">
            {copy.deeperSummary(TECHNICAL_COURSE_COUNT)}
          </p>
          <Link
            href={localizeHref("/kurse", locale)}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 justify-self-start border-b border-brand-orange font-ui-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange outline-none transition-[border-color,color] duration-150 hover:border-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background max-lg:border-b-0 max-lg:!font-sans max-lg:text-sm max-lg:font-semibold max-lg:normal-case max-lg:tracking-normal max-lg:text-foreground max-lg:underline max-lg:decoration-border max-lg:underline-offset-4 sm:justify-self-end"
          >
            {copy.viewAllCourses}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
