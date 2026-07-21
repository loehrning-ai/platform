import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DEF_CHAPTERS } from "@/lib/data-engineering-fundamentals/types";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import type { JsonLdGraph } from "@/lib/seo/json-ld";

// ─── Data Engineering Fundamentals native landing page (plan 011 stage 10) ─
// Converts the source's hero/pipeline-flow into the platform's course-landing
// pattern (following data-infrastructure's plan 010 stage 11 precedent):
// Tailwind chrome for this marketing page, while the chapter readers
// themselves (under /[chapterId]) use the ported de-course.css design
// system for full source fidelity.

export const metadata: Metadata = {
  title: "Data Engineering Fundamentals: production-ready pipelines, source to serving",
  description:
    "A 12-chapter, deeply interactive crash course on data engineering: storage internals, streaming, orchestration, data quality, discovery, governance — with 17 live simulators and a sabotage-able capstone.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/kurse/open-source/data-engineering-fundamentals` },
  openGraph: {
    title: "Data Engineering Fundamentals: production-ready pipelines, source to serving",
    description: "Twelve chapters, 17 live simulators, and a capstone you can break to see exactly what fails.",
    url: `${SITE_URL}/kurse/open-source/data-engineering-fundamentals`,
    siteName: "loehrning.ai",
    locale: "en_US",
    type: "website",
  },
};

export default function DataEngineeringFundamentalsLandingPage() {
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
            name: "Data Engineering Fundamentals",
            item: `${SITE_URL}/kurse/open-source/data-engineering-fundamentals`,
          },
        ],
      },
      {
        "@type": "Course",
        name: "Data Engineering Fundamentals",
        description:
          "The system, not the tools: storage & formats, ingest, streaming, storage patterns, compute, orchestration, quality, discovery, serving, and governance — built around interactive simulators of every concept usually drawn on a whiteboard.",
        url: `${SITE_URL}/kurse/open-source/data-engineering-fundamentals`,
        inLanguage: "en",
        isAccessibleForFree: true,
        provider: { "@id": ORG_ID },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          url: `${SITE_URL}/kurse/open-source/data-engineering-fundamentals/home`,
        },
        teaches: DEF_CHAPTERS.filter((c) => c.id !== "home").map((c) => c.title),
      },
    ],
  };

  return (
    <>
      <JsonLd data={courseJsonLd} id="data-engineering-fundamentals-course-jsonld" />
      <section className="mx-auto max-w-[1100px] px-6 pb-20 pt-20">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">data-engineering / fundamentals</p>
        <h1 className="mt-6 max-w-[900px] text-[44px] font-bold leading-[0.98] tracking-[-0.04em] text-foreground sm:text-[60px] md:text-[76px]">
          Think like a data engineer by lunch.
        </h1>
        <p className="mt-7 max-w-[680px] text-[18px] leading-[1.6] text-muted-foreground">
          The system, not the tools. Storage &amp; formats, ingest, streaming, storage patterns, compute, orchestration, data quality, discovery,
          serving, and governance — no slides, no toy code. By the end, you&apos;ll know where a pipeline fails before it does.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/kurse/open-source/data-engineering-fundamentals/home"
            className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)]"
          >
            $ start the course
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link
            href="#chapters"
            className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-foreground shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-card"
          >
            Browse the chapters
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {["12 chapters", "17 live simulators", "~90 min", "no signup"].map((chip) => (
            <span
              key={chip}
              className="border border-foreground bg-background px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-foreground"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { n: "12", l: "chapters" },
            { n: "17", l: "live simulators" },
            { n: "1", l: "sabotage-able capstone" },
            { n: "0", l: "signup required" },
          ].map((stat) => (
            <div key={stat.l} className="border-2 border-border bg-card p-4 text-center">
              <p className="font-mono text-[26px] font-bold text-foreground">{stat.n}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{stat.l}</p>
            </div>
          ))}
        </div>

        <section id="chapters" className="mt-20 scroll-mt-24">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">the course</p>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-foreground sm:text-[34px]">
            One pipeline. Twelve chapters. A capstone you can break.
          </h2>
          <p className="mt-3 max-w-[600px] text-[15px] leading-relaxed text-muted-foreground">
            Linear the first time — each chapter assumes the last. The capstone (chapter 10) stitches all six contracts together and lets you
            sabotage any one to watch exactly what fails downstream.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DEF_CHAPTERS.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/kurse/open-source/data-engineering-fundamentals/${c.id}`}
                  className="block h-full border-2 border-border bg-card p-4 transition-colors hover:border-brand-orange"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-orange">chapter {c.displayNumber}</p>
                  <h3 className="mt-1 text-[15px] font-semibold text-foreground">{c.title}</h3>
                  <p className="mt-1 text-[12.5px] leading-[1.4] text-muted-foreground">{c.subtitle}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-16 border-2 border-foreground bg-card p-8 text-center shadow-[6px_6px_0_var(--color-foreground)]">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">start now</p>
          <h2 className="mt-2 text-[26px] font-bold text-foreground sm:text-[32px]">Open the overview.</h2>
          <p className="mx-auto mt-3 max-w-[440px] text-[14px] leading-relaxed text-muted-foreground">
            The pipeline, end to end, in three minutes. Then the rest of the course is just zooming in.
          </p>
          <Link
            href="/kurse/open-source/data-engineering-fundamentals/home"
            className="mt-6 inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)]"
          >
            $ start
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
