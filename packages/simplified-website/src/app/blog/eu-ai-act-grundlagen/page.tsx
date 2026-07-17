import type { Metadata } from "next";
import { ReadingProgress } from "../_components/reading-progress";
import { ScrollReveal } from "../_components/scroll-reveal";
import { RailNav, type RailItem } from "../_components/rail-nav";
import { JsonLd, ORG_ID, PERSON_ID, SITE_URL } from "@/lib/seo/json-ld";
import { BLOG_POSTS } from "@/lib/blog-metadata";
import { Hero } from "./_sections/hero";
import { Grundlagen } from "./_sections/grundlagen";
import { Risikoklassen } from "./_sections/risikoklassen";
import { Zeitplan } from "./_sections/zeitplan";
import { Stand2026 } from "./_sections/stand-2026";
import { DeineRechte } from "./_sections/deine-rechte";
import { Praxis } from "./_sections/praxis";
import { Quellen } from "./_sections/quellen";

// Pull dates from the canonical manifest so they never drift
const POST_META = BLOG_POSTS.find((p) => p.slug === "eu-ai-act-grundlagen");
const DATE_PUBLISHED = POST_META?.datePublished ?? "2026-07-16";
const DATE_MODIFIED = POST_META?.dateModified ?? "2026-07-16";

export const metadata: Metadata = {
  title: "Der EU AI Act: was er bedeutet, wenn du keine Juristin bist",
  description:
    "Was der EU AI Act regelt, was schon gilt und was ab 2. August 2026 dazukommt. Mit dem Stand zum AI Omnibus (Juli 2026), deinen Rechten und Primärquellen.",
  alternates: { canonical: "/blog/eu-ai-act-grundlagen" },
  openGraph: {
    title: "Der EU AI Act: was er bedeutet, wenn du keine Juristin bist",
    description:
      "Risikoklassen, Zeitplan, AI Omnibus und deine Rechte nach Art. 50, 85 und 86. Erklärung ohne Fachjargon, Stand 16. Juli 2026.",
    url: `${SITE_URL}/blog/eu-ai-act-grundlagen`,
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
          name: "EU AI Act Grundlagen",
          item: `${SITE_URL}/blog/eu-ai-act-grundlagen`,
        },
      ],
    },
    {
      "@type": "BlogPosting",
      headline: "Der EU AI Act: was er bedeutet, wenn du keine Juristin bist",
      description:
        "Was der EU AI Act regelt, was schon gilt und was ab 2. August 2026 dazukommt. Mit dem Stand zum AI Omnibus (Juli 2026), deinen Rechten und Primärquellen.",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${SITE_URL}/blog/eu-ai-act-grundlagen`,
      },
      url: `${SITE_URL}/blog/eu-ai-act-grundlagen`,
      author: { "@id": PERSON_ID },
      publisher: { "@id": ORG_ID },
      datePublished: DATE_PUBLISHED,
      dateModified: DATE_MODIFIED,
      inLanguage: "de-DE",
      keywords: [
        "EU AI Act",
        "AI Omnibus",
        "Artikel 50",
        "Artikel 86",
        "KI-Kompetenz",
        "Hochrisiko-KI",
      ],
      articleSection: "EU AI Act",
      wordCount: 2100,
    },
  ],
};

const railItems: readonly RailItem[] = [
  { id: "hero", num: "00", label: "Einstieg" },
  { id: "grundlagen", num: "01", label: "Das Gesetz" },
  { id: "risikoklassen", num: "02", label: "Risikoklassen" },
  { id: "zeitplan", num: "03", label: "Zeitplan" },
  { id: "stand", num: "04", label: "Stand 2026" },
  { id: "rechte", num: "05", label: "Deine Rechte" },
  { id: "praxis", num: "06", label: "Praxis" },
  { id: "quellen", num: "07", label: "Quellen" },
];

export default function EuAiActGrundlagenPage() {
  return (
    <>
      <JsonLd data={POST_GRAPH} id="eu-ai-act-grundlagen-jsonld" />
      <ReadingProgress />
      <ScrollReveal
        selectors={[".reveal", ".heading", ".pipeline", ".ladder"]}
        wrapHeadings
      />
      <RailNav kicker="§ Lesepunkte" items={railItems} />

      <article className="post-shell" data-screen-label="EU AI Act Grundlagen Post">
        <Hero />
        <Grundlagen />
        <Risikoklassen />
        <Zeitplan />
        <Stand2026 />
        <DeineRechte />
        <Praxis />
        <Quellen />
      </article>
    </>
  );
}
