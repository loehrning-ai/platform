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
import {
  formatSheetDate,
  type QuestionSheet,
} from "@/lib/vorlagen/question-sheet";
import { downloadPathFor, loadQuestionSheet } from "@/lib/vorlagen/registry";
import {
  POST_COPY,
  POST_PATH,
  POST_SLUG,
  SECTION_IDS,
  SHEET_SLUG,
} from "./post-copy";
import { richToText, type RichContext } from "./_sections/rich";
import { Hero } from "./_sections/hero";
import { WarumJetzt } from "./_sections/warum-jetzt";
import { Rechte } from "./_sections/rechte";
import { Fragen } from "./_sections/fragen";
import { Berichtsheft } from "./_sections/berichtsheft";
import { Grenzen } from "./_sections/grenzen";
import { Weiterlernen } from "./_sections/weiterlernen";
import { Quellen } from "./_sections/quellen";

// Dates come from the canonical manifest so they never drift.
const POST_META = BLOG_POSTS.find((post) => post.slug === POST_SLUG);
if (!POST_META) throw new Error(`blog manifest has no entry for ${POST_SLUG}`);
const DATE_PUBLISHED = POST_META.datePublished;
const DATE_MODIFIED = POST_META.dateModified;

function richContext(locale: Locale, sheet: QuestionSheet): RichContext {
  return { locale, stand: formatSheetDate(sheet.meta.lastReviewed, locale) };
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

/** Words of the article copy plus the rendered sheet, for BlogPosting.wordCount. */
function wordCount(locale: Locale, sheet: QuestionSheet): number {
  const context = richContext(locale, sheet);
  const copy = POST_COPY[locale];
  const prose = [
    copy.title,
    copy.lede,
    copy.intro,
    ...copy.facts.map((fact) => fact.value),
    ...copy.warumJetzt.paragraphs,
    ...copy.warumJetzt.stations.map((station) => station.what),
    copy.warumJetzt.legend,
    copy.rechte.intro,
    ...copy.rechte.can.flatMap((item) => [item.text, item.ref ?? ""]),
    ...copy.rechte.cannot.flatMap((item) => [item.text, item.ref ?? ""]),
    ...copy.rechte.rows.flat(),
    copy.rechte.note,
    copy.fragen.intro,
    copy.fragen.exercise,
    ...copy.berichtsheft,
    ...copy.grenzen,
    ...copy.weiterlernen.courses.map((course) => course.description),
    ...copy.weiterlernen.external.flatMap((row) => [row.title, row.description]),
    ...copy.quellen.rows.flatMap((row) => [row.title, row.covers]),
  ].map((source) => richToText(source, context));
  const sheetText = [
    sheet.meta.title,
    ...sheet.intro,
    sheet.status,
    ...sheet.usage.steps,
    ...sheet.usage.after,
    ...sheet.groups.flatMap((group) => [
      group.title,
      ...group.questions.flatMap((question) => [
        question.text,
        question.legalBasis,
        question.answer,
        question.note ?? "",
        question.open ?? "",
      ]),
    ]),
    ...sheet.limits,
  ];
  return countWords([...prose, ...sheetText].join(" "));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = POST_COPY[locale];
  const localizedPath = localizeHref(POST_PATH, locale);

  return {
    title: copy.title,
    description: copy.description,
    robots: { index: true, follow: true },
    alternates: {
      ...buildLocaleAlternates(POST_PATH, contentLocalesForPath(POST_PATH)),
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

function postGraph(locale: Locale, sheet: QuestionSheet) {
  const copy = POST_COPY[locale];
  const localizedPath = localizeHref(POST_PATH, locale);
  const audience = copy.facts[0]?.value ?? "";
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
            item: `${SITE_URL}${localizeHref("/blog", locale)}`,
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
        articleSection: copy.articleSection,
        wordCount: wordCount(locale, sheet),
        audience: { "@type": "Audience", audienceType: audience },
        hasPart: {
          "@type": "DigitalDocument",
          name: sheet.meta.title,
          encodingFormat: "text/markdown",
          url: `${SITE_URL}${downloadPathFor(SHEET_SLUG, locale)}`,
          license: "https://creativecommons.org/licenses/by/4.0/",
          dateModified: sheet.meta.lastReviewed,
        },
      },
    ],
  };
}

function railItems(locale: Locale): readonly RailItem[] {
  return SECTION_IDS.map((id, index) => ({
    id,
    num: String(index).padStart(2, "0"),
    label: POST_COPY[locale].rail[id],
  }));
}

export default async function KiInDerAusbildungPage() {
  const locale = await getRequestLocale();
  const sheet = await loadQuestionSheet(SHEET_SLUG, locale);
  const props = { locale, sheet, context: richContext(locale, sheet) };

  return (
    <>
      <JsonLd data={postGraph(locale, sheet)} id="ki-in-der-ausbildung-jsonld" />
      <RailNav
        kicker={POST_COPY[locale].railKicker}
        items={railItems(locale)}
        locale={locale}
      />
      <article
        className="post-wz"
        data-screen-label={POST_COPY[locale].screenLabel}
      >
        <Hero {...props} />
        <WarumJetzt {...props} />
        <Rechte {...props} />
        <Fragen {...props} />
        <Berichtsheft {...props} />
        <Grenzen {...props} />
        <Weiterlernen {...props} />
        <Quellen {...props} />
      </article>
    </>
  );
}
