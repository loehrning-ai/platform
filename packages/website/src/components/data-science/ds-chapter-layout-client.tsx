"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { DsReaderShell } from "@/components/data-science/reader-shell";
import type { ChapterMeta } from "@/lib/data-science/types";
import { isDsNumberedChapterId } from "@/lib/data-science/types";
import type { Locale } from "@/lib/i18n/locale";

export function DsChapterLayoutClient({
  children,
  locale,
  chapters,
}: {
  readonly children: ReactNode;
  readonly locale: Locale;
  readonly chapters: readonly ChapterMeta[];
}) {
  const params = useParams<{ chapterSlug: string }>();
  const activeId = isDsNumberedChapterId(params.chapterSlug)
    ? params.chapterSlug
    : "home";

  return (
    <DsReaderShell activeId={activeId} locale={locale} chapters={chapters}>
      {children}
    </DsReaderShell>
  );
}

export default DsChapterLayoutClient;
