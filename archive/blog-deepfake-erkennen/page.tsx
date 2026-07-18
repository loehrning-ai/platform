import type { Metadata } from "next";
import { ReadingProgress } from "../_components/reading-progress";
import { ScrollReveal } from "../_components/scroll-reveal";
import { RailNav, type RailItem } from "../_components/rail-nav";
import { JsonLd, ORG_ID, PERSON_ID, SITE_URL } from "@/lib/seo/json-ld";
import { BLOG_POSTS } from "@/lib/blog-metadata";
import { Hero } from "./_sections/hero";
import { WerkzeugeCheckliste } from "./_sections/werkzeuge-checkliste";
import { RechteHandlung } from "./_sections/rechte-handlung";

// Pull dates from the canonical manifest so they never drift
const POST_META = BLOG_POSTS.find((p) => p.slug === "deepfake-erkennen");
const DATE_PUBLISHED = POST_META?.datePublished ?? "2026-06-22";
const DATE_MODIFIED = POST_META?.dateModified ?? "2026-06-22";

export const metadata: Metadata = {
  title: "Deepfakes erkennen: Drei kostenlose Werkzeuge und eine Checkliste",
  description:
    "Rückwärtsbildersuche, InVID/WeVerify und Hive Demo: drei kostenlose Werkzeuge in zwei Minuten. Plus 10-Punkt-Checkliste und Rechte nach EU AI Act Art. 50 und KUG § 22.",
  alternates: { canonical: "/blog/deepfake-erkennen" },
  openGraph: {
    title: "Deepfakes erkennen: Drei kostenlose Werkzeuge und eine Checkliste",
    description:
      "WeVerify, Hive Demo, Rückwärtssuche: drei kostenlose Werkzeuge in zwei Minuten. Deine Rechte nach EU AI Act Art. 50 und was du tust, wenn du einen Deepfake findest.",
    url: `${SITE_URL}/blog/deepfake-erkennen`,
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
          name: "Deepfakes erkennen",
          item: `${SITE_URL}/blog/deepfake-erkennen`,
        },
      ],
    },
    {
      "@type": "BlogPosting",
      headline: "Deepfakes erkennen: Drei kostenlose Werkzeuge und eine Checkliste",
      description:
        "Rückwärtsbildersuche, WeVerify und Hive Demo: drei kostenlose Werkzeuge in zwei Minuten plus 10-Punkt-Checkliste und EU AI Act Art. 50 Rechte.",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${SITE_URL}/blog/deepfake-erkennen`,
      },
      url: `${SITE_URL}/blog/deepfake-erkennen`,
      author: { "@id": PERSON_ID },
      publisher: { "@id": ORG_ID },
      datePublished: DATE_PUBLISHED,
      dateModified: DATE_MODIFIED,
      inLanguage: "de-DE",
      keywords: ["Deepfakes", "WeVerify", "EU AI Act", "Medienkompetenz", "Desinformation"],
      articleSection: "KI und Gesellschaft",
      wordCount: 1200,
    },
  ],
};

const railItems: readonly RailItem[] = [
  { id: "hero", num: "01", label: "Einleitung" },
  { id: "werkzeuge", num: "02", label: "Werkzeuge" },
  { id: "checkliste", num: "03", label: "Checkliste" },
  { id: "rechte", num: "04", label: "Rechte" },
  { id: "handlung", num: "05", label: "Handlung" },
];

export default function DeepfakeErkennenPage() {
  return (
    <>
      <JsonLd data={POST_GRAPH} id="deepfake-erkennen-jsonld" />
      <ReadingProgress />
      <ScrollReveal
        selectors={[".reveal", ".heading", ".pipeline"]}
        wrapHeadings
      />
      <RailNav kicker="§ Lesepunkte" items={railItems} />

      <article className="post-shell" data-screen-label="Deepfakes erkennen Post">
        <Hero />
        <WerkzeugeCheckliste />
        <RechteHandlung />
      </article>
    </>
  );
}
