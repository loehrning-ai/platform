import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllDataInfraLessons } from "@/lib/data-infrastructure/data";
import { DATA_INFRA_TRACKS } from "@/lib/data-infrastructure/types";
import { DataInfraProgressBand } from "@/components/data-infrastructure/data-infra-progress-band";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import type { JsonLdGraph } from "@/lib/seo/json-ld";

/**
 * Data Infrastructure native landing page, converting
 * the source's hero/stack-diagram/track-grid/stats-band into the platform's
 * course-landing patterns, following `/ai-native`'s precedent of a live,
 * client-rendered progress readout embedded in an otherwise server-rendered
 * page. Once `catalog.ts`'s entry flips to `nativeStatus: "live"` (stage 13),
 * this static route replaces the generic external-course template.
 */

const STACK_ROWS = [
  { n: "01", name: "source", head: "Where data is born.", body: "App backends, mobile clients, IoT sensors, third-party APIs. Every event has a creator.", tools: ["Postgres", "iOS SDK", "Stripe"] },
  { n: "02", name: "log", head: "The append-only spine.", body: "An ordered, durable, partitioned log. Decouples producers from consumers.", tools: ["Kafka", "Kinesis", "Pub/Sub"] },
  { n: "03", name: "process", head: "Where shape changes.", body: "Stream jobs filter, enrich, window, aggregate. Batch jobs do the same, on bounded data.", tools: ["Flink", "Spark", "dbt"] },
  { n: "04", name: "store", head: "Bytes that survive.", body: "Object storage holds the raw. Open table formats give it ACID. Indexes give it speed.", tools: ["S3", "Iceberg", "Parquet"] },
  { n: "05", name: "serve", head: "Sub-second answers.", body: "OLAP engines for BI, vector stores for ML, key-value stores for online features.", tools: ["Snowflake", "Trino", "DynamoDB"] },
  { n: "06", name: "consume", head: "The whole point.", body: "Dashboards, ML features, billing, fraud, the recommender.", tools: ["Looker", "Feature store", "API"] },
] as const;

export const metadata: Metadata = {
  title: "Data Infrastructure: an IC5 system-design field guide",
  description:
    "A 12-lesson, deeply interactive guide to data engineering system design at the IC5/staff level. Storage, streaming, lakehouses, observability, and a live interview replay.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/kurse/open-source/data-infrastructure` },
  openGraph: {
    title: "Data Infrastructure: an IC5 system-design field guide",
    description:
      "Twelve lessons across four tracks, 40+ live simulators, and a full IC5 mock-interview replay.",
    url: `${SITE_URL}/kurse/open-source/data-infrastructure`,
    siteName: "loehrning.ai",
    locale: "en_US",
    type: "website",
  },
};

export default async function DataInfrastructureLandingPage() {
  const lessons = await getAllDataInfraLessons();

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
            name: "Data Infrastructure",
            item: `${SITE_URL}/kurse/open-source/data-infrastructure`,
          },
        ],
      },
      {
        "@type": "Course",
        name: "Data Infrastructure",
        description:
          "A field guide to the data stack at IC5/staff system-design depth: storage internals, streaming semantics, lakehouse formats, and operational craft.",
        url: `${SITE_URL}/kurse/open-source/data-infrastructure`,
        inLanguage: "en",
        isAccessibleForFree: true,
        provider: { "@id": ORG_ID },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          url: `${SITE_URL}/kurse/open-source/data-infrastructure/kurs`,
        },
        teaches: DATA_INFRA_TRACKS.map((t) => t.title),
      },
    ],
  };

  return (
    <>
      <JsonLd data={courseJsonLd} id="data-infrastructure-course-jsonld" />
      <section className="mx-auto max-w-[1100px] px-6 pb-20 pt-20">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          data-infra / field-guide
        </p>
        <h1 className="mt-6 max-w-[900px] text-[44px] font-bold leading-[0.98] tracking-[-0.04em] text-foreground sm:text-[60px] md:text-[76px]">
          Data infrastructure, at system-design depth.
        </h1>
        <p className="mt-7 max-w-[680px] text-[18px] leading-[1.6] text-muted-foreground">
          A field guide to the data stack at the level of an IC5 / staff system-design interview. Storage
          internals, streaming semantics, lakehouse table formats, and the operational craft, built around
          interactive simulators of every concept that&apos;s usually drawn on a whiteboard.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/kurse/open-source/data-infrastructure/kurs/mental-model"
            className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)]"
          >
            $ start lesson 01
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link
            href="#tracks"
            className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-foreground shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-card"
          >
            Browse the course
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {["12 lessons", "40+ live simulations", "~3h total", "1 mock interview at the end"].map((chip) => (
            <span
              key={chip}
              className="border border-foreground bg-background px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-foreground"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-9 border border-border bg-card shadow-md">
          <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2.5 font-mono text-[12px] text-muted-foreground">
            <span className="inline-flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#e07856]" />
              <span className="h-2 w-2 rounded-full bg-[#e0c356]" />
              <span className="h-2 w-2 rounded-full bg-[#63b380]" />
            </span>
            <span>the data stack · top → bottom</span>
            <span className="ml-auto opacity-70">stack.svg</span>
          </div>
          <div className="grid gap-3 p-4">
            {STACK_ROWS.map((row) => (
              <div key={row.n} className="grid gap-3 border border-border bg-background p-3.5 sm:grid-cols-[100px_1fr_auto]">
                <div>
                  <span className="block font-mono text-[22px] leading-none tracking-[-0.03em] text-foreground">{row.n}</span>
                  <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {row.name}
                  </span>
                </div>
                <div>
                  <h4 className="font-mono text-[14px] font-semibold text-foreground">{row.head}</h4>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{row.body}</p>
                </div>
                <div className="flex flex-wrap content-start items-start gap-1.5 sm:justify-end">
                  {row.tools.map((t) => (
                    <span key={t} className="whitespace-nowrap rounded-full border border-border bg-card px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { n: "12", l: "lessons" },
            { n: "40+", l: "live simulations" },
            { n: "4", l: "tracks" },
            { n: "IC5", l: "target depth" },
          ].map((stat) => (
            <div key={stat.l} className="border-2 border-border bg-card p-4 text-center">
              <p className="font-mono text-[26px] font-bold text-foreground">{stat.n}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{stat.l}</p>
            </div>
          ))}
        </div>

        <section id="tracks" className="mt-20 scroll-mt-24">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">the course</p>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-foreground sm:text-[34px]">
            Four tracks. Twelve lessons. One mock interview.
          </h2>
          <p className="mt-3 max-w-[600px] text-[15px] leading-relaxed text-muted-foreground">
            Linear the first time, each lesson assumes the last. The capstone (lesson 12) is a 45-minute IC5
            system-design walkthrough you can step through one move at a time.
          </p>

          <div className="mt-8 flex flex-col gap-8">
            {DATA_INFRA_TRACKS.map((track) => {
              const trackLessons = lessons.filter((l) => l.trackId === track.id);
              return (
                <div key={track.id}>
                  <h3 className="text-[18px] font-bold text-foreground">{track.title}</h3>
                  <p className="text-[13px] text-muted-foreground">{track.hint}</p>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {trackLessons.map((lesson) => (
                      <li key={lesson.id}>
                        <Link
                          href={`/kurse/open-source/data-infrastructure/kurs/${lesson.id}`}
                          className="block h-full border-2 border-border bg-card p-4 transition-colors hover:border-brand-orange"
                        >
                          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-orange">
                            lesson {String(lesson.number).padStart(2, "0")}
                          </p>
                          <h4 className="mt-1 text-[15px] font-semibold text-foreground">{lesson.title}</h4>
                          <p className="mt-1 text-[12.5px] leading-[1.4] text-muted-foreground">{lesson.hook}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-20">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">/ progress</p>
          <h2 className="mt-2 text-[24px] font-bold tracking-[-0.02em] text-foreground">
            Live progress, saved to your account.
          </h2>
          <div className="mt-6">
            <DataInfraProgressBand lessons={lessons.map((l) => ({ id: l.id, trackId: l.trackId }))} />
          </div>
        </section>

        <div className="mt-16 border-2 border-foreground bg-card p-8 text-center shadow-[6px_6px_0_var(--color-foreground)]">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">start now</p>
          <h2 className="mt-2 text-[26px] font-bold text-foreground sm:text-[32px]">Open lesson 01.</h2>
          <p className="mx-auto mt-3 max-w-[440px] text-[14px] leading-relaxed text-muted-foreground">
            The stack, top to bottom, in twelve minutes. Then the rest of the course is just zooming in.
          </p>
          <Link
            href="/kurse/open-source/data-infrastructure/kurs/mental-model"
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
