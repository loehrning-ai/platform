import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DsReaderShell } from "@/components/data-science/reader-shell";
import { getDsChapterComponent } from "@/lib/data-science/chapters";
import { DS_CHAPTERS, getDsChapterMeta } from "@/lib/data-science/types";
import { dsChapterHref } from "@/lib/data-science/routes";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import type { JsonLdGraph } from "@/lib/seo/json-ld";

// ─── Data Science course root — the ported Overview chapter (plan 012 stage 5) ─
//
// Unlike a from-scratch marketing landing page, this course's "landing
// page" IS the source's own Overview chapter (id "home", App.js's own
// default screen): source has no distinct marketing splash separate from
// it. Rendered inside the same DsReaderShell chrome as every numbered
// chapter (Done Criteria: no home route collision with [chapterSlug]).

export const metadata: Metadata = {
  title: "Data Science Fundamentals · Interactive Course",
  description:
    "Twelve interactive chapters covering the full data science loop — from EDA and feature engineering to A/B testing, causal inference, and production deployment. Every chapter opens with a live simulation.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/kurse/open-source/data-science` },
  openGraph: {
    title: "Data Science Fundamentals · Interactive Course",
    description:
      "Twelve interactive chapters covering the full data science loop — from EDA and feature engineering to A/B testing, causal inference, and production deployment.",
    url: `${SITE_URL}/kurse/open-source/data-science`,
    siteName: "loehrning.ai",
    locale: "en_US",
    type: "website",
  },
};

export default async function DataScienceOverviewPage() {
  const meta = getDsChapterMeta("home");
  const ChapterComponent = await getDsChapterComponent("home");
  if (!ChapterComponent) notFound();

  const next = DS_CHAPTERS[1];

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
            name: "Data Science Fundamentals",
            item: `${SITE_URL}/kurse/open-source/data-science`,
          },
        ],
      },
      {
        "@type": "Course",
        name: "Data Science Fundamentals",
        description:
          "Twelve interactive chapters covering the full data science loop — EDA, feature engineering, statistical thinking, CLT, bias/variance, ROC/PR, SHAP, A/B test power, causal DAGs, drift, production deployment, and a capstone.",
        url: `${SITE_URL}/kurse/open-source/data-science`,
        inLanguage: "en",
        isAccessibleForFree: true,
        provider: { "@id": ORG_ID },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          url: `${SITE_URL}/kurse/open-source/data-science`,
        },
        teaches: DS_CHAPTERS.filter((c) => c.id !== "home").map((c) => c.title),
      },
    ],
  };

  return (
    <DsReaderShell activeId="home">
      <JsonLd data={courseJsonLd} id="data-science-course-jsonld" />
      <div className="content">
        <ChapterComponent chapter={meta} />
        <nav className="tb" aria-label="Chapter pagination" style={{ marginTop: 48 }}>
          <span />
          {next && (
            <Link className="btn btn-primary" href={dsChapterHref(next.id)}>
              Next → <span className="kbd">→</span>
            </Link>
          )}
        </nav>
      </div>
    </DsReaderShell>
  );
}
