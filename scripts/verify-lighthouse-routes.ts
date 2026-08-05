#!/usr/bin/env bun

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BLOG_POSTS } from "../packages/website/src/lib/blog-metadata";
import { books } from "../packages/website/src/lib/books";
import {
  CRAWL_CONTRACT,
  matchesPattern,
  type CrawlRoute,
} from "../packages/website/src/lib/crawl/contract";
import { demos } from "../packages/website/src/lib/demos";
import { OPEN_SOURCE_ARTIFACTS } from "../packages/website/src/lib/open-source/artifacts";
import { WIE_KI_LEKTIONEN } from "../packages/website/src/lib/wie-ki-funktioniert";
import { getWorkshopSlugs } from "../packages/website/src/lib/workshops";

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEBSITE_ROOT = path.join(REPOSITORY_ROOT, "packages", "website");
export const LIGHTHOUSE_ORIGIN = "http://localhost:3000";

type LighthouseConfig = {
  ci?: {
    collect?: {
      url?: unknown;
    };
  };
};

export type LighthouseRouteSummary = {
  configuredRoutes: number;
  staticRoutes: number;
  dynamicPatterns: number;
};

function fail(problems: readonly string[]): never {
  throw new Error(
    `Lighthouse route contract failed (${problems.length} problem${problems.length === 1 ? "" : "s"}):\n` +
      problems.map((problem) => `- ${problem}`).join("\n"),
  );
}

function canonicalConfiguredPath(rawUrl: string, origin: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (
    url.origin !== origin ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    return null;
  }
  if (url.pathname !== "/" && url.pathname.endsWith("/")) return null;
  if (rawUrl !== `${origin}${url.pathname}`) return null;
  return url.pathname;
}

/**
 * Validates the cheap, deterministic contract around a Lighthouse run.
 * It does not launch Chromium or claim performance results.
 */
export function verifyLighthouseRouteConfig({
  config,
  crawlContract,
  dynamicCandidates,
  origin = LIGHTHOUSE_ORIGIN,
}: {
  config: LighthouseConfig;
  crawlContract: readonly CrawlRoute[];
  dynamicCandidates: ReadonlyMap<string, readonly string[]>;
  origin?: string;
}): LighthouseRouteSummary {
  const problems: string[] = [];
  const rawUrls = config.ci?.collect?.url;
  if (!Array.isArray(rawUrls) || rawUrls.length === 0) {
    fail(["ci.collect.url must be a non-empty array"]);
  }

  const configuredPaths: string[] = [];
  for (const [index, value] of rawUrls.entries()) {
    if (typeof value !== "string") {
      problems.push(`ci.collect.url[${index}] must be a string`);
      continue;
    }
    const pathname = canonicalConfiguredPath(value, origin);
    if (!pathname) {
      problems.push(
        `ci.collect.url[${index}] must be a canonical ${origin} URL without credentials, query, hash, or a non-root trailing slash: ${value}`,
      );
      continue;
    }
    configuredPaths.push(pathname);
  }

  const duplicates = [...new Set(configuredPaths.filter(
    (pathname, index) => configuredPaths.indexOf(pathname) !== index,
  ))];
  for (const pathname of duplicates) {
    problems.push(`duplicate Lighthouse route: ${pathname}`);
  }

  const publicIndexable = crawlContract.filter(
    (entry) => entry.routeClass === "public-indexable",
  );
  const staticRoutes = publicIndexable.filter((entry) => !entry.pattern.includes(":"));
  const dynamicRoutes = publicIndexable.filter((entry) => entry.pattern.includes(":"));
  const configured = new Set(configuredPaths);

  for (const entry of staticRoutes) {
    if (!configured.has(entry.pattern)) {
      problems.push(`missing static public-indexable route: ${entry.pattern}`);
    }
  }

  for (const entry of dynamicRoutes) {
    if (!dynamicCandidates.has(entry.pattern)) {
      problems.push(`dynamic public-indexable pattern has no candidate source: ${entry.pattern}`);
      continue;
    }
    const candidates = [...new Set(dynamicCandidates.get(entry.pattern) ?? [])].sort();
    const invalidCandidates = candidates.filter(
      (candidate) => !matchesPattern(candidate, entry.pattern),
    );
    for (const candidate of invalidCandidates) {
      problems.push(`published candidate ${candidate} does not match ${entry.pattern}`);
    }
    if (candidates.length === 0) {
      problems.push(`dynamic public-indexable pattern has an empty candidate source: ${entry.pattern}`);
      continue;
    }
    if (!candidates.some((candidate) => configured.has(candidate))) {
      problems.push(`missing published representative for dynamic pattern: ${entry.pattern}`);
    }
  }

  for (const pathname of configuredPaths) {
    const entry = crawlContract.find((candidate) => matchesPattern(pathname, candidate.pattern));
    if (!entry) {
      problems.push(`configured route is absent from the crawl contract: ${pathname}`);
      continue;
    }
    if (entry.routeClass !== "public-indexable") {
      problems.push(
        `configured route must be public-indexable, got ${entry.routeClass}: ${pathname}`,
      );
      continue;
    }
    if (!entry.pattern.includes(":")) continue;
    const candidates = dynamicCandidates.get(entry.pattern) ?? [];
    if (!candidates.includes(pathname)) {
      problems.push(
        `configured dynamic route is not present in its publication catalog (${entry.pattern}): ${pathname}`,
      );
    }
  }

  if (problems.length > 0) fail(problems);
  return {
    configuredRoutes: configuredPaths.length,
    staticRoutes: staticRoutes.length,
    dynamicPatterns: dynamicRoutes.length,
  };
}

async function publishedBookChapterPaths(): Promise<string[]> {
  const paths: string[] = [];
  for (const book of books) {
    const manifestPath = path.join(
      WEBSITE_ROOT,
      "content",
      "books",
      book.id,
      "manifest.json",
    );
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      bookSlug?: unknown;
      chapters?: { slug?: unknown }[];
    };
    if (manifest.bookSlug !== book.id || !Array.isArray(manifest.chapters)) {
      throw new Error(`Invalid book manifest for Lighthouse candidates: ${manifestPath}`);
    }
    for (const chapter of manifest.chapters) {
      if (typeof chapter.slug !== "string" || chapter.slug.length === 0) {
        throw new Error(`Invalid chapter slug in Lighthouse candidate source: ${manifestPath}`);
      }
      paths.push(`/buecher/${book.id}/${chapter.slug}`);
    }
  }
  return paths;
}

export async function buildPublishedDynamicCandidates(): Promise<
  ReadonlyMap<string, readonly string[]>
> {
  const openSourceDetails = OPEN_SOURCE_ARTIFACTS.map((artifact) => artifact.href).filter(
    (href) => matchesPattern(href, "/open-source/:kind/:slug"),
  );
  return new Map([
    [
      "/wie-ki-funktioniert/:lektionId",
      WIE_KI_LEKTIONEN.map((lektion) => `/wie-ki-funktioniert/${lektion.id}`),
    ],
    ["/blog/:slug", BLOG_POSTS.map((post) => `/blog/${post.slug}`)],
    [
      "/workshops/:slug",
      getWorkshopSlugs().map((slug) => `/workshops/${slug}`),
    ],
    ["/buecher/:slug", books.map((book) => `/buecher/${book.id}`)],
    ["/demos/:slug", demos.map((demo) => `/demos/${demo.slug}`)],
    ["/open-source/:kind/:slug", openSourceDetails],
    ["/buecher/:slug/:chapter", await publishedBookChapterPaths()],
  ]);
}

async function main(): Promise<void> {
  const config = JSON.parse(
    await readFile(path.join(REPOSITORY_ROOT, "lighthouserc.json"), "utf8"),
  ) as LighthouseConfig;
  const summary = verifyLighthouseRouteConfig({
    config,
    crawlContract: CRAWL_CONTRACT,
    dynamicCandidates: await buildPublishedDynamicCandidates(),
  });
  process.stdout.write(
    `Lighthouse route contract passed: ${summary.configuredRoutes} configured routes, ` +
      `${summary.staticRoutes} static routes, ${summary.dynamicPatterns} dynamic patterns.\n`,
  );
}

if (import.meta.main) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
