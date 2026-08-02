import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkChapterVisited } from "@/components/data-science/mark-chapter-visited";
import { getDsChapterComponent } from "@/lib/data-science/chapters";
import {
  DS_CHAPTERS,
  DS_NUMBERED_CHAPTER_IDS,
  getDsChapterMeta,
  isDsNumberedChapterId,
} from "@/lib/data-science/types";
import { dsChapterHref } from "@/lib/data-science/routes";
import { SITE_URL } from "@/lib/seo/json-ld";

interface PageProps {
  readonly params: Promise<{ chapterSlug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return DS_NUMBERED_CHAPTER_IDS.map((chapterSlug) => ({ chapterSlug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { chapterSlug } = await params;
  if (!isDsNumberedChapterId(chapterSlug)) return { title: "Chapter not found" };
  const meta = getDsChapterMeta(chapterSlug);
  const url = `${SITE_URL}${dsChapterHref(chapterSlug)}`;
  const title = `${meta.title}: Data Science Fundamentals`;
  return {
    title,
    description: meta.subtitle,
    robots: { index: false, follow: true },
    alternates: { canonical: url },
    openGraph: { title, description: meta.subtitle, url, type: "article" },
  };
}

export default async function DsChapterRoute({ params }: PageProps) {
  const { chapterSlug } = await params;
  if (!isDsNumberedChapterId(chapterSlug)) notFound();

  const meta = getDsChapterMeta(chapterSlug);
  const ChapterComponent = await getDsChapterComponent(chapterSlug);
  if (!ChapterComponent) notFound();

  const currentIndex = DS_CHAPTERS.findIndex((c) => c.id === chapterSlug);
  const prev = currentIndex > 0 ? DS_CHAPTERS[currentIndex - 1] : null;
  const next = currentIndex < DS_CHAPTERS.length - 1 ? DS_CHAPTERS[currentIndex + 1] : null;

  return (
    <div className="content">
      <ChapterComponent chapter={meta} />
      <div style={{ marginTop: 32 }}>
        <MarkChapterVisited chapterId={chapterSlug} />
      </div>
      <nav className="tb" aria-label="Chapter pagination" style={{ marginTop: 48 }}>
        {prev ? (
          <Link className="btn" href={dsChapterHref(prev.id)}>
            ← Prev <span className="kbd">←</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="btn btn-primary" href={dsChapterHref(next.id)}>
            Next → <span className="kbd">→</span>
          </Link>
        ) : (
          <Link className="btn btn-primary" href="/kurse/open-source/data-science/zertifikat">
            Get your certificate →
          </Link>
        )}
      </nav>
    </div>
  );
}
