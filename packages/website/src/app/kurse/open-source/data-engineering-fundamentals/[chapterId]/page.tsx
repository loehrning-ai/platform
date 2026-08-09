import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataEngineeringFundamentalsLocaleProvider } from "@/components/data-engineering-fundamentals/locale-context";
import { MarkChapterVisited } from "@/components/data-engineering-fundamentals/mark-chapter-visited";
import { getDataEngineeringFundamentalsCourseCopy } from "@/lib/data-engineering-fundamentals/course-copy";
import { getDefLocaleRegistry } from "@/lib/data-engineering-fundamentals/content";
import { isDefChapterId } from "@/lib/data-engineering-fundamentals/types";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  buildTechnicalCourseMetadata,
  getTechnicalCourseStaticParams,
  technicalCourseCanonicalHref,
  technicalCourseHref,
} from "@/lib/technical-courses/routes";

interface PageProps {
  readonly params: Promise<{ chapterId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return [...getTechnicalCourseStaticParams("data-engineering-fundamentals")];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const [{ chapterId }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  const copy = getDataEngineeringFundamentalsCourseCopy(locale).reader;
  if (!isDefChapterId(chapterId)) {
    return {
      title: copy.notFoundTitle,
      robots: { index: false, follow: true },
    };
  }

  const bundle = (await getDefLocaleRegistry()).get(locale);
  const chapter = bundle.content.chapters.find(
    (candidate) => candidate.id === chapterId,
  );
  if (!chapter) {
    return {
      title: copy.notFoundTitle,
      robots: { index: false, follow: true },
    };
  }

  const target = { kind: "chapter", chapterId } as const;
  const canonicalPath = technicalCourseCanonicalHref(
    "data-engineering-fundamentals",
    target,
  );
  return buildTechnicalCourseMetadata({
    courseSlug: "data-engineering-fundamentals",
    locale,
    target,
    title: `${chapter.meta.title}: ${bundle.config.title}`,
    description: chapter.meta.subtitle,
    availableContentLocales: contentLocalesForPath(canonicalPath),
  });
}

export default async function DefChapterRoute({ params }: PageProps) {
  const [{ chapterId }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  if (!isDefChapterId(chapterId)) notFound();

  const bundle = (await getDefLocaleRegistry()).get(locale);
  const chapters = bundle.content.chapters;
  const currentIndex = chapters.findIndex(
    (candidate) => candidate.id === chapterId,
  );
  if (currentIndex < 0) notFound();

  const chapter = chapters[currentIndex];
  const prev = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const next =
    currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  const ChapterComponent = chapter.component;
  const copy = getDataEngineeringFundamentalsCourseCopy(locale).reader;

  return (
    <DataEngineeringFundamentalsLocaleProvider locale={locale}>
      <div className="content min-w-0">
        <ChapterComponent chapter={chapter.meta} />
        <div className="mt-8 min-w-0">
          <MarkChapterVisited chapterId={chapterId} locale={locale} />
        </div>
        <nav
          className="tb mt-12 min-w-0 flex-wrap gap-3"
          aria-label={copy.paginationLabel}
        >
          {prev ? (
            <Link
              className="btn max-w-full break-words [overflow-wrap:anywhere]"
              href={technicalCourseHref(
                "data-engineering-fundamentals",
                locale,
                { kind: "chapter", chapterId: prev.id },
              )}
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
              href={technicalCourseHref(
                "data-engineering-fundamentals",
                locale,
                { kind: "chapter", chapterId: next.id },
              )}
              prefetch={false}
            >
              {copy.next}
            </Link>
          ) : (
            <Link
              className="btn btn-primary max-w-full break-words [overflow-wrap:anywhere]"
              href={technicalCourseHref(
                "data-engineering-fundamentals",
                locale,
                { kind: "certificate" },
              )}
              prefetch={false}
            >
              {copy.certificate}
            </Link>
          )}
        </nav>
      </div>
    </DataEngineeringFundamentalsLocaleProvider>
  );
}
