import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import { MarkChapterVisited } from "@/components/data-science/mark-chapter-visited";
import { getDataScienceCourseCopy } from "@/lib/data-science/course-copy";
import { getDsLocaleRegistry } from "@/lib/data-science/content";
import { isDsNumberedChapterId } from "@/lib/data-science/types";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  buildTechnicalCourseMetadata,
  getTechnicalCourseStaticParams,
  technicalCourseCanonicalHref,
  technicalCourseHref,
} from "@/lib/technical-courses/routes";

interface PageProps {
  readonly params: Promise<{ chapterSlug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return [...getTechnicalCourseStaticParams("data-science")];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const [{ chapterSlug }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  const copy = getDataScienceCourseCopy(locale).reader;
  if (!isDsNumberedChapterId(chapterSlug)) {
    return {
      title: copy.notFoundTitle,
      robots: { index: false, follow: true },
    };
  }

  const bundle = (await getDsLocaleRegistry()).get(locale);
  const chapter = bundle.content.chapters.find(
    (candidate) => candidate.id === chapterSlug,
  );
  if (!chapter) {
    return {
      title: copy.notFoundTitle,
      robots: { index: false, follow: true },
    };
  }

  const target = { kind: "chapter", chapterId: chapterSlug } as const;
  const canonicalPath = technicalCourseCanonicalHref("data-science", target);
  return buildTechnicalCourseMetadata({
    courseSlug: "data-science",
    locale,
    target,
    title: `${chapter.meta.title}: ${bundle.config.title}`,
    description: chapter.meta.subtitle,
    availableContentLocales: contentLocalesForPath(canonicalPath),
  });
}

export default async function DsChapterRoute({ params }: PageProps) {
  const [{ chapterSlug }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  if (!isDsNumberedChapterId(chapterSlug)) notFound();

  const bundle = (await getDsLocaleRegistry()).get(locale);
  const chapters = bundle.content.chapters;
  const currentIndex = chapters.findIndex(
    (candidate) => candidate.id === chapterSlug,
  );
  if (currentIndex < 0) notFound();

  const chapter = chapters[currentIndex];
  if (!chapter) notFound();
  const prev = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const next =
    currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  const ChapterComponent = chapter.component;
  const copy = getDataScienceCourseCopy(locale).reader;

  return (
    <DataScienceLocaleProvider locale={locale}>
      <div className="content min-w-0">
        <ChapterComponent chapter={chapter.meta} />
        <div className="mt-8 min-w-0">
          <MarkChapterVisited chapterId={chapterSlug} locale={locale} />
        </div>
        <nav
          className="tb mt-12 min-w-0 flex-wrap gap-3"
          aria-label={copy.paginationLabel}
        >
          {prev ? (
            <Link
              className="btn max-w-full break-words [overflow-wrap:anywhere]"
              href={technicalCourseHref("data-science", locale, {
                kind: "chapter",
                chapterId: prev.id,
              })}
              prefetch={false}
            >
              {copy.previous}
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          {next ? (
            <Link
              className="btn btn-primary max-w-full break-words [overflow-wrap:anywhere]"
              href={technicalCourseHref("data-science", locale, {
                kind: "chapter",
                chapterId: next.id,
              })}
              prefetch={false}
            >
              {copy.next}
            </Link>
          ) : (
            <Link
              className="btn btn-primary max-w-full break-words [overflow-wrap:anywhere]"
              href={technicalCourseHref("data-science", locale, {
                kind: "certificate",
              })}
              prefetch={false}
            >
              {copy.certificate}
            </Link>
          )}
        </nav>
      </div>
    </DataScienceLocaleProvider>
  );
}
