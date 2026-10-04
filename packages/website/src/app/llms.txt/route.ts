import type { NextRequest } from "next/server";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  isSkillName,
  SKILL_DOCUMENT_FILENAME,
  skillsContentRoot,
} from "@/app/skills/_lib/registry";
import { BLOG_POSTS } from "@/lib/blog-metadata";
import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import { STAND_DATE } from "@/lib/content-meta";
import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalog } from "@/lib/courses/catalog-copy";
import { courseFacts } from "@/lib/courses/tracks";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { localizeHref } from "@/lib/i18n/locale";
import { OPEN_SOURCE_ARTIFACT_SECTIONS } from "@/lib/open-source/artifacts";
import { SITE_ENTITY, SITE_ORIGIN, TIM_ENTITY } from "@/lib/seo/entity";
import { getWorkshops } from "@/lib/workshops";

export const dynamic = "force-static";

type PublicPage = Readonly<{
  path: string;
  de: string;
  en: string;
}>;

const PUBLIC_PAGES: readonly PublicPage[] = [
  { path: "/", de: "Startseite", en: "Home" },
  { path: "/kurse", de: "Kursübersicht", en: "Course catalog" },
  { path: "/einstieg", de: "Einstieg", en: "Introduction" },
  { path: "/ki-check", de: "KI-Check", en: "AI self-check" },
  { path: "/buecher", de: "Bücher", en: "Books" },
  { path: "/demos", de: "Demos", en: "Demos" },
  { path: "/workshops", de: "Workshops", en: "Workshops" },
  { path: "/open-source", de: "Open Source", en: "Open source" },
  {
    path: "/open-source/lizenzrichtlinie",
    de: "Lizenzrichtlinie",
    en: "Licence policy",
  },
  { path: "/blog", de: "Blog", en: "Blog" },
  {
    path: "/ueber-mich",
    de: `Profil: ${TIM_ENTITY.displayName}`,
    en: `Profile: ${TIM_ENTITY.displayName}`,
  },
  { path: "/hilfe", de: "Hilfe", en: "Help" },
  { path: "/impressum", de: "Impressum", en: "Legal notice" },
  { path: "/datenschutz", de: "Datenschutz", en: "Privacy" },
];

function absolutePath(path: string): string {
  return `${SITE_ORIGIN}${path === "/" ? "" : path}`;
}

function englishUrl(path: string): string {
  return absolutePath(localizeHref(path, "en"));
}

function localizedEntry(
  germanTitle: string,
  path: string,
  englishTitle = germanTitle,
): string {
  const canonical = `- ${germanTitle}: ${absolutePath(path)}`;
  if (!contentLocalesForPath(path).includes("en")) return canonical;
  return `${canonical}\n  - English: ${englishTitle}: ${englishUrl(path)}`;
}

function courseLines(group: "spine" | "deeper"): string {
  const german = localizeCatalog(COURSE_CATALOG, "de").filter(
    (course) => courseFacts(course.slug).group === group,
  );
  const englishBySlug = new Map(
    localizeCatalog(COURSE_CATALOG, "en").map((course) => [
      course.slug,
      course,
    ]),
  );
  return german
    .map((course) =>
      localizedEntry(
        course.title,
        course.href,
        englishBySlug.get(course.slug)?.title ?? course.title,
      ),
    )
    .join("\n");
}

function importedCourseLines(): string {
  const german = localizeCatalog(IMPORTED_COURSE_CATALOG, "de");
  const englishBySlug = new Map(
    localizeCatalog(IMPORTED_COURSE_CATALOG, "en").map((course) => [
      course.slug,
      course,
    ]),
  );
  return german
    .map((course) =>
      localizedEntry(
        course.title,
        course.href,
        englishBySlug.get(course.slug)?.title ?? course.title,
      ),
    )
    .join("\n");
}

function workshopLines(): string {
  const englishBySlug = new Map(
    getWorkshops("en").map((workshop) => [workshop.slug, workshop]),
  );
  return getWorkshops("de")
    .map((workshop) =>
      localizedEntry(
        workshop.title,
        `/workshops/${workshop.slug}`,
        englishBySlug.get(workshop.slug)?.title ?? workshop.title,
      ),
    )
    .join("\n");
}

function openSourceSections(): string {
  return OPEN_SOURCE_ARTIFACT_SECTIONS.filter(
    (section) => section.artifacts.length > 0,
  )
    .map((section) => {
      const lines = section.artifacts
        .map((artifact) => localizedEntry(artifact.title, artifact.href))
        .join("\n");
      return `## Open Source: ${section.heading}\n\n${lines}`;
    })
    .join("\n\n");
}

/**
 * Skill names from the content directory, the same source the skills route
 * serves from, filtered by the registry's own name rule so this list and the
 * served collection cannot disagree. Read synchronously because this handler
 * is synchronous by contract: its callers read the body without awaiting the
 * handler itself. Only a document that exists is listed; a missing directory
 * means an empty collection, any other filesystem fault fails the build.
 */
function skillNames(): readonly string[] {
  const root = skillsContentRoot();
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | null)?.code;
    if (code === "ENOENT" || code === "ENOTDIR") return [];
    throw error;
  }
  return entries
    .filter(
      (entry) =>
        entry.isDirectory() &&
        isSkillName(entry.name) &&
        existsSync(join(root, entry.name, SKILL_DOCUMENT_FILENAME)),
    )
    .map((entry) => entry.name)
    .sort();
}

function skillLines(): string {
  return skillNames()
    .map(
      (name) =>
        `- Agenten-Skill ${name} / Agent skill ${name}: ${SITE_ORIGIN}/skills/${name}/${SKILL_DOCUMENT_FILENAME}`,
    )
    .join("\n");
}

function englishIndex(): string {
  return PUBLIC_PAGES.filter((page) =>
    contentLocalesForPath(page.path).includes("en"),
  )
    .map((page) => `- ${page.en}: ${englishUrl(page.path)}`)
    .join("\n");
}

function renderBody(): string {
  const blogLines = BLOG_POSTS.map((post) =>
    localizedEntry(post.titleDe, `/blog/${post.slug}`, post.titleEn),
  ).join("\n");
  const publicPageLines = PUBLIC_PAGES.map((page) =>
    localizedEntry(page.de, page.path, page.en),
  ).join("\n");
  const externalLabs = importedCourseLines();
  const externalLabsSection = externalLabs
    ? `## Externe technische Labore\n\n${externalLabs}`
    : "";
  const sections = [
    `## Grundlagenpfad\n\n${courseLines("spine")}`,
    `## Visuelles Lernen\n\n${courseLines("deeper")}`,
    `## Workshops\n\n${workshopLines()}`,
    externalLabsSection,
    openSourceSections(),
  ]
    .filter(Boolean)
    .join("\n\n");

  return `# loehrning.ai

${SITE_ENTITY.description}

Free AI and data learning resources in German and English. Each page states its access, sources and completion-record status.

## Öffentlicher Bereich / Public access

Öffentlich sind Landingpages, Kursreader zum visuellen Lernen, Bücher, Demos, Workshops, Blog, Open-Source-Artefakte und maschinenlesbare Metadaten. Die Reader der vier Grundlagenkurse brauchen ein Konto. Quiz-, Abschluss- und Verifizierungsseiten können direkt erreichbar sein, werden aber nicht indexiert.

Public content: landing pages, visual-learning course readers, books, demos, workshops, the blog, open-source artifacts and machine-readable metadata. The four foundation-course readers require an account. Quiz, completion and verification pages may be reachable directly but are not indexed.

## Sprachen und URLs / Languages and URLs

Kanonische deutsche URLs haben kein Präfix, geprüfte englische Fassungen liegen unter /en. Eine /en-URL steht hier und in der Sitemap erst nach geprüfter Inhalts- und Routenparität. Nicht gelistete /en-Seiten gelten nicht als übersetzt.

Canonical German URLs have no prefix; reviewed English versions live under /en. An /en URL appears here and in the sitemap only after verified content and route parity. Treat unlisted /en routes as untranslated.

## Private Zustände / Private state

Mit vollständiger Providerkonfiguration speichert das Lernkonto Fortschritt, Quiz- und Abschlussstatus und Datenschutzaktionen auf dem Server. Ohne sie bleiben kontogeschützte Reader geschlossen. Private APIs, Kontoseiten, Providerkonfiguration und Betriebsnachweise fehlen in dieser Datei.

With full provider configuration, the learning account stores progress, quiz and completion state and privacy actions on the server. Without it, protected readers stay closed. Private APIs, account pages, provider configuration and operational evidence are not listed here.

## Öffentliche Seiten / Public pages

${publicPageLines}
- Sitemap: ${SITE_ORIGIN}/sitemap.xml
- Öffentlicher Buchkatalog / Public book catalog: ${SITE_ORIGIN}/api/books.json
- Öffentlicher Kurskatalog / Public course catalog: ${SITE_ORIGIN}/api/courses.json
- Öffentlicher Workshopkatalog / Public workshop catalog: ${SITE_ORIGIN}/api/workshops.json
- Öffentlicher Wissensgraph / Public knowledge graph: ${SITE_ORIGIN}/api/knowledge-graph.json

## Agenten-Zugang / Agent access

Jeder MCP-Client (etwa Claude Desktop, Claude Code oder Codex) liest über den MCP-Endpunkt die öffentlichen Inhalte: Kurse, Lektionen, Workshops mit Materialien, Buchkapitel, Open-Source-Werkzeuge, Suche und Wissensgraph. Lernstand und nächsten Schritt liest er erst nach OAuth-Freigabe oder mit einem persönlichen Zugriffstoken aus dem Konto. Der Endpunkt schreibt nie. Ist er in einer Umgebung nicht aktiviert, bleiben diese Datei und die JSON-Kataloge die maschinenlesbaren Quellen.

Any MCP client (such as Claude Desktop, Claude Code or Codex) reads the public content through the MCP endpoint: courses, lessons, workshops with materials, book chapters, open-source tools, search and the knowledge graph. It reads progress and the next step only after an OAuth grant or with a personal access token from the account. The endpoint never writes. When a deployment has it disabled, this file and the JSON catalogs remain the machine-readable sources.

- MCP-Endpunkt (Streamable HTTP, GET zeigt die Einrichtung) / MCP endpoint (Streamable HTTP, GET shows the setup guide): ${SITE_ORIGIN}/api/mcp
- OAuth-Ressourcenmetadaten des Endpunkts (RFC 9728) / Protected resource metadata for the endpoint (RFC 9728): ${SITE_ORIGIN}/.well-known/oauth-protected-resource/api/mcp
- OAuth-Ressourcenmetadaten der Website / Site-level protected resource metadata: ${SITE_ORIGIN}/.well-known/oauth-protected-resource
${skillLines()}

## Reviewed English index

${englishIndex()}

## Blog

${blogLines}

${sections}

## Wiederverwendung und Zitation / Reuse and citation

Öffentliche Seiten dürfen zitiert und verlinkt werden. Abschlussdokumente sind selbst ausgestellte Teilnahmebestätigungen oder Lernnachweise, keine amtlichen oder akkreditierten Nachweise. Rechtsbezogene Inhalte ersetzen keine Rechtsberatung.

Public pages may be cited and linked. Completion documents are self-issued participation or learning records, not official or accredited credentials. Legal content is not legal advice.

## Datenstand / Content date

Stand der Kerninhalte: ${STAND_DATE}. Veröffentlichungsdatum dieser Datei: ${SITE_CONTENT_DATE}.
Core-content date: ${STAND_DATE}. Publication date of this file: ${SITE_CONTENT_DATE}.
`;
}

export function GET(_req: NextRequest): Response {
  return new Response(renderBody(), {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Language": "de, en",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      Link: `<${SITE_ORIGIN}/sitemap.xml>; rel="sitemap"`,
    },
  });
}
