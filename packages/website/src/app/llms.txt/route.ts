import type { NextRequest } from "next/server";
import { BLOG_POSTS } from "@/lib/blog-metadata";
import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import { STAND_DATE } from "@/lib/content-meta";
import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { OPEN_SOURCE_ARTIFACT_SECTIONS } from "@/lib/open-source/artifacts";
import { SITE_ENTITY, SITE_ORIGIN, TIM_ENTITY } from "@/lib/seo/entity";

export const dynamic = "force-static";

function renderBody(): string {
  const blogLines = BLOG_POSTS.map(
    (post) => `- ${post.titleDe}: ${SITE_ORIGIN}/blog/${post.slug}`,
  ).join("\n");
  const nativeCourseLines = COURSE_CATALOG.map(
    (course) => `- ${course.title}: ${SITE_ORIGIN}${course.href}`,
  ).join("\n");
  const importedCourseLines = IMPORTED_COURSE_CATALOG.map(
    (course) => `- ${course.title}: ${SITE_ORIGIN}${course.href}`,
  ).join("\n");
  const labsSection = `## Technische Labore\n\n${importedCourseLines}`;
  const openSourceSections = OPEN_SOURCE_ARTIFACT_SECTIONS
    .filter((section) => section.artifacts.length > 0)
    .map((section) => {
      const lines = section.artifacts
        .map(
          (artifact) =>
            `- ${artifact.title}: ${SITE_ORIGIN}${artifact.href}`,
        )
        .join("\n");
      return `## Open Source: ${section.heading}\n\n${lines}`;
    })
    .join("\n\n");
  const catalogSections = [labsSection, openSourceSections]
    .filter((section) => section.length > 0)
    .join("\n\n");

  return `# loehrning.ai

${SITE_ENTITY.description}

## Öffentlicher Bereich

Öffentlich zugänglich sind Startseite, Kurse, Kursreader, Bücher, Demos, Blog, offene Labs, Rechtliches und maschinenlesbare Metadaten. Einige öffentliche Lern- und Utility-Seiten werden nicht in der Sitemap gelistet, bleiben aber crawlbar, damit Noindex- oder Kontextsignale gelesen werden können.

## Private Zustände

Wenn die optionale Kontofunktion vollständig konfiguriert ist, kann sie Fortschritt, Zertifikatsstatus, Datenschutzaktionen und serverseitige Synchronisation speichern. Ohne diese Providerkonfiguration bleiben Lerninhalte öffentlich und Fortschritt lokal im Browser. Private Zustands-APIs, Kontoseiten, Feedbackmoderation, Providerkonfiguration und Betriebsnachweise sind nicht Teil dieser Datei.

## Öffentliche Seiten

- Startseite: ${SITE_ORIGIN}/
- Kursübersicht: ${SITE_ORIGIN}/kurse
${nativeCourseLines}
- Einstieg: ${SITE_ORIGIN}/einstieg
- Wie KI funktioniert: ${SITE_ORIGIN}/wie-ki-funktioniert
- Bücher: ${SITE_ORIGIN}/buecher
- Demos: ${SITE_ORIGIN}/demos
- Open Source: ${SITE_ORIGIN}/open-source
- Lizenzrichtlinie: ${SITE_ORIGIN}/open-source/lizenzrichtlinie
- Blog: ${SITE_ORIGIN}/blog
- Profil: ${TIM_ENTITY.displayName}: ${SITE_ORIGIN}/ueber-mich
- Über die Plattform: ${SITE_ORIGIN}/ueber-die-plattform
- Bekannte Grenzen: ${SITE_ORIGIN}/bekannte-grenzen
- Hilfe: ${SITE_ORIGIN}/hilfe
- Impressum: ${SITE_ORIGIN}/impressum
- Datenschutz: ${SITE_ORIGIN}/datenschutz
- Sitemap: ${SITE_ORIGIN}/sitemap.xml
- Öffentlicher Buchkatalog: ${SITE_ORIGIN}/api/books.json
- Öffentlicher Wissensgraph: ${SITE_ORIGIN}/api/knowledge-graph.json

## Blog

${blogLines}

${catalogSections}

## Wiederverwendung und Zitation

Öffentliche Seiten dürfen als Lernressource zitiert und verlinkt werden. Kurszertifikate sind selbst ausgestellte Teilnahmebestätigungen, keine amtlichen oder akkreditierten Nachweise. Rechtsbezogene Inhalte ersetzen keine Rechtsberatung.

## Datenstand

Stand der Kerninhalte: ${STAND_DATE}. Veröffentlichungsdatum dieser Datei: ${SITE_CONTENT_DATE}.
`;
}

export function GET(_req: NextRequest): Response {
  return new Response(renderBody(), {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
