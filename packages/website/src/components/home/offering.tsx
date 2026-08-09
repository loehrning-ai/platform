import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Github } from "@/components/icons/brand";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { Card, IconTile } from "@/components/ui/card";
import { courseFacts, courseGroupFor } from "@/lib/courses/tracks";
import { iconByName } from "@/lib/courses/track-icon";
import {
  HOME_COPY,
  homeCourseBadges,
  homeCourseCopy,
} from "@/components/home/home-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

// The homepage splits along the declared classification: the four ordered
// spine courses carry the "Vier Kurse." section, and the Technikkurse band
// previews three of the six ported English courses. Real screenshots from
// public/imported-courses/screenshots, linking to each course's detail route.
const SPINE_HOME_COURSES = COURSE_CATALOG.filter(
  (course) => courseGroupFor(course.slug) !== "deeper",
);
const DEEPER_HOME_COURSES = COURSE_CATALOG.filter(
  (course) => courseGroupFor(course.slug) === "deeper",
);
const LAB_PREVIEWS = DEEPER_HOME_COURSES.flatMap((course) =>
  course.imageSrc && course.imageAlt && course.sourceHref
    ? [
        {
          slug: course.slug,
          href: course.href,
          title: course.title,
          imageSrc: course.imageSrc,
          imageAlt: course.imageAlt,
          sourceHref: course.sourceHref,
        },
      ]
    : [],
).slice(0, 3);

// The catalog carries German cover descriptions. English falls back to the
// localized course title rather than shipping the German string to an English
// reader, matching how the lab previews below handle their screenshots.
function courseCoverAlt(
  course: { readonly coverImageAlt?: string },
  localizedTitle: string,
  locale: Locale,
): string {
  if (locale === "de" && course.coverImageAlt) return course.coverImageAlt;
  return `Cover illustration for the ${localizedTitle} course`;
}

const META_LINE =
  "font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground";
const BADGE_CHIP =
  "inline-flex w-fit items-center rounded-none bg-card-hover px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground";

// Honest per-course badges (Deutsch · mit Teilnahmebestätigung / mit
// Lernnachweis), driven by COURSE_FACTS so the homepage matches /kurse instead
// of a hardcoded label.
function CourseBadges({ slug, locale }: { readonly slug: string; readonly locale: Locale }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {homeCourseBadges(locale, slug).map((badge) => (
        <span key={badge} className={BADGE_CHIP}>
          {badge}
        </span>
      ))}
    </span>
  );
}

export function Offering({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = HOME_COPY[locale].offering;
  const [featured, ...restCourses] = SPINE_HOME_COURSES;
  const featuredCopy = homeCourseCopy(locale, featured.slug);
  const featuredMeta = courseFacts(featured.slug);
  const FeaturedIcon = iconByName(featuredMeta.iconName);

  return (
    <section
      id="kurse"
      className="relative scroll-mt-24 bg-background py-20 md:py-24"
      data-testid="kurse-section"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div
          className="mb-12 h-px w-full bg-border"
        />

        <p className="overline mb-4">{copy.overline}</p>

        <h2
          className="font-bold leading-[0.95] tracking-[-0.04em] text-foreground"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
        >
          {copy.headline[0]}
          <br />
          <span className="text-muted-foreground">
            {copy.headline[1]}
          </span>
        </h2>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {copy.introduction}
        </p>

        <nav
          aria-label={copy.personaAria}
          data-testid="persona-filter"
          className="mt-8 flex flex-wrap gap-3"
        >
          <span className="self-center font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {copy.personaLabel}
          </span>
          {copy.personas.map((persona) => (
            <Link
              key={persona.href}
              href={localizeHref(persona.href, locale)}
              aria-label={copy.personaLinkAria(persona.label, persona.course)}
              className="rounded-lg border border-border bg-card px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground shadow-tile transition-[color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-orange/40 hover:text-foreground focus-visible:border-brand-orange/40 focus-visible:text-foreground"
            >
              {persona.label}
              <span aria-hidden="true"> →</span>
            </Link>
          ))}
        </nav>

        {/* Featured lead course: larger card, warm kupfer-mist fill, so the
            recommended starting point does not read as one of five equal boxes. */}
        <div className="mt-12">
          <Card
            href={localizeHref(featured.href, locale)}
            accent={featuredMeta.accent}
            className="bg-kupfer-mist"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="md:max-w-xl">
                <div className="flex items-center gap-4">
                  <IconTile
                    icon={FeaturedIcon}
                    accent={featuredMeta.accent}
                    size="lg"
                  />
                  <span className="inline-flex items-center rounded-none bg-brand-orange/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange">
                    {copy.recommended}
                  </span>
                </div>
                <span className="mt-4 block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  {featuredCopy.eyebrow}
                </span>
                <h3 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-[-0.025em] text-foreground group-hover:text-brand-orange sm:text-[1.75rem]">
                  <span>{featuredCopy.title}</span>
                  <ArrowRight
                    size={20}
                    className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand-orange"
                  />
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-foreground/80">
                  {featuredCopy.tagline}
                </p>
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
                  {featuredCopy.description}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 md:min-w-[200px]">
                {featured.coverImage ? (
                  <span className="relative block aspect-square w-full max-w-[200px] overflow-hidden rounded-lg border border-border bg-card-hover">
                    <Image
                      src={featured.coverImage}
                      alt={courseCoverAlt(featured, featuredCopy.title, locale)}
                      width={610}
                      height={610}
                      sizes="200px"
                      className="h-full w-full object-cover"
                    />
                  </span>
                ) : null}
                <CourseBadges slug={featured.slug} locale={locale} />
                {/* Mini Typenschild: the featured course's data plate. */}
                <div className="relative border border-border bg-background bg-dot-pattern p-4">
                  <span aria-hidden="true" className="absolute left-1.5 top-1.5 h-1 w-1 bg-foreground/25" />
                  <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-1 w-1 bg-foreground/25" />
                  <span aria-hidden="true" className="absolute bottom-1.5 left-1.5 h-1 w-1 bg-foreground/25" />
                  <span aria-hidden="true" className="absolute bottom-1.5 right-1.5 h-1 w-1 bg-foreground/25" />
                  <span
                    aria-hidden="true"
                    className="absolute right-3 top-2 font-mono text-[36px] font-bold leading-none text-brand-orange/15"
                  >
                    {String(featured.step).padStart(2, "0")}
                  </span>
                  <dl className="relative flex flex-col font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5">
                      <dt>{copy.duration}</dt>
                      <dd className="font-bold text-foreground">
                        {featuredCopy.duration}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5">
                      <dt>{featuredCopy.unitLabel}</dt>
                      <dd className="font-bold text-foreground">
                        {featured.unitCount}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <dt>{copy.lessons}</dt>
                      <dd className="font-bold text-foreground">
                        {featured.totalLessons}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* The remaining three courses: equal warm cards, each with its track
            icon tile and certificate badge. */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restCourses.map((course) => {
            const meta = courseFacts(course.slug);
            const courseCopy = homeCourseCopy(locale, course.slug);
            return (
              <div key={course.slug} className="h-full">
                <Card href={localizeHref(course.href, locale)} accent={meta.accent} className="h-full">
                  {course.coverImage ? (
                    <span className="relative -mx-6 -mt-6 mb-5 block aspect-[16/10] overflow-hidden rounded-t-xl border-b border-border bg-card-hover">
                      <Image
                        src={course.coverImage}
                        alt={courseCoverAlt(course, courseCopy.title, locale)}
                        width={610}
                        height={610}
                        sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </span>
                  ) : null}
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-border bg-background font-mono text-[15px] font-bold text-foreground shadow-tile"
                    >
                      {String(course.step).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <span className="block font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand-orange">
                        {courseCopy.eyebrow}
                      </span>
                      <h3 className="mt-1 flex items-center gap-1.5 text-lg font-bold tracking-[-0.02em] text-foreground group-hover:text-brand-orange">
                        <span>{courseCopy.title}</span>
                        <ArrowRight
                          size={15}
                          className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand-orange"
                        />
                      </h3>
                    </div>
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {courseCopy.tagline}
                  </p>
                  <div className="mt-5 flex flex-col gap-2">
                    <CourseBadges slug={course.slug} locale={locale} />
                    <span className={`flex flex-wrap gap-x-2 gap-y-1 ${META_LINE}`}>
                      <span>{courseCopy.duration}</span>
                      <span aria-hidden="true">·</span>
                      <span>{course.totalLessons} {copy.lessons}</span>
                    </span>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          {copy.deeperSummary(DEEPER_HOME_COURSES.length)}{" "}
          <Link
            href={localizeHref("/kurse", locale)}
            className="font-bold text-brand-orange underline-offset-4 hover:underline"
          >
            {copy.viewAllCourses} &#8594;
          </Link>
        </p>

        {/* Real-imagery band: GitHub-Labs previews. Sand tint to match the
            open-source track colour and break the cream monotony. */}
        <div className="mt-8 rounded-xl border border-border bg-brand-sand/10 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconTile icon={Github} accent="sand" />
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  {copy.technicalCourses}
                </p>
                <p className="text-sm text-muted-foreground">
                  {copy.technicalDescription}
                </p>
              </div>
            </div>
            <Link
              href={localizeHref("/kurse", locale)}
              className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-foreground underline-offset-4 hover:underline"
            >
              {copy.viewTechnicalCourses} &#8594;
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LAB_PREVIEWS.map((course) => (
              <div
                key={course.slug}
                className="group/lab overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover"
              >
                <Link
                  href={localizeHref(course.href, locale)}
                  className="block"
                  aria-label={copy.detailsAria(course.title)}
                >
                  <span className="relative block aspect-[16/10] overflow-hidden bg-card-hover">
                    <Image
                      src={course.imageSrc}
                      alt={locale === "de" ? course.imageAlt : `Screenshot of the ${course.title} course`}
                      width={640}
                      height={400}
                      sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover/lab:scale-[1.03]"
                    />
                  </span>
                </Link>
                <div className="flex items-start justify-between gap-2 p-4">
                  <div className="min-w-0">
                    <Link
                      href={localizeHref(course.href, locale)}
                      className="block truncate text-sm font-bold tracking-[-0.01em] text-foreground hover:text-brand-orange"
                    >
                      {course.title}
                    </Link>
                    <span className="mt-1 block font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground">
                      {copy.sourceFacts}
                    </span>
                  </div>
                  <a
                    href={course.sourceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={copy.sourceAria(course.title)}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
                  >
                    <Github size={17} strokeWidth={1.75} aria-hidden="true" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
