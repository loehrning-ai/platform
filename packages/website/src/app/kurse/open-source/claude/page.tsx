import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroOrrery } from "@/components/imported-courses/claude/hero-orrery";
import { HeroTransform } from "@/components/imported-courses/claude/hero-transform";
import { getAllClaudeLessons } from "@/lib/claude-course/data";
import { CLAUDE_TRACKS } from "@/lib/claude-course/types";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import type { JsonLdGraph } from "@/lib/seo/json-ld";

/**
 * Claude Course native landing page. Once
 * `catalog.ts`'s claude entry flips to `nativeStatus: "live"` (stage 10),
 * this static route replaces the generic external-course template for
 * `/kurse/open-source/claude` (Next.js resolves the static segment ahead of
 * the `[slug]` dynamic one regardless of catalog data).
 */

export const metadata: Metadata = {
  title: "Claude Course: prompt like you mean it",
  description:
    "Twelve hands-on lessons on prompting Claude effectively: prompt anatomy, context engineering, CLAUDE.md, agents and tool use, code review, grounding, evals, and safety.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/kurse/open-source/claude` },
  openGraph: {
    title: "Claude Course: prompt like you mean it",
    description:
      "Twelve hands-on lessons on prompting Claude effectively. Every lesson has an interactive widget.",
    url: `${SITE_URL}/kurse/open-source/claude`,
    siteName: "loehrning.ai",
    locale: "en_US",
    type: "website",
  },
};

export default async function ClaudeCourseLandingPage() {
  const lessons = await getAllClaudeLessons();

  const courseJsonLd: JsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Kurse", item: `${SITE_URL}/kurse` },
          {
            "@type": "ListItem",
            position: 3,
            name: "Claude Course",
            item: `${SITE_URL}/kurse/open-source/claude`,
          },
        ],
      },
      {
        "@type": "Course",
        name: "Claude Course",
        description:
          "Twelve hands-on lessons on prompting Claude effectively, across four tracks.",
        url: `${SITE_URL}/kurse/open-source/claude`,
        inLanguage: "en",
        isAccessibleForFree: true,
        provider: { "@id": ORG_ID },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          url: `${SITE_URL}/kurse/open-source/claude/kurs`,
        },
        teaches: CLAUDE_TRACKS.map((t) => t.label),
      },
    ],
  };

  return (
    <>
      <JsonLd data={courseJsonLd} id="claude-course-jsonld" />
      <section className="mx-auto max-w-[1100px] px-6 pb-20 pt-20">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          the claude best-practices course
        </p>
        <h1 className="mt-6 max-w-[900px] text-[44px] font-bold leading-[0.98] tracking-[-0.04em] text-foreground sm:text-[60px] md:text-[76px]">
          Prompt like you mean it.
        </h1>
        <p className="mt-7 max-w-[680px] text-[18px] leading-[1.6] text-muted-foreground">
          The difference between people who love Claude and people who bounce off it isn&apos;t
          talent, it&apos;s a handful of habits. Twelve lessons. Every one hands-on, with
          interactive widgets from the first click.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/kurse/open-source/claude/kurs/mental-model"
            className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)]"
          >
            Start lesson 01
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link
            href="#lessons"
            className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-foreground shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-card"
          >
            Jump to course map
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {["12 lessons", "~2 hours", "fully interactive", "hands-on widget in every lesson"].map(
            (chip) => (
              <span
                key={chip}
                className="border border-foreground bg-background px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-foreground"
              >
                {chip}
              </span>
            ),
          )}
        </div>

        <div className="mt-16">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            the orrery
          </p>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Toggle the parts. Watch the quality shift. Run it live.
          </p>
          <div className="mt-6">
            <HeroOrrery />
          </div>
          <div className="mt-8">
            <HeroTransform />
          </div>
        </div>

        <section id="lessons" className="mt-20 scroll-mt-24">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            the course
          </p>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-foreground sm:text-[34px]">
            Four tracks. Twelve lessons. One arc.
          </h2>
          <p className="mt-3 max-w-[600px] text-[15px] leading-relaxed text-muted-foreground">
            Start with the mental model. End with a team that ships better work, faster.
            Everything in between is practice.
          </p>

          <div className="mt-8 flex flex-col gap-8">
            {CLAUDE_TRACKS.map((track) => {
              const trackLessons = lessons.filter((l) => l.trackId === track.id);
              return (
                <div key={track.id}>
                  <h3 className="text-[18px] font-bold text-foreground">{track.label}</h3>
                  <p className="text-[13px] text-muted-foreground">{track.hint}</p>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {trackLessons.map((lesson) => (
                      <li key={lesson.id}>
                        <Link
                          href={`/kurse/open-source/claude/kurs/${lesson.id}`}
                          className="block h-full border-2 border-border bg-card p-4 transition-colors hover:border-brand-orange"
                        >
                          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-orange">
                            lesson {lesson.number}
                          </p>
                          <h4 className="mt-1 text-[15px] font-semibold text-foreground">
                            {lesson.title}
                          </h4>
                          <p className="mt-1 text-[12.5px] leading-[1.4] text-muted-foreground">
                            {lesson.subtitle}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-16 border-2 border-foreground bg-card p-8 text-center shadow-[6px_6px_0_var(--color-foreground)]">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            start now
          </p>
          <h2 className="mt-2 text-[26px] font-bold text-foreground sm:text-[32px]">
            Ready for lesson 01?
          </h2>
          <p className="mx-auto mt-3 max-w-[440px] text-[14px] leading-relaxed text-muted-foreground">
            Eight minutes. A handful of interactives. The only lesson where you&apos;re allowed to
            be wrong about what Claude actually is.
          </p>
          <Link
            href="/kurse/open-source/claude/kurs/mental-model"
            className="mt-6 inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)]"
          >
            Begin
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
