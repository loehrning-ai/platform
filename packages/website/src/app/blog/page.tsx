import type { Metadata } from "next";
import Link from "next/link";

import { Dateline } from "./_components/dateline";
import { claimRange } from "./ki-in-der-ausbildung/_sections/dates";
import {
  JAV_ELECTION_END,
  JAV_ELECTION_START,
} from "./ki-in-der-ausbildung/post-copy";
import {
  BLOG_POSTS,
  BLOG_LAST_MODIFIED,
  type BlogPost,
} from "@/lib/blog-metadata";
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
      "Nachprüfbare Texte mit Primärquellen zu KI im Alltag, EU AI Act und KI in der Gesellschaft.",
    datelineTitle: "Der loehrning.ai Blog",
    intro: "Artikel zum EU AI Act und zu KI in Arbeit und Gesellschaft.",
    article: (count: number) => `${count} Artikel`,
    lastUpdated: "Zuletzt aktualisiert:",
    rhythm: "Erscheint unregelmäßig",
    allArticles: "§ Alle Artikel",
    feedLabel: "Alle Artikel",
    feedTitle: "KI im Alltag, mit Quellen erklärt.",
    published: "erschienen",
    featured: "Aktuelle Ausgabe",
    earlier: (count: number) =>
      count === 1 ? "Frühere Ausgabe" : "Frühere Ausgaben",
    articleNumber: "Artikel Nº",
    readingTime: (minutes: number) => `${minutes} Min. Lesezeit`,
    readLabel: (title: string) => `Artikel lesen: ${title}`,
    read: "Artikel lesen",
    noteLabel: "Kein Redaktionsplan.",
    note: "Ein neuer Artikel erscheint, wenn ein Thema sauber erklärt ist und die Quellen stimmen.",
    sourceLabel: "Quellenstandard",
    sourceTitle: "Behauptungen mit Belegspur.",
    sourceBody:
      "Rechtliche Aussagen verlinken auf Primärquellen und nennen das Prüfdatum.",
    sourceMarks: ["Primärquellen", "Prüfdatum", "Lesezeit sichtbar"],
  },
  en: {
    metadataTitle: "Blog | loehrning.ai",
    metadataDescription:
      "Verifiable articles with primary sources about everyday AI, the EU AI Act and AI in society.",
    datelineTitle: "The loehrning.ai blog",
    intro: "Articles on the EU AI Act and on AI at work and in society.",
    article: (count: number) =>
      `${count} ${count === 1 ? "article" : "articles"}`,
    lastUpdated: "Last updated:",
    rhythm: "Published irregularly",
    allArticles: "§ All articles",
    feedLabel: "All articles",
    feedTitle: "Everyday AI, explained with sources.",
    published: "published",
    featured: "Current edition",
    earlier: (count: number) =>
      count === 1 ? "Earlier edition" : "Earlier editions",
    articleNumber: "Article Nº",
    readingTime: (minutes: number) => `${minutes} min read`,
    readLabel: (title: string) => `Read article: ${title}`,
    read: "Read article",
    noteLabel: "No publishing quota.",
    note: "A new article appears when a subject is explained properly and the sources hold.",
    sourceLabel: "Source standard",
    sourceTitle: "Claims with an evidence trail.",
    sourceBody:
      "Legal claims link to primary sources and state the review date.",
    sourceMarks: ["Primary sources", "Review date", "Reading time visible"],
  },
} as const;

/**
 * The printed preview sheet beside each article: one big figure, a caption
 * and three marks. Dates come from the legal registry, never from literals.
 */
interface PostVisual {
  /** Accessible name of the preview sheet (role="img"). */
  readonly alt: string;
  readonly label: readonly [string, string];
  readonly big: string;
  readonly caption: string;
  readonly emphasis: string;
  readonly marks: readonly string[];
  readonly foot: readonly [string, string];
}

const POST_VISUALS: Readonly<
  Record<string, (locale: Locale) => PostVisual>
> = {
  "eu-ai-act-grundlagen": (locale) =>
    locale === "de"
      ? {
          alt: "EU AI Act ab August 2026: Art. 50 Transparenz + deine Rechte",
          label: ["Lesefertige Vorschau", "01 / 07"],
          big: "2. Aug",
          caption: "EU AI Act ab August 2026:",
          emphasis: "Art. 50 Transparenz + deine Rechte",
          marks: ["Art. 50", "Art. 85", "Art. 86"],
          foot: ["Reg. 2024/1689", "AI Omnibus 2026"],
        }
      : {
          alt: "EU AI Act from August 2026: Article 50 transparency and your rights",
          label: ["Reading preview", "01 / 07"],
          big: "2 Aug",
          caption: "EU AI Act from August 2026:",
          emphasis: "Article 50 transparency and your rights",
          marks: ["Art. 50", "Art. 85", "Art. 86"],
          foot: ["Reg. 2024/1689", "AI Omnibus 2026"],
        },
  "ki-in-der-ausbildung": (locale) => {
    const election = claimRange(JAV_ELECTION_START, JAV_ELECTION_END, locale, {
      compact: true,
    });
    return locale === "de"
      ? {
          alt: `20 Fragen für JAV und Betriebsrat. JAV-Wahl: ${election}`,
          label: ["Zum Drucken", "CC BY 4.0"],
          big: "20",
          caption: "Fragen für JAV und Betriebsrat. JAV-Wahl:",
          emphasis: election,
          marks: ["§ 80", "§ 90", "§ 95"],
          foot: ["BetrVG", "KI-Verordnung"],
        }
      : {
          alt: `20 questions for youth reps and works councils. JAV election: ${election}`,
          label: ["Printable", "CC BY 4.0"],
          big: "20",
          caption: "Questions for youth reps and works councils. JAV election:",
          emphasis: election,
          marks: ["§ 80", "§ 90", "§ 95"],
          foot: ["BetrVG", "EU AI Act"],
        };
  },
};

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

const LATEST_ISSUE = Math.max(...BLOG_POSTS.map((post) => post.postNumber));

function postCopy(post: BlogPost, locale: Locale) {
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

function issueNumber(value: number): string {
  return String(value).padStart(2, "0");
}

/** A post without its own preview sheet still gets a filled one. */
function postVisual(post: BlogPost, locale: Locale): PostVisual {
  const own = POST_VISUALS[post.slug];
  if (own) return own(locale);
  const copy = COPY[locale];
  const localized = postCopy(post, locale);
  const number = issueNumber(post.postNumber);
  return {
    alt: `${copy.articleNumber} ${number}: ${localized.title}`,
    label: [localized.tags[0] ?? copy.datelineTitle, number],
    big: `Nº ${number}`,
    caption: `${localized.tags[0] ?? ""}:`,
    emphasis: copy.readingTime(post.readingTimeMin),
    marks: [],
    foot: ["Tim Löhr", formatDate(post.datePublished, locale)],
  };
}

function ArticleCard({
  post,
  locale,
  variant,
}: {
  readonly post: BlogPost;
  readonly locale: Locale;
  readonly variant: "featured" | "earlier";
}) {
  const copy = COPY[locale];
  const number = issueNumber(post.postNumber);
  const localized = postCopy(post, locale);
  const visual = postVisual(post, locale);

  return (
    <Link
      href={localizeHref(`/blog/${post.slug}`, locale)}
      className={variant === "earlier" ? "row row--earlier" : "row"}
      aria-label={copy.readLabel(localized.title)}
      data-link-preview
      data-editorial-article={variant}
    >
      <div className="row__body">
        <div className="row__topline">
          <span className="row__tag">{localized.tags[0]}</span>
          <time className="row__date" dateTime={post.datePublished}>
            {formatDate(post.datePublished, locale)}
          </time>
          <span className="row__dot" aria-hidden="true">
            ·
          </span>
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
              <span className="row__dot" aria-hidden="true">
                ·
              </span>
              <span>{tag}</span>
            </span>
          ))}
          <span className="row__cta">
            {copy.read}{" "}
            <span className="arr" aria-hidden="true">
              ↗
            </span>
          </span>
        </div>
      </div>
      <div
        className="row__art"
        role="img"
        aria-label={visual.alt}
        data-article-preview
        data-risograph-sheet="article"
      >
        <div className="row__art-label">
          <span>{visual.label[0]}</span>
          <span>{visual.label[1]}</span>
        </div>
        <div className="row__art-body">
          <div className="row__art-big">{visual.big}</div>
          <div className="row__art-cap">
            {visual.caption} <b>{visual.emphasis}</b>
          </div>
        </div>
        {visual.marks.length > 0 ? (
          <div className="row__art-articles">
            {visual.marks.map((mark) => (
              <span key={mark}>{mark}</span>
            ))}
          </div>
        ) : null}
        <div className="row__art-foot">
          <span>{visual.foot[0]}</span>
          <span>{visual.foot[1]}</span>
        </div>
      </div>
    </Link>
  );
}

function BlogIndexContent({ locale }: { readonly locale: Locale }) {
  const copy = COPY[locale];
  const lastUpdated = formatDate(BLOG_LAST_MODIFIED, locale);
  const [featured, ...earlier] = BLOG_POSTS_NEWEST_FIRST;

  return (
    <>
      <div className="blog-dateline">
        <div className="left">
          <Dateline locale={locale} />
        </div>
        <div className="center">{copy.datelineTitle}</div>
        <div className="right">{BLOG_LAST_MODIFIED.slice(0, 4)}</div>
      </div>

      {/* The risograph masthead: giant "Blog." with the Mennige full stop,
          the issue sheet on its stacked paper and the acid block behind it.
          data-cover-band lets the band checks (contrast, focus) sample it
          like every other page head. */}
      <section
        className="mast--hero"
        aria-labelledby="blog-title"
        data-risograph-hero
        data-cover-band=""
      >
        <div className="mast__statement">
          <p className="mast__label">{copy.datelineTitle}</p>
          <h1 id="blog-title" className="mast__title">
            Blog<span className="k">.</span>
          </h1>
          <p className="mast__sub">{copy.intro}</p>
        </div>
        <div className="mast__meta" data-risograph-sheet="issue">
          <span className="mast__meta-index">Nº {issueNumber(LATEST_ISSUE)}</span>
          <div className="mast__meta-copy">
            <b>{copy.article(BLOG_POSTS.length)}</b>
            <span>
              {copy.lastUpdated}{" "}
              <time dateTime={BLOG_LAST_MODIFIED}>{lastUpdated}</time>
            </span>
            <span className="live">{copy.rhythm}</span>
          </div>
        </div>
      </section>

      <section className="feed" data-editorial-bento aria-label={copy.feedLabel}>
        <div className="feed__head">
          <div className="hash">{copy.allArticles}</div>
          <div className="title">{copy.feedTitle}</div>
          <div className="count">
            <b>{BLOG_POSTS.length}</b> {copy.published}
          </div>
        </div>

        <div className="editorial-grid">
          {featured ? (
            <div className="article-stack">
              <p className="article-stack__label">{copy.featured}</p>
              <ArticleCard post={featured} locale={locale} variant="featured" />
            </div>
          ) : null}

          {earlier.length > 0 ? (
            <div className="article-archive">
              <p className="article-stack__label">
                {copy.earlier(earlier.length)}
              </p>
              {earlier.map((post) => (
                <ArticleCard
                  key={post.slug}
                  post={post}
                  locale={locale}
                  variant="earlier"
                />
              ))}
            </div>
          ) : null}

          <aside
            className="evidence-card"
            aria-labelledby="source-standard"
            data-risograph-sheet="sources"
          >
            <span className="evidence-card__register" aria-hidden="true" />
            <p className="evidence-card__label">{copy.sourceLabel}</p>
            <h2 id="source-standard">{copy.sourceTitle}</h2>
            <p>{copy.sourceBody}</p>
            <ul>
              {copy.sourceMarks.map((mark, index) => (
                <li key={mark}>
                  <span>{issueNumber(index + 1)}</span>
                  {mark}
                </li>
              ))}
            </ul>
          </aside>

          <aside
            className="feed__note"
            aria-labelledby="publishing-note"
            data-risograph-sheet="note"
          >
            <div>
              <p className="feed__note-label">{copy.noteLabel}</p>
              <h2 id="publishing-note">{copy.rhythm}</h2>
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
