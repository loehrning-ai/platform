import type { Metadata } from "next";
import Link from "next/link";
import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import { DsReaderShell } from "@/components/data-science/reader-shell";
import { getDataScienceCourseCopy } from "@/lib/data-science/course-copy";
import { DATA_SCIENCE_CONFIG, DATA_SCIENCE_CONFIG_DE } from "@/lib/data-science/config";
import {
  DS_TRANSLATED_CORE_CHAPTER_IDS,
  getDsTranslatedCoreChapterMeta,
} from "@/lib/data-science/localized-core-meta";
import { getDsOverviewComponent } from "@/lib/data-science/overview-content";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { JsonLd, SITE_URL, type JsonLdGraph } from "@/lib/seo/json-ld";
import {
  buildTechnicalCourseJsonLd,
  buildTechnicalCourseMetadata,
  technicalCourseHref,
} from "@/lib/technical-courses/routes";

const CANONICAL_PATH = "/kurse/open-source/data-science";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = getDataScienceCourseCopy(locale).landingMetadata;
  return buildTechnicalCourseMetadata({
    courseSlug: "data-science",
    locale,
    target: { kind: "landing" },
    title: copy.title,
    description: copy.description,
    availableContentLocales: contentLocalesForPath(CANONICAL_PATH),
  });
}

export default async function DataScienceOverviewPage() {
  const locale = await getRequestLocale();
  // Metas come from data and the overview component from its own loader, so
  // this route never reaches the chapter loader map. Pulling the map in placed
  // every chapter's client simulators in this page's eager client entry.
  const chapters = DS_TRANSLATED_CORE_CHAPTER_IDS.map((id) => ({
    id,
    meta: getDsTranslatedCoreChapterMeta(id, locale),
  }));
  const overview = chapters[0];
  const next = chapters[1];
  if (!overview || overview.id !== "home") {
    throw new Error("Data Science locale bundle is missing its overview.");
  }
  const copy = getDataScienceCourseCopy(locale);
  const course = buildTechnicalCourseJsonLd({
    courseSlug: "data-science",
    locale,
    name: (locale === "en" ? DATA_SCIENCE_CONFIG : DATA_SCIENCE_CONFIG_DE)
      .title,
    description: copy.jsonLdDescription,
    teaches: chapters
      .filter((chapter) => chapter.id !== "home")
      .map((chapter) => chapter.meta.title),
    timeRequired: "PT2H",
  });
  const { "@context": _context, ...courseNode } = course;
  const localizedCourseHref = technicalCourseHref("data-science", locale, {
    kind: "landing",
  });
  const courseJsonLd: JsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: copy.breadcrumbs[0],
            item: locale === "en" ? `${SITE_URL}/en` : SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: copy.breadcrumbs[1],
            item:
              locale === "en" ? `${SITE_URL}/en/kurse` : `${SITE_URL}/kurse`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: copy.breadcrumbs[2],
            item: `${SITE_URL}${localizedCourseHref}`,
          },
        ],
      },
      {
        ...courseNode,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          url: `${SITE_URL}${localizedCourseHref}`,
        },
      },
    ],
  };
  const OverviewComponent = await getDsOverviewComponent(locale);

  return (
    <DsReaderShell
      activeId="home"
      locale={locale}
      chapters={chapters.map((chapter) => chapter.meta)}
    >
      <JsonLd data={courseJsonLd} id="data-science-course-jsonld" />
      <DataScienceLocaleProvider locale={locale}>
        <div className="content min-w-0">
          <OverviewComponent chapter={overview.meta} />
          <nav
            className="tb mt-12 min-w-0 flex-wrap gap-3"
            aria-label={copy.reader.paginationLabel}
          >
            <span aria-hidden="true" />
            {next && (
              <Link
                className="btn btn-primary max-w-full break-words [overflow-wrap:anywhere]"
                href={technicalCourseHref("data-science", locale, {
                  kind: "chapter",
                  chapterId: next.id,
                })}
                prefetch={false}
              >
                {copy.reader.next}
              </Link>
            )}
          </nav>
        </div>
      </DataScienceLocaleProvider>
    </DsReaderShell>
  );
}
