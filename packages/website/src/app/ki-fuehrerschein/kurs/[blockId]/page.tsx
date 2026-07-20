import type { Metadata } from "next";
import {
  BlockPageShell,
  blockMetadata,
  blockStaticParams,
} from "@/components/course/kurs/block-page-shell";

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
  return blockMetadata(COURSE_SLUG, blockId);
}

export default async function BlockPage({ params }: BlockPageProps) {
  const { blockId } = await params;
  return <BlockPageShell courseSlug={COURSE_SLUG} blockId={blockId} />;
}
