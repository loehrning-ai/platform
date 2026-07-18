import type { Metadata } from "next";
import { ReadingProgress } from "../_components/reading-progress";
import { ScrollReveal } from "../_components/scroll-reveal";
import { RailNav, type RailItem } from "../_components/rail-nav";
import { JsonLd, ORG_ID, PERSON_ID, SITE_URL } from "@/lib/seo/json-ld";
import { BLOG_POSTS } from "@/lib/blog-metadata";
import { Hero } from "./_sections/hero";
import { ExpositionSubstitution } from "./_sections/exposition-substitution";
import { AmplifierBetriebsrat } from "./_sections/amplifier-betriebsrat";

// Pull dates from the canonical manifest so they never drift
const POST_META = BLOG_POSTS.find((p) => p.slug === "ki-und-arbeit");
const DATE_PUBLISHED = POST_META?.datePublished ?? "2026-06-22";
const DATE_MODIFIED = POST_META?.dateModified ?? "2026-06-22";

export const metadata: Metadata = {
  title: "KI und Arbeit: Was die Daten wirklich sagen",
  description:
    "27 bis 46 Prozent der Jobs sind KI-exponiert. Was das bedeutet und was nicht: OECD 2023, Amplifier-Modell, Betriebsrat und was du jetzt tun kannst.",
  alternates: { canonical: "/blog/ki-und-arbeit" },
  openGraph: {
    title: "KI und Arbeit: Was die Daten wirklich sagen",
    description:
      "OECD 2023: 27 bis 46 Prozent KI-exponiert. Exposition ist nicht Substitution. Was das Amplifier-Modell erklärt und welche Rechte du hast.",
    url: `${SITE_URL}/blog/ki-und-arbeit`,
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
          name: "KI und Arbeit",
          item: `${SITE_URL}/blog/ki-und-arbeit`,
        },
      ],
    },
    {
      "@type": "BlogPosting",
      headline: "KI und Arbeit: Was die Daten wirklich sagen",
      description:
        "OECD 2023: 27 bis 46 Prozent der Jobs in OECD-Ländern KI-exponiert. Das Amplifier-Modell, BetrVG Mitbestimmung und was du jetzt tun kannst.",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${SITE_URL}/blog/ki-und-arbeit`,
      },
      url: `${SITE_URL}/blog/ki-und-arbeit`,
      author: { "@id": PERSON_ID },
      publisher: { "@id": ORG_ID },
      datePublished: DATE_PUBLISHED,
      dateModified: DATE_MODIFIED,
      inLanguage: "de-DE",
      keywords: ["KI und Arbeit", "OECD", "Automatisierung", "Amplifier-Modell", "Betriebsrat"],
      articleSection: "KI und Gesellschaft",
      wordCount: 1400,
    },
  ],
};

const railItems: readonly RailItem[] = [
  { id: "hero", num: "01", label: "Einleitung" },
  { id: "exposition", num: "02", label: "Die Zahlen" },
  { id: "amplifier", num: "03", label: "Amplifier" },
  { id: "betriebsrat", num: "04", label: "Mitbestimmung" },
  { id: "schluss", num: "05", label: "Handlung" },
];

export default function KiUndArbeitPage() {
  return (
    <>
      <JsonLd data={POST_GRAPH} id="ki-und-arbeit-jsonld" />
      <ReadingProgress />
      <ScrollReveal
        selectors={[".reveal", ".heading", ".pipeline"]}
        wrapHeadings
      />
      <RailNav kicker="§ Lesepunkte" items={railItems} />

      <article className="post-shell" data-screen-label="KI und Arbeit Post">
        <Hero />
        <ExpositionSubstitution />
        <AmplifierBetriebsrat />
      </article>
    </>
  );
}
