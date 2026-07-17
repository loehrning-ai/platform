import { NextResponse } from "next/server";
import { BLOG_POSTS } from "@/lib/blog-metadata";
import { books } from "@/lib/books";
import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import { IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { getCrawlRoute } from "@/lib/crawl/contract";
import { demos } from "@/lib/demos";
import { LEARNING_EDGES, LEARNING_NODES } from "@/lib/learning-graph";
import { OPEN_SOURCE_ARTIFACTS } from "@/lib/open-source/artifacts";
import { absoluteUrl, GITHUB_ORG, SITE_ENTITY, SITE_ORIGIN } from "@/lib/seo/entity";
import { getAllVorlagenMeta } from "@/lib/vorlagen";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 3600;

function nodeWithCrawl(node: (typeof LEARNING_NODES)[number]) {
  const crawl = getCrawlRoute(node.route);
  return {
    id: node.id,
    type: node.type,
    title: node.title,
    url: absoluteUrl(node.route),
    language: node.language,
    access: node.access,
    crawlClass: crawl.routeClass,
    evidenceMode: node.evidenceMode,
    sourceOwner: node.sourceOwner,
    courseSlug: node.courseSlug ?? null,
    summary: node.summary ?? null,
  };
}

export async function GET() {
  const payload = {
    schema: `${SITE_ORIGIN}/schema/knowledge-graph/v1`,
    generatedAt: new Date(SITE_CONTENT_DATE).toISOString(),
    site: {
      name: SITE_ENTITY.name,
      url: SITE_ENTITY.origin,
      language: "de-DE",
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
        lastReviewed: book.lastReviewed,
        nextReview: book.nextReview,
        sourceOwner: book.sourceOwner,
      })),
      demos: demos.map((demo) => ({
        id: `demo:${demo.slug}`,
        url: absoluteUrl(`/demos/${demo.slug}`),
        lastReviewed: demo.lastReviewed,
        evidenceMode: demo.evidenceMode,
        riskNotes: demo.riskNotes,
      })),
      templates: getAllVorlagenMeta().map((template) => ({
        id: `template:${template.slug}`,
        url: absoluteUrl(`/vorlagen/${template.slug}`),
        lastReviewed: template.lastReviewed,
        nextReview: template.nextReview,
        sources: template.sources,
      })),
      blog: BLOG_POSTS.map((post) => ({
        id: `blog:${post.slug}`,
        url: absoluteUrl(`/blog/${post.slug}`),
        datePublished: post.datePublished,
        dateModified: post.dateModified,
        tags: post.tags,
      })),
      // Imported labs are /kurse catalog content with open-source upstreams;
      // they are not entries of the loehrning-ai artifact registry below.
      openSourceLabs: IMPORTED_COURSE_CATALOG.map((course) => ({
        id: `open-source-lab:${course.slug}`,
        url: absoluteUrl(course.href),
        sourceUrl: course.sourceHref,
        launchUrl: course.launchHref,
        sourceCommit: course.sourceCommit,
        licenseUrl: absoluteUrl(course.licenseHref),
      })),
      openSourceArtifacts: OPEN_SOURCE_ARTIFACTS.map((artifact) => ({
        id: artifact.id,
        kind: artifact.kind,
        url: absoluteUrl(artifact.href),
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
