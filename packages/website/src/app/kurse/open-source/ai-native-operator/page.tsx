import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseProgressBar } from "@/components/ai-native-operator/course-progress-bar";
import { COURSE_META, MODULE_IDS, TOTAL_LESSON_COUNT, orderedModuleMetas } from "@/lib/ai-native-operator/types";
import { lessonHref, moduleHref } from "@/lib/ai-native-operator/routes";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import type { JsonLdGraph } from "@/lib/seo/json-ld";

/**
 * AI-Native Operator course native landing page. Once
 * `catalog.ts`'s ai-native-operator entry flips to `nativeStatus: "live"`
 * (stage 12), this static route replaces the generic external-course
 * template for `/kurse/open-source/ai-native-operator` (Next.js resolves
 * the static segment ahead of the `[slug]` dynamic one regardless of
 * catalog data, matching claude/codex's own precedent).
 */

const TOTAL_EXERCISE_COUNT = 30;

export const metadata: Metadata = {
  title: "The AI-Native Operator: Course",
  description:
    "A 9-module course for individuals, leaders, and executives who intend to compete in 2026 and beyond. Mindset, engineering practice, product building, operations, talent, org structure, data, governance, and measurement.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/kurse/open-source/ai-native-operator` },
  openGraph: {
    title: "The AI-Native Operator: Course",
    description:
      "39 lessons across 9 modules. 30 hands-on exercises. Diagnose your AI maturity, redesign your team, and build the governance that lets you go faster.",
    url: `${SITE_URL}/kurse/open-source/ai-native-operator`,
    siteName: "loehrning.ai",
    locale: "en_US",
    type: "website",
  },
};

export default function AiNativeOperatorLandingPage() {
  const modules = orderedModuleMetas();
  const firstModuleId = MODULE_IDS[0];

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
            name: "The AI-Native Operator",
            item: `${SITE_URL}/kurse/open-source/ai-native-operator`,
          },
        ],
      },
      {
        "@type": "Course",
        name: COURSE_META.title,
        description: COURSE_META.subtitle,
        url: `${SITE_URL}/kurse/open-source/ai-native-operator`,
        inLanguage: "en",
        isAccessibleForFree: true,
        provider: { "@id": ORG_ID },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          url: `${SITE_URL}/kurse/open-source/ai-native-operator`,
        },
        teaches: modules.map((m) => m.name),
      },
    ],
  };

  return (
    <>
      <JsonLd data={courseJsonLd} id="ai-native-operator-course-jsonld" />
      <section className="mx-auto max-w-[1100px] px-6 pb-20 pt-20">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          the ai operating model course
        </p>
        <h1 className="mt-6 max-w-[900px] text-[44px] font-bold leading-[0.98] tracking-[-0.04em] text-foreground sm:text-[60px] md:text-[76px]">
          The AI-Native
          <br />
          Operator.
        </h1>
        <p className="mt-7 max-w-[680px] text-[18px] leading-[1.6] text-muted-foreground">
          {COURSE_META.subtitle}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={lessonHref(firstModuleId, 1)}
            className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)]"
          >
            Begin Module 01
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link
            href="#syllabus"
            className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-foreground shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-card"
          >
            Jump to syllabus
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[`${modules.length} modules`, `${TOTAL_LESSON_COUNT} lessons`, `${TOTAL_EXERCISE_COUNT} exercises`, COURSE_META.duration.replace("~14 hours of reading + 30 exercises", "~14h")].map(
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

        <div className="mt-8 max-w-[420px]">
          <CourseProgressBar />
        </div>

        <div className="mt-16">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            what you will be able to do
          </p>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-foreground sm:text-[34px]">
            Outcomes
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {COURSE_META.outcomes.map((outcome, i) => (
              <div key={outcome} className="flex gap-4">
                <span className="font-mono text-[13px] font-bold text-brand-orange">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[15px] leading-[1.5] text-foreground">{outcome}</p>
              </div>
            ))}
          </div>
        </div>

        <section id="syllabus" className="mt-20 scroll-mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              syllabus
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              9 modules · linear or self-directed
            </p>
          </div>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-foreground sm:text-[34px]">
            Nine modules. Thirty-nine lessons.
          </h2>

          <div className="mt-8 flex flex-col divide-y divide-border border-t border-border">
            {modules.map((m) => (
              <Link
                key={m.id}
                href={moduleHref(m.id)}
                className="group flex items-center gap-5 py-5 transition-colors hover:bg-card"
              >
                <div className="w-14 shrink-0 font-mono text-[13px] font-bold text-brand-orange">
                  {m.code}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[17px] font-semibold text-foreground">{m.name}</h3>
                  <p className="mt-0.5 text-[13.5px] leading-[1.4] text-muted-foreground">
                    {m.tagline}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                    <span>{m.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span>{m.lessonCount} lessons</span>
                    <span aria-hidden="true">·</span>
                    <span>{m.duration}</span>
                  </div>
                </div>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-16 border-2 border-foreground bg-card p-8 text-center shadow-[6px_6px_0_var(--color-foreground)]">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            start now
          </p>
          <h2 className="mt-2 text-[26px] font-bold text-foreground sm:text-[32px]">
            Ready for Module 01?
          </h2>
          <p className="mx-auto mt-3 max-w-[440px] text-[14px] leading-relaxed text-muted-foreground">
            Mindset & Culture. Fourteen minutes for the first lesson, and a reflection exercise
            to calibrate where you honestly stand.
          </p>
          <Link
            href={lessonHref(firstModuleId, 1)}
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
