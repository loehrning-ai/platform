import type { Metadata } from "next";
import Link from "next/link";

import { Dateline } from "./_components/dateline";
import { BLOG_POSTS, BLOG_LAST_MODIFIED } from "@/lib/blog-metadata";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { SITE_URL } from "@/lib/seo/json-ld";

const PATH = "/blog";

const COPY = {
  de: {
    metadataTitle: "Blog | loehrning.ai",
    metadataDescription:
      "Lange, nachprüfbare Texte über KI im Alltag, EU AI Act und KI in der Gesellschaft, für die breite deutschsprachige Öffentlichkeit.",
    datelineTitle: "Der loehrning.ai Blog",
    intro:
      "Öffentliche Texte zu KI im Alltag, EU AI Act und KI in der Gesellschaft. Offen, nachprüfbar, mit Zahlen und Quellenangaben.",
    article: (count: number) =>
      `${count} ${count === 1 ? "Artikel" : "Artikel"}`,
    lastUpdated: "Zuletzt aktualisiert:",
    ongoing: "Laufend ergänzt",
    allArticles: "§ Alle Artikel",
    featured: "Aktuelle Ausgabe",
    feedTitle: "Ein Thema, gründlich statt viel.",
    published: "erschienen",
    articleNumber: "Artikel Nº",
    readingTime: (minutes: number) => `${minutes} Min. Lesezeit`,
    readLabel: (title: string) => `Artikel lesen: ${title}`,
    read: "Artikel lesen",
    noteLabel: "Kein Redaktionsplan.",
    note: "Dieser Blog erscheint unregelmäßig. Neue Artikel entstehen, wenn ein Thema sauber genug erklärt werden kann und die Quellen stimmen.",
    sourceLabel: "Quellenstandard",
    sourceTitle: "Behauptungen mit Belegspur.",
    sourceBody:
      "Rechtliche Aussagen führen zu Primärquellen. Datum, Lesedauer und Themenumfang stehen vor dem Einstieg fest.",
    sourceMarks: ["Primärquellen", "Prüfdatum", "Lesezeit sichtbar"],
    visual: {
      label: "Sieben Abschnitte · Bürgerperspektive",
      big: "2. Aug",
      caption: "EU AI Act ab August 2026:",
      emphasis: "Art. 50 Transparenz + deine Rechte",
      status: "Lesefertige Vorschau",
      articles: ["Art. 50", "Art. 85", "Art. 86"],
    },
  },
  en: {
    metadataTitle: "Blog | loehrning.ai",
    metadataDescription:
      "Long-form, source-backed writing about everyday AI, the EU AI Act, and AI in society for a general English-speaking audience.",
    datelineTitle: "The loehrning.ai blog",
    intro:
      "Public articles about everyday AI, the EU AI Act, and AI in society. Open access, verifiable claims, explicit figures, and primary sources.",
    article: (count: number) =>
      `${count} ${count === 1 ? "article" : "articles"}`,
    lastUpdated: "Last updated:",
    ongoing: "Updated when evidence changes",
    allArticles: "§ All articles",
    featured: "Current edition",
    feedTitle: "One subject, examined properly.",
    published: "published",
    articleNumber: "Article Nº",
    readingTime: (minutes: number) => `${minutes} min read`,
    readLabel: (title: string) => `Read article: ${title}`,
    read: "Read article",
    noteLabel: "No publishing quota.",
    note: "Articles appear when a subject can be explained precisely and the source record is complete. There is no fixed publishing schedule.",
    sourceLabel: "Source standard",
    sourceTitle: "Claims with an evidence trail.",
    sourceBody:
      "Legal claims lead to primary sources. Date, reading time, and scope are visible before you open the article.",
    sourceMarks: ["Primary sources", "Review date", "Reading time visible"],
    visual: {
      label: "Seven sections · Citizen perspective",
      big: "2 Aug",
      caption: "EU AI Act from August 2026:",
      emphasis: "Article 50 transparency and your rights",
      status: "Reading preview",
      articles: ["Art. 50", "Art. 85", "Art. 86"],
    },
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
    <>
      <div className="blog-dateline">
        <div className="left">
          <Dateline locale={locale} />
        </div>
        <div
          className="center"
          style={{ color: "var(--druckertinte)", fontWeight: 700 }}
        >
          {copy.datelineTitle}
        </div>
        <div className="right">2026</div>
      </div>

      <section className="mast--hero">
        <div className="mast__statement">
          <div className="mast__label">{copy.datelineTitle}</div>
          <h1 className="mast__title">
            Blog<span className="k">.</span>
          </h1>
          <div className="mast__sub">{copy.intro}</div>
        </div>
        <div className="mast__meta">
          <span className="mast__meta-index">Nº 01</span>
          <div className="mast__meta-copy">
            <b>{copy.article(BLOG_POSTS.length)}</b>
            <span>
              {copy.lastUpdated} {lastUpdated}
            </span>
            <span className="live">{copy.ongoing}</span>
          </div>
        </div>
      </section>

      <section className="feed" data-editorial-bento>
        <div className="feed__head">
          <div className="hash">{copy.allArticles}</div>
          <div className="title">{copy.feedTitle}</div>
          <div className="count">
            <b>{BLOG_POSTS.length}</b> {copy.published}
          </div>
        </div>

        <div className="editorial-grid">
          <div className="article-stack">
            <p className="article-stack__label">{copy.featured}</p>
            {BLOG_POSTS_NEWEST_FIRST.map((post) => {
              const number = String(post.postNumber).padStart(2, "0");
              const localized = postCopy(post, locale);
              return (
                <Link
                  key={post.slug}
                  href={localizeHref(`/blog/${post.slug}`, locale)}
                  className="row"
                  aria-label={copy.readLabel(localized.title)}
                  data-link-preview
                >
                  <div className="row__body">
                    <div className="row__topline">
                      <span className="row__tag">{localized.tags[0]}</span>
                      <span className="row__date">
                        {formatDate(post.datePublished, locale)}
                      </span>
                      <span className="row__dot">·</span>
                      <span>{copy.readingTime(post.readingTimeMin)}</span>
                    </div>
                    <span className="row__no">
                      <span className="hash">
                        {copy.articleNumber} {number}
                      </span>
                      {number}
                    </span>
                    <h2 className="row__title">{localized.title}</h2>
                    <p className="row__dek">{localized.summary}</p>
                    <div className="row__foot">
                      <span className="row__author">Tim Löhr</span>
                      {localized.tags.slice(1).map((tag) => (
                        <span key={tag} className="contents">
                          <span className="row__dot">·</span>
                          <span>{tag}</span>
                        </span>
                      ))}
                      <span className="row__cta">
                        {copy.read} <span className="arr">↗</span>
                      </span>
                    </div>
                  </div>
                  <div className="row__art" aria-hidden="true">
                    <div className="row__art-label">
                      <span>{copy.visual.status}</span>
                      <span>01 / 07</span>
                    </div>
                    <div className="row__art-body">
                      <div className="row__art-big">{copy.visual.big}</div>
                      <div className="row__art-cap">
                        {copy.visual.caption} <b>{copy.visual.emphasis}</b>
                      </div>
                    </div>
                    <div className="row__art-articles">
                      {copy.visual.articles.map((article) => (
                        <span key={article}>{article}</span>
                      ))}
                    </div>
                    <div className="row__art-foot">
                      <span>Reg. 2024/1689</span>
                      <span>AI Omnibus 2026</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <aside className="evidence-card" aria-labelledby="source-standard">
            <span className="evidence-card__register" aria-hidden="true" />
            <p className="evidence-card__label">{copy.sourceLabel}</p>
            <h2 id="source-standard">{copy.sourceTitle}</h2>
            <p>{copy.sourceBody}</p>
            <ul>
              {copy.sourceMarks.map((mark, index) => (
                <li key={mark}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {mark}
                </li>
              ))}
            </ul>
          </aside>

          <aside className="feed__note" aria-labelledby="publishing-note">
            <div>
              <p className="feed__note-label">{copy.noteLabel}</p>
              <h2 id="publishing-note">{copy.ongoing}</h2>
            </div>
            <p className="feed__note-body">{copy.note}</p>
            <span className="feed__note-cta" aria-hidden="true">
              ↳
            </span>
          </aside>
        </div>
      </section>
    </>
  );
}

export default async function BlogIndexPage() {
  const locale = await getRequestLocale();
  return <BlogIndexContent locale={locale} />;
}
