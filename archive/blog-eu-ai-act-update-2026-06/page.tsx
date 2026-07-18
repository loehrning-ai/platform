// HUMAN-AUTHORED ONLY — do not generate with an LLM. Tim reviews before this stage is marked complete.

import type { Metadata } from "next";
import { ReadingProgress } from "../_components/reading-progress";
import { JsonLd, ORG_ID, PERSON_ID, SITE_URL } from "@/lib/seo/json-ld";
import { BLOG_POSTS } from "@/lib/blog-metadata";
import { EnforcementStart } from "./_sections/enforcement-start";
import { WasBedeutetDasFuerDich } from "./_sections/was-bedeutet-das-fuer-dich";

// Pull dates from the canonical manifest so they never drift
const POST_META = BLOG_POSTS.find((p) => p.slug === "eu-ai-act-update-2026-06");
const DATE_PUBLISHED = POST_META?.datePublished ?? "2026-06-22";
const DATE_MODIFIED = POST_META?.dateModified ?? "2026-06-22";

export const metadata: Metadata = {
  title: "EU AI Act Update Juni 2026: was ab 2. August gilt",
  description:
    "Ab 2. August 2026 gelten weitere Teile des EU AI Act, darunter Artikel 50. Der Hochrisiko-Zeitplan folgt später.",
  alternates: { canonical: "/blog/eu-ai-act-update-2026-06" },
  openGraph: {
    title: "EU AI Act Update Juni 2026: was ab 2. August gilt",
    description:
      "Ab 2. August 2026: Artikel-50-Transparenzpflichten, Aufsicht und der geänderte Hochrisiko-Zeitplan.",
    url: `${SITE_URL}/blog/eu-ai-act-update-2026-06`,
    type: "article",
    publishedTime: DATE_PUBLISHED,
    modifiedTime: DATE_MODIFIED,
  },
};

const POST_GRAPH = {
  "@context": "https://schema.org" as const,
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        {
          "@type": "ListItem",
          position: 3,
          name: "EU AI Act Update Juni 2026",
          item: `${SITE_URL}/blog/eu-ai-act-update-2026-06`,
        },
      ],
    },
    {
      "@type": "BlogPosting",
      headline: "EU AI Act Update Juni 2026: was ab 2. August gilt",
      description:
        "Ab dem 2. August 2026 gelten weitere Teile des EU AI Act, darunter Artikel 50. Der Hochrisiko-Zeitplan folgt später.",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${SITE_URL}/blog/eu-ai-act-update-2026-06`,
      },
      url: `${SITE_URL}/blog/eu-ai-act-update-2026-06`,
      author: { "@id": PERSON_ID },
      publisher: { "@id": ORG_ID },
      datePublished: DATE_PUBLISHED,
      dateModified: DATE_MODIFIED,
      inLanguage: "de-DE",
      keywords: ["EU AI Act", "August 2026", "Artikel 50", "Wasserzeichen", "Marktaufsicht", "Transparenz"],
      articleSection: "Monatliches EU-AI-Act-Update",
      wordCount: 900,
    },
  ],
};

export default function EuAiActUpdate202606Page() {
  return (
    <>
      <JsonLd data={POST_GRAPH} id="eu-ai-act-update-2026-06-jsonld" />
      <ReadingProgress />

      <article className="post-shell" data-screen-label="EU AI Act Update Juni 2026">
        {/* Digest header */}
        <section className="post-hero">
          <div className="post-hero__eyebrow">
            <span className="post-hero__tag">Monatliches EU-AI-Act-Update</span>
            <span className="post-hero__dot">·</span>
            <span className="post-hero__date">Juni 2026</span>
            <span className="post-hero__dot">·</span>
            <span>6 Min. Lesezeit</span>
          </div>
          <h1 className="post-hero__title">
            EU AI Act Update Juni 2026: was ab dem 2. August gilt.
          </h1>
          <p className="post-hero__dek">
            Dieser Überblick erklärt, welche Pflichten am 2. August 2026
            anwendbar werden, welche Regeln bereits gelten und warum die
            Hochrisiko-Pflichten einem anderen Zeitplan folgen.
          </p>
          <p className="post-hero__note">
            Stand: 14. Juli 2026. Die ursprüngliche Staffelung steht in
            Art. 113 der Verordnung (EU) 2024/1689. Parlament und Rat haben
            die AI-Omnibus-Änderung beschlossen; sie war an diesem Stichtag
            noch nicht im Amtsblatt veröffentlicht und damit noch nicht in Kraft.
          </p>
        </section>

        <EnforcementStart />
        <WasBedeutetDasFuerDich />

        {/* Footer link — educational, not promotional */}
        <section className="post-section post-section--cta">
          <p>
            Wenn du mehr über den EU AI Act lernen willst, erklärt der{" "}
            <a href="/eu-ai-act-kurs" className="post-link">
              kostenlose EU AI Act Kurs auf loehrning.ai
            </a>{" "}
            alle wichtigen Artikel in sechs Blöcken, von den verbotenen
            Praktiken bis zu den Hochrisiko-Anforderungen.
          </p>
        </section>
      </article>
    </>
  );
}
