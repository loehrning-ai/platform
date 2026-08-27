import { NextResponse } from "next/server";
import { BLOG_POSTS } from "@/lib/blog-metadata";
import { books } from "@/lib/books";
import { getBookDisplay } from "@/app/buecher/book-copy";
import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import { IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalogCourse } from "@/lib/courses/catalog-copy";
import { getCrawlRoute } from "@/lib/crawl/contract";
import { demos } from "@/lib/demos";
import { getDemoForLocale } from "@/lib/demos-localization";
import { ENTRY_COPY } from "@/lib/i18n/public-info-copy";
import { KI_CHECK_PAGE_COPY } from "@/lib/ki-check/localization";
import { LEARNING_EDGES, LEARNING_NODES } from "@/lib/learning-graph";
import { OPEN_SOURCE_ARTIFACTS } from "@/lib/open-source/artifacts";
import {
  absoluteUrl,
  GITHUB_ORG,
  SITE_ENTITY,
} from "@/lib/seo/entity";
import { KNOWLEDGE_GRAPH_SCHEMA_ID } from "@/lib/seo/knowledge-graph-schema";
import { getWorkshopBySlug, WORKSHOPS } from "@/lib/workshops";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 3600;

const PAGE_LANGUAGE_TAG = {
  de: "de-DE",
  en: "en-GB",
} as const;

function localizedPagesFor<T extends object>(
  path: string,
  fieldsForLocale: (locale: Locale) => T,
) {
  return Object.fromEntries(
    contentLocalesForPath(path).map((locale) => [
      locale,
      {
        url: absoluteUrl(localizeHref(path, locale)),
        pageLanguage: PAGE_LANGUAGE_TAG[locale],
        ...fieldsForLocale(locale),
      },
    ]),
  );
}

function localizedNodeCopy(
  node: (typeof LEARNING_NODES)[number],
  locale: Locale,
) {
  if (node.type === "course" && node.courseSlug) {
    const course = COURSE_CATALOG.find(({ slug }) => slug === node.courseSlug);
    if (course) {
      const localized = localizeCatalogCourse(course, locale);
      return { title: localized.title, summary: localized.description };
    }
  }

  if (node.type === "book") {
    const book = books.find(({ id }) => `book:${id}` === node.id);
    if (book) {
      const localized = getBookDisplay(book, locale);
      return { title: localized.title, summary: localized.description };
    }
  }

  if (node.type === "demo") {
    const demo = getDemoForLocale(node.id.slice("demo:".length), locale);
    if (demo) {
      return {
        title: demo.title.replace(/\.$/, ""),
        summary: demo.description,
      };
    }
  }

  if (node.type === "workshop") {
    const workshop = getWorkshopBySlug(
      node.id.slice("workshop:".length),
      locale,
    );
    if (workshop) {
      return { title: workshop.title, summary: workshop.summary };
    }
  }

  if (node.type === "open_source_lab") {
    const course = IMPORTED_COURSE_CATALOG.find(
      ({ slug }) => `open-source-lab:${slug}` === node.id,
    );
    if (course) {
      const localized = localizeCatalogCourse(course, locale);
      return { title: localized.title, summary: localized.description };
    }
  }

  if (node.id === "self-test:ki-check") {
    const copy = KI_CHECK_PAGE_COPY[locale];
    return { title: copy.title, summary: copy.description };
  }

  if (node.id === "on-ramp:einstieg") {
    const copy = ENTRY_COPY[locale].metadata;
    return { title: copy.title, summary: copy.description };
  }

  if (locale === node.language) {
    return { title: node.title, summary: node.summary ?? null };
  }

  throw new Error(`Missing ${locale} machine copy for node "${node.id}".`);
}

function nodeWithCrawl(node: (typeof LEARNING_NODES)[number]) {
  const crawl = getCrawlRoute(node.route);
  return {
    id: node.id,
    type: node.type,
    title: node.title,
    url: absoluteUrl(node.route),
    canonicalPageLanguage: PAGE_LANGUAGE_TAG[node.language],
    availablePageLanguages: contentLocalesForPath(node.route).map(
      (locale) => PAGE_LANGUAGE_TAG[locale],
    ),
    sourceMaterialLanguages: node.sourceMaterialLanguages,
    localizedPages: localizedPagesFor(node.route, (locale) =>
      localizedNodeCopy(node, locale),
    ),
    access: node.access,
    crawlClass: crawl.routeClass,
    evidenceMode: node.evidenceMode,
    sourceOwner: node.sourceOwner,
    courseSlug: node.courseSlug ?? null,
    summary: node.summary ?? null,
  };
}

function localizedUrlsFor(path: string) {
  return Object.fromEntries(
    contentLocalesForPath(path).map((locale) => [
      locale,
      absoluteUrl(localizeHref(path, locale)),
    ]),
  );
}

export async function GET() {
  const payload = {
    schema: KNOWLEDGE_GRAPH_SCHEMA_ID,
    generatedAt: new Date(SITE_CONTENT_DATE).toISOString(),
    site: {
      name: SITE_ENTITY.name,
      url: SITE_ENTITY.origin,
      language: ["de-DE", "en-GB"],
      openSourceHub: SITE_ENTITY.openSourceUrl,
    },
    openSource: {
      organization: GITHUB_ORG.slug,
      orgUrl: GITHUB_ORG.url,
      sourcePolicy:
        "Only published sources with a pinned commit and explicit license appear in the public catalog.",
    },
    nodes: LEARNING_NODES.map(nodeWithCrawl),
    edges: LEARNING_EDGES,
    catalogs: {
      books: books.map((book) => ({
        id: `book:${book.id}`,
        url: absoluteUrl(book.readerHref),
        localizedUrls: localizedUrlsFor(book.readerHref),
        lastReviewed: book.lastReviewed,
        nextReview: book.nextReview,
        sourceOwner: book.sourceOwner,
      })),
      demos: demos.map((demo) => ({
        id: `demo:${demo.slug}`,
        url: absoluteUrl(`/demos/${demo.slug}`),
        sourceMaterialLanguages: ["de"],
        localizedPages: localizedPagesFor(`/demos/${demo.slug}`, (locale) => {
          const localized = getDemoForLocale(demo.slug, locale);
          if (!localized) {
            throw new Error(`Missing ${locale} demo copy for "${demo.slug}".`);
          }
          return {
            title: localized.title.replace(/\.$/, ""),
            riskNotes: localized.riskNotes,
          };
        }),
        lastReviewed: demo.lastReviewed,
        evidenceMode: demo.evidenceMode,
      })),
      blog: BLOG_POSTS.map((post) => ({
        id: `blog:${post.slug}`,
        url: absoluteUrl(`/blog/${post.slug}`),
        localizedUrls: localizedUrlsFor(`/blog/${post.slug}`),
        datePublished: post.datePublished,
        dateModified: post.dateModified,
        tags: post.tags,
        localizedTitles: { de: post.titleDe, en: post.titleEn },
        localizedSummaries: { de: post.summary, en: post.summaryEn },
        localizedTags: { de: post.tags, en: post.tagsEn },
      })),
      workshops: WORKSHOPS.map((workshop) => ({
        id: `workshop:${workshop.slug}`,
        url: absoluteUrl(`/workshops/${workshop.slug}`),
        sourceMaterialLanguages: Array.from(
          new Set(workshop.materials.map((material) => material.language)),
        ),
        localizedPages: localizedPagesFor(
          `/workshops/${workshop.slug}`,
          (locale) => {
            const localized = getWorkshopBySlug(workshop.slug, locale);
            if (!localized) {
              throw new Error(
                `Missing ${locale} workshop copy for "${workshop.slug}".`,
              );
            }
            return {
              title: localized.title,
              format: localized.format,
              duration: localized.duration,
            };
          },
        ),
        materialCount: workshop.materials.length,
        evidenceMode: "synthetic",
      })),
      // Imported labs are /kurse catalog content with open-source upstreams;
      // they are not entries of the loehrning-ai artifact registry below.
      openSourceLabs: IMPORTED_COURSE_CATALOG.map((course) => ({
        id: `open-source-lab:${course.slug}`,
        url: absoluteUrl(course.href),
        localizedUrls: localizedUrlsFor(course.href),
        sourceUrl: course.sourceHref,
        launchUrl: course.launchHref,
        sourceCommit: course.sourceCommit,
        licenseUrl: absoluteUrl(course.licenseHref),
      })),
      openSourceArtifacts: OPEN_SOURCE_ARTIFACTS.map((artifact) => ({
        id: artifact.id,
        kind: artifact.kind,
        url: absoluteUrl(artifact.href),
        localizedUrls: localizedUrlsFor(artifact.href),
        sourceUrl: artifact.source.href,
        sourceCommit: artifact.source.revision,
        licenseUrl: absoluteUrl(artifact.license.href),
        accessUrl:
          artifact.kind === "video"
            ? absoluteUrl(artifact.watchHref)
            : artifact.launchHref
              ? absoluteUrl(artifact.launchHref)
              : absoluteUrl(artifact.href),
      })),
    },
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
