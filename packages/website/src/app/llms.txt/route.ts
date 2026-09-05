import type { NextRequest } from "next/server";
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
    `## Technische Kurse\n\n${courseLines("deeper")}`,
    `## Workshops\n\n${workshopLines()}`,
    externalLabsSection,
    openSourceSections(),
  ]
    .filter(Boolean)
    .join("\n\n");

  return `# loehrning.ai

${SITE_ENTITY.description}

Free AI and data learning resources in German and English. Each page states its access boundary, source basis, and completion-record status.

## Öffentlicher Bereich / Public access

Öffentlich zugänglich sind Landingpages, technische Kursreader, Bücher, Demos, Workshops, Blog, Open-Source-Artefakte und maschinenlesbare Metadaten. Die Reader der vier Grundlagenkurse sind kontogeschützt. Quiz-, Abschluss- und Verifizierungsseiten können direkt erreichbar, aber bewusst nicht indexierbar sein.

Public resources include landing pages, technical course readers, books, demos, workshops, the blog, open-source artifacts, and machine-readable metadata. The four foundation-course readers require an account. Quiz, completion, and verification pages may be directly accessible while deliberately excluded from indexing.

## Sprachmodell / Language model

Deutsch verwendet kanonische, nicht präfixierte URLs. Geprüfte englische Fassungen verwenden /en. Eine englische URL erscheint hier und in der Sitemap erst nach bestätigter Inhalts- und Routenparität. Nicht gelistete /en-Seiten dürfen nicht als übersetzt interpretiert werden.

German uses canonical, unprefixed URLs. Reviewed English versions use /en. An English URL appears here and in the sitemap only after content and route parity are verified. An unlisted /en route must not be treated as translated content.

## Private Zustände / Private state

Wenn das Lernkonto vollständig konfiguriert ist, kann es Fortschritt, Quizstatus, Abschlussstatus, Datenschutzaktionen und serverseitige Synchronisation speichern. Ohne vollständige Providerkonfiguration bleiben kontogeschützte Reader geschlossen. Private APIs, Kontoseiten, Providerkonfiguration und Betriebsnachweise sind nicht Teil dieser Datei.

When the learning account is fully configured, it can store progress, quiz state, completion state, privacy actions, and server-side synchronization. Without complete provider configuration, protected readers remain closed. Private APIs, account pages, provider configuration, and operational evidence are outside this file.

## Öffentliche Seiten / Public pages

${publicPageLines}
- Sitemap: ${SITE_ORIGIN}/sitemap.xml
- Öffentlicher Buchkatalog / Public book catalog: ${SITE_ORIGIN}/api/books.json
- Öffentlicher Wissensgraph / Public knowledge graph: ${SITE_ORIGIN}/api/knowledge-graph.json

## Reviewed English index

${englishIndex()}

## Blog

${blogLines}

${sections}

## Wiederverwendung und Zitation / Reuse and citation

Öffentliche Seiten dürfen als Lernressource zitiert und verlinkt werden. Abschlussdokumente sind selbst ausgestellte Teilnahmebestätigungen, keine amtlichen oder akkreditierten Nachweise. Rechtsbezogene Inhalte ersetzen keine Rechtsberatung.

Public pages may be cited and linked as learning resources. Completion documents are self-issued participation or learning records, not official or accredited credentials. Legal content is not legal advice.

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
