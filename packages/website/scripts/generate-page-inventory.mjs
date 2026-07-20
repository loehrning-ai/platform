/**
 * Canonical page inventory generator.
 *
 * Generates docs/seo/page-inventory.md from the crawl contract
 * (src/lib/crawl/contract.ts) plus the content catalogs (books, demos,
 * blog manifest, wie-ki lektionen).
 *
 * Run with bun (it imports the TypeScript modules directly):
 *
 *   cd packages/website && bun scripts/generate-page-inventory.mjs
 *
 * Honesty rules:
 * - The inventory only contains fields that a checked source can prove.
 * - Missing source files or required catalog metadata stop generation.
 * - Owner is Tim Löhr for every page (single-operator platform).
 * - The generated file is a committed artifact; regenerate after contract or
 *   catalog changes and commit the diff.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const { CRAWL_CONTRACT, SITE_ORIGIN } = await import(join(ROOT, "src/lib/crawl/contract.ts"));
const { SITE_CONTENT_DATE } = await import(join(ROOT, "src/lib/content-freshness.ts"));
const { books } = await import(join(ROOT, "src/lib/books.ts"));
const { demos } = await import(join(ROOT, "src/lib/demos.ts"));
const { BLOG_POSTS } = await import(join(ROOT, "src/lib/blog-metadata.ts"));
const { WIE_KI_LEKTIONEN } = await import(join(ROOT, "src/lib/wie-ki-funktioniert.ts"));
const { IMPORTED_COURSE_CATALOG } = await import(join(ROOT, "src/lib/courses/catalog.ts"));
const { OPEN_SOURCE_ARTIFACTS } = await import(join(ROOT, "src/lib/open-source/artifacts.ts"));

const OWNER = "Tim Löhr";
const GENERATED_DATE = SITE_CONTENT_DATE;

/** Escapes pipes and trims cell text so markdown tables stay intact. */
function cell(value, maxLength = 110) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error("Inventory cells must have a checked, non-empty value");
  }
  const text = String(value)
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ")
    // Keep generated table cells typographically consistent and easy to diff.
    .replaceAll("\u{2014}", "-")
    .replaceAll("\u{2013}", "-")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

/** Resolves the source page for a static route and fails on contract drift. */
function staticSourceAsset(pattern) {
  if (pattern === "/") return "src/app/page.tsx";
  const candidate = `src/app${pattern}/page.tsx`;
  if (!existsSync(join(ROOT, candidate))) {
    throw new Error(`Indexable static route ${pattern} has no source page at ${candidate}`);
  }
  return candidate;
}

function row(fields) {
  return `| ${fields.map((f) => cell(f)).join(" | ")} |`;
}

function table(headers, rows) {
  return [row(headers), `|${" --- |".repeat(headers.length)}`, ...rows].join("\n");
}

// ---------------------------------------------------------------------------
// Indexable pages
// ---------------------------------------------------------------------------

const staticEntries = CRAWL_CONTRACT.filter(
  (entry) => entry.routeClass === "public-indexable" && !entry.pattern.includes(":"),
);

const staticRows = staticEntries.map((entry) =>
  row([
    `${SITE_ORIGIN}${entry.pattern === "/" ? "" : entry.pattern}`,
    staticSourceAsset(entry.pattern),
    `canonical content date ${GENERATED_DATE}`,
    entry.includeInSitemap ? "yes" : "no",
    OWNER,
  ]),
);

const STATIC_HEADERS = [
  "Canonical URL",
  "Source/proof asset",
  "Freshness evidence",
  "In sitemap",
  "Owner",
];

const CONTENT_HEADERS = [
  "Canonical URL",
  "Title",
  "Description",
  "Source/proof asset",
  "Freshness evidence",
  "Owner",
];

const wieKiRows = WIE_KI_LEKTIONEN.map((lektion) =>
  row([
    `${SITE_ORIGIN}/wie-ki-funktioniert/${lektion.id}`,
    lektion.title,
    lektion.subtitle,
    "src/lib/wie-ki-funktioniert.ts",
    `canonical content date ${GENERATED_DATE}`,
    OWNER,
  ]),
);

const blogRows = BLOG_POSTS.map((post) =>
  row([
    `${SITE_ORIGIN}/blog/${post.slug}`,
    post.titleDe,
    post.summary,
    `src/lib/blog-metadata.ts + src/app/blog/${post.slug}/page.tsx`,
    `manifest dateModified ${post.dateModified}`,
    OWNER,
  ]),
);

const bookRows = books.map((book) =>
  row([
    `${SITE_ORIGIN}/buecher/${book.id}`,
    book.title,
    book.description,
    `src/lib/books.ts + content/books/${book.id}/`,
    `catalog lastReviewed ${book.lastReviewed}`,
    OWNER,
  ]),
);

const demoRows = demos.map((demo) =>
  row([
    `${SITE_ORIGIN}/demos/${demo.slug}`,
    demo.title,
    demo.description,
    "src/lib/demos.ts",
    `canonical content date ${GENERATED_DATE}`,
    OWNER,
  ]),
);

const importedCourseRows = IMPORTED_COURSE_CATALOG.map((course) =>
  row([
    `${SITE_ORIGIN}${course.href}`,
    course.title,
    course.description,
    "src/lib/courses/catalog.ts",
    `source revision ${course.sourceCommit}`,
    OWNER,
  ]),
);

const openSourceArtifactRows = OPEN_SOURCE_ARTIFACTS.map((artifact) =>
  row([
    `${SITE_ORIGIN}${artifact.href}`,
    artifact.title,
    artifact.description,
    "src/lib/open-source/artifacts.ts",
    `source revision ${artifact.source.revision}`,
    OWNER,
  ]),
);

// ---------------------------------------------------------------------------
// Non-indexable classes (pattern-level summary)
// ---------------------------------------------------------------------------

function classTable(routeClass) {
  const rows = CRAWL_CONTRACT.filter((entry) => entry.routeClass === routeClass).map(
    (entry) => `| \`${entry.pattern}\` | ${cell(entry.explanation, 160)} |`,
  );
  return ["| Pattern | Explanation |", "| --- | --- |", ...rows].join("\n");
}

const indexableExcluded = CRAWL_CONTRACT.filter(
  (entry) => entry.routeClass === "public-indexable" && !entry.includeInSitemap,
).map((entry) => `- \`${entry.pattern}\`: ${entry.explanation}`);

// ---------------------------------------------------------------------------
// Document assembly
// ---------------------------------------------------------------------------

const doc = `# Canonical Publication Inventory

GENERATED FILE - do not edit by hand. Regenerate with:

\`\`\`bash
cd packages/website && bun scripts/generate-page-inventory.mjs
\`\`\`

- Source of truth: \`src/lib/crawl/contract.ts\` (crawl contract) plus the
  content catalogs (\`src/lib/books.ts\`, \`src/lib/demos.ts\`,
  \`src/lib/blog-metadata.ts\`,
  \`src/lib/wie-ki-funktioniert.ts\`, \`src/lib/courses/catalog.ts\`,
  \`src/lib/open-source/artifacts.ts\`).
- Generated from the canonical content date: ${GENERATED_DATE}. Owner of every page: ${OWNER}.
- This is a mechanically generated publication inventory, not a fabricated
  keyword, schema, or internal-link audit. It includes only values proved by
  the crawl contract, source files, and typed content catalogs. Generation
  fails when required evidence is missing.

## Indexable pages (class: public-indexable)

### Static pages (${staticRows.length})

${table(STATIC_HEADERS, staticRows)}

### Wie-KI-funktioniert Lektionen (${wieKiRows.length})

${table(CONTENT_HEADERS, wieKiRows)}

### Blog posts (${blogRows.length})

${table(CONTENT_HEADERS, blogRows)}

### Buch-Detailseiten (${bookRows.length})

${table(CONTENT_HEADERS, bookRows)}

### Demo-Detailseiten (${demoRows.length})

${table(CONTENT_HEADERS, demoRows)}

### Technische Labore (importierte Kurse) (${importedCourseRows.length})

${table(CONTENT_HEADERS, importedCourseRows)}

### Open-Source-Artefakte (${openSourceArtifactRows.length})

${table(CONTENT_HEADERS, openSourceArtifactRows)}

### Indexable patterns deliberately excluded from the sitemap

${indexableExcluded.join("\n")}

## Public-access patterns (crawlable, not in sitemap)

${classTable("public-access")}

## Public-noindex patterns

${classTable("public-noindex")}

## Machine-readable surfaces (public-machine)

${classTable("public-machine")}

## Asset patterns (public-assets)

${classTable("public-assets")}

## Protected patterns

${classTable("protected")}

## Retired patterns

${classTable("retired")}
`;

const outDir = join(ROOT, "docs", "seo");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "page-inventory.md");
if (process.argv.includes("--check")) {
  const existing = existsSync(outPath) ? readFileSync(outPath, "utf8") : null;
  if (existing !== doc) {
    console.error(
      "[generate-page-inventory] inventory is stale; run bun run page-inventory:generate",
    );
    process.exitCode = 1;
  } else {
    console.log("[generate-page-inventory] inventory is current");
  }
} else {
  writeFileSync(outPath, doc, "utf8");
  console.log(`[generate-page-inventory] wrote ${outPath}`);
}
