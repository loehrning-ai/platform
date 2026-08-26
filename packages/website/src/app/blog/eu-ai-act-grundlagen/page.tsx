import type { Metadata } from "next";
import { RailNav, type RailItem } from "../_components/rail-nav";
import { JsonLd, ORG_ID, PERSON_ID, SITE_URL } from "@/lib/seo/json-ld";
import { BLOG_POSTS } from "@/lib/blog-metadata";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { Hero } from "./_sections/hero";
import { Grundlagen } from "./_sections/grundlagen";
import { Risikoklassen } from "./_sections/risikoklassen";
import { Zeitplan } from "./_sections/zeitplan";
import { Stand2026 } from "./_sections/stand-2026";
import { DeineRechte } from "./_sections/deine-rechte";
import { Praxis } from "./_sections/praxis";
import { Quellen } from "./_sections/quellen";
import { HeroEn } from "./_sections/en/hero";
import { GrundlagenEn } from "./_sections/en/grundlagen";
import { RisikoklassenEn } from "./_sections/en/risikoklassen";
import { ZeitplanEn } from "./_sections/en/zeitplan";
import { Stand2026En } from "./_sections/en/stand-2026";
import { DeineRechteEn } from "./_sections/en/deine-rechte";
import { PraxisEn } from "./_sections/en/praxis";
import { QuellenEn } from "./_sections/en/quellen";

// Pull dates from the canonical manifest so they never drift
const POST_META = BLOG_POSTS.find((p) => p.slug === "eu-ai-act-grundlagen");
const DATE_PUBLISHED = POST_META?.datePublished ?? "2026-07-16";
const DATE_MODIFIED = POST_META?.dateModified ?? "2026-07-28";
const PATH = "/blog/eu-ai-act-grundlagen";

const POST_COPY = {
  de: {
    title: "Der EU AI Act: was er bedeutet, wenn du keine Juristin bist",
    description:
      "Was der EU AI Act regelt, was schon gilt und was ab 2. August 2026 dazukommt. Mit dem Stand zum AI Omnibus (Juli 2026), deinen Rechten und Primärquellen.",
    openGraphDescription:
      "Risikoklassen, Zeitplan, AI Omnibus und deine Rechte nach Art. 50, 85 und 86. Erklärung ohne Fachjargon, Stand 28. Juli 2026.",
    breadcrumbHome: "Start",
    breadcrumbTitle: "EU AI Act Grundlagen",
    railKicker: "§ Lesepunkte",
    rail: [
      "Einstieg",
      "Das Gesetz",
      "Risikoklassen",
      "Zeitplan",
      "Stand 2026",
      "Deine Rechte",
      "Praxis",
      "Quellen",
    ],
    keywords: [
      "EU AI Act",
      "AI Omnibus",
      "Artikel 50",
      "Artikel 86",
      "KI-Kompetenz",
      "Hochrisiko-KI",
    ],
  },
  en: {
    title: "The EU AI Act: what it means if you are not a lawyer",
    description:
      "What the EU AI Act regulates, what already applies, and what changes on 2 August 2026. Includes the July 2026 AI Omnibus position, individual rights, and primary sources.",
    openGraphDescription:
      "Risk classes, the application timeline, the AI Omnibus, and rights under Articles 50, 85, and 86. Current to 28 July 2026.",
    breadcrumbHome: "Home",
    breadcrumbTitle: "EU AI Act foundations",
    railKicker: "§ Reading points",
    rail: [
      "Introduction",
      "The law",
      "Risk classes",
      "Timeline",
      "Position in 2026",
      "Your rights",
      "Practical steps",
      "Sources",
    ],
    keywords: [
      "EU AI Act",
      "AI Omnibus",
      "Article 50",
      "Article 86",
      "AI literacy",
      "high-risk AI",
    ],
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = POST_COPY[locale];
  const localizedPath = localizeHref(PATH, locale);

  return {
    title: copy.title,
    description: copy.description,
    robots: { index: true, follow: true },
    alternates: {
      ...buildLocaleAlternates(PATH, contentLocalesForPath(PATH)),
      canonical: localizedPath,
    },
    openGraph: {
      title: copy.title,
      description: copy.openGraphDescription,
      url: `${SITE_URL}${localizedPath}`,
      locale: locale === "de" ? "de_DE" : "en_GB",
      alternateLocale: [locale === "de" ? "en_GB" : "de_DE"],
      type: "article",
      publishedTime: DATE_PUBLISHED,
      modifiedTime: DATE_MODIFIED,
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.openGraphDescription,
    },
  };
}

function postGraph(locale: Locale) {
  const copy = POST_COPY[locale];
  const localizedPath = localizeHref(PATH, locale);
  const localizedBlogPath = localizeHref("/blog", locale);
  return {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: copy.breadcrumbHome,
            item: `${SITE_URL}${localizeHref("/", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: `${SITE_URL}${localizedBlogPath}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: copy.breadcrumbTitle,
            item: `${SITE_URL}${localizedPath}`,
          },
        ],
      },
      {
        "@type": "BlogPosting",
        headline: copy.title,
        description: copy.description,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${SITE_URL}${localizedPath}`,
        },
        url: `${SITE_URL}${localizedPath}`,
        author: { "@id": PERSON_ID },
        publisher: { "@id": ORG_ID },
        datePublished: DATE_PUBLISHED,
        dateModified: DATE_MODIFIED,
        inLanguage: locale === "de" ? "de-DE" : "en-GB",
        keywords: copy.keywords,
        articleSection: "EU AI Act",
        wordCount: 2100,
      },
    ],
  };
}

function railItems(locale: Locale): readonly RailItem[] {
  const ids = [
    "hero",
    "grundlagen",
    "risikoklassen",
    "zeitplan",
    "stand",
    "rechte",
    "praxis",
    "quellen",
  ] as const;
  return ids.map((id, index) => ({
    id,
    num: String(index).padStart(2, "0"),
    label: POST_COPY[locale].rail[index]!,
  }));
}

export default async function EuAiActGrundlagenPage() {
  const locale = await getRequestLocale();
  return (
    <>
      <JsonLd data={postGraph(locale)} id="eu-ai-act-grundlagen-jsonld" />
      <RailNav
        kicker={POST_COPY[locale].railKicker}
        items={railItems(locale)}
        locale={locale}
      />

      <article
        className="post-shell"
        data-screen-label={
          locale === "de"
            ? "EU AI Act Grundlagen Artikel"
            : "EU AI Act foundations article"
        }
      >
        {locale === "de" ? (
          <>
            <Hero />
            <Grundlagen />
            <Risikoklassen />
            <Zeitplan />
            <Stand2026 />
            <DeineRechte />
            <Praxis />
            <Quellen />
          </>
        ) : (
          <>
            <HeroEn />
            <GrundlagenEn />
            <RisikoklassenEn />
            <ZeitplanEn />
            <Stand2026En />
            <DeineRechteEn />
            <PraxisEn />
            <QuellenEn />
          </>
        )}
      </article>
    </>
  );
}
