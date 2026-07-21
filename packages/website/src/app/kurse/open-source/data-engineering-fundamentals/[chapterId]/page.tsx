import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDefChapterComponent } from "@/lib/data-engineering-fundamentals/content";
import { DEF_CHAPTERS, DEF_CHAPTER_IDS, getDefChapterMeta, isDefChapterId } from "@/lib/data-engineering-fundamentals/types";
import { SITE_URL } from "@/lib/seo/json-ld";

interface PageProps {
  readonly params: Promise<{ chapterId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return DEF_CHAPTER_IDS.map((chapterId) => ({ chapterId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { chapterId } = await params;
  if (!isDefChapterId(chapterId)) return { title: "Chapter not found" };
  const meta = getDefChapterMeta(chapterId);
  const url = `${SITE_URL}/kurse/open-source/data-engineering-fundamentals/${chapterId}`;
  const title = `${meta.title}: Data Engineering Fundamentals`;
  return {
    title,
    description: meta.subtitle,
    robots: { index: false, follow: true },
    alternates: { canonical: url },
    openGraph: { title, description: meta.subtitle, url, type: "article" },
  };
}

export default async function DefChapterRoute({ params }: PageProps) {
  const { chapterId } = await params;
  if (!isDefChapterId(chapterId)) notFound();

  const meta = getDefChapterMeta(chapterId);
  const ChapterComponent = await getDefChapterComponent(chapterId);
  if (!ChapterComponent) notFound();

  const currentIndex = DEF_CHAPTERS.findIndex((c) => c.id === chapterId);
  const prev = currentIndex > 0 ? DEF_CHAPTERS[currentIndex - 1] : null;
  const next = currentIndex < DEF_CHAPTERS.length - 1 ? DEF_CHAPTERS[currentIndex + 1] : null;

  return (
    <div className="content">
      <ChapterComponent chapter={meta} />
      <nav className="tb" aria-label="Chapter pagination" style={{ marginTop: 48 }}>
        {prev ? (
          <Link className="btn" href={`/kurse/open-source/data-engineering-fundamentals/${prev.id}`}>
            ← Prev <span className="kbd">←</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="btn btn-primary" href={`/kurse/open-source/data-engineering-fundamentals/${next.id}`}>
            Next → <span className="kbd">→</span>
          </Link>
        ) : (
          <Link className="btn btn-primary" href="/kurse/open-source/data-engineering-fundamentals/zertifikat">
            Get your certificate →
          </Link>
        )}
      </nav>
    </div>
  );
}
