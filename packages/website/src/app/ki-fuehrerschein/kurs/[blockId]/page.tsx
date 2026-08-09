import type { Metadata } from "next";
import {
  BlockPageShell,
  blockMetadata,
  blockStaticParams,
} from "@/components/course/kurs/block-page-shell";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

const COURSE_SLUG = "ki-fuehrerschein" as const;

interface BlockPageProps {
  readonly params: Promise<{ blockId: string }>;
}

export function generateStaticParams() {
  return blockStaticParams(COURSE_SLUG);
}

export async function generateMetadata({
  params,
}: BlockPageProps): Promise<Metadata> {
  const { blockId } = await params;
  const locale = resolveFoundationCourseContentLocale(
    COURSE_SLUG,
    await getRequestLocale(),
  );
  return blockMetadata(COURSE_SLUG, blockId, locale);
}

export default async function BlockPage({ params }: BlockPageProps) {
  const { blockId } = await params;
  const locale = resolveFoundationCourseContentLocale(
    COURSE_SLUG,
    await getRequestLocale(),
  );
  return (
    <BlockPageShell
      courseSlug={COURSE_SLUG}
      blockId={blockId}
      locale={locale}
    />
  );
}
