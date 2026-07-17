"use client";

import Link from "next/link";
import Image from "next/image";
import { m, useReducedMotion } from "framer-motion";
import { ArrowRight, Github } from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { PersonaCourseLinks } from "@/app/kurse/persona-filter";
import { Card, IconTile } from "@/components/ui/card";
import { trackMetaFor } from "@/lib/courses/tracks";
import { iconByName } from "@/lib/courses/track-icon";

// The three GitHub-Labs previews shown in the imagery band. Real screenshots
// from public/imported-courses/screenshots, linking through to each lab's
// detail route on the /kurse hub.
const LAB_PREVIEWS = IMPORTED_COURSE_CATALOG.slice(0, 3);

const META_LINE =
  "font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground";
const BADGE_CHIP =
  "inline-flex w-fit items-center rounded-full bg-card-hover px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground";

export function Offering() {
  const prefersReducedMotion = useReducedMotion();
  const reveal = (delay = 0) => ({
    initial: prefersReducedMotion ? false : { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.5, delay, ease: EASE_OUT_EXPO },
  });

  const [featured, ...restCourses] = COURSE_CATALOG;
  const featuredMeta = trackMetaFor(featured.slug);
  const FeaturedIcon = iconByName(featuredMeta.iconName);

  return (
    <section
      id="kurse"
      className="relative scroll-mt-24 bg-background py-20 md:py-24"
      data-testid="kurse-section"
    >
      <div className="mx-auto max-w-5xl px-6">
        <m.div
          className="mb-12 h-px w-full bg-border"
          initial={prefersReducedMotion ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          style={{ transformOrigin: "left" }}
        />

        <m.p
          className="overline mb-4"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          Die Kurse
        </m.p>

        <m.h2
          className="font-bold leading-[0.95] tracking-[-0.04em] text-foreground"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
        >
          Vier Kurse.
          <br />
          <span className="text-muted-foreground">
            Vom ersten Prompt bis zum EU-Gesetz.
          </span>
        </m.h2>

        <m.p
          className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          Fang beim KI-Führerschein an und arbeite dich vor. Jeder Kurs ist
          kostenlos, ohne Konto nutzbar und komplett auf Deutsch.
        </m.p>

        <PersonaCourseLinks />

        {/* Featured lead course: larger card, warm kupfer-mist fill, so the
            recommended starting point does not read as one of five equal boxes. */}
        <m.div {...reveal()} className="mt-12">
          <Card
            href={featured.href}
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
                  <span className="inline-flex items-center rounded-full bg-brand-orange/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange">
                    Empfohlener Start
                  </span>
                </div>
                <span className="mt-4 block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  {featured.eyebrow}
                </span>
                <h3 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-[-0.025em] text-foreground group-hover:text-brand-orange sm:text-[1.75rem]">
                  <span>{featured.title}</span>
                  <ArrowRight
                    size={20}
                    className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand-orange"
                  />
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-foreground/80">
                  {featured.tagline}
                </p>
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
                  {featured.description}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 border-t border-border pt-5 md:min-w-[180px] md:border-l md:border-t-0 md:pl-6 md:pt-0">
                <span className={BADGE_CHIP}>{featuredMeta.badge}</span>
                <dl className="flex flex-col gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <dt>Dauer</dt>
                    <dd className="font-bold text-foreground">
                      {featured.duration}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>{featured.unitLabel}</dt>
                    <dd className="font-bold text-foreground">
                      {featured.unitCount}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Lektionen</dt>
                    <dd className="font-bold text-foreground">
                      {featured.totalLessons}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </Card>
        </m.div>

        {/* The remaining three courses: equal warm cards, each with its track
            icon tile and certificate badge. */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restCourses.map((course, i) => {
            const meta = trackMetaFor(course.slug);
            const Icon = iconByName(meta.iconName);
            return (
              <m.div key={course.slug} {...reveal(i * 0.06)} className="h-full">
                <Card href={course.href} accent={meta.accent} className="h-full">
                  <div className="flex items-start gap-4">
                    <IconTile icon={Icon} accent={meta.accent} />
                    <div className="min-w-0">
                      <span className="block font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand-orange">
                        {course.eyebrow}
                      </span>
                      <h3 className="mt-1 flex items-center gap-1.5 text-lg font-bold tracking-[-0.02em] text-foreground group-hover:text-brand-orange">
                        <span>{course.title}</span>
                        <ArrowRight
                          size={15}
                          className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand-orange"
                        />
                      </h3>
                    </div>
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {course.tagline}
                  </p>
                  <div className="mt-5 flex flex-col gap-2">
                    <span className={BADGE_CHIP}>{meta.badge}</span>
                    <span className={`flex flex-wrap gap-x-2 gap-y-1 ${META_LINE}`}>
                      <span>{course.duration}</span>
                      <span aria-hidden="true">·</span>
                      <span>{course.totalLessons} Lektionen</span>
                    </span>
                  </div>
                </Card>
              </m.div>
            );
          })}
        </div>

        <m.p
          className="mt-5 text-sm leading-relaxed text-muted-foreground"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          Dazu {IMPORTED_COURSE_CATALOG.length} technische Labore auf Englisch,
          von Data Engineering bis System Design.{" "}
          <Link
            href="/kurse"
            className="font-bold text-brand-orange underline-offset-4 hover:underline"
          >
            Alle Kurse ansehen &#8594;
          </Link>
        </m.p>

        {/* Real-imagery band: GitHub-Labs previews. Sand tint to match the
            open-source track colour and break the cream monotony. */}
        <m.div
          {...reveal()}
          className="mt-8 rounded-xl border border-border bg-brand-sand/10 p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconTile icon={Github} accent="sand" />
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-sand">
                  GitHub-Labs
                </p>
                <p className="text-sm text-muted-foreground">
                  Technische Browserkurse, quelloffen auf GitHub.
                </p>
              </div>
            </div>
            <Link
              href="/kurse"
              className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-foreground underline-offset-4 hover:underline"
            >
              Alle Labs ansehen &#8594;
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LAB_PREVIEWS.map((course) => (
              <div
                key={course.slug}
                className="group/lab overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover"
              >
                <Link
                  href={course.href}
                  className="block"
                  aria-label={`${course.title}: Details ansehen`}
                >
                  <span className="relative block aspect-[16/10] overflow-hidden bg-card-hover">
                    <Image
                      src={course.imageSrc}
                      alt={course.imageAlt}
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
                      href={course.href}
                      className="block truncate text-sm font-bold tracking-[-0.01em] text-foreground hover:text-brand-orange"
                    >
                      {course.title}
                    </Link>
                    <span className="mt-1 block font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground">
                      GitHub · MIT · Englisch · extern
                    </span>
                  </div>
                  <a
                    href={course.sourceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Quellcode auf GitHub: ${course.title}`}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
                  >
                    <Github size={17} strokeWidth={1.75} aria-hidden="true" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </m.div>
      </div>
    </section>
  );
}
