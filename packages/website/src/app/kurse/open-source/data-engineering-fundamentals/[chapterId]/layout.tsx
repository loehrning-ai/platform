import type { ReactNode } from "react";
import { DefChapterLayoutClient } from "@/components/data-engineering-fundamentals/def-chapter-layout-client";
import { getDefLocaleRegistry } from "@/lib/data-engineering-fundamentals/content";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function DefChapterLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const locale = await getRequestLocale();
  const bundle = (await getDefLocaleRegistry()).get(locale);

  return (
    <DefChapterLayoutClient
      locale={locale}
      chapters={bundle.content.chapters.map((chapter) => chapter.meta)}
    >
      {children}
    </DefChapterLayoutClient>
  );
}
