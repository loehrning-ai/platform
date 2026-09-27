import type { Metadata } from "next";
import Link from "next/link";

import { CapsLine, CornerDots, Halftone } from "@/components/plakat";
import { BLOG_POSTS, BLOG_LAST_MODIFIED } from "@/lib/blog-metadata";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { posterTitleStyle } from "@/lib/plakat/fit";
import { SITE_URL } from "@/lib/seo/json-ld";

const PATH = "/blog";

const COPY = {
  de: {
    metadataTitle: "Blog | loehrning.ai",
    metadataDescription:
      "Nachprüfbare Texte mit Primärquellen zu KI im Alltag, EU AI Act und KI in der Gesellschaft.",
    kicker: (count: number) => `Blog · ${count} Artikel`,
    title: "KI im Alltag, mit Quellen erklärt.",
    intro: "Texte zu KI im Alltag, EU AI Act und KI in der Gesellschaft.",
    lastUpdated: "Zuletzt aktualisiert",
    allArticles: "Alle Artikel",
    listNote: "Neueste zuerst",
    readingTime: (minutes: number) => `${minutes} Min. Lesezeit`,
    readLabel: (title: string) => `Artikel lesen: ${title}`,
    read: "Artikel lesen",
    noteLabel: "Kein Redaktionsplan.",
    sourceLabel: "Quellenstandard",
    sourceTitle: "Behauptungen mit Belegspur.",
    sourceBody: "Rechtliche Aussagen führen zu Primärquellen.",
    sourceMarks: ["Primärquellen", "Prüfdatum", "Lesezeit sichtbar"],
  },
  en: {
    metadataTitle: "Blog | loehrning.ai",
    metadataDescription:
      "Verifiable articles with primary sources about everyday AI, the EU AI Act and AI in society.",
    kicker: (count: number) =>
      `Blog · ${count} ${count === 1 ? "article" : "articles"}`,
    title: "Everyday AI, explained with sources.",
    intro: "Articles about everyday AI, the EU AI Act and AI in society.",
    lastUpdated: "Last updated",
    allArticles: "All articles",
    listNote: "Newest first",
    readingTime: (minutes: number) => `${minutes} min read`,
    readLabel: (title: string) => `Read article: ${title}`,
    read: "Read article",
    noteLabel: "No publishing quota.",
    sourceLabel: "Source standard",
    sourceTitle: "Claims with an evidence trail.",
    sourceBody: "Legal claims lead to primary sources.",
    sourceMarks: ["Primary sources", "Review date", "Reading time visible"],
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = COPY[locale];
  const localizedPath = localizeHref(PATH, locale);
  const alternates = buildLocaleAlternates(PATH, contentLocalesForPath(PATH));

  return {
    title: { absolute: copy.metadataTitle },
    description: copy.metadataDescription,
    robots: { index: true, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title: copy.metadataTitle,
      description: copy.metadataDescription,
      url: `${SITE_URL}${localizedPath}`,
      locale: locale === "de" ? "de_DE" : "en_GB",
      alternateLocale: [locale === "de" ? "en_GB" : "de_DE"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metadataTitle,
      description: copy.metadataDescription,
    },
  };
}

const BLOG_POSTS_NEWEST_FIRST = [...BLOG_POSTS].sort(
  (a, b) =>
    b.datePublished.localeCompare(a.datePublished) ||
    b.postNumber - a.postNumber,
);

function postCopy(post: (typeof BLOG_POSTS)[number], locale: Locale) {
  return locale === "de"
    ? { title: post.titleDe, summary: post.summary, tags: post.tags }
    : { title: post.titleEn, summary: post.summaryEn, tags: post.tagsEn };
}

function formatDate(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function BlogIndexContent({ locale }: { readonly locale: Locale }) {
  const copy = COPY[locale];
  const lastUpdated = formatDate(BLOG_LAST_MODIFIED, locale);

  return (
    <div className="blog-index" data-blog-index data-plakat-page="idea">
      {/* IDEA band (SPEC §2.3, §3.12): the plakat-idea scope on the hero,
          four corner dots, the arrow caps line, the Himbeere poster title,
          a 17px Kobalt lede and the Kobalt cloud halftone: the three colours
          of the IDEA poster, as on /demos. Three type sizes; the update date
          moves to paper under the section head. From lg the halftone sits
          beside the lede, so the first article reaches the first view. The
          blog reset in blog.css zeroes Tailwind spacing, so every gap here
          is set in blog-index.css. data-cover-band lets the band checks
          (contrast, focus) find it like every other band. */}
      <header
        className="blog-index__hero plakat-idea"
        data-blog-hero
        data-cover-band=""
        data-plakat="idea"
      >
        <CornerDots />
        <div className="blog-index__container blog-index__hero-inner">
          <CapsLine arrow>{copy.kicker(BLOG_POSTS.length)}</CapsLine>
          <h1 className="blog-index__title" style={posterTitleStyle(copy.title)}>
            {copy.title}
          </h1>
          <div className="blog-index__hero-row">
            <p className="blog-index__lead">
              {copy.intro}
            </p>
            <Halftone field="blog" className="blog-index__halftone" />
          </div>
        </div>
      </header>

      <section
        className="blog-index__section"
        aria-labelledby="blog-articles"
        data-blog-ledger
      >
        <div className="blog-index__container">
          <header className="blog-index__head">
            <h2 id="blog-articles">{copy.allArticles}</h2>
            <p className="blog-index__caption">
              {copy.listNote} · {copy.noteLabel}
            </p>
          </header>
          <p className="blog-index__caption blog-index__updated">
            {copy.lastUpdated}{" "}
            <time dateTime={BLOG_LAST_MODIFIED}>{lastUpdated}</time>
          </p>

          <ol className="blog-index__list">
            {BLOG_POSTS_NEWEST_FIRST.map((post) => {
              const number = String(post.postNumber).padStart(2, "0");
              const localized = postCopy(post, locale);
              return (
                <li
                  key={post.slug}
                  className="blog-index__row"
                  data-blog-article
                >
                  <span className="blog-index__no" aria-hidden="true">
                    {number}
                  </span>
                  <div className="blog-index__body">
                    <p className="blog-index__caption blog-index__meta">
                      <time dateTime={post.datePublished}>
                        {formatDate(post.datePublished, locale)}
                      </time>
                      <span aria-hidden="true"> · </span>
                      <span>{copy.readingTime(post.readingTimeMin)}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{localized.tags[0]}</span>
                    </p>
                    <h3 className="blog-index__row-title">{localized.title}</h3>
                    <p className="blog-index__summary">{localized.summary}</p>
                  </div>
                  <Link
                    href={localizeHref(`/blog/${post.slug}`, locale)}
                    className="blog-index__link"
                    aria-label={copy.readLabel(localized.title)}
                  >
                    {copy.read}
                    <span className="blog-index__arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section
        className="blog-index__section blog-index__section--last"
        aria-labelledby="source-standard"
      >
        <div className="blog-index__container blog-index__standard">
          <header className="blog-index__head">
            <h2 id="source-standard">{copy.sourceTitle}</h2>
            <p className="blog-index__caption">{copy.sourceLabel}</p>
          </header>
          <p className="blog-index__body-text">{copy.sourceBody}</p>
          <ul className="blog-index__marks">
            {copy.sourceMarks.map((mark, index) => (
              <li key={mark}>
                <span className="blog-index__no">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {mark}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

export default async function BlogIndexPage() {
  const locale = await getRequestLocale();
  return <BlogIndexContent locale={locale} />;
}
