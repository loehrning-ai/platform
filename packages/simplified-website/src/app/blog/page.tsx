import Link from "next/link";
import type { Metadata } from "next";

import { Dateline } from "./_components/dateline";
import { Runline } from "./_components/runline";
import { BLOG_POSTS, BLOG_LAST_MODIFIED } from "@/lib/blog-metadata";

export const metadata: Metadata = {
  title: { absolute: "Blog | loehrning.ai" },
  description:
    "Lange, nachprüfbare Texte über KI im Alltag, EU AI Act und KI in der Gesellschaft, für die breite deutschsprachige Öffentlichkeit.",
  alternates: { canonical: "/blog" },
};

// Runline items from the manifest — no hardcoded post titles
const runItems = [
  ...BLOG_POSTS.map(
    (p) => `Artikel Nº ${String(p.postNumber).padStart(2, "0")}: ${p.titleDe}`,
  ),
  "loehrning.ai",
  "Offen · Nachprüfbar · Lernorientiert",
];

// Most recent dateModified for "Zuletzt aktualisiert" label
const lastUpdated = new Date(BLOG_LAST_MODIFIED).toLocaleDateString("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const BLOG_DATE_FORMATTER = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

type BlogIndexVisual = {
  readonly label: string;
  readonly big: string;
  readonly caption: string;
  readonly emphasis: string;
  readonly foot: readonly [string, string];
};

const BLOG_INDEX_VISUALS: Record<string, BlogIndexVisual> = {
  "eu-ai-act-grundlagen": {
    label: "Sieben Abschnitte · Bürgerperspektive",
    big: "2. Aug",
    caption: "EU AI Act ab August 2026:",
    emphasis: "Art. 50 Transparenz + deine Rechte",
    foot: ["Reg. 2024/1689", "AI Omnibus 2026"],
  },
};

const BLOG_POSTS_NEWEST_FIRST = [...BLOG_POSTS].sort(
  (a, b) =>
    b.datePublished.localeCompare(a.datePublished) ||
    b.postNumber - a.postNumber,
);

function formatPostDate(date: string): string {
  return BLOG_DATE_FORMATTER.format(new Date(`${date}T00:00:00Z`));
}

export default function BlogIndexPage() {
  return (
    <>
      {/* Dateline strip */}
      <div className="blog-dateline">
        <div className="left">
          <Dateline />
        </div>
        <div className="center" style={{ color: "var(--druckertinte)", fontWeight: 700 }}>
          Der loehrning.ai Blog
        </div>
        <div className="right">2026</div>
      </div>

      {/* Masthead */}
      <section className="mast--hero">
        <div>
          <div className="mast__label">Der loehrning.ai Blog</div>
          <h1 className="mast__title">
            Blog<span className="k">.</span>
          </h1>
          <div className="mast__sub">
            Öffentliche Texte zu KI im Alltag, EU AI Act und KI in der
            Gesellschaft. Offen, nachprüfbar, mit Zahlen und Quellenangaben.
          </div>
        </div>
        <div className="mast__meta">
          <b>{BLOG_POSTS.length} Artikel</b>
          Zuletzt aktualisiert:
          <br />
          {lastUpdated}
          <br />
          <span className="live">Laufend ergänzt</span>
        </div>
      </section>

      <Runline items={runItems} />

      {/* Feed */}
      <section className="feed">
        <div className="feed__head">
          <div className="hash">§ Alle Artikel</div>
          <div className="title">Ein Thema, gründlich statt viel.</div>
          <div className="count">
            <b>{BLOG_POSTS.length}</b> erschienen
          </div>
        </div>

        {BLOG_POSTS_NEWEST_FIRST.map((post) => {
          const number = String(post.postNumber).padStart(2, "0");
          const visual = BLOG_INDEX_VISUALS[post.slug];
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="row"
              aria-label={`Artikel lesen: ${post.titleDe}`}
            >
              <div className="row__no">
                <span className="hash">Artikel Nº {number}</span>
                {number}
              </div>
              <div className="row__body">
                <div className="row__topline">
                  <span className="row__tag">{post.tags[0]}</span>
                  <span className="row__date">{formatPostDate(post.datePublished)}</span>
                  <span className="row__dot">·</span>
                  <span>{post.readingTimeMin} Min. Lesezeit</span>
                </div>
                <h2 className="row__title">{post.titleDe}</h2>
                <p className="row__dek">{post.summary}</p>
                <div className="row__foot">
                  <span className="row__author">Tim Löhr</span>
                  {post.tags.slice(1).map((tag) => (
                    <span key={tag} className="contents">
                      <span className="row__dot">·</span>
                      <span>{tag}</span>
                    </span>
                  ))}
                  <span className="row__cta">
                    Artikel lesen <span className="arr">→</span>
                  </span>
                </div>
              </div>
              {visual && (
                <div className="row__art" aria-hidden="true">
                  <div className="row__art-label">{visual.label}</div>
                  <div className="row__art-body">
                    <div className="row__art-big">{visual.big}</div>
                    <div className="row__art-cap">
                      {visual.caption} <b>{visual.emphasis}</b>
                    </div>
                  </div>
                  <div className="row__art-foot">
                    <span>{visual.foot[0]}</span>
                    <span style={{ color: "var(--kupfer)" }}>{visual.foot[1]}</span>
                  </div>
                </div>
              )}
            </Link>
          );
        })}

        {/* Note strip */}
        <div className="feed__note">
          <div className="feed__note-label">Kein Redaktionsplan.</div>
          <div className="feed__note-body">
            Dieser Blog erscheint <span className="k">unregelmäßig</span>.
            Neue Artikel entstehen, wenn ein Thema sauber genug erklärt werden kann
            und die Quellen stimmen.
          </div>
          <span className="feed__note-cta">Laufend ergänzt</span>
        </div>
      </section>
    </>
  );
}
